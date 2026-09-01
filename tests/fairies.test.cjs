const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const legacyGuard = require('../fairies.js');

test('legacy five-fairy runtime methods are removed without touching core logic', () => {
  const logic = {
    clamp() {},
    createDailyCompanion() {},
    normalizeDailyCompanion() {},
    getCollectedCompanion() {},
    upsertDailyCompanion() {}
  };

  assert.equal(legacyGuard.disable(logic), true);
  assert.equal(typeof logic.clamp, 'function');
  legacyGuard.LEGACY_METHODS.forEach((key) => assert.equal(Object.hasOwn(logic, key), false));
});

test('legacy guard is safe when logic is unavailable', () => {
  assert.equal(legacyGuard.disable(null), false);
  assert.equal(legacyGuard.disable(undefined), false);
});

test('legacy guard runs before the new twelve-fairy gacha runtime', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const guardIndex = html.indexOf('<script src="/fairies.js" defer></script>');
  const gachaIndex = html.indexOf('<script src="/gacha.js" defer></script>');

  assert.ok(guardIndex >= 0, 'legacy guard script must remain loaded during migration');
  assert.ok(gachaIndex > guardIndex, 'new gacha runtime must initialize after legacy methods are disabled');
});
