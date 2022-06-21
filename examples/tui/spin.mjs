import shell from '../../proxy.js';
import tui from '../../tui/index.js';

// Usage: see https://github.com/sindresorhus/ora
const spinner = tui.spin('Loading unicorns').start();

await shell.sleep(2);

spinner.color = 'yellow';
spinner.text = 'Loading rainbows';

tui.write('Looooooooooooooong message');

await shell.sleep(2);

spinner.stop();

console.log('done');
await shell.sleep(1);
