import test from 'ava';

import shell from '../proxy';
import utils from './utils/utils';

shell.config.silent = true;

//
// Invalids
//

test('no expression given', async t => {
  try {
    await shell.test();
  } catch (e) {
    t.truthy(shell.error());
  }
});

test('bad expression', async t => {
  try {
    await shell.test('asdf');
  } catch (e) {
    t.truthy(shell.error());
  }
});

test('bad expression #2', async t => {
  try {
    await shell.test('f', 'test/resources/file1');
  } catch (e) {
    t.truthy(shell.error());
  }
});

test('no file', async t => {
  try {
    await shell.test('-f');
  } catch (e) {
    t.truthy(shell.error());
  }
});

//
// Valids
//


test('-e option succeeds for files', async t => {
  const result = await shell.test('-e', 'test/resources/file1');
  t.falsy(shell.error());
  t.truthy(result);
});

test('-e option fails if it does not exist', async t => {
  const result = await shell.test('-e', 'test/resources/404');
  t.falsy(shell.error());
  t.falsy(result);
});

test('-d option succeeds for a directory', async t => {
  const result = await shell.test('-d', 'test/resources');
  t.falsy(shell.error());
  t.truthy(result);
});

test('-f option fails for a directory', async t => {
  const result = await shell.test('-f', 'test/resources');
  t.falsy(shell.error());
  t.falsy(result);
});

test('-L option fails for a directory', async t => {
  const result = await shell.test('-L', 'test/resources');
  t.falsy(shell.error());
  t.falsy(result);
});

test('-d option fails for a file', async t => {
  const result = await shell.test('-d', 'test/resources/file1');
  t.falsy(shell.error());
  t.falsy(result);
});

test('-f option succeeds for a file', async t => {
  const result = await shell.test('-f', 'test/resources/file1');
  t.falsy(shell.error());
  t.truthy(result);
});

test('-L option fails for a file', async t => {
  const result = await shell.test('-L', 'test/resources/file1');
  t.falsy(shell.error());
  t.falsy(result);
});

test('test command is not globbed', async t => {
  // regression #529
  const result = await shell.test('-f', 'test/resources/**/*.js');
  t.falsy(shell.error());
  t.falsy(result);
});

// TODO(nate): figure out a way to test links on Windows
test('-d option fails for a link', async t => {
  await utils.skipOnWin(t, async () => {
    const result = await shell.test('-d', 'test/resources/link');
    t.falsy(shell.error());
    t.falsy(result);
  });
});

test('-f option succeeds for a link', async t => {
  await utils.skipOnWin(t, async () => {
    const result = await shell.test('-f', 'test/resources/link');
    t.falsy(shell.error());
    t.truthy(result);
  });
});

test('-L option succeeds for a symlink', async t => {
  await utils.skipOnWin(t, async () => {
    const result = await shell.test('-L', 'test/resources/link');
    t.falsy(shell.error());
    t.truthy(result);
  });
});

test('-L option works for broken symlinks', async t => {
  await utils.skipOnWin(t, async () => {
    const result = await shell.test('-L', 'test/resources/badlink');
    t.falsy(shell.error());
    t.truthy(result);
  });
});

test('-L option fails for missing files', async t => {
  await utils.skipOnWin(t, async () => {
    const result = await shell.test('-L', 'test/resources/404');
    t.falsy(shell.error());
    t.falsy(result);
  });
});
