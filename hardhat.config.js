require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat", // consider that for deploy you should use ganache instead, so specify here, or during command run with --network ganache flag

  networks: {
    hardhat: {
      chainId: 1337,
    },
    ganache: {
      url: "HTTP://127.0.0.1:7545",
      chainId: 1337,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    bsctest: {
      url: process.env.WEB3_HTTP_PROVIDER_TEST,
      accounts: [process.env.BSC_PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 8000000000,
    },
    bscmain: {
      url: process.env.WEB3_HTTP_PROVIDER_MAIN,
      accounts: [process.env.BSC_PRIVATE_KEY],
    },
  },
  etherscan: {
    // Command to verify in Scan:
    // npx hardhat verify --network bsc CONTRACT_ADDRESS "Constructor argument 1" "Constructor argument 2" ...
    //(If it does not work, clean cache & artifacts & make sure there are not 2 contracts with the same code)
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  solidity: {
    compilers: [{ version: "0.8.19" }, { version: "0.8.17" }],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
