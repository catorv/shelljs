const style = require('../style.js');

const levels = {
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
}

const log = {
  logger: console,

  levels,
  level: levels.INFO,

  indent: 0,
};

log.debug   = wrap('log', levels.DEBUG, '■', style.magenta);
log.info    = wrap('log', levels.INFO, '◇', style.blueBright);
log.success = wrap('log', levels.INFO, '✓', style.green);
log.warn    = wrap('warn', levels.WARN, '‼', style.yellow);
log.error   = wrap('error', levels.ERROR, '✗', style.red);

module.exports = log;

function wrap(method, level, icon, style_fn) {
  const prefix = ' '.repeat(log.indent) + style_fn(icon);
  return function() {
    if (level > log.level) return;
    let args = Array.from(arguments).map(item =>
      typeof item === 'string' ? style_fn(item) : item
    );
    if (typeof args[0] === 'string') {
      if (args[0] && args[0].indexOf('%') >= 0) {
        args[0] = fixFormatString(prefix + ' ' + args[0], style_fn);
      } else {
        args[0] = prefix + ' ' + args[0];
      }
    } else {
      args = [prefix].concat(args);
    }
    log.logger[method].apply(null, args);
  };
}

function fixFormatString(str, style_fn) {
  let start = 0;
  const len = str.length;
  const parts = [];
  for (let i = 0; i < len; i++) {
    const ch = str[i];
    if (ch === '%') {
      if (str[i + 1] !== '%') {
        parts.push(str.substring(start, i));
        parts.push(str.substring(i, i + 2));
        start = i + 2;
      }
      i++;
    }
  }
  if (start < len) {
    parts.push(str.substring(start));
  }
  return parts.map(x => style_fn(x)).join('');
}
