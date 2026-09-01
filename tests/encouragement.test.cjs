const test = require('node:test');
const assert = require('node:assert/strict');
const encouragement = require('../encouragement.js');

test('encouragement pool keeps 123 unique messages', () => {
  assert.equal(encouragement.MESSAGES.length, 123);
  assert.equal(new Set(encouragement.MESSAGES).size, encouragement.MESSAGES.length);
});

test('encouragement copy avoids technical or awkward product language', () => {
  const joined = encouragement.MESSAGES.join('\n');
  for (const phrase of ['최적화', '종료 버튼', '협상', '변수라면']) {
    assert.ok(!joined.includes(phrase), `copy should not contain ${phrase}`);
  }
  assert.ok(encouragement.MESSAGES.every((message) => message.length <= 48), 'messages should stay short enough for mobile');
});

test('message picker stays in range', () => {
  assert.equal(encouragement.pickMessage(0), encouragement.MESSAGES[0]);
  assert.equal(encouragement.pickMessage(1), encouragement.MESSAGES.at(-1));
  assert.ok(encouragement.MESSAGES.includes(encouragement.pickMessage(.5234)));
});
