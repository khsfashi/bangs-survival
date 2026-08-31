const test = require('node:test');
const assert = require('node:assert/strict');
const encouragement = require('../encouragement.js');

test('encouragement pool has at least 100 unique messages', () => {
  assert.ok(encouragement.MESSAGES.length >= 100);
  assert.equal(new Set(encouragement.MESSAGES).size, encouragement.MESSAGES.length);
});

test('message picker stays in range', () => {
  assert.equal(encouragement.pickMessage(0), encouragement.MESSAGES[0]);
  assert.equal(encouragement.pickMessage(1), encouragement.MESSAGES.at(-1));
  assert.ok(encouragement.MESSAGES.includes(encouragement.pickMessage(.5234)));
});
