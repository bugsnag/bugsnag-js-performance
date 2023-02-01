'use strict';

const browser = require('..');
const assert = require('assert').strict;

assert.strictEqual(browser(), 'Hello from browser');
console.info("browser tests passed");
