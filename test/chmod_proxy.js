import fs from 'fs';

import test from 'ava';

import shell from '../proxy';
import common from '../src/common';
import utils from './utils/utils';

let TMP;
const BITMASK = parseInt('777', 8);

test.before(async () => {
  TMP = utils.getTempDir();
  await shell.cp('-r', 'test/resources', TMP);
  shell.config.silent = true;
});

test.after(async () => {
  await shell.rm('-rf', TMP);
});

//
// Invalids
//

test('invalid permissions', async t => {
  try {
    await shell.chmod('blah');
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
  }
  try {
    await shell.chmod('893', `${TMP}/chmod`); // invalid permissions - mode must be in octal
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
  }
});

test('Basic usage with octal codes', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.chmod('755', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & BITMASK,
      parseInt('755', 8)
    );
    result = await shell.chmod('644', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & BITMASK,
      parseInt('644', 8)
    );
  });
});

test('symbolic mode', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.chmod('o+x', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('007', 8),
      parseInt('005', 8)
    );
    result = await shell.chmod('644', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
  });
});

test('symbolic mode, without group', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.chmod('+x', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & BITMASK,
      parseInt('755', 8)
    );
    result = await shell.chmod('644', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
  });
});

test('Test setuid', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.chmod('u+s', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('4000', 8),
      parseInt('4000', 8)
    );
    result = await shell.chmod('u-s', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & BITMASK,
      parseInt('644', 8)
    );

    // according to POSIX standards at http://linux.die.net/man/1/chmod,
    // setuid is never cleared from a directory unless explicitly asked for.
    result = await shell.chmod('u+s', `${TMP}/chmod/c`);

    t.is(result.code, 0);
    result = await shell.chmod('755', `${TMP}/chmod/c`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/c`).mode & parseInt('4000', 8),
      parseInt('4000', 8)
    );
    result = await shell.chmod('u-s', `${TMP}/chmod/c`);
    t.is(result.code, 0);
  });
});

test('Test setgid', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.chmod('g+s', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('2000', 8),
      parseInt('2000', 8)
    );
    result = await shell.chmod('g-s', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & BITMASK,
      parseInt('644', 8)
    );
  });
});

test('Test sticky bit', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.chmod('+t', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('1000', 8),
      parseInt('1000', 8)
    );
    result = await shell.chmod('-t', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & BITMASK,
      parseInt('644', 8)
    );
    t.is(common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('1000', 8), 0);
  });
});

test('Test directories', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.chmod('a-w', `${TMP}/chmod/b/a/b`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/b/a/b`).mode & BITMASK,
      parseInt('555', 8)
    );
    result = await shell.chmod('755', `${TMP}/chmod/b/a/b`);
    t.is(result.code, 0);
  });
});

test('Test recursion', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.chmod('-R', 'a+w', `${TMP}/chmod/b`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/b/a/b`).mode & BITMASK,
      BITMASK
    );
    result = await shell.chmod('-R', '755', `${TMP}/chmod/b`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/b/a/b`).mode & BITMASK,
      parseInt('755', 8)
    );
  });
});

test('Test symbolic links w/ recursion  - WARNING: *nix only', async t => {
  await utils.skipOnWin(t, async () => {
    fs.symlinkSync(`${TMP}/chmod/b/a`, `${TMP}/chmod/a/b/c/link`, 'dir');
    let result = await shell.chmod('-R', 'u-w', `${TMP}/chmod/a/b`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/a/b/c`).mode & parseInt('700', 8),
      parseInt('500', 8)
    );
    t.is(
      common.statFollowLinks(`${TMP}/chmod/b/a`).mode & parseInt('700', 8),
      parseInt('700', 8)
    );
    result = await shell.chmod('-R', 'u+w', `${TMP}/chmod/a/b`);
    t.is(result.code, 0);
    fs.unlinkSync(`${TMP}/chmod/a/b/c/link`);
  });
});

test('Test combinations', async t => {
  let result = await shell.chmod('a-rwx', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
  t.is(
    common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('000', 8),
    parseInt('000', 8)
  );
  result = await shell.chmod('644', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
});

test('multiple symbolic modes', async t => {
  let result = await shell.chmod('a-rwx,u+r', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
  t.is(
    common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('400', 8),
    parseInt('400', 8)
  );
  result = await shell.chmod('644', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
});

test('multiple symbolic modes #2', async t => {
  let result = await shell.chmod('a-rwx,u+rw', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
  t.is(
    common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('600', 8),
    parseInt('600', 8)
  );
  result = await shell.chmod('644', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
});

test('multiple symbolic modes #3', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.chmod('a-rwx,u+rwx', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('700', 8),
      parseInt('700', 8)
    );
    result = await shell.chmod('644', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
  });
});

test('u+rw', async t => {
  let result = await shell.chmod('000', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
  result = await shell.chmod('u+rw', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
  t.is(
    common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('600', 8),
    parseInt('600', 8)
  );
  result = await shell.chmod('644', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
});

test('u+wx', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.chmod('000', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    result = await shell.chmod('u+wx', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('300', 8),
      parseInt('300', 8)
    );
    result = await shell.chmod('644', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
  });
});

test('Multiple symbolic modes at once', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.chmod('000', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    result = await shell.chmod('u+r,g+w,o+x', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('421', 8),
      parseInt('421', 8)
    );
    result = await shell.chmod('644', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
  });
});

test('u+rw,g+wx', async t => {
  await utils.skipOnWin(t, async () => {
    let result = await shell.chmod('000', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    result = await shell.chmod('u+rw,g+wx', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
    t.is(
      common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('630', 8),
      parseInt('630', 8)
    );
    result = await shell.chmod('644', `${TMP}/chmod/file1`);
    t.is(result.code, 0);
  });
});

test('u-x,g+rw', async t => {
  let result = await shell.chmod('700', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
  result = await shell.chmod('u-x,g+rw', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
  t.is(
    common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('660', 8),
    parseInt('660', 8)
  );
  result = await shell.chmod('644', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
});

test('a-rwx,u+rw', async t => {
  let result = await shell.chmod('a-rwx,u+rw', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
  t.is(
    common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('600', 8),
    parseInt('600', 8)
  );
  result = await shell.chmod('a-rwx,u+rw', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
  t.is(
    common.statFollowLinks(`${TMP}/chmod/file1`).mode & parseInt('600', 8),
    parseInt('600', 8)
  );
  result = await shell.chmod('644', `${TMP}/chmod/file1`);
  t.is(result.code, 0);
});

test('Numeric modes', async t => {
  let result = await shell.chmod('744', `${TMP}/chmod/xdir`);
  t.is(result.code, 0);
  result = await shell.chmod('644', `${TMP}/chmod/xdir/file`);
  t.is(result.code, 0);
  result = await shell.chmod('744', `${TMP}/chmod/xdir/deep`);
  t.is(result.code, 0);
  result = await shell.chmod('644', `${TMP}/chmod/xdir/deep/file`);
  t.is(result.code, 0);
  result = await shell.chmod('-R', 'a+X', `${TMP}/chmod/xdir`);
  t.is(result.code, 0);
});

test('Make sure chmod succeeds for a variety of octal codes', async t => {
  await utils.skipOnWin(t, async () => {
    t.is(
      common.statFollowLinks(`${TMP}/chmod/xdir`).mode & parseInt('755', 8),
      parseInt('755', 8)
    );
    t.is(
      common.statFollowLinks(`${TMP}/chmod/xdir/file`).mode & parseInt('644', 8),
      parseInt('644', 8)
    );
    t.is(
      common.statFollowLinks(`${TMP}/chmod/xdir/deep`).mode & parseInt('755', 8),
      parseInt('755', 8)
    );
    t.is(
      common.statFollowLinks(`${TMP}/chmod/xdir/deep/file`).mode & parseInt('644', 8),
      parseInt('644', 8)
    );
  });
});
