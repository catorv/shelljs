import test from 'ava';

import shell from '../proxy';

const CWD = process.cwd();

test.beforeEach(() => {
  shell.config.resetForTesting();
  process.chdir(CWD);
});

//
// Invalids
//

test('no args', async t => {
  try {
    await shell.find();
  } catch (e) {
    t.is(e.code, 1);
    t.truthy(shell.error());
  }
});

//
// Valids
//

test('current path', async t => {
  shell.cd('test/resources/find');
  const result = await shell.find('.');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(result.indexOf('.hidden') > -1);
  t.truthy(result.indexOf('dir1/dir11/a_dir11') > -1);
  t.is(result.length, 12);
  shell.cd('../..');
});

test('simple path', async t => {
  const result = await shell.find('test/resources/find');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(result.indexOf('test/resources/find/.hidden') > -1);
  t.truthy(result.indexOf('test/resources/find/dir1/dir11/a_dir11') > -1);
  t.is(result.length, 12);
});

test('multiple paths - comma', async t => {
  const result = await shell.find('test/resources/find/dir1', 'test/resources/find/dir2');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(result.indexOf('test/resources/find/dir1/dir11/a_dir11') > -1);
  t.truthy(result.indexOf('test/resources/find/dir2/a_dir1') > -1);
  t.is(result.length, 6);
});

test('multiple paths - array', async t => {
  const result = await shell.find(['test/resources/find/dir1', 'test/resources/find/dir2']);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(result.indexOf('test/resources/find/dir1/dir11/a_dir11') > -1);
  t.truthy(result.indexOf('test/resources/find/dir2/a_dir1') > -1);
  t.is(result.length, 6);
});

test('nonexistent path', async t => {
  try {
    await shell.find('test/resources/find/nonexistent');
  } catch (e) {
    t.is(shell.error(), 'find: no such file or directory: test/resources/find/nonexistent');
    t.is(e.code, 1);
  }
});

test('-L flag, folder is symlinked', async t => {
  const result = await shell.find('-L', 'test/resources/find');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(result.indexOf('test/resources/find/dir2_link/a_dir1') > -1);
  t.is(result.length, 13);
});
