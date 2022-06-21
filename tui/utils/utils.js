const wcwidth = require('wcwidth');

const getWritableStream = () => process.stdout || process.stderr;


function columns() {
  return getWritableStream().columns;
}
exports.columns = columns;


function rows() {
  return getWritableStream().rows;
}
exports.rows = rows;


function colorDepth() {
  return getWritableStream().getColorDepth();
}
exports.colorDepth = colorDepth;


function isTTY() {
  return getWritableStream().isTTY;
}
exports.isTTY = isTTY;


function ellipsis(text, maxWidth = 0) {
  if (maxWidth === 0) {
    maxWidth = columns();
  } else if (maxWidth < 0) {
    maxWidth = columns() + maxWidth;
  }
  if (wcwidth(text) < maxWidth) return text;

  const len = text.length;
  let width = 0;
  let i = 0;
  for (; i < len; i++) {
    const w = wcwidth(text[i]);
    if (width + w >= maxWidth) break;
    width += w;
  }

  return text.substring(0, i) + '…';
};
exports.ellipsis = ellipsis;
