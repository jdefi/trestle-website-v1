require("@nomicfoundation/hardhat-toolbox");

require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    hardhat: {},
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com",
      chainId: 137,
      accounts:
        process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY.length > 0
          ? [process.env.DEPLOYER_PRIVATE_KEY]
          : [],
      gasPrice: 400e9, // 400 gwei — adjust if stuck (check https://polygonscan.com/gastracker)
      timeout: 120000, // 2 minutes for slow blocks
    },
  },

  // Etherscan v2 — single API key covers all chains (Ethereum, Polygon, etc.)
  // Get your key at https://etherscan.io/apis
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
