// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentBazaarEscrow
 * @notice Trust-minimized, auditable task escrow & settlement contract for AgentBazaar on HashKey Chain (HSK Chain).
 * @dev Supports native HSK (address(0)) and supported ERC-20 tokens (e.g. USDC, USDT on HSK Chain).
 * Built for HSK Chain Horizon Hackathon Mumbai Edition.
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract AgentBazaarEscrow {
    // -------------------------------------------------------------
    // Enums and Structs
    // -------------------------------------------------------------
    enum EscrowStatus {
        NONE,
        LOCKED,
        RELEASED,
        REFUNDED,
        DISPUTED
    }

    struct Agreement {
        bytes32 taskId;          // Keccak256 hash of task UUID
        address buyer;           // Task creator / funder
        address provider;        // Service agent recipient address
        address token;           // address(0) for native HSK, or ERC-20 token address
        uint256 amount;          // Amount in wei (native HSK) or token units
        bytes32 mandateHash;     // Cart Mandate SHA-256 hash (HSP reference)
        uint256 lockTimestamp;   // When funds were deposited
        uint256 timeoutTimestamp;// Deadline after which refund is possible
        EscrowStatus status;     // Current status of escrow
    }

    // -------------------------------------------------------------
    // State Variables
    // -------------------------------------------------------------
    address public immutable owner;
    uint256 public constant MIN_TIMEOUT = 1 hours;
    uint256 public constant MAX_TIMEOUT = 90 days;

    // taskId => Agreement
    mapping(bytes32 => Agreement) public agreements;

    // Track total escrowed per token (address(0) for native HSK)
    mapping(address => uint256) public totalEscrowed;

    // Prevent reentrancy
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // -------------------------------------------------------------
    // Events
    // -------------------------------------------------------------
    event TaskPaymentLocked(
        bytes32 indexed taskId,
        address indexed buyer,
        address indexed provider,
        address token,
        uint256 amount,
        bytes32 mandateHash,
        uint256 timeoutTimestamp
    );

    event TaskPaymentReleased(
        bytes32 indexed taskId,
        address indexed provider,
        uint256 amount,
        address token
    );

    event TaskPaymentRefunded(
        bytes32 indexed taskId,
        address indexed buyer,
        uint256 amount,
        address token
    );

    event TaskDisputed(
        bytes32 indexed taskId,
        address indexed initiatedBy,
        string reason
    );

    // -------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------
    error ReentrancyGuardReentrantCall();
    error NotOwner();
    error UnauthorizedCaller();
    error AgreementAlreadyExists();
    error AgreementNotFound();
    error InvalidStatus(EscrowStatus expected, EscrowStatus actual);
    error InvalidAmount();
    error InvalidAddress();
    error TimeoutNotReached();
    error TimeoutOutOfRange();
    error NativeTransferFailed();
    error ERC20TransferFailed();

    // -------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------
    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrancyGuardReentrantCall();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // -------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------
    constructor() {
        owner = msg.sender;
        _status = _NOT_ENTERED;
    }

    // -------------------------------------------------------------
    // Core Functions
    // -------------------------------------------------------------

    /**
     * @notice Locks payment in escrow for an agreed task.
     * @param _taskId Keccak256 hash of the off-chain task ID
     * @param _provider Service agent wallet address receiving funds upon completion
     * @param _token Token address (use address(0) for native HSK)
     * @param _amount Amount to lock
     * @param _mandateHash HSP Cart Mandate hash
     * @param _durationSeconds Timeout duration in seconds
     */
    function lockPayment(
        bytes32 _taskId,
        address _provider,
        address _token,
        uint256 _amount,
        bytes32 _mandateHash,
        uint256 _durationSeconds
    ) external payable nonReentrant {
        if (_provider == address(0) || _provider == msg.sender) revert InvalidAddress();
        if (_amount == 0) revert InvalidAmount();
        if (_durationSeconds < MIN_TIMEOUT || _durationSeconds > MAX_TIMEOUT) revert TimeoutOutOfRange();
        if (agreements[_taskId].status != EscrowStatus.NONE) revert AgreementAlreadyExists();

        if (_token == address(0)) {
            // Native HSK payment
            if (msg.value != _amount) revert InvalidAmount();
        } else {
            // ERC-20 payment
            if (msg.value != 0) revert InvalidAmount();
            bool success = IERC20(_token).transferFrom(msg.sender, address(this), _amount);
            if (!success) revert ERC20TransferFailed();
        }

        uint256 timeoutTimestamp = block.timestamp + _durationSeconds;

        agreements[_taskId] = Agreement({
            taskId: _taskId,
            buyer: msg.sender,
            provider: _provider,
            token: _token,
            amount: _amount,
            mandateHash: _mandateHash,
            lockTimestamp: block.timestamp,
            timeoutTimestamp: timeoutTimestamp,
            status: EscrowStatus.LOCKED
        });

        totalEscrowed[_token] += _amount;

        emit TaskPaymentLocked(
            _taskId,
            msg.sender,
            _provider,
            _token,
            _amount,
            _mandateHash,
            timeoutTimestamp
        );
    }

    /**
     * @notice Releases locked escrow funds to the service agent provider.
     * @dev Only the buyer or the contract owner (dispute resolution) can trigger release.
     * @param _taskId Keccak256 hash of the task ID
     */
    function releasePayment(bytes32 _taskId) external nonReentrant {
        Agreement storage ag = agreements[_taskId];
        if (ag.status != EscrowStatus.LOCKED && ag.status != EscrowStatus.DISPUTED) {
            revert InvalidStatus(EscrowStatus.LOCKED, ag.status);
        }

        if (msg.sender != ag.buyer && msg.sender != owner) {
            revert UnauthorizedCaller();
        }

        ag.status = EscrowStatus.RELEASED;
        totalEscrowed[ag.token] -= ag.amount;

        _payout(ag.provider, ag.token, ag.amount);

        emit TaskPaymentReleased(_taskId, ag.provider, ag.amount, ag.token);
    }

    /**
     * @notice Refunds locked payment back to the buyer if deadline has elapsed.
     * @param _taskId Keccak256 hash of the task ID
     */
    function refundPayment(bytes32 _taskId) external nonReentrant {
        Agreement storage ag = agreements[_taskId];
        if (ag.status != EscrowStatus.LOCKED && ag.status != EscrowStatus.DISPUTED) {
            revert InvalidStatus(EscrowStatus.LOCKED, ag.status);
        }

        // Only buyer can claim refund after timeout, or owner can resolve refund
        if (msg.sender != owner) {
            if (msg.sender != ag.buyer) revert UnauthorizedCaller();
            if (block.timestamp < ag.timeoutTimestamp) revert TimeoutNotReached();
        }

        ag.status = EscrowStatus.REFUNDED;
        totalEscrowed[ag.token] -= ag.amount;

        _payout(ag.buyer, ag.token, ag.amount);

        emit TaskPaymentRefunded(_taskId, ag.buyer, ag.amount, ag.token);
    }

    /**
     * @notice Flags an escrow agreement as disputed for review.
     * @param _taskId Keccak256 hash of the task ID
     * @param _reason Explanation of the dispute
     */
    function disputePayment(bytes32 _taskId, string calldata _reason) external {
        Agreement storage ag = agreements[_taskId];
        if (ag.status != EscrowStatus.LOCKED) {
            revert InvalidStatus(EscrowStatus.LOCKED, ag.status);
        }
        if (msg.sender != ag.buyer && msg.sender != ag.provider && msg.sender != owner) {
            revert UnauthorizedCaller();
        }

        ag.status = EscrowStatus.DISPUTED;
        emit TaskDisputed(_taskId, msg.sender, _reason);
    }

    /**
     * @notice Returns complete agreement details for verification.
     */
    function getAgreement(bytes32 _taskId) external view returns (Agreement memory) {
        return agreements[_taskId];
    }

    // -------------------------------------------------------------
    // Internal Utilities
    // -------------------------------------------------------------
    function _payout(address _to, address _token, uint256 _amount) internal {
        if (_token == address(0)) {
            (bool sent, ) = payable(_to).call{value: _amount}("");
            if (!sent) revert NativeTransferFailed();
        } else {
            bool sent = IERC20(_token).transfer(_to, _amount);
            if (!sent) revert ERC20TransferFailed();
        }
    }

    receive() external payable {
        revert("Use lockPayment()");
    }
}
