import tui from '../../tui/index.js';

const result1 = await tui.confirm('Are you sure?');
console.log('selected:', result1);

const result2 = await tui.confirm('Are you sure?', false);
console.log('selected:', result2);

const result3 = await tui.confirm({
  title: 'Are you sure?',
  items: ['是', '否'],
});
console.log('selected:', result3);

try {
  await tui.confirm({ title: 'Are you sure?', items: [] });
} catch (e) {
  console.log('error:', e.message);
}
