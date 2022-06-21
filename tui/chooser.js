const keyboard = require('../keyboard.js');
const cursor = require('./cursor.js');
const { clearLine, clearScreenDown } = require('./clear.js');
const { write, writeln } = require('./write.js');
const style = require('../style.js');

const STYLE_CANCELLED = style.bgYellow.red;
const STYLE_SELECTED = style.inverse.yellow;
const STYLE_ITEM = style.yellow;
const STYLE_RESULT = style.green;

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

    await write(title);
    if (value < 0) {
      await writeln(STYLE_CANCELLED(' Cancelled'));
    } else {
      await writeln(STYLE_RESULT(' ' + items[value]));
    }
  } else {
    if (clear) {
      await cursor.move(0, -items.length - 1);
    }

    await writeln(title);

    for (let i = 0; i < items.length; i++) {
      let isCurrent = i === value;
      const s = isCurrent ? STYLE_SELECTED : STYLE_ITEM;
      // await write(s(isCurrent ? ` •${i + 1}.` : `  ${i + 1}.`));
      // await writeln(s(` ${items[i]} `));
      await writeln(' ' + s(` ${i + 1}. ${items[i]} `));
    }
  }
}

async function showChooserInline(title, items, value, exit = false) {
  if (exit) {
    await clearLineAndReset();
    await write(title);
    if (value < 0) {
      await writeln(STYLE_CANCELLED(' Cancelled'));
    } else {
      await writeln(STYLE_RESULT(' ' + items[value]));
    }
  } else {
    await cursor.moveToStart();
    await write(title + ' ');
    for (let i = 0; i < items.length; i++) {
      let isCurrent = i === value;
      const s = isCurrent ? STYLE_SELECTED : STYLE_ITEM;
      await write(s(' ' + items[i] + ' '));
    }
  }
}

/**
 * Chooser
 * @param {Object} options
 * @returns {Promise<number>}
 */
module.exports = async function chooser(options) {
  options = {
    title: 'Please select:',
    items: [],
    value: 0,
    cancelable: false,
    breakable: true,
    inline: false,
    backwardKeys: ['up', 'left', 'k', 'h'],
    forwardKeys: ['down', 'right', 'tab', 'j', 'l'],
    confirmKeys: ['return', 'space'],
    onKeyPress: null,
    ...options,
  };
  let value = options.value | 0;
  const {title, items, cancelable, breakable, inline} = options;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('options.items must be a non-empty array.');
  }

  cursor.hide();
  if (inline) {
    await showChooserInline(title, items, value);
  } else {
    await showChooser(title, items, value);
  }

  const len = items.length;
  let key;
  while ((key = await keyboard.read())) {
    if (options.confirmKeys.includes(key.name)) {
      break;
    }

    if (cancelable && key.name === 'escape') {
      value = -1;
      break;
    }

    if (key.name === 'c' && key.ctrl || breakable && key.name === 'q') {
      await writeln(STYLE_CANCELLED(' Cancelled! '));
      cursor.show();
      process.exit(0);
    }

    if (/\d/.test(key.name)) {
      const num = (key.name | 0) - 1;
      if (num < len) {
        value = num;
        break;
      }
    }

    if (options.backwardKeys.includes(key.name)) {
      value = ((value - 1) + len) % len;
    } else if (options.forwardKeys.includes(key.name)) {
      value = (value + 1) % len;
    }

    if (typeof options.onKeyPress === 'function') {
      const result = options.onKeyPress({ ...key, value });
      if (result) {
        const newValue = result.value;
        if (typeof newValue === 'number' && (newValue >= 0 && newValue < len)) {
          value = newValue;
        }
        if (result.select) {
          break;
        }
      }
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
