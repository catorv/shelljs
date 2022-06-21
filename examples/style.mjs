import style from '../style.js';

const log = console.log;

/*
 * comes with an easy to use composable API where you just chain and
 * nest the styles you want.
 */

// Combine styled and normal strings
log(style.blue('Hello') + ' World' + style.red('!'));

// Compose multiple styles using the chainable API
log(style.blue.bgRed.bold('Hello world!'));

// Pass in multiple arguments
log(style.blue('Hello', 'World!', 'Foo', 'bar', 'biz', 'baz'));

// Nest styles
log(style.red('Hello', style.underline.bgBlue('world') + '!'));

// Nest styles of the same type even (color, underline, background)
log(style.green(
  'I am a green line ' +
  style.blue.underline.bold('with a blue substring') +
  ' that becomes green again!'
));

// ES2015 template literal
log(`
CPU: ${style.red('90%')}
RAM: ${style.green('40%')}
DISK: ${style.yellow('70%')}
`);

// Use RGB colors in terminal emulators that support it.
log(style.rgb(123, 45, 67).underline('Underlined reddish color'));
log(style.hex('#DEADED').bold('Bold gray!'));
log(style.hex('#DEADED')('gray!'));


/*
 * Easily define your own themes:
 */

const error = style.bold.red;
const warning = style.hex('#FFA500'); // Orange color

console.log(error('Error!'));
console.log(warning('Warning!'));


// see: https://github.com/chalk/chalk
