import fs from 'fs';
import path from 'path';

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
    await shell.rm();
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'rm: no paths given');
  }
});

test('file does not exist', async t => {
  try {
    await shell.rm('asdfasdf');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'rm: no such file or directory: asdfasdf');
  }
});

test('cannot delete a directoy without recursive flag', async t => {
  try {
    await shell.rm(`${t.context.tmp}/rm`);
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'rm: path is a directory');
  }
});

test('only an option', async t => {
  try {
    await shell.rm('-f');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'rm: no paths given');
  }
});

test('invalid option', async t => {
  try {
    await shell.rm('-@', 'test/resources/file1');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.truthy(fs.existsSync('test/resources/file1'));
    t.is(e.stderr, 'rm: option not recognized: @');
  }
});

//
// Valids
//

test('file does not exist, but -f specified', async t => {
  const result = await shell.rm('-f', 'asdfasdf');
  t.falsy(shell.error());
  t.is(result.code, 0);
});

test('directory does not exist, but -fr specified', async t => {
  const result = await shell.rm('-fr', 'fake_dir/');
  t.falsy(shell.error());
  t.is(result.code, 0);
});

test('directory does not exist, but *only -f* specified', async t => {
  const result = await shell.rm('-f', 'fake_dir/');
  t.falsy(shell.error());
  t.is(result.code, 0);
});

test('file (in fake dir) does not exist, but -f specified', async t => {
  const result = await shell.rm('-f', 'fake_dir/asdfasdf');
  t.falsy(shell.error());
  t.is(result.code, 0);
});

test('dir (in fake dir) does not exist, but -fr specified', async t => {
  const result = await shell.rm('-fr', 'fake_dir/sub/');
  t.falsy(shell.error());
  t.is(result.code, 0);
});

test('simple rm', async t => {
  t.truthy(fs.existsSync(`${t.context.tmp}/file1`));
  const result = await shell.rm(`${t.context.tmp}/file1`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.falsy(fs.existsSync(`${t.context.tmp}/file1`));
});

test('recursive dir removal: -r option', async t => {
  await shell.mkdir('-p', `${t.context.tmp}/a/b/c`);
  t.truthy(fs.existsSync(`${t.context.tmp}/a/b/c`));
  const result = await shell.rm('-rf', `${t.context.tmp}/a`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.falsy(fs.existsSync(`${t.context.tmp}/a`));
});

test('-R option does the same thing', async t => {
  await shell.mkdir('-p', `${t.context.tmp}/a/b/c`);
  t.truthy(fs.existsSync(`${t.context.tmp}/a/b/c`));
  const result = await shell.rm('-Rf', `${t.context.tmp}/a`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.falsy(fs.existsSync(`${t.context.tmp}/a`));
});

test('recursive dir removal - absolute path', async t => {
  await shell.mkdir('-p', `${t.context.tmp}/a/b/c`);
  t.truthy(fs.existsSync(`${t.context.tmp}/a/b/c`));
  const result = await shell.rm('-Rf', path.resolve(`./${t.context.tmp}/a`));
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.falsy(fs.existsSync(`${t.context.tmp}/a`));
});

test('wildcard', async t => {
  const result = await shell.rm(`${t.context.tmp}/file*`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.falsy(fs.existsSync(`${t.context.tmp}/file1`));
  t.falsy(fs.existsSync(`${t.context.tmp}/file2`));
  t.falsy(fs.existsSync(`${t.context.tmp}/file1.js`));
  t.falsy(fs.existsSync(`${t.context.tmp}/file2.js`));
});

test('recursive dir removal', async t => {
  await shell.mkdir('-p', `${t.context.tmp}/a/b/c`);
  await shell.mkdir('-p', `${t.context.tmp}/b`);
  await shell.mkdir('-p', `${t.context.tmp}/c`);
  await shell.mkdir('-p', `${t.context.tmp}/.hidden`);
  t.truthy(fs.existsSync(`${t.context.tmp}/a/b/c`));
  t.truthy(fs.existsSync(`${t.context.tmp}/b`));
  t.truthy(fs.existsSync(`${t.context.tmp}/c`));
  t.truthy(fs.existsSync(`${t.context.tmp}/.hidden`));
  const result = await shell.rm('-rf', `${t.context.tmp}/*`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  const contents = fs.readdirSync(t.context.tmp);
  t.is(contents.length, 1);
  t.is(contents[0], '.hidden'); // shouldn't remove hidden if no .* given
});

test('recursive dir removal #2', async t => {
  await shell.mkdir('-p', `${t.context.tmp}/a/b/c`);
  await shell.mkdir('-p', `${t.context.tmp}/b`);
  await shell.mkdir('-p', `${t.context.tmp}/c`);
  await shell.mkdir('-p', `${t.context.tmp}/.hidden`);
  t.truthy(fs.existsSync(`${t.context.tmp}/a/b/c`));
  t.truthy(fs.existsSync(`${t.context.tmp}/b`));
  t.truthy(fs.existsSync(`${t.context.tmp}/c`));
  t.truthy(fs.existsSync(`${t.context.tmp}/.hidden`));
  const result = await shell.rm('-rf', `${t.context.tmp}/*`, `${t.context.tmp}/.*`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  const contents = fs.readdirSync(t.context.tmp);
  t.is(contents.length, 0);
});

test('recursive dir removal - array-syntax', async t => {
  await shell.mkdir('-p', `${t.context.tmp}/a/b/c`);
  await shell.mkdir('-p', `${t.context.tmp}/b`);
  await shell.mkdir('-p', `${t.context.tmp}/c`);
  await shell.mkdir('-p', `${t.context.tmp}/.hidden`);
  t.truthy(fs.existsSync(`${t.context.tmp}/a/b/c`));
  t.truthy(fs.existsSync(`${t.context.tmp}/b`));
  t.truthy(fs.existsSync(`${t.context.tmp}/c`));
  t.truthy(fs.existsSync(`${t.context.tmp}/.hidden`));
  const result = await shell.rm('-rf', [`${t.context.tmp}/*`, `${t.context.tmp}/.*`]);
  t.falsy(shell.error());
  t.is(result.code, 0);
  const contents = fs.readdirSync(t.context.tmp);
  t.is(contents.length, 0);
});

test('removal of a read-only file (unforced)', async t => {
  await shell.mkdir('-p', `${t.context.tmp}/readonly`);
  shell.ShellString('asdf').to(`${t.context.tmp}/readonly/file1`);
  fs.chmodSync(`${t.context.tmp}/readonly/file1`, '0444'); // -r--r--r--
  try {
    await shell.rm(`${t.context.tmp}/readonly/file1`);
  } catch (e) {
    t.truthy(shell.error());
    t.truthy(fs.existsSync(`${t.context.tmp}/readonly/file1`)); // bash's rm always asks before removing read-only files
    // here we just assume "no"
  }
});

test('removal of a read-only file (forced)', async t => {
  await shell.mkdir('-p', `${t.context.tmp}/readonly`);
  shell.ShellString('asdf').to(`${t.context.tmp}/readonly/file2`);
  fs.chmodSync(`${t.context.tmp}/readonly/file2`, '0444'); // -r--r--r--
  await shell.rm('-f', `${t.context.tmp}/readonly/file2`);
  t.falsy(shell.error());
  t.falsy(fs.existsSync(`${t.context.tmp}/readonly/file2`));
});

test('removal of a tree containing read-only files (unforced)', async t => {
  await shell.mkdir('-p', `${t.context.tmp}/tree2`);
  shell.ShellString('asdf').to(`${t.context.tmp}/tree2/file1`);
  shell.ShellString('asdf').to(`${t.context.tmp}/tree2/file2`);
  fs.chmodSync(`${t.context.tmp}/tree2/file1`, '0444'); // -r--r--r--
  try {
    await shell.rm('-r', `${t.context.tmp}/tree2`);
  } catch (e) {
    t.truthy(shell.error());
    t.truthy(fs.existsSync(`${t.context.tmp}/tree2/file1`));
    t.falsy(fs.existsSync(`${t.context.tmp}/tree2/file2`));
  }
});

test('removal of a tree containing read-only files (forced)', async t => {
  await shell.mkdir('-p', `${t.context.tmp}/tree`);
  shell.ShellString('asdf').to(`${t.context.tmp}/tree/file1`);
  shell.ShellString('asdf').to(`${t.context.tmp}/tree/file2`);
  fs.chmodSync(`${t.context.tmp}/tree/file1`, '0444'); // -r--r--r--
  await shell.rm('-rf', `${t.context.tmp}/tree`);
  t.falsy(shell.error());
  t.falsy(fs.existsSync(`${t.context.tmp}/tree`));
});

test(
  'removal of a sub-tree containing read-only and hidden files - glob',
  async t => {
    await shell.mkdir('-p', `${t.context.tmp}/tree3`);
    await shell.mkdir('-p', `${t.context.tmp}/tree3/subtree`);
    await shell.mkdir('-p', `${t.context.tmp}/tree3/.hidden`);
    shell.ShellString('asdf').to(`${t.context.tmp}/tree3/subtree/file`);
    shell.ShellString('asdf').to(`${t.context.tmp}/tree3/.hidden/file`);
    shell.ShellString('asdf').to(`${t.context.tmp}/tree3/file`);
    fs.chmodSync(`${t.context.tmp}/tree3/file`, '0444'); // -r--r--r--
    fs.chmodSync(`${t.context.tmp}/tree3/subtree/file`, '0444'); // -r--r--r--
    fs.chmodSync(`${t.context.tmp}/tree3/.hidden/file`, '0444'); // -r--r--r--
    await shell.rm('-rf', `${t.context.tmp}/tree3/*`, `${t.context.tmp}/tree3/.*`); // erase dir contents
    t.is((await shell.ls(`${t.context.tmp}/tree3`)).length, 0);
  }
);

test(
  'removal of a sub-tree containing read-only and hidden files - without glob',
  async t => {
    await shell.mkdir('-p', `${t.context.tmp}/tree4`);
    await shell.mkdir('-p', `${t.context.tmp}/tree4/subtree`);
    await shell.mkdir('-p', `${t.context.tmp}/tree4/.hidden`);
    shell.ShellString('asdf').to(`${t.context.tmp}/tree4/subtree/file`);
    shell.ShellString('asdf').to(`${t.context.tmp}/tree4/.hidden/file`);
    shell.ShellString('asdf').to(`${t.context.tmp}/tree4/file`);
    fs.chmodSync(`${t.context.tmp}/tree4/file`, '0444'); // -r--r--r--
    fs.chmodSync(`${t.context.tmp}/tree4/subtree/file`, '0444'); // -r--r--r--
    fs.chmodSync(`${t.context.tmp}/tree4/.hidden/file`, '0444'); // -r--r--r--
    await shell.rm('-rf', `${t.context.tmp}/tree4`); // erase dir contents
    t.falsy(fs.existsSync(`${t.context.tmp}/tree4`));
  }
);

test('remove symbolic link to a dir', async t => {
  const result = await shell.rm(`${t.context.tmp}/rm/link_to_a_dir`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.falsy(fs.existsSync(`${t.context.tmp}/rm/link_to_a_dir`));
  t.truthy(fs.existsSync(`${t.context.tmp}/rm/a_dir`));
});

test('rm -rf on a symbolic link to a dir deletes its contents', async t => {
  await utils.skipOnWin(t, async () => {
    const result = await shell.rm('-rf', `${t.context.tmp}/rm/link_to_a_dir/`);
    t.falsy(shell.error());
    t.is(result.code, 0);

    // Both the link and original dir should remain, but contents are deleted
    t.truthy(fs.existsSync(`${t.context.tmp}/rm/link_to_a_dir`));
    t.truthy(fs.existsSync(`${t.context.tmp}/rm/a_dir`));
    t.falsy(fs.existsSync(`${t.context.tmp}/rm/a_dir/a_file`));
  });
});

test('remove broken symbolic link', async t => {
  await utils.skipOnWin(t, async () => {
    // t.truthy(fs.existsSync(`${t.context.tmp}/rm/fake.lnk`));
    // t.truthy(await shell.test('-L', `${t.context.tmp}/rm/fake.lnk`));
    const result = await shell.rm(`${t.context.tmp}/rm/fake.lnk`);
    t.falsy(shell.error());
    t.is(result.code, 0);
    // t.falsy(await shell.test('-L', `${t.context.tmp}/rm/fake.lnk`));
    t.falsy(fs.existsSync(`${t.context.tmp}/rm/fake.lnk`));
  });
});

test('recursive dir removal, for non-normalized path', async t => {
  await shell.mkdir('-p', `${t.context.tmp}/a/b/c`);
  t.truthy(fs.existsSync(`${t.context.tmp}/a/b/c`));
  const result = await shell.rm('-rf', `${t.context.tmp}/a/.././a`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.falsy(fs.existsSync(`${t.context.tmp}/a`));
});

test('remove fifo', async t => {
  await utils.skipOnWin(t, async () => {
    const fifo = utils.mkfifo(t.context.tmp);
    const result = await shell.rm(fifo);
    t.falsy(shell.error());
    t.is(result.code, 0);
  });
});
