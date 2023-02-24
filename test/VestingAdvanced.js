const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {anyValue} = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("VestingAdvanced", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  // Constants
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
    const vesterAccounts = [
      accounts[1],
      accounts[2],
      accounts[3],
      accounts[4],
      accounts[5]
    ]
    const vesterTiers = [
      1,
      1,
      1,
      1,
      1
    ]
    const stranger = accounts[6]
    // Creating employees addresses stack starting by Ethers accounts
    let vesterAddresses = []
    for (let empl of vesterAccounts) {
      vesterAddresses.push(empl.address)
    }

    const GFALToken = await ethers.getContractFactory("GFALToken");
    const gfalToken = await GFALToken.deploy();

    const VestingAdvanced = await ethers.getContractFactory("VestingAdvanced")
    const vestingAdvanced = await VestingAdvanced.deploy(gfalToken.address, vesterAddresses, vesterTiers, UNLOCK_TIME);

    let totalVestingAmount = ethers.utils.parseEther(String(0))
    for (let i = 0; i < VESTING_SCHEDULE_SUCCESS.amount.length; i++) {
      totalVestingAmount = totalVestingAmount.add(VESTING_SCHEDULE_SUCCESS.amount[i])
    }

    await gfalToken.transfer(vestingAdvanced.address, totalVestingAmount)

    return {gfalToken, vestingAdvanced, owner, vesterAccounts, vesterTiers, vesterAddresses, stranger };
  }

  describe("Deployment", function () {
    it("Should set the right vestingToken", async function () {
      const {gfalToken, vestingAdvanced} = await loadFixture(deployContracts);

      await expect(await vestingAdvanced.vestingToken()).to.equal(gfalToken.address);
    });

    it("Should set the right collectors", async function () {
      const {vestingAdvanced, vesterAddresses, vesterTiers} = await loadFixture(deployContracts);

      for (let i = 0; i < vesterAddresses.length; i++) {
        const currentCollector = await vestingAdvanced.collectors(vesterAddresses[i])
        expect(currentCollector.allowed).to.equal(true);
        expect(currentCollector.tier).to.equal(vesterTiers[i]);
      }
    });

    it("Should set the right unlockTime", async function () {
      const {vestingAdvanced} = await loadFixture(deployContracts);

      await expect(await vestingAdvanced.unlockTime()).to.equal(UNLOCK_TIME);
    });

    it("Should set the right owner", async function () {
      const {vestingAdvanced, owner} = await loadFixture(deployContracts);

      await expect(await vestingAdvanced.owner()).to.equal(owner.address);
    });

    it("Should set an empty vestingSchedule", async function () {
      const {vestingAdvanced} = await loadFixture(deployContracts);

      expect(vestingAdvanced.vestingSchedule(0)).to.be.reverted
    });

    it("Should set the right nextVestingPeriod", async function () {
      const {vestingAdvanced, vesterAddresses} = await loadFixture(deployContracts);

      for (let addr of vesterAddresses) {
        await expect(await vestingAdvanced.nextVestingPeriods(addr)).to.equal(0);
      }
    });
  });

  describe("SetVestingSchedule", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called after unlockTime", async function () {
        const {vestingAdvanced} = await loadFixture(deployContracts);

        // fast-forward to unlock time
        await time.increaseTo(UNLOCK_TIME);


        await expect(vestingAdvanced.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)).to.be.revertedWith('Setting vesting schedule should be before unlockTime')
      })

      it("Should revert with the right error if called twice", async function () {
        const {vestingAdvanced} = await loadFixture(deployContracts);

        await vestingAdvanced.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)

        await expect(vestingAdvanced.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)).to.be.revertedWith('Setting vesting schedule not permitted after first setup')
      })

      it("Should revert with the right error if set inconsistent vesting schedule", async function () {
        const {vestingAdvanced} = await loadFixture(deployContracts);

        await expect(vestingAdvanced.setVestingSchedule(VESTING_SCHEDULE_ERROR.when, VESTING_SCHEDULE_ERROR.amount)).to.be.revertedWith('When.length length must be the same as Amount.length')
      });
    });

    describe("Workflow", function () {
      it("Should set the vesting schedule as expected", async function () {
        const {vestingAdvanced} = await loadFixture(deployContracts);

        await vestingAdvanced.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)

        // Check the first month - one index zero
        const firstVesting = await vestingAdvanced.vestingSchedule(0)
        expect(firstVesting.when).to.equal(VESTING_SCHEDULE_SUCCESS.when[0])
        expect(firstVesting.amount).to.equal(VESTING_SCHEDULE_SUCCESS.amount[0])

        // Check the last month - twelve index eleven
        const lastVesting = await vestingAdvanced.vestingSchedule(VESTING_SCHEDULE_SUCCESS.when.length - 1)
        expect(lastVesting.when).to.equal(VESTING_SCHEDULE_SUCCESS.when[VESTING_SCHEDULE_SUCCESS.when.length - 1])
        expect(lastVesting.amount).to.equal(VESTING_SCHEDULE_SUCCESS.amount[VESTING_SCHEDULE_SUCCESS.when.length - 1])

        // Not existing, reverting, vesting period
        await expect(vestingAdvanced.vestingSchedule(VESTING_SCHEDULE_SUCCESS.when.length)).to.be.reverted
      });
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called from another account", async function () {
        const {vestingAdvanced} = await loadFixture(deployContracts);

        // calling as admin, which is not whitelisted so a stranger
        await expect(vestingAdvanced.withdraw()).to.be.revertedWith('Sender must be whitelisted')
      });

      it("Should revert with the right error if called before unlockTime", async function () {
        const {vestingAdvanced, vesterAccounts} = await loadFixture(deployContracts);

        await vestingAdvanced.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)

        // fast-forward to unlock time
        await time.increaseTo(UNLOCK_TIME - 2);

        await expect(vestingAdvanced.connect(vesterAccounts[0]).withdraw()).to.be.revertedWith('Vesting schedule should be after unlockTime')
      });

      it("Should revert with the right error if called after unlockTime but before vesting", async function () {
        const {vestingAdvanced, vesterAccounts} = await loadFixture(deployContracts);

        await vestingAdvanced.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)

        // fast-forward to unlock time
        await time.increaseTo(VESTING_SCHEDULE_SUCCESS.when[0] - 2);

        await expect(vestingAdvanced.connect(vesterAccounts[0]).withdraw()).to.be.revertedWith('You cannot vest zero amount')
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
      it("Should transfer the funds to THE single claimer for single period claim finishing the full schedule", async function () {
        const {gfalToken, vestingAdvanced, vesterAccounts, vesterTiers} = await loadFixture(deployContracts);

        await vestingAdvanced.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)

        for (let i = 0; i < VESTING_SCHEDULE_SUCCESS.when.length; i++) {
          // fast-forward to unlock time
          await time.increaseTo(VESTING_SCHEDULE_SUCCESS.when[i]);

          const beforeBalanceContract = await gfalToken.balanceOf(vestingAdvanced.address)
          const beforeBalanceCollector = await gfalToken.balanceOf(vesterAccounts[0].address)

          await vestingAdvanced.connect(vesterAccounts[0]).withdraw()

          const afterBalanceContract = await gfalToken.balanceOf(vestingAdvanced.address)
          const afterBalanceCollector = await gfalToken.balanceOf(vesterAccounts[0].address)

          const collectorsTierSum = vesterTiers.reduce((sum, int) => sum + int, 0);
          let relativeAmount = (VESTING_SCHEDULE_SUCCESS.amount[i].div(collectorsTierSum)).mul(vesterTiers[0])
          expect(afterBalanceContract).to.equal(beforeBalanceContract.sub(relativeAmount))
          expect(afterBalanceCollector).to.equal(beforeBalanceCollector.add(relativeAmount))
        }
      });

      it("Should transfer the funds to ALL the collectors for single period claim finishing the full schedule", async function () {
        const {gfalToken, vestingAdvanced, vesterAccounts, vesterTiers} = await loadFixture(deployContracts);
        await vestingAdvanced.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)

        const collectorsTierSum = vesterTiers.reduce((sum, int) => sum + int, 0);

        for (let i = 0; i < VESTING_SCHEDULE_SUCCESS.when.length; i++) {
          // fast-forward to unlock time
          await time.increaseTo(VESTING_SCHEDULE_SUCCESS.when[i]);

          for (let z = 0; z < vesterAccounts.length; z++) {
            const beforeBalanceContract = await gfalToken.balanceOf(vestingAdvanced.address)
            const beforeBalanceCollector = await gfalToken.balanceOf(vesterAccounts[z].address)

            await vestingAdvanced.connect(vesterAccounts[z]).withdraw()

            const afterBalanceContract = await gfalToken.balanceOf(vestingAdvanced.address)
            const afterBalanceCollector = await gfalToken.balanceOf(vesterAccounts[z].address)

            // Expectations
            const relativeAmount = (VESTING_SCHEDULE_SUCCESS.amount[i].div(collectorsTierSum)).mul(vesterTiers[z])
            expect(afterBalanceContract).to.equal(beforeBalanceContract.sub(relativeAmount))
            expect(afterBalanceCollector).to.equal(beforeBalanceCollector.add(relativeAmount))
          }
        }

        // Post vesting expectations
        const totalVestingSupply = VESTING_SCHEDULE_SUCCESS.amount.reduce((sum, int) => int.add(sum), 0);
        const contractBalance = await gfalToken.balanceOf(vestingAdvanced.address)
        expect(contractBalance).to.be.approximately(0, 100) // TODO: Check if dusting is fine
        for (let w = 0; w < vesterAccounts.length; w++) {
          const vesterBalance = await gfalToken.balanceOf(vesterAccounts[w].address)
          const expectedBalance = (totalVestingSupply.div(collectorsTierSum)).mul(vesterTiers[w])
          expect(vesterBalance).to.be.approximately(expectedBalance, expectedBalance.sub(100)) // TODO: Check if dusting is fine
        }
      });

      // it("Should transfer the funds to ALL the collectors for single period claim blacklisting collectors before finishing the full schedule", async function () {
      //   const {gfalToken, vestingAdvanced, vesterAccounts, vesterTiers} = await loadFixture(deployContracts);
      //   await vestingAdvanced.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)
      //
      //   // Let as it will change in this test case
      //   let collectorsTierSum = vesterTiers.reduce((sum, int) => sum + int, 0);
      //
      //   let blackListedAddresses = []
      //   for (let i = 0; i < VESTING_SCHEDULE_SUCCESS.when.length; i++) {
      //     console.log('----- Vesting Schedule ->', i)
      //     // fast-forward to unlock time
      //     await time.increaseTo(VESTING_SCHEDULE_SUCCESS.when[i]);
      //
      //     // Start blacklisting
      //     if ((i !== 0 && i !== vesterAccounts.length-1) && i % 2 === 0) {
      //       const accountIndex = (i/2)-1
      //       const addressToBlacklist = vesterAccounts[accountIndex].address
      //       await vestingAdvanced.setVesterAddresses([addressToBlacklist], [false], [vesterTiers[accountIndex]])
      //       console.log('----- Blacklisting Account ->', accountIndex)
      //       blackListedAddresses.push(addressToBlacklist)
      //       // Subtract the not anymore allowed tier from the blacklisted account
      //       collectorsTierSum -= vesterTiers[accountIndex]
      //     }
      //     // Stop blacklisting
      //
      //     for (let z = 0; z < vesterAccounts.length; z++) {
      //       if (!blackListedAddresses.includes(vesterAccounts[z].address)) {
      //         const beforeBalanceContract = await gfalToken.balanceOf(vestingAdvanced.address)
      //         const beforeBalanceCollector = await gfalToken.balanceOf(vesterAccounts[z].address)
      //
      //         console.log('Account:', z)
      //         await vestingAdvanced.connect(vesterAccounts[z]).withdraw()
      //
      //         const afterBalanceContract = await gfalToken.balanceOf(vestingAdvanced.address)
      //         const afterBalanceCollector = await gfalToken.balanceOf(vesterAccounts[z].address)
      //         console.log('Claimed:', ethers.utils.formatEther(afterBalanceCollector.sub(beforeBalanceCollector)))
      //
      //         // Expectations
      //         const relativeAmount = (VESTING_SCHEDULE_SUCCESS.amount[i].div(collectorsTierSum)).mul(vesterTiers[z])
      //         expect(afterBalanceContract).to.equal(beforeBalanceContract.sub(relativeAmount))
      //         expect(afterBalanceCollector).to.equal(beforeBalanceCollector.add(relativeAmount))
      //       }
      //     }
      //   }
      //
      //   // Post vesting expectations
      //   const totalVestingSupply = VESTING_SCHEDULE_SUCCESS.amount.reduce((sum, int) => int.add(sum), 0);
      //   const contractBalance = await gfalToken.balanceOf(vestingAdvanced.address)
      //   expect(contractBalance).to.be.approximately(0, 100) // TODO: Check if dusting is fine
      //   for (let w = 0; w < vesterAccounts.length; w++) {
      //     const vesterBalance = await gfalToken.balanceOf(vesterAccounts[w].address)
      //     const expectedBalance = (totalVestingSupply.div(collectorsTierSum)).mul(vesterTiers[w])
      //     expect(vesterBalance).to.be.approximately(expectedBalance, expectedBalance.sub(100)) // TODO: Check if dusting is fine
      //   }
      // });

      it("Should transfer the funds to ALL the collectors for single period claim blacklisting collectors before finishing the full schedule, at mid periods", async function () {
        const {gfalToken, vestingAdvanced, vesterAccounts, vesterTiers} = await loadFixture(deployContracts);
        await vestingAdvanced.setVestingSchedule(VESTING_SCHEDULE_SUCCESS.when, VESTING_SCHEDULE_SUCCESS.amount)

        // Let as it will change in this test case
        let collectorsTierSum = vesterTiers.reduce((sum, int) => sum + int, 0);
        let lastBlacklistedDuringPeriod = 0
        let blackListedAddresses = []
        for (let i = 0; i < VESTING_SCHEDULE_SUCCESS.when.length; i++) {
          console.log('----- Vesting Schedule ->', i)
          // fast-forward to unlock time
          await time.increaseTo(VESTING_SCHEDULE_SUCCESS.when[i]);

          for (let z = 0; z < vesterAccounts.length; z++) {
            // Start blacklisting
            if (i !== 0 && i % 2 === 0 && z % 2 === 0 && !blackListedAddresses.includes(vesterAccounts[z].address) && lastBlacklistedDuringPeriod !== i) {
              lastBlacklistedDuringPeriod = i
              const addressToBlacklist = vesterAccounts[z].address
              await vestingAdvanced.setVesterAddresses([addressToBlacklist], [false], [vesterTiers[z]])
              console.log('----- Blacklisting Account ->', z)
              blackListedAddresses.push(addressToBlacklist)
              // Subtract the not anymore allowed tier from the blacklisted account
              collectorsTierSum -= vesterTiers[z]
            }
            // Stop blacklisting

            if (!blackListedAddresses.includes(vesterAccounts[z].address)) {
              const beforeBalanceContract = await gfalToken.balanceOf(vestingAdvanced.address)
              const beforeBalanceCollector = await gfalToken.balanceOf(vesterAccounts[z].address)

              console.log('Account:', z)
              await vestingAdvanced.connect(vesterAccounts[z]).withdraw()

              const afterBalanceContract = await gfalToken.balanceOf(vestingAdvanced.address)
              const afterBalanceCollector = await gfalToken.balanceOf(vesterAccounts[z].address)
              console.log('Claimed:', ethers.utils.formatEther(afterBalanceCollector.sub(beforeBalanceCollector)))

              // Expectations
              const relativeAmount = (VESTING_SCHEDULE_SUCCESS.amount[i].div(collectorsTierSum)).mul(vesterTiers[z])
              expect(afterBalanceContract).to.equal(beforeBalanceContract.sub(relativeAmount))
              expect(afterBalanceCollector).to.equal(beforeBalanceCollector.add(relativeAmount))
            }
          }
        }

        // Post vesting expectations
        const totalVestingSupply = VESTING_SCHEDULE_SUCCESS.amount.reduce((sum, int) => int.add(sum), 0);
        const contractBalance = await gfalToken.balanceOf(vestingAdvanced.address)
        console.log(ethers.utils.formatEther(contractBalance))
        expect(contractBalance).to.be.approximately(0, 100) // TODO: Check if dusting is fine
        for (let w = 0; w < vesterAccounts.length; w++) {
          const vesterBalance = await gfalToken.balanceOf(vesterAccounts[w].address)
          const expectedBalance = (totalVestingSupply.div(collectorsTierSum)).mul(vesterTiers[w])
          expect(vesterBalance).to.be.approximately(expectedBalance, expectedBalance.sub(100)) // TODO: Check if dusting is fine
        }
      });
    });
  });
});
