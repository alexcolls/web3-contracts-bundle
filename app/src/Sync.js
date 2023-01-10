const ApiCalls = require("./utils/ApiCalls");
const Contract = require("./utils/Contract");
const provider = require('../provider');

const ERBankContract = new provider.web3.eth.Contract(
  Contract.getABI('ERBank'),
  Contract.getAddress('ERBank')
);

const blocksOffset = process.env.APP_BLOCKS_OFFSET;
const iterationLimit = process.env.APP_ITERATION_LIMIT;

let parsedTxs = new Set();

const Sync = (() => {
  async function syncPastEvents(eventName, resetSyncCounter = false) {
    let fromBlock;
    let toBlock;
    let iterationCurrent = 0;
    let repeat = false;

    if (resetSyncCounter) {
      fromBlock = null;
      iterationCurrent = 0;
    }

    while (iterationCurrent <= iterationLimit && !repeat) {
      iterationCurrent++;

      if (fromBlock) {
        // If NOT the first time we subtract blocksOffset from toBlock (as it is null first time)
        toBlock = (toBlock - blocksOffset);
      } else {
        toBlock = Number(await web3.eth.getBlockNumber());
        fromBlock = toBlock;
      }
      fromBlock = (fromBlock - blocksOffset);

      const events = await pastEvents(eventName, fromBlock, toBlock);
      repeat = await postEvents(events);
    }
  }

  async function pastEvents(eventName, fromBlock, toBlock) {
    try {
      return await ERBankContract.getPastEvents(eventName, {
        filter: {},
        fromBlock: String(fromBlock),
        toBlock: String(toBlock)
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function postEvents(events) {
    if (events.length) {
      for (const event of events) {
        if (!parsedTxs.has(event.transactionHash)) {
          parsedTxs.add(event.transactionHash);
          const repeat = await ApiCalls.postSomething(event);
          if (repeat) {
            return true;
          }
        } else {
          console.log(`Transaction hash ${event.transactionHash} already parsed`);
        }
      }
    }
    return false;
  }

  return { syncPastEvents };
})();

module.exports = Sync;
