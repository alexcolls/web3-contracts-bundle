require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat", // consider that for deploy you should use ganache instead, so specify here, or during command run with --network ganache flag

  networks: {
    hardhat: {
      chainId: 1337,
    },
    // bsctest: {
    //   url: process.env.WEB3_HTTP_PROVIDER_TEST,
    //   accounts: [process.env.OWNER_PRIVATE_KEY]
    // },
    // bscmain: {
    //   url: process.env.WEB3_HTTP_PROVIDER_MAIN,
    //   accounts: [process.env.OWNER_PRIVATE_KEY]
    // }
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
