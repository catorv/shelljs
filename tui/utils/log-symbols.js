// see: https://github.com/sindresorhus/log-symbols
const chalk = require('chalk');
const isUnicodeSupported = require('./is-unicode-supported.js');

const main = {
  info: chalk.blueBright('ℹ'),
  success: chalk.green('✔'),
  warning: chalk.yellow('⚠'),
  error: chalk.red('✖'),
};

const fallback = {
  info: chalk.blueBright('i'),
  success: chalk.green('√'),
  warning: chalk.yellow('‼'),
  error: chalk.red('×'),
};

const logSymbols = isUnicodeSupported() ? main : fallback;

module.exports = logSymbols;
