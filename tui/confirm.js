const style = require('../style.js');
const cursor = require('./cursor.js');
const { write, writeln } = require('./write.js');
const { read } = require('../keyboard.js');
const { clearLine } = require('./clear.js');

module.exports = async function(text, defaultValue = true) {
  const yLetter = defaultValue ? 'Y' : 'y';
  const nLetter = defaultValue ? 'n' : 'N';
  write(text + ' (' +
    style.cyan.underline(yLetter) + style.cyan('es') + '/' +
    style.cyan.underline(nLetter) + style.cyan('o') + ')');

  cursor.hide();

  let key;
  while ((key = await read())) {
    if (key.name === 'y' || key.name === 'n' || key.name === 'return') {
      break;
    }

    if (key.name === 'c' && key.ctrl) {
      writeln(style.red.bgYellow(' Cancelled! '));
      cursor.show();
      process.exit(1);
    }
  }

  let result = key.name === 'y';

  if (key.name === 'return') {
    result = defaultValue;
  }

  await clearLine();
  await cursor.moveToStart();
  write(text + ' ');
  writeln(result ? style.green('yes') : style.yellow('no'));

  cursor.show();

  return result;
}
