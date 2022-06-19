import test from 'ava';

import shell from '../proxy';
import utils from './utils/utils';
import mocks from './utils/mocks';

shell.config.silent = true;

test.beforeEach(t => {
  t.context.tmp = utils.getTempDir();
  mocks.init();
});

test.afterEach.always(async t => {
  await shell.rm('-rf', t.context.tmp);
  mocks.restore();
});

//
// Valids
//

test('simple test with defaults', async t => {
  const result = await shell.echo('hello', 'world');
  const stdout = mocks.stdout();
  const stderr = mocks.stderr();
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(stdout, 'hello world\n');
  t.is(stderr, '');
});

test('allow arguments to begin with a hyphen', async t => {
  try {
    // Github issue #20
    await shell.echo('-asdf', '111');
  } catch (e) {
    const stdout = mocks.stdout();
    const stderr = mocks.stderr();
    t.falsy(shell.error());
    t.is(e.code, 1);
    t.is(stdout, '-asdf 111\n');
    t.is(stderr, '');
  }
});

test("using null as an explicit argument doesn't crash the function", async t => {
  const result = await shell.echo(null);
  const stdout = mocks.stdout();
  const stderr = mocks.stderr();
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(stdout, 'null\n');
  t.is(stderr, '');
});

test('-e option', async t => {
  const result = await shell.echo('-e', '\tmessage');
  const stdout = mocks.stdout();
  const stderr = mocks.stderr();
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(stdout, '\tmessage\n');
  t.is(stderr, '');
});

test('piping to a file', async t => {
  // Github issue #476
  await shell.mkdir(t.context.tmp);
  const tmp = `${t.context.tmp}/echo.txt`;
  const resultA = (await shell.echo('A')).toEnd(tmp);
  t.falsy(shell.error());
  t.is(resultA.code, 0);
  const resultB = (await shell.echo('B')).toEnd(tmp);
  t.falsy(shell.error());
  t.is(resultB.code, 0);
  const result = await shell.cat(tmp);
  const stdout = mocks.stdout();
  const stderr = mocks.stderr();
  t.falsy(shell.error());
  t.is(stdout, 'A\nB\n');
  t.is(stderr, '');
  t.is(result.toString(), 'A\nB\n');
});

test('-n option', async t => {
  const result = await shell.echo('-n', 'message');
  const stdout = mocks.stdout();
  const stderr = mocks.stderr();
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(stdout, 'message');
  t.is(stderr, '');
});

test('-ne option', async t => {
  const result = await shell.echo('-ne', 'message');
  const stdout = mocks.stdout();
  const stderr = mocks.stderr();
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(stdout, 'message');
  t.is(stderr, '');
});

test('-en option', async t => {
  const result = await shell.echo('-en', 'message');
  const stdout = mocks.stdout();
  const stderr = mocks.stderr();
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(stdout, 'message');
  t.is(stderr, '');
});

test('-en option with escaped characters', async t => {
  const result = await shell.echo('-en', '\tmessage\n');
  const stdout = mocks.stdout();
  const stderr = mocks.stderr();
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(stdout, '\tmessage\n');
  t.is(stderr, '');
});

test('piping to a file with -n', async t => {
  // Github issue #476
  await shell.mkdir(t.context.tmp);
  const tmp = `${t.context.tmp}/echo.txt`;
  const resultA = (await shell.echo('-n', 'A')).toEnd(tmp);
  t.falsy(shell.error());
  t.is(resultA.code, 0);
  const resultB = (await shell.echo('-n', 'B')).toEnd(tmp);
  t.falsy(shell.error());
  t.is(resultB.code, 0);
  const result = await shell.cat(tmp);
  const stdout = mocks.stdout();
  const stderr = mocks.stderr();
  t.falsy(shell.error());
  t.is(stdout, 'AB');
  t.is(stderr, '');
  t.is(result.toString(), 'AB');
});

test('stderr with unrecognized options is empty', async t => {
  try {
    await shell.echo('-asdf');
  } catch (e) {
    const stdout = mocks.stdout();
    const stderr = mocks.stderr();
    t.falsy(shell.error());
    t.is(e.code, 1);
    t.falsy(e.stderr);
    t.is(stdout, '-asdf\n');
    t.is(stderr, '');
  }
});
