import crypto from 'crypto';
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

// Helper functions
function resetUtimes(f) {
  const d = new Date();
  d.setYear(2000);
  fs.utimesSync(f, d, d);
  return common.statFollowLinks(f);
}

function tmpFile(t, noCreate) {
  const str = crypto.randomBytes(Math.ceil(10 / 2)).toString('hex');
  const file = `${t.context.tmp}/${str}`;
  if (!noCreate) {
    fs.closeSync(fs.openSync(file, 'a'));
  }
  return file;
}


//
// Valids
//

test('should handle args', async t => {
  try {
    await shell.touch();
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
  }
});

test('arguments must be strings', async t => {
  try {
    await shell.touch(1);
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
  }
});

test('exits without error when trying to touch a directory', async t => {
  const result = await shell.touch(t.context.tmp);
  t.falsy(shell.error());
  t.is(result.code, 0);
});

test('creates new files', async t => {
  const testFile = tmpFile(t);
  const result = await shell.touch(testFile);
  t.truthy(fs.existsSync(testFile));
  t.is(result.code, 0);
});

test('does not create a file if told not to', async t => {
  const testFile = tmpFile(t, true);
  const result = await shell.touch('-c', testFile);
  t.is(result.code, 0);
  t.falsy(fs.existsSync(testFile));
});

test('handles globs correctly', async t => {
  await shell.touch(`${t.context.tmp}/file.txt`);
  await shell.touch(`${t.context.tmp}/file.js`);
  const result = await shell.touch(`${t.context.tmp}/file*`);
  t.is(result.code, 0);
  const files = await shell.ls(`${t.context.tmp}/file*`);
  t.truthy(files.indexOf(`${t.context.tmp}/file.txt`) > -1);
  t.truthy(files.indexOf(`${t.context.tmp}/file.js`) > -1);
  t.is(files.length, 2);
});

test('errors if reference file is not found', async t => {
  const testFile = tmpFile(t);
  const refFile = tmpFile(t, true);
  try {
    await shell.touch({ '-r': refFile }, testFile);
  } catch (e) {
    t.is(e.code, 1);
    t.truthy(shell.error());
  }
});

test('uses a reference file for mtime', async t => {
  const testFile = tmpFile(t);
  const testFile2 = tmpFile(t);
  await shell.touch(testFile2);
  utils.sleep(1000);
  let result = await shell.touch(testFile);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.not(
    common.statFollowLinks(testFile).mtime.getTime(),
    common.statFollowLinks(testFile2).mtime.getTime()
  );
  t.not(
    common.statFollowLinks(testFile).atime.getTime(),
    common.statFollowLinks(testFile2).atime.getTime()
  );
  result = await shell.touch({ '-r': testFile2 }, testFile);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(
    common.statFollowLinks(testFile).mtime.getTime(),
    common.statFollowLinks(testFile2).mtime.getTime()
  );
  t.is(
    common.statFollowLinks(testFile).atime.getTime(),
    common.statFollowLinks(testFile2).atime.getTime()
  );
});

test('accepts -d flag', async t => {
  const testFile = tmpFile(t);
  const date = new Date('December 17, 1995 03:24:00');
  const result = await shell.touch({ '-d': date }, testFile);
  t.is(result.code, 0);
  // Compare getTime(), because Date can't be compared with triple-equals.
  t.is(common.statFollowLinks(testFile).mtime.getTime(), date.getTime());
  t.is(common.statFollowLinks(testFile).atime.getTime(), date.getTime());
});

test('accepts long option (--date)', async t => {
  const testFile = tmpFile(t);
  const someDate = new Date('December 17, 1995 03:24:00');
  const result = await shell.touch({ date: someDate }, testFile);
  t.is(result.code, 0);
  // Compare getTime(), because Date can't be compared with triple-equals.
  t.is(common.statFollowLinks(testFile).mtime.getTime(), someDate.getTime());
  t.is(common.statFollowLinks(testFile).atime.getTime(), someDate.getTime());
});

test('sets mtime and atime by default', async t => {
  const testFile = tmpFile(t);
  const oldStat = resetUtimes(testFile);
  const result = await shell.touch(testFile);
  t.is(result.code, 0);
  t.truthy(oldStat.mtime < common.statFollowLinks(testFile).mtime);
  t.truthy(oldStat.atime < common.statFollowLinks(testFile).atime);
});

test('does not set mtime if told not to', async t => {
  const testFile = tmpFile(t);
  const oldStat = resetUtimes(testFile);
  const result = await shell.touch('-a', testFile);
  t.is(result.code, 0);
  t.is(oldStat.mtime.getTime(), common.statFollowLinks(testFile).mtime.getTime());
});

test('does not set atime if told not to', async t => {
  const testFile = tmpFile(t);
  const oldStat = resetUtimes(testFile);
  const result = await shell.touch('-m', testFile);
  t.is(result.code, 0);
  t.is(oldStat.atime.getTime(), common.statFollowLinks(testFile).atime.getTime());
});

test('multiple files', async t => {
  const testFile = tmpFile(t, true);
  const testFile2 = tmpFile(t, true);
  await shell.rm('-f', testFile, testFile2);
  const result = await shell.touch(testFile, testFile2);
  t.is(result.code, 0);
  t.truthy(fs.existsSync(testFile));
  t.truthy(fs.existsSync(testFile2));
});

test('file array', async t => {
  const testFile = tmpFile(t, true);
  const testFile2 = tmpFile(t, true);
  await shell.rm('-f', testFile, testFile2);
  const result = await shell.touch([testFile, testFile2]);
  t.is(result.code, 0);
  t.truthy(fs.existsSync(testFile));
  t.truthy(fs.existsSync(testFile2));
});

test('touching broken link creates a new file', async t => {
  await utils.skipOnWin(t, async () => {
    const result = await shell.touch('test/resources/badlink');
    t.is(result.code, 0);
    t.falsy(shell.error());
    t.truthy(fs.existsSync('test/resources/not_existed_file'));
    await shell.rm('test/resources/not_existed_file');
  });
});
