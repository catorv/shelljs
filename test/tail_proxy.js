import fs from 'fs';

import test from 'ava';

import shell from '../proxy';
import common from '../src/common';

shell.config.silent = true;

//
// Invalids
//

test('no args', async t => {
  try {
    await shell.tail();
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
  }
});

test('file does not exist', async t => {
  t.falsy(fs.existsSync('/asdfasdf')); // sanity check
  try {
    await shell.tail('/asdfasdf');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
  }
});

test('directory', async t => {
  t.truthy(common.statFollowLinks('test/resources/').isDirectory()); // sanity check
  try {
    await shell.tail('test/resources/');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, "tail: error reading 'test/resources/': Is a directory");
  }
});

//
// Valids
//

const bottomOfFile1 = ['file1 50', 'file1 49', 'file1 48', 'file1 47', 'file1 46',
                       'file1 45', 'file1 44', 'file1 43', 'file1 42', 'file1 41',
                       'file1 40', 'file1 39', 'file1 38', 'file1 37', 'file1 36',
                       'file1 35', 'file1 34', 'file1 33', 'file1 32', 'file1 31'];
const bottomOfFile2 = ['file2 50', 'file2 49', 'file2 48', 'file2 47', 'file2 46',
                       'file2 45', 'file2 44', 'file2 43', 'file2 42', 'file2 41',
                       'file2 40', 'file2 39', 'file2 38', 'file2 37', 'file2 36',
                       'file2 35', 'file2 34', 'file2 33', 'file2 32', 'file2 31'];

test('simple', async t => {
  const result = await shell.tail('test/resources/head/file1.txt');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), bottomOfFile1.slice(0, 10).reverse().join('\n') + '\n');
});

test('multiple files', async t => {
  const result = await shell.tail('test/resources/head/file2.txt', 'test/resources/head/file1.txt');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(),
    bottomOfFile2
      .slice(0, 10)
      .reverse()
      .concat(bottomOfFile1.slice(0, 10).reverse())
      .join('\n') + '\n');
});

test('multiple files, array syntax', async t => {
  const result = await shell.tail(['test/resources/head/file2.txt', 'test/resources/head/file1.txt']);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(),
    bottomOfFile2
      .slice(0, 10)
      .reverse()
      .concat(bottomOfFile1.slice(0, 10).reverse())
      .join('\n') + '\n');
});

test('reading more lines than are in the file (no trailing newline)', async t => {
  const result = await shell.tail('test/resources/file2', 'test/resources/file1');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), 'test2\ntest1'); // these files only have one line (no \n)
});

test('reading more lines than are in the file (with trailing newline)', async t => {
  const result = await shell.tail('test/resources/head/shortfile2', 'test/resources/head/shortfile1');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), 'short2\nshort1\n'); // these files only have one line (with \n)
});

test('globbed file', async t => {
  const result = await shell.tail('test/resources/head/file?.txt');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(),
    bottomOfFile1
      .slice(0, 10)
      .reverse()
      .concat(bottomOfFile2.slice(0, 10).reverse())
      .join('\n') + '\n');
});

test('with `\'-n\' <num>` option', async t => {
  const result = await shell.tail('-n', 4, 'test/resources/head/file2.txt',
    'test/resources/head/file1.txt');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(),
    bottomOfFile2
      .slice(0, 4)
      .reverse()
      .concat(bottomOfFile1.slice(0, 4).reverse())
      .join('\n') + '\n');
});

test('with `\'-n\' +<num>` option', async t => {
  const result = await shell.tail('-n', '+48', 'test/resources/head/file2.txt',
    'test/resources/head/file1.txt');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(),
    bottomOfFile2
      .slice(0, 3)
      .reverse()
      .concat(bottomOfFile1.slice(0, 3).reverse())
      .join('\n') + '\n');
});

test('with `{\'-n\': <num>}` option', async t => {
  const result = await shell.tail({ '-n': 4 }, 'test/resources/head/file2.txt',
    'test/resources/head/file1.txt');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(),
    bottomOfFile2
      .slice(0, 4)
      .reverse()
      .concat(bottomOfFile1.slice(0, 4).reverse())
      .join('\n') + '\n');
});

test('with `{\'-n\': +<num>}` option', async t => {
  const result = await shell.tail({ '-n': '+48' }, 'test/resources/head/file2.txt',
    'test/resources/head/file1.txt');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(),
    bottomOfFile2
      .slice(0, 3)
      .reverse()
      .concat(bottomOfFile1.slice(0, 3).reverse())
      .join('\n') + '\n');
});

test('negative values are the same as positive values', async t => {
  const result = await shell.tail('-n', -4, 'test/resources/head/file2.txt',
    'test/resources/head/file1.txt');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(),
    bottomOfFile2
      .slice(0, 4)
      .reverse()
      .concat(bottomOfFile1.slice(0, 4).reverse())
      .join('\n') + '\n');
});
