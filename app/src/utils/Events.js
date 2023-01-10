const EventEmitter = require('app/src/utils/Events');

class AppEmitter extends EventEmitter {}
const emitter = new AppEmitter();

module.exports = emitter;
