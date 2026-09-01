const test = require('node:test');
const assert = require('node:assert/strict');
const query = require('../request-query.js');

test('parses weather request query through WHATWG URL', () => {
  assert.deepEqual(
    query.parseWeatherRequestUrl('/api/weather?lat=37.5665&lon=126.9780&range=week'),
    { lat: '37.5665', lon: '126.9780', range: 'week' }
  );
});

test('preserves missing parameters as undefined', () => {
  assert.deepEqual(
    query.parseWeatherRequestUrl('/api/weather?lat=37.5665'),
    { lat: '37.5665', lon: undefined, range: undefined }
  );
});

test('malformed request URL fails closed', () => {
  assert.deepEqual(
    query.parseWeatherRequestUrl('http://['),
    { lat: undefined, lon: undefined, range: undefined }
  );
});
