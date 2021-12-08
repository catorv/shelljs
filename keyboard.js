const readline = require('readline')

exports.readline = function (prompt) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(prompt, async answer => {
      rl.close();
      resolve(answer);
    });
  });
};

exports.read = function read() {
  return new Promise(function (resolve) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: null
    });

    // 注册 keypress 事件
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      // 开启原始模式, 使输入的每个字符带上各种详细属性
      process.stdin.setRawMode(true);
    }

    process.stdin.once('keypress', (char, data) => {
      resolve(data);
      rl.close();
      process.stdin.setRawMode(false);
    });
  });
};
