import fs from 'fs';

import test from 'ava';

import shell from '../proxy';
import common from '../src/common';
import utils from './utils/utils';

test.beforeEach(async t => {
  t.context.tmp = utils.getTempDir();
  shell.config.resetForTesting();
  await shell.mkdir(t.context.tmp);
});

test.afterEach.always(async t => {
  await shell.rm('-rf', t.context.tmp);
});


//
// Invalids
//

test('no args', async t => {
  try {
    await shell.mkdir();
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mkdir: no paths given');
  }
});

test('dir already exists', async t => {
  const mtime = common.statFollowLinks(t.context.tmp).mtime.toString();
  try {
    await shell.mkdir(t.context.tmp); // dir already exists
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, `mkdir: path already exists: ${t.context.tmp}`);
    t.is(common.statFollowLinks(t.context.tmp).mtime.toString(), mtime); // didn't mess with dir
  }
});

test('Can\'t overwrite a broken link', async t => {
  const mtime = common.statNoFollowLinks('test/resources/badlink').mtime.toString();
  try {
    await shell.mkdir('test/resources/badlink');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mkdir: path already exists: test/resources/badlink');
    t.is(common.statNoFollowLinks('test/resources/badlink').mtime.toString(), mtime); // didn't mess with file
  }
});

test('root path does not exist', async t => {
  t.falsy(fs.existsSync('/asdfasdf')); // sanity check
  try {
    await shell.mkdir('/asdfasdf/foobar'); // root path does not exist
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mkdir: no such file or directory: /asdfasdf');
    t.falsy(fs.existsSync('/asdfasdf'));
    t.falsy(fs.existsSync('/asdfasdf/foobar'));
  }
});

test('try to overwrite file', async t => {
  t.truthy(common.statFollowLinks('test/resources/file1').isFile());
  try {
    await shell.mkdir('test/resources/file1');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mkdir: path already exists: test/resources/file1');
    t.truthy(common.statFollowLinks('test/resources/file1').isFile());
  }
});

test('try to overwrite file, with -p', async t => {
  t.truthy(common.statFollowLinks('test/resources/file1').isFile());
  try {
    await shell.mkdir('-p', 'test/resources/file1');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mkdir: cannot create directory test/resources/file1: File exists');
    t.truthy(common.statFollowLinks('test/resources/file1').isFile());
  }
});

test('try to make a subdirectory of a file', async t => {
  t.truthy(common.statFollowLinks('test/resources/file1').isFile());
  try {
    await shell.mkdir('test/resources/file1/subdir');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mkdir: cannot create directory test/resources/file1/subdir: Not a directory');
    t.truthy(common.statFollowLinks('test/resources/file1').isFile());
    t.falsy(fs.existsSync('test/resources/file1/subdir'));
  }
});

test('Check for invalid permissions', async t => {
  await utils.skipOnWin(t, async () => {
    // This test case only works on unix, but should work on Windows as well
    const dirName = `${t.context.tmp}/nowritedir`;
    await shell.mkdir(dirName);
    t.falsy(shell.error());
    await shell.chmod('-w', dirName);
    try {
      await shell.mkdir(dirName + '/foo');
    } catch (e) {
      t.is(e.code, 1);
      t.is(
        e.stderr,
        `mkdir: cannot create directory ${t.context.tmp}/nowritedir/foo: Permission denied`
      );
      t.truthy(shell.error());
      t.falsy(fs.existsSync(dirName + '/foo'));
    }
    await shell.rm('-rf', dirName); // clean up
  });
});

//
// Valids
//

test('basic usage', async t => {
  t.falsy(fs.existsSync(`${t.context.tmp}/t1`));
  const result = await shell.mkdir(`${t.context.tmp}/t1`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(fs.existsSync(`${t.context.tmp}/t1`));
});

test('multiple dirs', async t => {
  t.falsy(fs.existsSync(`${t.context.tmp}/t2`));
  t.falsy(fs.existsSync(`${t.context.tmp}/t3`));
  const result = await shell.mkdir(`${t.context.tmp}/t2`, `${t.context.tmp}/t3`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(fs.existsSync(`${t.context.tmp}/t2`));
  t.truthy(fs.existsSync(`${t.context.tmp}/t3`));
});

test('one dir exists, the other does not', async t => {
  await shell.mkdir(`${t.context.tmp}/t1`);
  t.truthy(fs.existsSync(`${t.context.tmp}/t1`));
  t.falsy(fs.existsSync(`${t.context.tmp}/t4`));
  try {
    await shell.mkdir(`${t.context.tmp}/t1`, `${t.context.tmp}/t4`);
  } catch (e) {
    t.is(e.code, 1);
    t.is(utils.numLines(shell.error()), 1);
    t.truthy(fs.existsSync(`${t.context.tmp}/t1`));
    t.truthy(fs.existsSync(`${t.context.tmp}/t4`));
  }
});

test('-p flag', async t => {
  t.falsy(fs.existsSync(`${t.context.tmp}/a`));
  const result = await shell.mkdir('-p', `${t.context.tmp}/a/b/c`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(fs.existsSync(`${t.context.tmp}/a/b/c`));
  shell.rm('-Rf', `${t.context.tmp}/a`); // revert
});

test('-p flag: multiple dirs', async t => {
  const result = await shell.mkdir('-p', `${t.context.tmp}/zzza`,
    `${t.context.tmp}/zzzb`, `${t.context.tmp}/zzzc`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(fs.existsSync(`${t.context.tmp}/zzza`));
  t.truthy(fs.existsSync(`${t.context.tmp}/zzzb`));
  t.truthy(fs.existsSync(`${t.context.tmp}/zzzc`));
});

test('-p flag: multiple dirs, array syntax', async t => {
  const result = await shell.mkdir('-p', [`${t.context.tmp}/yyya`,
  `${t.context.tmp}/yyyb`, `${t.context.tmp}/yyyc`]);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(fs.existsSync(`${t.context.tmp}/yyya`));
  t.truthy(fs.existsSync(`${t.context.tmp}/yyyb`));
  t.truthy(fs.existsSync(`${t.context.tmp}/yyyc`));
});

test('-p flag: subdirectory already exists', async t => {
  t.falsy(fs.existsSync(`${t.context.tmp}/d1`));
  await shell.mkdir('-p', `${t.context.tmp}/d1/d2/d3`);
  t.truthy(fs.existsSync(`${t.context.tmp}/d1/d2/d3`));
  const result = await shell.mkdir('-p', `${t.context.tmp}/d1/d2`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(fs.existsSync(`${t.context.tmp}/d1/d2/d3`));
});

test('-p flag: create directory in subdirectory', async t => {
  t.falsy(fs.existsSync(`${t.context.tmp}/d1`));
  await shell.mkdir('-p', `${t.context.tmp}/d1/d2`);
  t.truthy(fs.existsSync(`${t.context.tmp}/d1/d2`));
  const result = await shell.mkdir('-p', `${t.context.tmp}/d1/d2/d3`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(fs.existsSync(`${t.context.tmp}/d1/d2/d3`));
});

test('globbed dir', async t => {
  let result = await shell.mkdir('-p', `${t.context.tmp}/mydir`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(fs.existsSync(`${t.context.tmp}/mydir`));
  result = await shell.mkdir('-p', `${t.context.tmp}/m*ir`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(fs.existsSync(`${t.context.tmp}/mydir`));
  t.falsy(fs.existsSync(`${t.context.tmp}/m*ir`)); // doesn't create literal name
});

test('non-normalized paths are still ok with -p', async t => {
  const result = await shell.mkdir('-p', `${t.context.tmp}/asdf/../asdf/./`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(fs.existsSync(`${t.context.tmp}/asdf`));
});
