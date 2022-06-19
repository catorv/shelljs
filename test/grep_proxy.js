import fs from 'fs';

import test from 'ava';

import shell from '../proxy';
import utils from './utils/utils';

test.beforeEach(async t => {
  t.context.tmp = utils.getTempDir();
  shell.config.resetForTesting();
  await shell.cp('-r', 'test/resources', t.context.tmp);
});

test.afterEach.always(async t => {
  await shell.rm('-rf', t.context.tmp);
});


//
// Invalids
//

test('no args', async t => {
  try {
    await shell.grep();
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 2);
    t.is(shell.errorCode(), 2);
  }
});

test('too few args', async t => {
  try {
    await shell.grep(/asdf/g); // too few args
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 2);
  }
});

test('no such file', async t => {
  t.falsy(fs.existsSync('/asdfasdf')); // sanity check
  try {
    await shell.grep(/asdf/g, '/asdfasdf'); // no such file
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.stderr, 'grep: no such file or directory: /asdfasdf');
    t.is(e.code, 2);
  }
});

test('if at least one file is missing, this should be an error', async t => {
  t.falsy(fs.existsSync('asdfasdf')); // sanity check
  t.truthy(fs.existsSync(`${t.context.tmp}/file1`)); // sanity check
  try {
    await shell.grep(/asdf/g, `${t.context.tmp}/file1`, 'asdfasdf');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.stderr, 'grep: no such file or directory: asdfasdf');
    t.is(e.code, 2);
  }
});

test("multiple files, one doesn't exist, one doesn't match", async t => {
  try {
    await shell.grep(/oogabooga/, 'test/resources/file1.txt',
      'test/resources/filedoesnotexist.txt');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 2);
  }
});

//
// Valids
//

test('basic', async t => {
  const result = await shell.grep('line', 'test/resources/a.txt');
  t.falsy(shell.error());
  t.is(result.split('\n').length - 1, 4);
});

test('-v option', async t => {
  const result = await shell.grep('-v', 'line', 'test/resources/a.txt');
  t.falsy(shell.error());
  t.is(result.split('\n').length - 1, 8);
});

test('matches one line', async t => {
  const result = await shell.grep('line one', 'test/resources/a.txt');
  t.falsy(shell.error());
  t.is(result.toString(), 'This is line one\n');
});

test('multiple files', async t => {
  const result = await shell.grep(/test/, 'test/resources/file1.txt',
    'test/resources/file2.txt');
  t.falsy(shell.error());
  t.is(result.toString(), 'test1\ntest2\n');
});

test('multiple files, array syntax', async t => {
  const result = await shell.grep(/test/, ['test/resources/file1.txt',
    'test/resources/file2.txt']);
  t.falsy(shell.error());
  t.is(result.toString(), 'test1\ntest2\n');
});

test('multiple files, glob syntax, * for file name', async t => {
  const result = await shell.grep(/test/, 'test/resources/file*.txt');
  t.falsy(shell.error());
  t.truthy(result.toString(), 'test1\ntest2\n');
});

test('multiple files, glob syntax, * for directory name', async t => {
  const result = await shell.grep(/test/, 'test/r*/file*.txt');
  t.falsy(shell.error());
  t.is(result.toString(), 'test1\ntest2\n');
});

test('multiple files, double-star glob', async t => {
  const result = await shell.grep(/test/, 'test/resources/**/file*.js');
  t.falsy(shell.error());
  t.is(result.toString(), 'test\ntest\ntest\ntest\n');
});

test('one file, * in regex', async t => {
  const result = await shell.grep(/alpha*beta/, 'test/resources/grep/file');
  t.falsy(shell.error());
  t.is(result.toString(), 'alphaaaaaaabeta\nalphbeta\n');
});

test('one file, * in string-regex', async t => {
  const result = await shell.grep('alpha*beta', 'test/resources/grep/file');
  t.falsy(shell.error());
  t.is(result.toString(), 'alphaaaaaaabeta\nalphbeta\n');
});

test('one file, * in regex, make sure * is not globbed', async t => {
  const result = await shell.grep(/l*\.js/, 'test/resources/grep/file');
  t.falsy(shell.error());
  t.is(result.toString(), 'this line ends in.js\nlllllllllllllllll.js\n');
});

test('one file, * in string-regex, make sure * is not globbed', async t => {
  const result = await shell.grep('l*\\.js', 'test/resources/grep/file');
  t.falsy(shell.error());
  t.is(result.toString(), 'this line ends in.js\nlllllllllllllllll.js\n');
});

test("one file, pattern doesn't match", async t => {
  try {
    await shell.grep('notfoundstring', 'test/resources/grep/file');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.toString(), '');
    t.is(e.stdout, '');
    // TODO(#900): "grep: " isn't really the correct stderr output, but we need a
    // non-empty string so `shell.error()` is truthy.
    t.is(e.stderr, 'grep: ');
    t.is(e.code, 1);
  }
});

test('-l option', async t => {
  const result = await shell.grep('-l', 'test1', 'test/resources/file1', 'test/resources/file2',
    'test/resources/file1.txt');
  t.falsy(shell.error());
  t.truthy(result.match(/file1(\n|$)/));
  t.truthy(result.match(/file1.txt/));
  t.falsy(result.match(/file2.txt/));
  t.is(result.split('\n').length - 1, 2);
});

test('-i option', async t => {
  const result = await shell.grep('-i', 'test', 'test/resources/grep/case1', 'test/resources/grep/case1.txt',
    'test/resources/grep/case1.js');
  t.falsy(shell.error());
  t.is(result.split('\n').length - 1, 3);
});

test('-n option', async t => {
  const result = await shell.grep('-n', /alpha*beta/, 'test/resources/grep/file');
  t.falsy(shell.error());
  t.is(result.toString(), '1:alphaaaaaaabeta\n3:alphbeta\n');
});

test('the pattern looks like an option', async t => {
  const result = await shell.grep('--', '-v', 'test/resources/grep/file2');
  t.falsy(shell.error());
  t.is(result.toString(), '-v\n-vv\n');
});
