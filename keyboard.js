const readline = require('readline')

/**
 * Read one line from `process.stdin`.
 * @param {string} query A statement or query to write to output, prepended to the prompt.
 * @returns {Promise<string>}
 */
exports.readline = function (query) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(query, async answer => {
      rl.close();
      resolve(answer);
    });
  });
};

/**
 * Read a key from `process.stdin`.
 * @returns {Promise<Object>}
 */
exports.read = function read() {
  return new Promise(function (resolve) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: null,
    });

    // 注册 keypress 事件
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      // 开启原始模式, 使输入的每个字符带上各种详细属性
      process.stdin.setRawMode(true);
    }

    process.stdin.once('keypress', (_char, data) => {
      resolve(data);
      rl.close();
      process.stdin.setRawMode(false);
    });
  });
};
