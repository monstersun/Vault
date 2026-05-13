const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const wethAddress = process.env.WETH_ADDRESS;

  if (!wethAddress) {
    throw new Error("Please set WETH_ADDRESS in .env before deploying vault.");
  }

  console.log("Deployer:", deployer.address);
  console.log("Using WETH:", wethAddress);

  const Vault = await ethers.getContractFactory("StoryEthVault");
  const vault = await upgrades.deployProxy(
    Vault,
    [wethAddress, "Story Staked ETH Vault", "stETHv", deployer.address],
    { kind: "uups" }
  );

  await vault.waitForDeployment();

  const proxyAddress = await vault.getAddress();
  const implementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("Vault proxy deployed at:", proxyAddress);
  console.log("Vault implementation at:", implementation);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
