const onetime = require('./utils/onetime.js');
const signalExit = require('signal-exit');

let isHidden = false;
const cursor = {};

// see: https://github.com/sindresorhus/restore-cursor
cursor.restore = onetime(() => {
  signalExit(() => {
    process.stderr.write('\u001B[?25h');
  }, {alwaysLast: true});
});

// see: https://github.com/sindresorhus/cli-cursor
cursor.show = (writableStream = process.stderr) => {
  if (!writableStream.isTTY) {
    return;
  }

  isHidden = false;
  writableStream.write('\u001B[?25h');
};

// see: https://github.com/sindresorhus/cli-cursor
cursor.hide = (writableStream = process.stderr) => {
  if (!writableStream.isTTY) {
    return;
  }

  cursor.restore();
  isHidden = true;
  writableStream.write('\u001B[?25l');
};

// see: https://github.com/sindresorhus/cli-cursor
cursor.toggle = (force, writableStream = process.stderr) => {
  if (force !== undefined) {
    isHidden = force;
  }

  if (isHidden) {
    cursor.show(writableStream);
  } else {
    cursor.hide(writableStream);
  }
};

cursor.move = (dx, dy, writableStream = process.stderr) => {
  return new Promise(resolve => { writableStream.moveCursor(dx, dy, resolve); });
}

cursor.moveTo = (x, y, writableStream = process.stderr) => {
  return new Promise(resolve => { writableStream.cursorTo(x, y, resolve); });
}

cursor.moveToStart = (writableStream = process.stderr) => {
  cursor.moveTo(0, undefined, writableStream);
}

module.exports = cursor;
