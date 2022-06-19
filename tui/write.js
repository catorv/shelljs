exports.write = function write(text = '', writableStream = process.stdout) {
  writableStream.write(text);
}

exports.writeln = function writeln(text = '', writableStream = process.stdout) {
  writableStream.write(text + '\n');
}
