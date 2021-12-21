const style = require('../style.js');
const { write, writeln } = require('./write.js');
const { read } = require('../keyboard.js');
const { clearLine } = require('./clear.js');
const cursor = require('./cursor.js');

module.exports = async function(text, waitText = 'Press any key to continue') {
  writeln(text);
  write(style.yellow.dim(waitText));
  await cursor.hide();
  await read();
  await clearLine();
  await cursor.moveToStart();
  await cursor.show();
}
