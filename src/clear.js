var common = require('./common');

common.register('clear', _clear, {
  cmdOptions: {
    n: 'noFullClear',
  },
  allowGlobbing: false,
  wrapOutput: false,
});

function _clear(options) {
  if (!options.noFullClear) {
    process.stdout.write('\x1b[2J');
  }

  process.stdout.write('\x1b[0f');

  return '';
}
module.exports = _clear;
