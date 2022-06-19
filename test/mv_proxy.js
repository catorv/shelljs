import fs from 'fs';

import test from 'ava';

import shell from '../proxy';
import utils from './utils/utils';

const CWD = process.cwd();
const numLines = utils.numLines;

test.beforeEach(async t => {
  t.context.tmp = utils.getTempDir();
  shell.config.resetForTesting();
  await shell.cp('-r', 'test/resources', t.context.tmp);
  await shell.cd(t.context.tmp);
});

test.afterEach.always(async t => {
  process.chdir(CWD);
  await shell.rm('-rf', t.context.tmp);
});


//
// Invalids
//

test('no args', async t => {
  try {
    await shell.mv();
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mv: missing <source> and/or <dest>');
  }
});

test('one arg', async t => {
  try {
    await shell.mv('file1');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mv: missing <source> and/or <dest>');
  }
});

test('option only', async t => {
  try {
    await shell.mv('-f');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mv: missing <source> and/or <dest>');
  }
});

test('option not supported', async t => {
  t.truthy(fs.existsSync('file1')); // precondition
  try {
    await shell.mv('-Z', 'file1', 'file1');
  } catch (e) {
    t.truthy(shell.error());
    t.truthy(fs.existsSync('file1'));
    t.is(e.code, 1);
    t.is(e.stderr, 'mv: option not recognized: Z');
  }
});

test('source does not exist', async t => {
  try {
    await shell.mv('asdfasdf', '..');
  } catch (e) {
    t.truthy(shell.error());
    t.is(numLines(shell.error()), 1);
    t.falsy(fs.existsSync('../asdfasdf'));
    t.is(e.code, 1);
    t.is(e.stderr, 'mv: no such file or directory: asdfasdf');
  }
});

test('sources do not exist', async t => {
  try {
    await shell.mv('asdfasdf1', 'asdfasdf2', '..');
  } catch (e) {
    t.truthy(shell.error());
    t.is(numLines(shell.error()), 2);
    t.falsy(fs.existsSync('../asdfasdf1'));
    t.falsy(fs.existsSync('../asdfasdf2'));
    t.is(e.code, 1);
    t.is(
      e.stderr,
      'mv: no such file or directory: asdfasdf1\nmv: no such file or directory: asdfasdf2'
    );
  }
});

test('too many sources (dest is file)', async t => {
  try {
    await shell.mv('asdfasdf1', 'asdfasdf2', 'file1');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mv: dest is not a directory (too many sources)');
  }
});

test('-n is no-force/no-clobber', async t => {
  try {
    await shell.mv('-n', 'file1', 'file2');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mv: dest file already exists: file2');
  }
});

test('-n option with a directory as the destination', async t => {
  await shell.cp('file1', 'cp'); // copy it so we're sure it's already there
  try {
    await shell.mv('-n', 'file1', 'cp');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mv: dest file already exists: cp/file1');
  }
});

test('-f is the default behavior', async t => {
  const result = await shell.mv('file1', 'file2'); // dest already exists (but that's ok)
  t.falsy(shell.error());
  t.falsy(result.stderr);
  t.is(result.code, 0);
});

test('-fn is the same as -n', async t => {
  try {
    await shell.mv('-fn', 'file1', 'file2');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'mv: dest file already exists: file2');
  }
});

test('too many sources (exist, but dest is file)', async t => {
  try {
    await shell.mv('file1', 'file2', 'a_file');
  } catch (e) {
    t.truthy(shell.error());
    t.falsy(fs.existsSync('a_file'));
    t.is(e.code, 1);
    t.is(e.stderr, 'mv: dest is not a directory (too many sources)');
  }
});

test('can\'t use wildcard when dest is file', async t => {
  try {
    await shell.mv('file*', 'file1');
  } catch (e) {
    t.truthy(shell.error());
    t.truthy(fs.existsSync('file1'));
    t.truthy(fs.existsSync('file2'));
    t.truthy(fs.existsSync('file1.js'));
    t.truthy(fs.existsSync('file2.js'));
    t.is(e.code, 1);
    t.is(e.stderr, 'mv: dest is not a directory (too many sources)');
  }
});

//
// Valids
//

test('handles self OK', async t => {
  const tmp2 = `${t.context.tmp}-2`;
  await shell.mkdir(tmp2);
  try {
    await shell.mv('*', tmp2); // has to handle self (tmp2 --> tmp2) without throwing error
  } catch (e) {
    t.truthy(shell.error()); // there's an error, but not fatal
    t.truthy(fs.existsSync(`${tmp2}/file1`)); // moved OK
    t.is(e.code, 1);
  }
  const result = await shell.mv(`${tmp2}/*`, '.'); // revert
  t.truthy(fs.existsSync('file1')); // moved OK
  t.is(result.code, 0);
});

test('one source', async t => {
  let result = await shell.mv('file1', 'file3');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.falsy(fs.existsSync('file1'));
  t.truthy(fs.existsSync('file3'));
  result = await shell.mv('file3', 'file1'); // revert
  t.falsy(shell.error());
  t.truthy(fs.existsSync('file1'));
  t.is(result.code, 0);
});

test('two sources', async t => {
  const result = await shell.mv('file1', 'file2', 'cp');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.falsy(fs.existsSync('file1'));
  t.falsy(fs.existsSync('file2'));
  t.truthy(fs.existsSync('cp/file1'));
  t.truthy(fs.existsSync('cp/file2'));
});

test('two sources, array style', async t => {
  await shell.rm('-rf', 't');
  await shell.mkdir('-p', 't');
  let result = await shell.mv(['file1', 'file2'], 't'); // two sources
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.falsy(fs.existsSync('file1'));
  t.falsy(fs.existsSync('file2'));
  t.truthy(fs.existsSync('t/file1'));
  t.truthy(fs.existsSync('t/file2'));
  result = await shell.mv('t/*', '.'); // revert
  t.truthy(fs.existsSync('file1'));
  t.truthy(fs.existsSync('file2'));
});

test('wildcard', async t => {
  shell.mkdir('-p', 't');
  let result = await shell.mv('file*.js', 't'); // wildcard
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.falsy(fs.existsSync('file1.js'));
  t.falsy(fs.existsSync('file2.js'));
  t.truthy(fs.existsSync('t/file1.js'));
  t.truthy(fs.existsSync('t/file2.js'));
  result = await shell.mv('t/*', '.'); // revert
  t.truthy(fs.existsSync('file1.js'));
  t.truthy(fs.existsSync('file2.js'));
});

test('dest exists, but -f given', async t => {
  const result = await shell.mv('-f', 'file1', 'file2');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.falsy(fs.existsSync('file1'));
  t.truthy(fs.existsSync('file2'));
});

test('should not overwrite recently created files', async t => {
  await shell.mkdir('-p', 't');
  try {
    await shell.mv('file1', 'cp/file1', 't/');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);

    // Ensure First file is copied
    t.is((await shell.cat('t/file1')).toString(), 'test1');
    t.is(
      e.stderr,
      "mv: will not overwrite just-created 't/file1' with 'cp/file1'"
    );
    t.truthy(fs.existsSync('cp/file1'));
  }
});


test('should not overwrite recently created files (not give error no-force mode)', async t => {
  await shell.mkdir('-p', 't');
  const result = await shell.mv('-n', 'file1', 'cp/file1', 't/');
  t.falsy(shell.error());
  t.is(result.code, 0);

  // Ensure First file is moved
  t.is((await shell.cat('t/file1')).toString(), 'test1');
  t.truthy(fs.existsSync('cp/file1'));
});
