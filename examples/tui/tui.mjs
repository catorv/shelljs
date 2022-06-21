import tui from '../../tui/index.js';

//
// properties
//

console.log('columns:', tui.columns);
console.log('rows:', tui.rows);
console.log('colorDepth:', tui.colorDepth);
console.log('isTTY:', tui.isTTY);


//
// ellipsis
//

const text1 = (
  '您好こんにちは' + Math.random() + Math.random() + Math.random() +
  Math.random() + Math.random() + Math.random() + Math.random() +
  Math.random() + Math.random() + Math.random() + Math.random()
).replace(/\./g, '');

console.log('');
console.log(text1);
console.log(tui.ellipsis(text1));
console.log(tui.ellipsis(text1, -10));

const text2 = (
  '' + Math.random() + Math.random() + Math.random() + Math.random() +
  Math.random() + Math.random() + Math.random() + Math.random() +
  Math.random() + Math.random() + Math.random() + Math.random()
).replace(/\./g, '');

console.log('');
console.log(text2);
console.log(tui.ellipsis(text2));
console.log(tui.ellipsis(text2, -10));
