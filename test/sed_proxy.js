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

test('no arguments', async t => {
  try {
    await shell.sed();
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.truthy(e.stderr);
  }
});

test('only one argument', async t => {
  try {
    await shell.sed(/asdf/g);
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
  }
});

test('only two arguments', async t => {
  try {
    await shell.sed(/asdf/g, 'nada');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
  }
});

test('no such file', async t => {
  t.falsy(fs.existsSync('asdfasdf')); // sanity check
  try {
    await shell.sed(/asdf/g, 'nada', 'asdfasdf');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 2);
    t.is(e.stderr, 'sed: no such file or directory: asdfasdf');
  }
});

// TODO(nate): flaky test
test('if at least one file is missing, this should be an error', async t => {
  t.falsy(fs.existsSync('asdfasdf')); // sanity check
  t.truthy(fs.existsSync(`${t.context.tmp}/file1`)); // sanity check
  try {
    await shell.sed(/asdf/g, 'nada', `${t.context.tmp}/file1`, 'asdfasdf');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 2);
    t.is(e.stderr, 'sed: no such file or directory: asdfasdf');
  }
});

//
// Valids
//

test('search with a string', async t => {
  const result = await shell.sed('test1', 'hello', `${t.context.tmp}/file1`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), 'hello');
});

test('search with a regex', async t => {
  const result = await shell.sed(/test1/, 'hello', `${t.context.tmp}/file1`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), 'hello');
});

test('replace with a number instead of a string', async t => {
  const result = await shell.sed(/test1/, 1234, `${t.context.tmp}/file1`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), '1234');
});

test('replace using a function', async t => {
  const replaceFun = match => match.toUpperCase() + match;
  const result = await shell.sed(/test1/, replaceFun, `${t.context.tmp}/file1`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), 'TEST1test1');
});

test('-i option', async t => {
  const result = await shell.sed('-i', /test1/, 'hello', `${t.context.tmp}/file1`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), '');
  t.is((await shell.cat(`${t.context.tmp}/file1`)).toString(), 'hello');
});

test('make sure * in regex is not globbed', async t => {
  const result = await shell.sed(/alpha*beta/, 'hello', 'test/resources/grep/file');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(
    result.toString(),
    'hello\nhowareyou\nhello\nthis line ends in.js\nlllllllllllllllll.js\n'
  );
});

test('make sure * in string-regex is not globbed', async t => {
  const result = await shell.sed('alpha*beta', 'hello', 'test/resources/grep/file');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(
    result.toString(),
    'hello\nhowareyou\nhello\nthis line ends in.js\nlllllllllllllllll.js\n'
  );
});

test('make sure * in regex is not globbed (matches something)', async t => {
  const result = await shell.sed(/l*\.js/, '', 'test/resources/grep/file');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(
    result.toString(),
    'alphaaaaaaabeta\nhowareyou\nalphbeta\nthis line ends in\n\n'
  );
});

test('make sure * in string-regex is not globbed (matches something)', async t => {
  const result = await shell.sed('l*\\.js', '', 'test/resources/grep/file');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(
    result.toString(),
    'alphaaaaaaabeta\nhowareyou\nalphbeta\nthis line ends in\n\n'
  );
});

test('multiple file names', async t => {
  const result = await shell.sed('test', 'hello', `${t.context.tmp}/file1`,
    `${t.context.tmp}/file2`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), 'hello1\nhello2');
});

test('array of file names (and try it out with a simple regex)', async t => {
  const result = await shell.sed(/t.*st/, 'hello', [`${t.context.tmp}/file1`,
  `${t.context.tmp}/file2`]);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), 'hello1\nhello2');
});

test('multiple file names, with in-place-replacement', async t => {
  const result = await shell.sed('-i', 'test', 'hello', [`${t.context.tmp}/file1`,
  `${t.context.tmp}/file2`]);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), '');
  t.is((await shell.cat(`${t.context.tmp}/file1`)).toString(), 'hello1');
  t.is((await shell.cat(`${t.context.tmp}/file2`)).toString(), 'hello2');
});

test('glob file names, with in-place-replacement', async t => {
  t.is((await shell.cat(`${t.context.tmp}/file1.txt`)).toString(), 'test1\n');
  t.is((await shell.cat(`${t.context.tmp}/file2.txt`)).toString(), 'test2\n');
  const result = await shell.sed('-i', 'test', 'hello', `${t.context.tmp}/file*.txt`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(result.toString(), '');
  t.is((await shell.cat(`${t.context.tmp}/file1.txt`)).toString(), 'hello1\n');
  t.is((await shell.cat(`${t.context.tmp}/file2.txt`)).toString(), 'hello2\n');
});

test('empty file', async t => {
  const result = await shell.sed('widget', 'wizzle', 'test/resources/sed/empty.txt');
  t.is(result.code, 0);
  t.is(result.toString(), '');
});
