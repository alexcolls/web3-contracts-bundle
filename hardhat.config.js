require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat", // consider that for deploy you should use ganache instead, so specify here, or during command run with --network ganache flag

  networks: {
    hardhat: {
      chainId: 1337
    },
    goerli: {
      url: "https://goerli.infura.io/v3/"+process.env.INFURA_API_ID,
      //accounts: [process.env.ETHEREUM_ACCOUNT_PRIVATE_KEY] // TODO uncomment this to deploy, is commented to do not throw error if ENV not existing
    }
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
