import path from 'path';

import test from 'ava';

import shell from '../proxy';
import utils from './utils/utils';

const cur = process.cwd();

test.beforeEach(async t => {
  t.context.tmp = utils.getTempDir();
  shell.config.resetForTesting();
  await shell.mkdir(t.context.tmp);
});

test.afterEach.always(async t => {
  process.chdir(cur);
  await shell.rm('-rf', t.context.tmp);
});


//
// Valids
//

test('initial directory', async t => {
  const cwd = await shell.pwd();
  t.falsy(shell.error());
  t.is(cwd.code, 0);
  t.falsy(cwd.stderr);
  t.is(cwd.toString(), path.resolve('.'));
});

test('after changing directory', async t => {
  shell.cd(t.context.tmp);
  const cwd = await shell.pwd();
  t.is(cwd.code, 0);
  t.falsy(cwd.stderr);
  t.falsy(shell.error());
  t.is(path.basename(cwd.toString()), t.context.tmp);
});
