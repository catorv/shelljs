import shell from '../../proxy.js';
import tui from '../../tui/index.js';

async function reset(message) {
  await shell.clear();
  console.log(`${message}
11111111111111111111111111111111111111111111111111111111111111111111111111111111
22222222222222222222222222222222222222222222222222222222222222222222222222222222
33333333333333333333333333333333333333333333333333333333333333333333333333333333
44444444444444444444444444444444444444444444444444444444444444444444444444444444
55555555555555555555555555555555555555555555555555555555555555555555555555555555
66666666666666666666666666666666666666666666666666666666666666666666666666666666
`);
  tui.cursor.move(10, -5);
}

await reset('clear()');
await shell.sleep(1);
tui.clear();
await shell.sleep(1);

await reset('clearLine()');
await shell.sleep(1);
tui.clearLine();
await shell.sleep(1);

await reset('clearLine(-1)');
await shell.sleep(1);
tui.clearLine(-1);
await shell.sleep(1);

await reset('clearLine(1)');
await shell.sleep(1);
tui.clearLine(1);
await shell.sleep(1);

await reset('clearScreenDown()');
await shell.sleep(1);
tui.clearScreenDown();
await shell.sleep(1);

