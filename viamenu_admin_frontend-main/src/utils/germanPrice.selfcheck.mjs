// Run: node src/utils/germanPrice.selfcheck.mjs
import assert from 'node:assert';
import { parseGermanPrice, formatGermanPrice } from './germanPrice.js';

// blur auto-correction rules
assert.strictEqual(formatGermanPrice(parseGermanPrice('1,5')), '1,50');
assert.strictEqual(formatGermanPrice(parseGermanPrice('1')), '1,00');
assert.strictEqual(formatGermanPrice(parseGermanPrice('1,')), '1,00');
assert.strictEqual(formatGermanPrice(parseGermanPrice('1,254')), '1,25'); // <= round down
assert.strictEqual(formatGermanPrice(parseGermanPrice('1,255')), '1,26'); // >= round up
assert.strictEqual(formatGermanPrice(parseGermanPrice('1,50')), '1,50');
assert.strictEqual(formatGermanPrice(parseGermanPrice('12,50')), '12,50');
assert.strictEqual(formatGermanPrice(parseGermanPrice('1,999')), '2,00'); // carry

// invalid input
assert.strictEqual(parseGermanPrice('1.50'), null); // dot not silently accepted
assert.strictEqual(parseGermanPrice(',5'), null);
assert.strictEqual(parseGermanPrice('abc'), null);
assert.strictEqual(parseGermanPrice(''), null);
assert.strictEqual(parseGermanPrice('1,2,3'), null);

// numeric / dotted DB values render back to German
assert.strictEqual(formatGermanPrice(9.99), '9,99');
assert.strictEqual(formatGermanPrice('9.9'), '9,90');

console.log('germanPrice: all checks passed');
