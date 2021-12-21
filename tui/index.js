const { write, writeln } = require('./write.js');
const cursor = require('./cursor.js');
const spin = require('./spinner');
spin.wait = spin.spinPromise;
const { clear, clearLine, clearScreenDown } = require('./clear.js');
const log = require('./logger.js');
const chooser = require('./chooser.js');

let tui = {
  clear,
  clearLine,
  clearScreenDown,
  cursor,
  log,
  spin,
  write,
  writeln,
  chooser,
}

const getWritableStream = () => process.stdout || process.stderr;

Object.defineProperty(tui, 'columns', {
  get() { return getWritableStream().columns; }
});

Object.defineProperty(tui, 'rows', {
  get() { return getWritableStream().rows; }
});

Object.defineProperty(tui, 'colorDepth', {
  get() { return getWritableStream().getColorDepth(); }
});

Object.defineProperty(tui, 'isTTY', {
  get() { return getWritableStream().isTTY; }
});

module.exports = tui;
