const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("AgentBazaar Escrow Deployment Script");
  console.log(`Target Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log("=================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer signer configured! Please set DEPLOYER_PRIVATE_KEY in .env");
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Address: ${deployer.address}`);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} HSK`);

  if (network.name === "hskMainnet") {
    console.warn("\n⚠️ WARNING: MAINNET DEPLOYMENT DETECTED!");
    console.warn("Transactions on HashKey Chain Mainnet consume REAL HSK and are irreversible.");
    console.warn("Please verify the network settings and deployer address before proceeding.\n");
  }

  console.log("Deploying AgentBazaarEscrow contract...");
  const EscrowFactory = await ethers.getContractFactory("AgentBazaarEscrow");
  const escrow = await EscrowFactory.deploy();
  await escrow.waitForDeployment();

  const deployedAddress = await escrow.getAddress();
  const txHash = escrow.deploymentTransaction()?.hash;

  console.log("\n=================================================");
  console.log("✅ Deployment Successful!");
  console.log(`Contract Address: ${deployedAddress}`);
  console.log(`Deployment Tx Hash: ${txHash}`);
  if (network.config.chainId === 177) {
    console.log(`Blockscout Explorer: https://hashkey.blockscout.com/address/${deployedAddress}`);
  } else if (network.config.chainId === 133) {
    console.log(`Testnet Explorer: https://hashkeychain-testnet-explorer.alt.technology/address/${deployedAddress}`);
  }
  console.log("=================================================\n");

  // Save deployment artifact
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: deployedAddress,
    transactionHash: txHash,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outDir, `${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`Deployment info saved to deployments/${network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
