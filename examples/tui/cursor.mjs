import shell from '../../proxy.js';
import style from '../../style.js';
import tui from '../../tui/index.js';

const sleep = shell.sleep.bind(shell, 2);

async function reset(message) {
  await shell.clear();
  console.log(`# ${message} #
0123456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789
1123456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789
2123456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789
3123456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789
4123456789_123456789_>>>=============---${
  style.red.bold('*')
}---=============<<<_123456789_123456789
5123456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789
6123456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789
7123456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789
8123456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789
`);
  await tui.cursor.moveTo(40, 5);
  await shell.sleep('300ms');
}

await reset('Ready...');
await sleep();


await reset('hide()');
tui.cursor.hide();
await sleep();

await reset('show()');
tui.cursor.show();
await sleep();

await reset('toggle()');
tui.cursor.toggle();
await sleep();
await reset('toggle() again');
tui.cursor.toggle();
await sleep();

await reset('move(-10, -3)');
tui.cursor.move(-10, -3);
await sleep();

await reset('moveTo(10, 5)');
tui.cursor.moveTo(10, 5);
await sleep();

await reset('moveToStart()');
tui.cursor.moveToStart();
await sleep();

await reset('moveUp()');
tui.cursor.moveUp();
await sleep();

await reset('moveDown()');
tui.cursor.moveDown();
await sleep();

await reset('moveLeft()');
tui.cursor.moveLeft();
await sleep();

await reset('moveRight()');
tui.cursor.moveRight();
await sleep();


await reset('Done');
await shell.sleep('300ms');
await shell.clear();
