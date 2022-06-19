import fs from 'fs';
import path from 'path';

import test from 'ava';

import shell from '../proxy';
import utils from './utils/utils';

shell.config.silent = true;

//
// Invalids
//

test('no args', async t => {
  try {
    await shell.which();
  } catch (e) {
    t.truthy(shell.error());
  }
});

test('command does not exist in the path', async t => {
  const result = await shell.which('asdfasdfasdfasdfasdf'); // what are the odds...
  t.falsy(shell.error());
  t.falsy(result);
});

//
// Valids
//

// TODO(nate): make sure this does not have a false negative if 'git' is missing
test('basic usage', async t => {
  const git = await shell.which('git');
  t.is(git.code, 0);
  t.falsy(git.stderr);
  t.falsy(shell.error());
  t.truthy(fs.existsSync(git.toString()));
});

test('Windows can search with or without a .exe extension', async t => {
  await utils.skipOnUnix(t, async () => {
    // This should be equivalent on Windows
    const node = await shell.which('node');
    const nodeExe = await shell.which('node.exe');
    t.falsy(shell.error());
    // If the paths are equal, then this file *should* exist, since that's
    // already been checked.
    t.is(node.toString(), nodeExe.toString());
  });
});

test('Searching with -a flag returns an array', async t => {
  const commandName = 'node'; // Should be an existing command
  const result = await shell.which('-a', commandName);
  t.falsy(shell.error());
  t.truthy(result);
  t.not(result.length, 0);
});

test('Searching with -a flag for not existing command returns an empty array', async t => {
  const notExist = '6ef25c13209cb28ae465852508cc3a8f3dcdc71bc7bcf8c38379ba38me';
  const result = await shell.which('-a', notExist);
  t.falsy(shell.error());
  t.is(result.length, 0);
});

test('Searching with -a flag returns an array with first item equals to the regular search', async t => {
  const commandName = 'node'; // Should be an existing command
  const resultForWhich = await shell.which(commandName);
  const resultForWhichA = await shell.which('-a', commandName);
  t.falsy(shell.error());
  t.truthy(resultForWhich);
  t.truthy(resultForWhichA);
  t.is(resultForWhich.toString(), resultForWhichA[0]);
});

test('None executable files does not appear in the result list', async t => {
  const commandName = 'node'; // Should be an existing command
  const extraPath = path.resolve(__dirname, 'resources', 'which');
  const matchingFile = path.resolve(extraPath, commandName);
  const pathEnv = process.env.PATH;

  // make sure that file is exists (will throw error otherwise)
  t.truthy(fs.existsSync(matchingFile));

  process.env.PATH = extraPath + path.delimiter + process.env.PATH;
  const resultForWhich = await shell.which(commandName);
  const resultForWhichA = await shell.which('-a', commandName);
  t.falsy(shell.error());
  t.truthy(resultForWhich);
  t.truthy(resultForWhichA);
  t.truthy(resultForWhichA.length);
  t.not(resultForWhich.toString(), matchingFile);
  t.is(resultForWhichA.indexOf(matchingFile), -1);

  process.env.PATH = pathEnv;
});
