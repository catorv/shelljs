const style = require('../style.js');
const logSymbols = require('./utils/log-symbols.js');

const log = {
  indent: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
};

log.level = log.INFO;
log.logger = console;

log.debug = wrap('log', log.DEBUG, '~', style.cyan);
log.info = wrap('log', log.INFO, 'info', style.blueBright);
log.success = wrap('log', log.INFO, 'success', style.green);
log.warn = wrap('warn', log.WARN, 'warning', style.yellow);
log.error = wrap('error', log.ERROR, 'error', style.red);

module.exports = log;

function wrap(method, level, type, styled) {
  const icon = logSymbols[type] || type;
  const prefix = ' '.repeat(log.indent) + styled(icon);
  return function() {
    if (level > log.level) return;
    const args = Array.from(arguments).map(item =>
      typeof item === 'string' ? styled(item) : item
    );
    log.logger[method].apply(null, [prefix].concat(args));
  };
}
