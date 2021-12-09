// see: https://github.com/sindresorhus/is-interactive
module.exports = function isInteractive({stream = process.stdout} = {}) {
  return Boolean(
    stream && stream.isTTY &&
    process.env.TERM !== 'dumb' &&
    !('CI' in process.env)
  );
}
