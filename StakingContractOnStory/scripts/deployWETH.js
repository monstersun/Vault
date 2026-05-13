const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const WETH9 = await ethers.getContractFactory("WETH9");
  const weth = await WETH9.deploy();
  await weth.waitForDeployment();

  console.log("WETH deployed at:", await weth.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
