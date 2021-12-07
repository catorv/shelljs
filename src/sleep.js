var common = require('./common');

common.register('sleep', _sleep, {
  cmdOptions: {},
  allowGlobbing: false,
});

var REG_NUMBER = /^\d+(?:\.\d+)?$/;
var REG_NUMBER_WITH_SUFFIX = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/;

function _sleep(options, waitTime) {
  waitTime = waitTime == null ? '1' : ('' + waitTime);
  var ms = 0;
  if (REG_NUMBER.test(waitTime)) {
    ms = +waitTime * 1000;
  } else if (REG_NUMBER_WITH_SUFFIX.test(waitTime)) {
    ms = +RegExp.$1;
    switch (RegExp.$2) {
      case 's': ms *= 1000; break;
      case 'm': ms *= 1000 * 60; break;
      case 'h': ms *= 1000 * 60 * 60; break;
      case 'd': ms *= 1000 * 60 * 60 * 24; break;
      default: break;
    }
  } else {
    common.error('sleep time must be an number');
  }
  if (ms > 0) {
    msleep(ms | 0);
  }
  return '';
}
module.exports = _sleep;

function msleep(n) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}
