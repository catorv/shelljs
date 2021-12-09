
exports.write = (text = '', writableStream = process.stdout) => {
  writableStream.write(text);
}

exports.writeln = (text = '', writableStream = process.stdout) => {
  writableStream.write(text + '\n');
}
