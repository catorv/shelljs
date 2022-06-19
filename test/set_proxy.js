import test from 'ava';

import shell from '../proxy';
import utils from './utils/utils';

const oldConfigSilent = shell.config.silent;
const uncaughtErrorExitCode = 1;

test.beforeEach(async t => {
  t.context.tmp = utils.getTempDir();
  shell.config.resetForTesting();
  await shell.cp('-r', 'test/resources', t.context.tmp);
});

test.afterEach.always(async t => {
  await shell.rm('-rf', t.context.tmp);
});

//
// Valids
//

test('initial values', async t => {
  t.false(oldConfigSilent);
  t.false(shell.config.verbose);
  t.false(shell.config.fatal);
  t.false(shell.config.noglob);
});

test('default behavior', async t => {
  const result = await shell.exec(JSON.stringify(shell.config.execPath) + ' -e "require(\'./global\'); ls(\'file_doesnt_exist\'); echo(1234);"');
  t.is(result.code, 0);
  t.is(result.stdout, '1234\n');
  t.is(result.stderr, 'ls: no such file or directory: file_doesnt_exist\n');
});

test('set -e', async t => {
  try {
    await shell.exec(JSON.stringify(shell.config.execPath) + ' -e "require(\'./global\'); set(\'-e\'); ls(\'file_doesnt_exist\'); echo(1234);"');
  } catch (e) {
    t.is(e.code, uncaughtErrorExitCode);
    t.is(e.stdout, '');
    t.truthy(e.stderr.indexOf('Error: ls: no such file or directory: file_doesnt_exist') >= 0);
  }
});

test('set -v', async t => {
  const result = await shell.exec(JSON.stringify(shell.config.execPath) + ' -e "require(\'./global\'); set(\'-v\'); ls(\'file_doesnt_exist\'); echo(1234);"');
  t.is(result.code, 0);
  t.is(result.stdout, '1234\n');
  t.is(
    result.stderr,
    'ls file_doesnt_exist\nls: no such file or directory: file_doesnt_exist\necho 1234\n'
  );
});

test('set -ev', async t => {
  try {
    await shell.exec(JSON.stringify(shell.config.execPath) + ' -e "require(\'./global\'); set(\'-ev\'); ls(\'file_doesnt_exist\'); echo(1234);"');
  } catch (e) {
    t.is(e.code, uncaughtErrorExitCode);
    t.is(e.stdout, '');
    t.truthy(e.stderr.indexOf('Error: ls: no such file or directory: file_doesnt_exist') >= 0);
    t.truthy(e.stderr.indexOf('ls file_doesnt_exist\n') >= 0);
    t.is(e.stderr.indexOf('echo 1234\n'), -1);
  }
});

test('set -e, set +e', async t => {
  const result = await shell.exec(JSON.stringify(shell.config.execPath) + ' -e "require(\'./global\'); set(\'-e\'); set(\'+e\'); ls(\'file_doesnt_exist\'); echo(1234);"');
  t.is(result.code, 0);
  t.is(result.stdout, '1234\n');
  t.is(result.stderr, 'ls: no such file or directory: file_doesnt_exist\n');
});

test('set -f', async t => {
  await shell.set('-f'); // disable globbing
  try {
    await shell.rm(`${t.context.tmp}/*.txt`);
  } catch (e) {
    t.truthy(shell.error()); // file '*.txt' doesn't exist, so rm() fails
  }
  await shell.set('+f');
  await shell.rm(`${t.context.tmp}/*.txt`);
  t.falsy(shell.error()); // globbing works, so rm succeeds
});
