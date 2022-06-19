import fs from 'fs';

import test from 'ava';

import shell from '../proxy';
import common from '../src/common';

shell.config.silent = true;

const doubleSorted = shell.sync.cat('test/resources/sort/sorted')
  .trimRight()
  .split('\n')
  .reduce((prev, cur) => prev.concat([cur, cur]), [])
  .join('\n') + '\n';


//
// Invalids
//

test('no args', async t => {
  try {
    await shell.sort();
  } catch (e) {
    t.truthy(shell.error());
    t.truthy(e.code);
  }
});

test('file does not exist', async t => {
  t.falsy(fs.existsSync('/asdfasdf')); // sanity check
  try {
    await shell.sort('/asdfasdf');
  } catch (e) {
    t.truthy(shell.error());
    t.truthy(e.code);
  }
});

test('directory', async t => {
  t.truthy(common.statFollowLinks('test/resources/').isDirectory()); // sanity check
  try {
    await shell.sort('test/resources/');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'sort: read failed: test/resources/: Is a directory');
  }
});

//
// Valids
//

test('simple', async t => {
  const result = await shell.sort('test/resources/sort/file1');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), (await shell.cat('test/resources/sort/sorted')).toString());
});

test('simple #2', async t => {
  const result = await shell.sort('test/resources/sort/file2');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), (await shell.cat('test/resources/sort/sorted')).toString());
});

test('multiple files', async t => {
  const result = await shell.sort('test/resources/sort/file2', 'test/resources/sort/file1');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), doubleSorted);
});

test('multiple files, array syntax', async t => {
  const result = await shell.sort(['test/resources/sort/file2', 'test/resources/sort/file1']);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), doubleSorted);
});

test('Globbed file', async t => {
  const result = await shell.sort('test/resources/sort/file?');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), doubleSorted);
});

test('With \'-n\' option', async t => {
  const result = await shell.sort('-n', 'test/resources/sort/file2');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), (await shell.cat('test/resources/sort/sortedDashN')).toString());
});

test('With \'-r\' option', async t => {
  const result = await shell.sort('-r', 'test/resources/sort/file2');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), (await shell.cat('test/resources/sort/sorted'))
    .trimRight()
    .split('\n')
    .reverse()
    .join('\n') + '\n');
});

test('With \'-rn\' option', async t => {
  const result = await shell.sort('-rn', 'test/resources/sort/file2');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), (await shell.cat('test/resources/sort/sortedDashN'))
    .trimRight()
    .split('\n')
    .reverse()
    .join('\n') + '\n');
});
