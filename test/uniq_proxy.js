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
    await shell.uniq();
  } catch (e) {
    t.truthy(shell.error());
    t.truthy(e.code);
  }
});

test('file does not exist', async t => {
  t.falsy(fs.existsSync('/asdfasdf')); // sanity check
  try {
    await shell.uniq('/asdfasdf');
  } catch (e) {
    t.truthy(shell.error());
    t.truthy(e.code);
  }
});

test('directory', async t => {
  t.truthy(common.statFollowLinks('test/resources/').isDirectory()); // sanity check
  try {
    await shell.uniq('test/resources/');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, "uniq: error reading 'test/resources/'");
  }
});

test('output directory', async t => {
  t.truthy(common.statFollowLinks('test/resources/').isDirectory()); // sanity check
  try {
    await shell.uniq('test/resources/file1.txt', 'test/resources/');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'uniq: test/resources/: Is a directory');
  }
});

test('file does not exist with output directory', async t => {
  t.falsy(fs.existsSync('/asdfasdf')); // sanity check
  try {
    await shell.uniq('/asdfasdf', 'test/resources/');
  } catch (e) {
    t.is(e.code, 1);
    t.truthy(shell.error());
  }
});

//
// Valids
//

test('uniq file1', async t => {
  const result = await shell.uniq('test/resources/uniq/file1');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), (await shell.cat('test/resources/uniq/file1u')).toString());
});

test('uniq -i file2', async t => {
  const result = await shell.uniq('-i', 'test/resources/uniq/file2');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), (await shell.cat('test/resources/uniq/file2u')).toString());
});

test('with glob character', async t => {
  const result = await shell.uniq('-i', 'test/resources/uniq/fi?e2');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), (await shell.cat('test/resources/uniq/file2u')).toString());
});

test('uniq file1 file2', async t => {
  const result = await shell.uniq('test/resources/uniq/file1', 'test/resources/uniq/file1t');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(
    (await shell.cat('test/resources/uniq/file1u')).toString(),
    (await shell.cat('test/resources/uniq/file1t')).toString()
  );
});

test('cat file1 |uniq', async t => {
  const result = (await shell.cat('test/resources/uniq/file1')).uniq();
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), (await shell.cat('test/resources/uniq/file1u')).toString());
});

test('uniq -c file1', async t => {
  const result = await shell.uniq('-c', 'test/resources/uniq/file1');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), (await shell.cat('test/resources/uniq/file1c')).toString());
});

test('uniq -d file1', async t => {
  const result = await shell.uniq('-d', 'test/resources/uniq/file1');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), (await shell.cat('test/resources/uniq/file1d')).toString());
});
