import fs from 'fs';

import test from 'ava';

import shell from '../proxy';
import { isCached, clearCache } from '../src/tempdir';

shell.config.silent = true;


//
// Valids
//

test('basic usage', async t => {
  const tmp = await shell.tempdir();
  t.falsy(shell.error());
  t.truthy(fs.existsSync(tmp));

  // It's a directory
  t.truthy(await shell.test('-d', tmp));
});

test('cache', async t => {
  clearCache(); // In case this runs after any test which relies on tempdir().
  t.falsy(isCached());
  const tmp1 = await shell.tempdir();
  t.truthy(isCached());
  const tmp2 = await shell.tempdir();
  t.is(tmp1, tmp2);
});
