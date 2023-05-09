require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");

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
      gasPrice: 10000000000,
    },
    bsctest: {
      url: process.env.WEB3_HTTP_PROVIDER_TEST,
      accounts: [process.env.BSC_PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 10000000000,
    },
    bscmain: {
      url: process.env.WEB3_HTTP_PROVIDER_MAIN,
      accounts: [process.env.BSC_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 50000,
          },
        },
      },
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 50000,
          },
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
    // outputFile: "gas-report.txt",
    currency: "EUR",
    gasPrice: 5,
    token: "BNB",
    coinmarketcap: process.env.COINMARKETCAP_API,
    gasPriceApi: process.env.BINANCE_GAS_API,
  },
};
