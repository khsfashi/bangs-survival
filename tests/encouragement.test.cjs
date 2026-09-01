const test = require('node:test');
const assert = require('node:assert/strict');
const encouragement = require('../encouragement.js');

test('encouragement pool keeps at least 100 unique short messages', () => {
  assert.ok(encouragement.MESSAGES.length >= 100);
  assert.equal(new Set(encouragement.MESSAGES).size, encouragement.MESSAGES.length);
  assert.ok(encouragement.MESSAGES.every((message) => message.length <= 48), 'messages should stay short enough for mobile');
});

test('encouragement copy avoids technical or awkward product language', () => {
  const joined = encouragement.MESSAGES.join('\n');
  for (const phrase of ['최적화', '종료 버튼', '협상', '변수라면']) {
    assert.ok(!joined.includes(phrase), `copy should not contain ${phrase}`);
  }
});

test('message picker stays in range', () => {
  assert.equal(encouragement.pickMessage(0), encouragement.MESSAGES[0]);
  assert.equal(encouragement.pickMessage(1), encouragement.MESSAGES.at(-1));
  assert.ok(encouragement.MESSAGES.includes(encouragement.pickMessage(.5234)));
});

test('weather and low score select an appropriate encouragement group', () => {
  assert.equal(encouragement.contextKey(92, 'clear'), 'bright');
  assert.equal(encouragement.contextKey(72, 'rain'), 'rain');
  assert.equal(encouragement.contextKey(72, 'wind'), 'wind');
  assert.equal(encouragement.contextKey(72, 'humid'), 'humid');
  assert.equal(encouragement.contextKey(40, 'rain'), 'careful');
  assert.equal(encouragement.contextKey(68, 'cloud'), 'gentle');
});

test('contextual pools are non-empty and stay inside the full pool', () => {
  for (const [key, messages] of Object.entries(encouragement.MESSAGE_GROUPS)) {
    assert.ok(messages.length >= 10, `${key} should have enough variation`);
    for (const message of messages) assert.ok(encouragement.MESSAGES.includes(message));
  }
  const rainy = encouragement.messagesForContext(70, 'rain');
  assert.ok(rainy.includes(encouragement.pickMessage(.4, rainy)));
});
