/**
 * Write some data to `writableStream`.
 * @param {(string|Buffer|Uint8Array|any)} [chunk=''] data to write. For streams not operating in object mode, chunk must be a string, Buffer or Uint8Array. For object mode streams, chunk may be any JavaScript value other than `null`.
 * @param {string} [encoding='utf8'] The encoding, if chunk is a string. Default: `'utf8'`
 * @param {stream.Writable} [writableStream]
 * @returns {Promise<any>}
 */
function write(chunk = '', encoding = 'utf8', writableStream = process.stdout) {
  return new Promise(function(resolve, reject) {
    writableStream.write(chunk, encoding, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(null);
      }
    });
  });
}
exports.write = write;

/**
 * Write some data to `writableStream`, ending with '\n'.
 * @param {string|Buffer|Uint8Array|any} [chunk=''] data to write. For streams not operating in object mode, chunk must be a string, Buffer or Uint8Array. For object mode streams, chunk may be any JavaScript value other than `null`.
 * @param {string} [encoding='utf8'] The encoding, if chunk is a string. Default: `'utf8'`
 * @param {stream.Writable} [writableStream]
 * @returns {Promise<any>}
 */
exports.writeln = async function writeln(chunk = '', encoding = 'utf8', writableStream = process.stdout) {
  await write(chunk, encoding);
  return write('\n', encoding);
}
