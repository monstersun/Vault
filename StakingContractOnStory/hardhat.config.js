require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

const { STORY_TESTNET_RPC_URL, SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

const networks = {
  hardhat: {},
  localhost: {
    url: "http://127.0.0.1:8545",
  },
};

if (SEPOLIA_RPC_URL) {
  networks.sepolia = {
    url: SEPOLIA_RPC_URL,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
  };
}

if (STORY_TESTNET_RPC_URL) {
  networks.storyTestnet = {
    url: STORY_TESTNET_RPC_URL,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
  };
}

/** @type import("hardhat/config").HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks,
  etherscan: {
    apiKey: ETHERSCAN_API_KEY || "",
  },
};
