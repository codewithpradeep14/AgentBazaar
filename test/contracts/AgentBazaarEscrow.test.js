const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentBazaarEscrow Smart Contract", function () {
  let Escrow;
  let escrow;
  let owner, buyer, provider, otherAccount;

  beforeEach(async function () {
    [owner, buyer, provider, otherAccount] = await ethers.getSigners();
    Escrow = await ethers.getContractFactory("AgentBazaarEscrow");
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();
  });

  it("Should set the deployer as owner", async function () {
    expect(await escrow.owner()).to.equal(owner.address);
  });

  it("Should lock native HSK payment successfully", async function () {
    const taskId = ethers.keccak256(ethers.toUtf8Bytes("task-audit-001"));
    const mandateHash = ethers.keccak256(ethers.toUtf8Bytes("mandate-canonical-json"));
    const amount = ethers.parseEther("5.0"); // 5 HSK
    const duration = 3600 * 24; // 24 hours

    const tx = await escrow.connect(buyer).lockPayment(
      taskId,
      provider.address,
      ethers.ZeroAddress,
      amount,
      mandateHash,
      duration,
      { value: amount }
    );

    await expect(tx)
      .to.emit(escrow, "TaskPaymentLocked")
      .withArgs(
        taskId,
        buyer.address,
        provider.address,
        ethers.ZeroAddress,
        amount,
        mandateHash,
        (await ethers.provider.getBlock(tx.blockNumber)).timestamp + duration
      );

    const ag = await escrow.getAgreement(taskId);
    expect(ag.status).to.equal(1); // EscrowStatus.LOCKED
    expect(ag.amount).to.equal(amount);
    expect(ag.buyer).to.equal(buyer.address);
    expect(ag.provider).to.equal(provider.address);
  });

  it("Should prevent duplicate lock on same taskId", async function () {
    const taskId = ethers.keccak256(ethers.toUtf8Bytes("task-duplicate-check"));
    const mandateHash = ethers.keccak256(ethers.toUtf8Bytes("mandate-hash"));
    const amount = ethers.parseEther("1.0");

    await escrow.connect(buyer).lockPayment(
      taskId,
      provider.address,
      ethers.ZeroAddress,
      amount,
      mandateHash,
      3600,
      { value: amount }
    );

    await expect(
      escrow.connect(buyer).lockPayment(
        taskId,
        provider.address,
        ethers.ZeroAddress,
        amount,
        mandateHash,
        3600,
        { value: amount }
      )
    ).to.be.revertedWithCustomError(escrow, "AgreementAlreadyExists");
  });

  it("Should release locked payment to provider on buyer authorization", async function () {
    const taskId = ethers.keccak256(ethers.toUtf8Bytes("task-release-test"));
    const mandateHash = ethers.keccak256(ethers.toUtf8Bytes("mandate-hash"));
    const amount = ethers.parseEther("2.5");

    await escrow.connect(buyer).lockPayment(
      taskId,
      provider.address,
      ethers.ZeroAddress,
      amount,
      mandateHash,
      3600,
      { value: amount }
    );

    const providerBalBefore = await ethers.provider.getBalance(provider.address);

    const releaseTx = await escrow.connect(buyer).releasePayment(taskId);
    await expect(releaseTx)
      .to.emit(escrow, "TaskPaymentReleased")
      .withArgs(taskId, provider.address, amount, ethers.ZeroAddress);

    const providerBalAfter = await ethers.provider.getBalance(provider.address);
    expect(providerBalAfter - providerBalBefore).to.equal(amount);

    const ag = await escrow.getAgreement(taskId);
    expect(ag.status).to.equal(2); // EscrowStatus.RELEASED
  });

  it("Should reject release attempt from unauthorized third-party", async function () {
    const taskId = ethers.keccak256(ethers.toUtf8Bytes("task-auth-test"));
    const mandateHash = ethers.keccak256(ethers.toUtf8Bytes("mandate-hash"));
    const amount = ethers.parseEther("1.0");

    await escrow.connect(buyer).lockPayment(
      taskId,
      provider.address,
      ethers.ZeroAddress,
      amount,
      mandateHash,
      3600,
      { value: amount }
    );

    await expect(
      escrow.connect(otherAccount).releasePayment(taskId)
    ).to.be.revertedWithCustomError(escrow, "UnauthorizedCaller");
  });

  it("Should allow refund only after timeout", async function () {
    const taskId = ethers.keccak256(ethers.toUtf8Bytes("task-timeout-test"));
    const mandateHash = ethers.keccak256(ethers.toUtf8Bytes("mandate-hash"));
    const amount = ethers.parseEther("1.0");
    const timeout = 3600; // 1 hour

    await escrow.connect(buyer).lockPayment(
      taskId,
      provider.address,
      ethers.ZeroAddress,
      amount,
      mandateHash,
      timeout,
      { value: amount }
    );

    // Try refund immediately -> should fail
    await expect(
      escrow.connect(buyer).refundPayment(taskId)
    ).to.be.revertedWithCustomError(escrow, "TimeoutNotReached");

    // Advance time past timeout
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine");

    const refundTx = await escrow.connect(buyer).refundPayment(taskId);
    await expect(refundTx)
      .to.emit(escrow, "TaskPaymentRefunded")
      .withArgs(taskId, buyer.address, amount, ethers.ZeroAddress);

    const ag = await escrow.getAgreement(taskId);
    expect(ag.status).to.equal(3); // EscrowStatus.REFUNDED
  });
});
