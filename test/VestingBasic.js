const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {anyValue} = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("VestingBasic", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  // Constants
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"
  const VESTER_ROLE = "0x64ed6499e2f5a7ea55dfd56da361bf9d48064843bb3891c36f1dabd9ba246135"
  const UNLOCK_TIME = 1678705100
  const VESTING_SCHEDULE_SUCCESS = {
    when: [
      1678705200, // 13 March 2023, 11:00:00 UTC/GMT
      1681383600, // 13 April 2023, 11:00:00 UTC/GMT
      1683975600, // 13 May 2023, 11:00:00 UTC/GMT
      1686654000, // 13 June 2023, 11:00:00 UTC/GMT
      1689246000, // 13 July 2023, 11:00:00 UTC/GMT
      1691924400, // 13 August 2023, 11:00:00 UTC/GMT
      1694602800, // 13 September 2023, 11:00:00 UTC/GMT
      1697194800, // 13 October 2023, 11:00:00 UTC/GMT
      1699873200, // 13 November 2023, 11:00:00 UTC/GMT
      1702465200, // 13 December 2023, 11:00:00 UTC/GMT
      1705143600, // 13 January 2024, 11:00:00 UTC/GMT
      1707822000, // 13 February 2024, 11:00:00 UTC/GMT
    ],
    amount: [
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ]
  }
  const VESTING_SCHEDULE_ERROR = {
    when: [
      1678705200, // 13 March 2023, 11:00:00 UTC/GMT
      1681383600, // 13 April 2023, 11:00:00 UTC/GMT
    ],
    amount: [
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
      ethers.utils.parseEther(String(2500000)), // 30.000.000 / 12 = 2.500.000 to Wei
    ]
  }

  async function deployContracts() {
    const accounts = await ethers.getSigners();
    const owner = accounts[0]
    const vester = accounts[1]
    const collector = accounts[2]
    const stranger = accounts[3]

    const GFALToken = await ethers.getContractFactory("GFALToken");
    const gfalToken = await GFALToken.deploy();

    const VestingBasic = await ethers.getContractFactory("VestingBasic")
    const vestingBasic = await VestingBasic.deploy(gfalToken.address, collector.address, UNLOCK_TIME);

    let totalVestingAmount = ethers.utils.parseEther(String(0))
    for (let i = 0; i < VESTING_SCHEDULE_SUCCESS.amount.length; i++) {
      totalVestingAmount = totalVestingAmount.add(VESTING_SCHEDULE_SUCCESS.amount[i])
    }

    await gfalToken.transfer(vestingBasic.address, totalVestingAmount)

    return {gfalToken, vestingBasic, owner, vester, collector, stranger};
  }

  describe("Deployment", function () {
    it("Should set the right vestingToken", async function () {
      const {gfalToken, vestingBasic} = await loadFixture(deployContracts);

      await expect(await vestingBasic.vestingToken()).to.equal(gfalToken.address);
    });

    it("Should set the right vestingCollector", async function () {
      const {vestingBasic, collector} = await loadFixture(deployContracts);

      await expect(await vestingBasic.vestingCollector()).to.equal(collector.address);
    });

    it("Should set the right unlockTime", async function () {
      const {vestingBasic} = await loadFixture(deployContracts);

      await expect(await vestingBasic.unlockTime()).to.equal(UNLOCK_TIME);
    });

    it("Should set the right DEFAULT_ADMIN_ROLE", async function () {
      const {vestingBasic, owner} = await loadFixture(deployContracts);

      await expect(await vestingBasic.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("Should set an empty vestingSchedule", async function () {
      const {vestingBasic} = await loadFixture(deployContracts);

      expect(vestingBasic.vestingSchedule(0)).to.be.reverted
    });

    it("Should set the right nextVestingPeriod", async function () {
      const {vestingBasic} = await loadFixture(deployContracts);

      await expect(await vestingBasic.nextVestingPeriod()).to.equal(0);
    });
  });

  describe("Access Control", function () {
    describe("Validations", function () {
      it("Should revert if a stranger tries to grant a role", async function () {
        const {vestingBasic, stranger, vester} = await loadFixture(deployContracts);

        await expect(vestingBasic.connect(stranger).grantRole(VESTER_ROLE, vester.address)).to.be.revertedWith('AccessControl: account 0x90f79bf6eb2c4f870365e785982e1f101e93b906 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000')
      });
    });

    describe("Workflow", function () {
      it("Should allow a DEFAULT_ADMIN_ROLE to grant role", async function () {
        const {vestingBasic, vester} = await loadFixture(deployContracts);

        await vestingBasic.grantRole(VESTER_ROLE, vester.address)

        await expect(await vestingBasic.hasRole(VESTER_ROLE, vester.address)).to.be.equal(true)
      });
    });
  });

  describe("SetVestingSchedule", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called after unlockTime", async function () {
        const {vestingBasic} = await loadFixture(deployContracts);

        // fast-forward to unlock time
        await time.increaseTo(UNLOCK_TIME);


        await expect(vestingBasic.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)).to.be.revertedWith('Setting vesting schedule should be before unlockTime')
      })

      it("Should revert with the right error if called twice", async function () {
        const {vestingBasic} = await loadFixture(deployContracts);

        await vestingBasic.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)

        await expect(vestingBasic.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)).to.be.revertedWith('Setting vesting schedule not permitted after first setup')
      })

      it("Should revert with the right error if set inconsistent vesting schedule", async function () {
        const {vestingBasic} = await loadFixture(deployContracts);

        await expect(vestingBasic.setVestingSchedule(VESTING_SCHEDULE_ERROR.when, VESTING_SCHEDULE_ERROR.amount)).to.be.revertedWith('When.length length must be the same as Amount.length')
      });
    });

    describe("Workflow", function () {
      it("Should set the vesting schedule as expected", async function () {
        const {vestingBasic} = await loadFixture(deployContracts);

        await vestingBasic.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)

        // Check the first month - one index zero
        const firstVesting = await vestingBasic.vestingSchedule(0)
        expect(firstVesting.when).to.equal(VESTING_SCHEDULE_SUCCESS.when[0])
        expect(firstVesting.amount).to.equal(VESTING_SCHEDULE_SUCCESS.amount[0])

        // Check the last month - twelve index eleven
        const lastVesting = await vestingBasic.vestingSchedule(VESTING_SCHEDULE_SUCCESS.when.length - 1)
        expect(lastVesting.when).to.equal(VESTING_SCHEDULE_SUCCESS.when[VESTING_SCHEDULE_SUCCESS.when.length - 1])
        expect(lastVesting.amount).to.equal(VESTING_SCHEDULE_SUCCESS.amount[VESTING_SCHEDULE_SUCCESS.when.length - 1])

        // Not existing, reverting, vesting period
        await expect(vestingBasic.vestingSchedule(VESTING_SCHEDULE_SUCCESS.when.length)).to.be.reverted
      });
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called from another account", async function () {
        const {vestingBasic} = await loadFixture(deployContracts);

        await expect(vestingBasic.withdraw()).to.be.revertedWith('AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x64ed6499e2f5a7ea55dfd56da361bf9d48064843bb3891c36f1dabd9ba246135')
      });

      it("Should revert with the right error if called before unlockTime", async function () {
        const {vestingBasic, vester} = await loadFixture(deployContracts);

        // Start - Already tested required things
        await vestingBasic.grantRole(VESTER_ROLE, vester.address)
        await vestingBasic.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)
        // End - Already tested required things

        // fast-forward to unlock time
        await time.increaseTo(UNLOCK_TIME - 2);

        await expect(vestingBasic.connect(vester).withdraw()).to.be.revertedWith('Vesting schedule should be after unlockTime')
      });

      it("Should revert with the right error if called after unlockTime but before vesting", async function () {
        const {vestingBasic, vester} = await loadFixture(deployContracts);

        // Start - Already tested required things
        await vestingBasic.grantRole(VESTER_ROLE, vester.address)
        await vestingBasic.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)
        // End - Already tested required things

        // fast-forward to unlock time
        await time.increaseTo(VESTING_SCHEDULE_SUCCESS.when[0] - 2);


        await expect(vestingBasic.connect(vester).withdraw()).to.be.revertedWith('You cannot vest zero amount')
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        // TODO: Test this
      });

      it("Should emit more then one event on cumulative withdrawals", async function () {
        // TODO: Test this
      });
    });

    describe("Workflow", function () {
      it("Should transfer the funds to the vestingCollector for single claim", async function () {
        const {gfalToken, vestingBasic, vester} = await loadFixture(deployContracts);

        // Start - Already tested required things
        await vestingBasic.grantRole(VESTER_ROLE, vester.address)
        await vestingBasic.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)
        // End - Already tested required things

        for (let i = 0; i < VESTING_SCHEDULE_SUCCESS.when.length; i++) {
          // fast-forward to unlock time
          await time.increaseTo(VESTING_SCHEDULE_SUCCESS.when[i]);

          const beforeBalanceContract = await gfalToken.balanceOf(vestingBasic.address)
          const beforeBalanceCollector = await gfalToken.balanceOf(await vestingBasic.vestingCollector())

          await vestingBasic.connect(vester).withdraw()

          const afterBalanceContract = await gfalToken.balanceOf(vestingBasic.address)
          const afterBalanceCollector = await gfalToken.balanceOf(await vestingBasic.vestingCollector())

          expect(afterBalanceContract).to.equal(beforeBalanceContract.sub(VESTING_SCHEDULE_SUCCESS.amount[i]))
          expect(afterBalanceCollector).to.equal(beforeBalanceCollector.add(VESTING_SCHEDULE_SUCCESS.amount[i]))
        }
      });

      it("Should transfer the funds to the vestingCollector for cumulative claim", async function () {
        const {gfalToken, vestingBasic, vester} = await loadFixture(deployContracts);

        // Start - Already tested required things
        await vestingBasic.grantRole(VESTER_ROLE, vester.address)
        await vestingBasic.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)
        // End - Already tested required things

        // fast-forward to unlock time
        await time.increaseTo(VESTING_SCHEDULE_SUCCESS.when[1]);

        const beforeBalanceContract = await gfalToken.balanceOf(vestingBasic.address)
        const beforeBalanceCollector = await gfalToken.balanceOf(await vestingBasic.vestingCollector())

        await vestingBasic.connect(vester).withdraw()

        const afterBalanceContract = await gfalToken.balanceOf(vestingBasic.address)
        const afterBalanceCollector = await gfalToken.balanceOf(await vestingBasic.vestingCollector())

        expect(afterBalanceContract).to.equal(beforeBalanceContract.sub(VESTING_SCHEDULE_SUCCESS.amount[0]).sub(VESTING_SCHEDULE_SUCCESS.amount[1]))
        expect(afterBalanceCollector).to.equal(beforeBalanceCollector.add(VESTING_SCHEDULE_SUCCESS.amount[0]).add(VESTING_SCHEDULE_SUCCESS.amount[1]))

        // expiring time to the last claim

        await time.increaseTo(VESTING_SCHEDULE_SUCCESS.when[VESTING_SCHEDULE_SUCCESS.when.length - 1]);

        let beforeBalanceContractEnd = await gfalToken.balanceOf(vestingBasic.address)
        let beforeBalanceCollectorEnd = await gfalToken.balanceOf(await vestingBasic.vestingCollector())

        await vestingBasic.connect(vester).withdraw()

        const afterBalanceContractEnd = await gfalToken.balanceOf(vestingBasic.address)
        const afterBalanceCollectorEnd = await gfalToken.balanceOf(await vestingBasic.vestingCollector())

        // Iterating increase of bigNumber
        for (let i = 2; i < VESTING_SCHEDULE_SUCCESS.amount.length; i++) {
          beforeBalanceContractEnd = beforeBalanceContractEnd.sub(VESTING_SCHEDULE_SUCCESS.amount[i])
          beforeBalanceCollectorEnd = beforeBalanceCollectorEnd.add(VESTING_SCHEDULE_SUCCESS.amount[i])
        }

        expect(beforeBalanceContractEnd).to.equal(0) // just to ensure, hardcoded value
        expect(afterBalanceContractEnd).to.equal(beforeBalanceContractEnd)
        expect(afterBalanceCollectorEnd).to.equal(beforeBalanceCollectorEnd)
      });
    });
  });
});
