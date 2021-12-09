exports.clear = function clear(writableStream = process.stderr) {
  writableStream.write('\x1b[2J\x1b[0f');
}

exports.clearLine = function clearLine(dir, writableStream = process.stderr) {
  return new Promise(resolve => { writableStream.clearLine(dir, resolve); });
}

exports.clearScreenDown = function clearScreenDown(writableStream = process.stderr) {
  return new Promise(resolve => { writableStream.clearScreenDown(resolve); });
}
