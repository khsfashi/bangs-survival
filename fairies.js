(function initLegacyFairyRuntimeGuard(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.disable(root.BangsLogic);
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const LEGACY_METHODS = Object.freeze([
    'createDailyCompanion',
    'normalizeDailyCompanion',
    'getCollectedCompanion',
    'upsertDailyCompanion'
  ]);

  function disable(logic) {
    if (!logic || typeof logic !== 'object') return false;
    LEGACY_METHODS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(logic, key)) delete logic[key];
    });
    return true;
  }

  return { LEGACY_METHODS: LEGACY_METHODS.slice(), disable };
}));
