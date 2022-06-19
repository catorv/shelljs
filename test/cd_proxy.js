import fs from 'fs';
import os from 'os';
import path from 'path';

import test from 'ava';

import shell from '../proxy';
import utils from './utils/utils';

const cur = shell.sync.pwd().toString();

test.beforeEach(async t => {
  t.context.tmp = utils.getTempDir();
  shell.config.resetForTesting();
  process.chdir(cur);
  await shell.mkdir(t.context.tmp);
});

test.afterEach.always(async t => {
  process.chdir(cur);
  await shell.rm('-rf', t.context.tmp);
});

//
// Invalids
//

test('nonexistent directory', async t => {
  t.falsy(fs.existsSync('/asdfasdf'));
  try {
    await shell.cd('/asdfasdf'); // dir does not exist
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'cd: no such file or directory: /asdfasdf');
  }
});

test('file not dir', async t => {
  t.truthy(fs.existsSync('test/resources/file1')); // sanity check
  try {
    await shell.cd('test/resources/file1'); // file, not dir
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'cd: not a directory: test/resources/file1');
  }
});

test('no previous dir', async t => {
  try {
    await shell.cd('-'); // Haven't changed yet, so there is no previous directory
  } catch (e) {
    t.truthy(shell.error());
    t.is(e.code, 1);
    t.is(e.stderr, 'cd: could not find previous directory');
  }
});

//
// Valids
//

test('relative path', async t => {
  const result = await shell.cd(t.context.tmp);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(path.basename(process.cwd()), t.context.tmp);
});

test('absolute path', async t => {
  const result = await shell.cd('/');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(process.cwd(), path.resolve('/'));
});

test('previous directory (-)', async t => {
  shell.cd('/');
  const result = await shell.cd('-');
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(process.cwd(), path.resolve(cur.toString()));
});

test('cd + other commands', async t => {
  t.falsy(fs.existsSync(`${t.context.tmp}/file1`));
  let result = await shell.cd('test/resources');
  t.falsy(shell.error());
  t.is(result.code, 0);
  result = await shell.cp('file1', `../../${t.context.tmp}`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  result = await shell.cd(`../../${t.context.tmp}`);
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.truthy(fs.existsSync('file1'));
});

test('Tilde expansion', async t => {
  await shell.cd('~');
  t.is(process.cwd(), os.homedir());
  await shell.cd('..');
  t.not(process.cwd(), os.homedir());
  await shell.cd('~'); // Change back to home
  t.is(process.cwd(), os.homedir());
});

test('Goes to home directory if no arguments are passed', async t => {
  const result = await shell.cd();
  t.falsy(shell.error());
  t.is(result.code, 0);
  t.is(process.cwd(), os.homedir());
});
