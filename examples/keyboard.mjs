// const kb = require('../keyboard');
import kb from '../keyboard.js';

const line = await kb.readline('Input a string: ');
console.log(`inputed: >>>${line}<<<`);

console.log();

console.log('Press any key to continue...');
const input = await kb.read();
console.log('inputed:', input);
