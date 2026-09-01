'use strict';

function queryValue(searchParams, key) {
  return searchParams.has(key) ? searchParams.get(key) : undefined;
}

function parseWeatherRequestUrl(rawUrl) {
  try {
    const url = new URL(typeof rawUrl === 'string' && rawUrl ? rawUrl : '/', 'http://localhost');
    return {
      lat: queryValue(url.searchParams, 'lat'),
      lon: queryValue(url.searchParams, 'lon'),
      range: queryValue(url.searchParams, 'range')
    };
  } catch {
    return { lat: undefined, lon: undefined, range: undefined };
  }
}

module.exports = { parseWeatherRequestUrl };
