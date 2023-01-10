const ApiCalls = require("./utils/ApiCalls");
const Contract = require("./utils/Contract");
const emitter = require('../events');
const provider = require('../provider');

const ERBankContract = new provider.web3.eth.Contract(
  Contract.getABI('ERBank'),
  Contract.getAddress('ERBank')
);

/*
 * Class
 */
const Listener = {
  // -- Events -- //
  async eventListenerDeposit() {
    return await ERBankContract.events.Deposit()
      .on('connected', function (subscriptionId) {
        console.log(`Setting the Deposit hook: ${subscriptionId}`)
      })
      .on('data', async function (event) {
        console.log(`Hook has detected a new Deposit!: ${event.returnValues}`)
        // find corresponding offer
        try {
          await ApiCalls.postSomething(event);
        } catch (error) {
          console.log(error);
        }
      })
      .on('error', function (error) {
        console.log(error);
        emitter.emit('listener-error', error);
      });
  }
};

module.exports = Listener;
