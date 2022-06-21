const { write, writeln } = require('./write.js');
const cursor = require('./cursor.js');
const spin = require('./spinner');
spin.wait = spin.spinPromise;
const { clear, clearLine, clearScreenDown } = require('./clear.js');
const log = require('./logger.js');
const chooser = require('./chooser.js');
const alert = require('./alert.js');
const confirm = require('./confirm.js');
const utils = require('./utils/utils.js');

let tui = {
  get columns() { return utils.columns(); },
  get rows() { return utils.rows(); },
  get colorDepth() { return utils.colorDepth(); },
  get isTTY() { return utils.isTTY(); },

  clear,
  clearLine,
  clearScreenDown,
  cursor,
  log,
  spin,
  write,
  writeln,
  chooser,
  alert,
  confirm,

  ellipsis: utils.ellipsis,
}

module.exports = tui;
