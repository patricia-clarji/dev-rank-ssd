const EventEmitter = require("events");

const appEventBus = new EventEmitter();

module.exports = {
  appEventBus,
};
