/**
 * Clear the terminal screen.
 * @param {stream.Writable} [writableStream]
 */
exports.clear = function clear(writableStream = process.stderr) {
  writableStream.write('\x1b[2J\x1b[0f');
}

/**
 * Clear the current line of `writableStream` in a direction identified by `dir`.
 * @param {number} [dir] valid values:
 *  - -1: to the left from cursor
 *  - 1: to the right from cursor
 *  - 0: the entire line
 * @param {stream.Writable} [writableStream]
 * @returns {Promise<boolean>} `false` if the stream wishes for the calling code to wait for the 'drain' event to be emitted before continuing to write additional data; otherwise `true`.
 */
exports.clearLine = function clearLine(dir = 0, writableStream = process.stderr) {
  return new Promise(resolve => { writableStream.clearLine(dir, resolve); });
}

/**
 * Clear `writableStream` from the current cursor down.
 * @param {stream.Writable} [writableStream]
 * @returns {Promise<boolean>} `false` if the stream wishes for the calling code to wait for the 'drain' event to be emitted before continuing to write additional data; otherwise `true`.
 */
exports.clearScreenDown = function clearScreenDown(writableStream = process.stderr) {
  return new Promise(resolve => { writableStream.clearScreenDown(resolve); });
}
