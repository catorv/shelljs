const onetime = require('./utils/onetime.js');
const signalExit = require('signal-exit');

let isHidden = false;
const cursor = {};

/**
 * Prevent the cursor you've hidden interactively from remaining hidden
 * if the process crashes.
 * see: https://github.com/sindresorhus/restore-cursor
 */
cursor.restore = onetime(() => {
  signalExit(() => {
    process.stderr.write('\u001B[?25h');
  }, { alwaysLast: true });
});

/**
 * Showing the CLI cursor.
 * @param {stream.Writable} [writableStream]
 * @see https://github.com/sindresorhus/cli-cursor
 */
cursor.show = (writableStream = process.stderr) => {
  if (!writableStream.isTTY) {
    return;
  }

  isHidden = false;
  writableStream.write('\u001B[?25h');
};

/**
 * Hiding the CLI cursor.
 * @param {stream.Writable} [writableStream]
 * @see https://github.com/sindresorhus/cli-cursor
 */
cursor.hide = (writableStream = process.stderr) => {
  if (!writableStream.isTTY) {
    return;
  }

  cursor.restore();
  isHidden = true;
  writableStream.write('\u001B[?25l');
};

/**
 * Toggle the CLI cursor
 * @param {boolean} [force=false] Useful for showing or hiding the cursor based on a boolean.
 * @param {stream.Writable} [writableStream]
 * @see https://github.com/sindresorhus/cli-cursor
 */
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

/**
 * Move the CLI cursor relative to its current position.
 * @param {number} dx
 * @param {number} dy
 * @param {stream.Writable} [writableStream]
 * @returns {Promise<boolean>} `false` if the stream wishes for the calling code to wait for the 'drain' event to be emitted before continuing to write additional data; otherwise `true`.
 */
cursor.move = (dx, dy, writableStream = process.stderr) => {
  return new Promise(resolve => { writableStream.moveCursor(dx, dy, resolve); });
}

/**
 * Move CLI cursor to the specified position.
 * @param {number} x
 * @param {number} [y]
 * @param {stream.Writable} [writableStream]
 * @returns {Promise<boolean>} `false` if the stream wishes for the calling code to wait for the 'drain' event to be emitted before continuing to write additional data; otherwise `true`.
 */
cursor.moveTo = (x, y, writableStream = process.stderr) => {
  return new Promise(resolve => { writableStream.cursorTo(x, y, resolve); });
}

/**
 * Move CLI cursor to the start of its current line.
 * @param {stream.Writable} [writableStream]
 * @returns {Promise<boolean>} `false` if the stream wishes for the calling code to wait for the 'drain' event to be emitted before continuing to write additional data; otherwise `true`.
 */
cursor.moveToStart = (writableStream = process.stderr) => {
  cursor.moveTo(0, undefined, writableStream);
}

/**
 * Move CLI cursor up.
 * @param {number} [lines=1]
 * @param {stream.Writable} [writableStream]
 * @returns {Promise<boolean>} `false` if the stream wishes for the calling code to wait for the 'drain' event to be emitted before continuing to write additional data; otherwise `true`.
 */
cursor.moveUp = (lines = 1, writableStream = process.stderr) => {
  return cursor.move(0, -lines, writableStream);
}

/**
 * Move CLI cursor down.
 * @param {number} [lines=1]
 * @param {stream.Writable} [writableStream]
 * @returns {Promise<boolean>} `false` if the stream wishes for the calling code to wait for the 'drain' event to be emitted before continuing to write additional data; otherwise `true`.
 */
cursor.moveDown = (lines = 1, writableStream = process.stderr) => {
  return cursor.move(0, lines, writableStream);
}

/**
 * Move CLI cursor left.
 * @param {number} [columns=1]
 * @param {stream.Writable} [writableStream]
 * @returns {Promise<boolean>} `false` if the stream wishes for the calling code to wait for the 'drain' event to be emitted before continuing to write additional data; otherwise `true`.
 */
cursor.moveLeft = (columns = 1, writableStream = process.stderr) => {
  return cursor.move(-columns, 0, writableStream);
}

/**
 * Move CLI cursor right.
 * @param {number} [columns=1]
 * @param {stream.Writable} [writableStream]
 * @returns {Promise<boolean>} `false` if the stream wishes for the calling code to wait for the 'drain' event to be emitted before continuing to write additional data; otherwise `true`.
 */
cursor.moveRight = (columns = 1, writableStream = process.stderr) => {
  return cursor.move(columns, 0, writableStream);
}

module.exports = cursor;
