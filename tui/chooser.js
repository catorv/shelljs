const keyboard = require('../keyboard.js');
const cursor = require('./cursor.js');
const { clearLine, clearScreenDown } = require('./clear.js');
const { write, writeln } = require('./write.js');
const style = require('../style.js');

async function clearLineAndReset() {
  await clearLine();
  await cursor.moveToStart();
}

async function showChooser(title, items, value, clear = false, exit = false) {
  if (exit) {
    if (clear) {
      await cursor.move(0, -items.length - 1);
      await clearScreenDown();
    }

    write(title);
    if (value < 0) {
      writeln(style.red(' Cancelled'));
    } else {
      writeln(style.green(' ' + items[value]));
    }
  } else {
    if (clear) {
      await cursor.move(0, -items.length - 1);
    }

    writeln(title);

    for (let i = 0; i < items.length; i++) {
      let isCurrent = i === value;
      const s = isCurrent ? style.magenta : style.cyan;
      write(s(isCurrent ? ` •${i + 1}.` : `  ${i + 1}.`));
      writeln(s(` ${items[i]} `));
    }
  }
}

async function showChooserInline(title, items, value, exit = false) {
  if (exit) {
    await clearLineAndReset();
    write(title);
    if (value < 0) {
      writeln(style.red(' Cancelled'));
    } else {
      writeln(style.green(' ' + items[value]));
    }
  } else {
    await cursor.moveToStart();
    write(style.green(title) + ' ');
    for (let i = 0; i < items.length; i++) {
      let isCurrent = i === value;
      const s = isCurrent ? style.magenta : style.cyan;
      write(s((isCurrent ? '[' : ' ') + items[i] + (isCurrent ? ']' : ' ')));
    }
  }
}

module.exports = async function chooser(options = {}) {
  options = Object.assign({
    title: 'Please select:',
    items: [],
    value: 0,
    cancelable: false,
    breakable: true,
    inline: false,
  }, options);
  let value = options.value | 0;
  const {title, items, cancelable, breakable, inline} = options;

  await cursor.hide();
  if (inline) {
    await showChooserInline(title, items, value);
  } else {
    await showChooser(title, items, value);
  }

  const len = items.length;
  let key;
  while (key = await keyboard.read()) {
    if (key.name === 'return' || key.name === 'space') {
      break;
    }

    if (cancelable && key.name === 'escape') {
      value = -1;
      break;
    }

    if (key.name === 'c' && key.ctrl || breakable && key.name === 'q') {
      writeln(style.red.bgYellow(' Cancelled! '));
      cursor.show();
      process.exit(1);
    }

    if (/\d/.test(key.name)) {
      const num = (key.name | 0) - 1;
      if (num < len) {
        value = num;
        break;
      }
    }

    switch (key.name) {
      case 'up':
      case 'left':
      case 'k':
      case 'h':
        value = ((value - 1) + len) % len;
        break;
      case 'down':
      case 'right':
      case 'tab':
      case 'j':
      case 'l':
        value = (value + 1) % len;
        break;
    }

    if (inline) {
      await showChooserInline(title, items, value);
    } else {
      await showChooser(title, items, value, true);
    }
  }

  if (inline) {
    await showChooserInline(title, items, value, true);
  } else {
    await showChooser(title, items, value, true, true);
  }
  cursor.show();
  return value;
}
