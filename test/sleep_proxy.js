import test from 'ava';

import shell from '../proxy';

shell.config.silent = true;

test('no args', async t => {
  const t1 = Date.now();
  await shell.sleep();
  const t2 = Date.now();
  t.truthy(t2 - t1 - 1000 < 10);
});

test('Sleep in x seconds', async t => {
  const t1 = Date.now();
  await shell.sleep(1.1);
  const t2 = Date.now();
  t.truthy(t2 - t1 - 1100 < 10);

  const t3 = Date.now();
  await shell.sleep('0.2s');
  const t4 = Date.now();
  t.truthy(t4 - t3 - 200 < 10);
});
