import tui from '../../tui/index.js';

tui.log.level = tui.log.DEBUG;

const methods = ['debug', 'info', 'success', 'warn', 'error'];

console.log('supported methods:', methods);

for (let i = 0; i < 20; i++) {
  const method = methods[Math.random() * methods.length | 0];
  const log = tui.log[method];
  log(`Looooooooooooooong text. -- ${method}`);
}

tui.log.debug('formatted text (%%s): Hello, %s!', 'world');

