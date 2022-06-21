import tui from '../../tui/index.js';

// default options:
// {
//   title: 'Please select:',
//   items: [], // Array or function. (required)
//   value: 0,
//   cancelable: false,
//   breakable: true,
//   inline: false,
// }

const result = await tui.chooser({
  items: [
    'aaaaaa',
    'bbbbbbb',
    'cccccccc',
  ],
});
console.log(`selected item: ${result}`);

const result2 = await tui.chooser({
  items: [
    'aaaaaa',
    'bbbbbbb',
    'cccccccc',
  ],
  inline: true,
});
console.log(`selected item: ${result2}`);

try {
  const result3 = await tui.chooser();
  console.log(result3);
} catch (e) {
  console.log('error:', e.message);
}
