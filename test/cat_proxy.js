import fs from 'fs';

import test from 'ava';

import shell from '../proxy';

shell.config.silent = true;

//
// Invalids
//

test('no paths given', async t => {
  try {
    await shell.cat();
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'cat: no paths given');
  }
});

test('nonexistent file', async t => {
  t.falsy(fs.existsSync('/asdfasdf')); // sanity check
  try {
    await shell.cat('/asdfasdf'); // file does not exist
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'cat: no such file or directory: /asdfasdf');
  }
});

test('directory', async t => {
  try {
    await shell.cat('test/resources/cat');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'cat: test/resources/cat: Is a directory');
  }
});

//
// Valids
//

test('simple', async t => {
  const result = await shell.cat('test/resources/cat/file1');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), 'test1\n');
});

test('multiple files', async t => {
  const result = await shell.cat('test/resources/cat/file2', 'test/resources/cat/file1');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), 'test2\ntest1\n');
});

test('multiple files, array syntax', async t => {
  const result = await shell.cat(['test/resources/cat/file2', 'test/resources/cat/file1']);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), 'test2\ntest1\n');
});

test('glob', async t => {
  const result = await shell.cat('test/resources/file*.txt');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(result.search('test1') > -1); // file order might be random
  t.truthy(result.search('test2') > -1);
});

test('without EOF', async t => {
  const result = await shell.cat('test/resources/cat/file3');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), 'test3');
});

test('empty', async t => {
  const result = await shell.cat('test/resources/cat/file5');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), '');
});

//
// With numbers
//

test('simple with numbers', async t => {
  const result = await shell.cat('-n', 'test/resources/cat/file1');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), '     1\ttest1\n');
});

test('simple twelve lines file with numbers', async t => {
  const result = await shell.cat('-n', 'test/resources/cat/file4');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), '     1\ttest4-01\n     2\ttest4-02\n     3\ttest4-03\n     4\ttest4-04\n     5\ttest4-05\n     6\ttest4-06\n     7\ttest4-07\n     8\ttest4-08\n     9\ttest4-09\n    10\ttest4-10\n    11\ttest4-11\n    12\ttest4-12\n');
});

test('multiple with numbers', async t => {
  const result = await shell.cat('-n', 'test/resources/cat/file2', 'test/resources/cat/file1');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), '     1\ttest2\n     2\ttest1\n');
});

test('simple numbers without EOF', async t => {
  const result = await shell.cat('-n', 'test/resources/cat/file3');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), '     1\ttest3');
});

test('multiple numbers without EOF', async t => {
  const result = await shell.cat('-n', 'test/resources/cat/file3', 'test/resources/cat/file2', 'test/resources/cat/file1');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), '     1\ttest3test2\n     2\ttest1\n');
});
