import os from 'os';
import path from 'path';
import util from 'util';

import test from 'ava';

import shell from '../proxy';
import utils from './utils/utils';
import mocks from './utils/mocks';

const CWD = process.cwd();
const ORIG_EXEC_PATH = shell.config.execPath;
shell.config.silent = true;

test.beforeEach(() => {
  mocks.init();
});

test.afterEach.always(() => {
  process.chdir(CWD);
  shell.config.execPath = ORIG_EXEC_PATH;
  mocks.restore();
});

//
// Invalids
//

test('no args', async t => {
  try {
    await shell.exec();
  } catch (e) {
    t.truthy(shell.error());
  }
});

test('unknown command', async t => {
  try {
    await shell.exec('asdfasdf'); // could not find command
  } catch (e) {
    t.truthy(e.code > 0);
  }
});

test('config.fatal and unknown command', async t => {
  const oldFatal = shell.config.fatal;
  shell.config.fatal = true;
  await t.throwsAsync(async () => {
    await shell.exec('asdfasdf'); // could not find command
  }, /asdfasdf/); // name of command should be in error message
  shell.config.fatal = oldFatal;
});

test('options.fatal = true and unknown command', async t => {
  const oldFatal = shell.config.fatal;
  shell.config.fatal = false;
  await t.throwsAsync(async () => {
    await shell.exec('asdfasdf', { fatal: true }); // could not find command
  }, /asdfasdf/); // name of command should be in error message
  shell.config.fatal = oldFatal; // TODO(nfischer): this setting won't get reset if the assertion above fails
});

// test('exec exits gracefully if we cannot find the execPath', t => {
//   shell.config.execPath = null;
//   shell.exec('echo foo');
//   t.regex(
//     shell.error(),
//     /Unable to find a path to the node binary\. Please manually set config\.execPath/
//   );
// });

test('cannot require exec-child.js', t => {
  t.throws(() => {
    require('../src/exec-child');
  }, /This file should not be required/);
});

//
// Valids
//

//
// sync
//

test('check if stdout goes to output', async t => {
  const result = await shell.exec(`${JSON.stringify(shell.config.execPath)} -e "console.log(1234);"`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.stdout, '1234\n');
});

test('check if stderr goes to output', async t => {
  const result = await shell.exec(`${JSON.stringify(shell.config.execPath)} -e "console.error(1234);"`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.stdout, '');
  t.is(result.stderr, '1234\n');
});

test('check if stdout + stderr go to output', async t => {
  const result = await shell.exec(`${JSON.stringify(shell.config.execPath)} -e "console.error(1234); console.log(666);"`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.stdout, '666\n');
  t.is(result.stderr, '1234\n');
});

test('check if stdout + stderr should not be printed to console if silent', async t => {
  try {
    await shell.exec(`${JSON.stringify(shell.config.execPath)} -e "console.error(1234); console.log(666); process.exit(12);"`, { silent: true });
  } catch (e) {
    const stdout = mocks.stdout();
    const stderr = mocks.stderr();
    t.is(stdout, '');
    t.is(stderr, '');
  }
});

test('check exit code', async t => {
  try {
    await shell.exec(`${JSON.stringify(shell.config.execPath)} -e "process.exit(12);"`);
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 12);
  }
});

test('interaction with cd', async t => {
  shell.cd('test/resources/external');
  const result = await shell.exec(`${JSON.stringify(shell.config.execPath)} node_script.js`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.stdout, 'node_script_1234\n');
});

test('check quotes escaping', async t => {
  const result = await shell.exec(util.format(JSON.stringify(shell.config.execPath) + ' -e "console.log(%s);"', "\\\"\\'+\\'_\\'+\\'\\\""));
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.stdout, "'+'_'+'\n");
});

test('set cwd', async t => {
  const cmdString = process.platform === 'win32' ? 'cd' : 'pwd';
  const result = await shell.exec(cmdString, { cwd: '..' });
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.stdout, path.resolve('..') + os.EOL);
});

test('set maxBuffer (very small)', async t => {
  const result = await shell.exec('echo 1234567890'); // default maxBuffer is ok
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.stdout, '1234567890' + os.EOL);
  try {
    await shell.exec('echo 1234567890', { maxBuffer: 6 });
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER');
    t.is(e.stdout, '123456');
    // const maxBufferErrorPattern = /.*\bmaxBuffer\b.*\bexceeded\b.*/;
    // t.regex(e.stderr, maxBufferErrorPattern);
  }
});

test('set timeout option', async t => {
  const result = await shell.exec(`${JSON.stringify(shell.config.execPath)} test/resources/exec/slow.js 100`); // default timeout is ok
  t.falsy(shell.error());
  t.is(result.code, 0);
  try {
    await shell.exec(`${JSON.stringify(shell.config.execPath)} test/resources/exec/slow.js 2000`, { timeout: 1000 }); // times out
  } catch (e) {
    t.truthy(shell.error());
  }
});

test('check process.env works', async t => {
  t.falsy(shell.env.FOO);
  shell.env.FOO = 'Hello world';
  const result = await shell.exec(process.platform !== 'win32' ? 'echo $FOO' : 'echo %FOO%');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.stdout, 'Hello world' + os.EOL);
  t.is(result.stderr, '');
});

test('set shell option (TODO: add tests for Windows)', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.exec('echo $0');
    t.falsy(shell.error());
    t.is(result.code, 0);
    t.is(result.stdout, '/bin/sh\n'); // sh by default
    const bashPath = (await shell.which('bash')).trim();
    if (bashPath) {
      result = await shell.exec('echo $0', { shell: '/bin/bash' });
      t.falsy(shell.error());
      t.is(result.code, 0);
      t.is(result.stdout, '/bin/bash\n');
    }
  });
});

test('exec returns a ShellString', async t => {
  const result = await shell.exec('echo foo');
  t.is(typeof result, 'object');
  t.truthy(result instanceof String);
  t.is(typeof result.stdout, 'string');
  t.is(result.toString(), result.stdout);
});

test('encoding option works', async t => {
  const result = await shell.exec(`${JSON.stringify(shell.config.execPath)} -e "console.log(1234);"`, { encoding: 'buffer' });
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(Buffer.isBuffer(result.stdout));
  t.truthy(Buffer.isBuffer(result.stderr));
  t.is(result.stdout.toString(), '1234\n');
  t.is(result.stderr.toString(), '');
});

test('options.fatal = false and unknown command', async t => {
  const oldFatal = shell.config.fatal;
  shell.config.fatal = true;
  try {
    await shell.exec('asdfasdf', { fatal: false }); // could not find command
  } catch (e) {
    t.truthy(shell.error());
    t.truthy(e.code);
  }
  shell.config.fatal = oldFatal;
});

//
// async
//

// test.cb('no callback', t => {
//   const c = shell.exec(`${JSON.stringify(shell.config.execPath)} -e "console.log(1234)"`, { async: true });
//   t.falsy(shell.error());
//   t.truthy('stdout' in c, 'async exec returns child process object');
//   t.end();
// });
//
// test.cb('callback as 2nd argument', t => {
//   shell.exec(`${JSON.stringify(shell.config.execPath)} -e "console.log(5678);"`, (code, stdout, stderr) => {
//     t.is(code, 0);
//     t.is(stdout, '5678\n');
//     t.is(stderr, '');
//     t.end();
//   });
// });
//
// test.cb('callback as end argument', t => {
//   shell.exec(`${JSON.stringify(shell.config.execPath)} -e "console.log(5566);"`, { async: true }, (code, stdout, stderr) => {
//     t.is(code, 0);
//     t.is(stdout, '5566\n');
//     t.is(stderr, '');
//     t.end();
//   });
// });
//
// test.cb('callback as 3rd argument (silent:true)', t => {
//   shell.exec(`${JSON.stringify(shell.config.execPath)} -e "console.log(5678);"`, { silent: true }, (code, stdout, stderr) => {
//     t.is(code, 0);
//     t.is(stdout, '5678\n');
//     t.is(stderr, '');
//     t.end();
//   });
// });

test('command that fails', async t => {
  try {
    await shell.exec('shx cp onlyOneCpArgument.txt', { silent: true });
  } catch ({ code, stdout, message }) {
    t.is(code, 1);
    t.is(stdout, '');
    t.is(message, 'cp: missing <source> and/or <dest>\n');
  }
});

test('encoding option works with async', async t => {
  const { code, stdout, stderr } = await shell.exec(`${JSON.stringify(shell.config.execPath)} -e "console.log(5566);"`, { async: true, encoding: 'buffer' });
  t.is(code, 0);
  t.truthy(Buffer.isBuffer(stdout));
  t.truthy(Buffer.isBuffer(stderr));
  t.is(stdout.toString(), '5566\n');
  t.is(stderr.toString(), '');
});
