const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {anyValue} = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const {expect} = require("chai");

describe("G4ALBank", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    // Contracts are deployed using the first signer/account by default
    const [owner, developer, user] = await ethers.getSigners();

    // Deploy GGT mocked contract to enable testing
    const ggt = await ethers.getContractFactory("GameGoldToken");
    const ggtContract = await ggt.deploy();

    // Transferring $GGT tokens to user
    await ggtContract.approve(owner.address, "10000000000")
    await ggtContract.transferFrom(owner.address, user.address, "10000000000")
    // Deploy Bank contract
    const bank = await ethers.getContractFactory("G4ALBank");
    const bankContract = await bank.deploy(ggtContract.address);

    // Whitelist BankConsumer as game by owner
    await bankContract.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SPENDER_ROLE")), developer.address)

    return {owner, developer, user, ggtContract, bankContract};
  }

  describe("Deployment", function () {
    it("Bank: Should set the right $GGT contract address", async function () {
      const {bankContract, ggtContract} = await loadFixture(deployContracts);

      expect(await bankContract.ggtToken()).to.equal(ggtContract.address);
    });
  });

  describe("Workflow", function () {
    describe("Validations", function () {
      it("Should revert if a user tries to withdraw funds without depositing", async function () {
        const {user, developer, bankContract} = await loadFixture(deployContracts);

        await expect(bankContract.connect(user).withdraw(100, developer.address)).to.be.revertedWith(
          "Insufficient funds"
        );
      });
      it("Should revert if strangers tries to grant a role", async function () {
        const {user, bankContract} = await loadFixture(deployContracts);

        await expect(bankContract.connect(user).grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SPENDER_ROLE")), "0x1234567890123456789012345678901234567890")).to.be.revertedWith(
          "AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
        );
      });
      it("Should revert if stranger tries to revoke a role", async function () {
        const {user, developer, bankContract} = await loadFixture(deployContracts);

        await expect(bankContract.connect(user).revokeRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SPENDER_ROLE")), developer.address)).to.be.revertedWith(
          "AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
        );
      });
      // TODO: Should revert if a consumer contract tries to spend non-existing funds
      // TODO: Should revert if a consumer contract tries to spend funds of other consumers
    });

    describe("Events", function () {
      it("Should emit an event on deposit", async function () {
        const {user, developer, ggtContract, bankContract} = await loadFixture(deployContracts);

        await ggtContract.connect(user).approve(bankContract.address, 100)

        await expect(bankContract.connect(user).deposit(100, developer.address))
          .to.emit(bankContract, "Deposit")
          .withArgs("100", anyValue, user.address, developer.address)
      });
      it("Should emit an event on withdrawal", async function () {
        const {user, developer, ggtContract, bankContract} = await loadFixture(deployContracts);

        await ggtContract.connect(user).approve(bankContract.address, 100)
        await bankContract.connect(user).deposit(100, developer.address)

        await expect(bankContract.connect(user).withdraw(100, developer.address))
          .to.emit(bankContract, "Withdrawal")
          .withArgs("100", anyValue, user.address, developer.address)
      });
    });

    describe("Transfers", function () {
      it("Should deposit the funds from the user to the contract", async function () {
        const {user, developer, ggtContract, bankContract} = await loadFixture(deployContracts);

        await ggtContract.connect(user).approve(bankContract.address, 100)
        await bankContract.connect(user).deposit(100, developer.address)

        await expect(await bankContract.getContractBalance()).to.equal(100)
        await expect(await bankContract.getUserBalanceByGame(user.address, developer.address)).to.equal(100)
      });

      it("Should withdraw the funds from the contract to the user", async function () {
        const {user, developer, ggtContract, bankContract} = await loadFixture(deployContracts);

        await ggtContract.connect(user).approve(bankContract.address, 100)
        await bankContract.connect(user).deposit(100, developer.address)

        await expect(await bankContract.getContractBalance()).to.equal(100)
        await expect(await bankContract.getUserBalanceByGame(user.address, developer.address)).to.equal(100)

        await bankContract.connect(user).withdraw(100, developer.address)

        await expect(await bankContract.getContractBalance()).to.equal(0)
        await expect(await bankContract.getUserBalanceByGame(user.address, developer.address)).to.equal(0)
      });

      it("Consumer should spend funds of a user after a he deposited", async function () {
        const {user, developer, ggtContract, bankContract} = await loadFixture(deployContracts);

        await ggtContract.connect(user).approve(bankContract.address, 100)
        await bankContract.connect(user).deposit(100, developer.address)

        await expect(await bankContract.getContractBalance()).to.equal(100)
        await expect(await bankContract.getUserBalanceByGame(user.address, developer.address)).to.equal(100)

        await bankContract.connect(developer).spend(100, user.address)

        await expect(await bankContract.getContractBalance()).to.equal(0)
        await expect(await bankContract.getUserBalanceByGame(user.address, developer.address)).to.equal(0)
      });
      it("User should withdraw remaining funds after a consumer spent partial amount", async function () {
        const {user, developer, ggtContract, bankContract} = await loadFixture(deployContracts);

        await ggtContract.connect(user).approve(bankContract.address, 100)
        await bankContract.connect(user).deposit(100, developer.address)

        await expect(await bankContract.getContractBalance()).to.equal(100)
        await expect(await bankContract.getUserBalanceByGame(user.address, developer.address)).to.equal(100)

        await bankContract.connect(developer).spend(50, user.address)

        await expect(await bankContract.getContractBalance()).to.equal(50)
        await expect(await bankContract.getUserBalanceByGame(user.address, developer.address)).to.equal(50)

        await bankContract.connect(user).withdraw(50, developer.address)

        await expect(await bankContract.getContractBalance()).to.equal(0)
        await expect(await bankContract.getUserBalanceByGame(user.address, developer.address)).to.equal(0)
      });
    });
  });
});
