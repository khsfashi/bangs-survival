const logic = require('../logic.js');
const week = require('../week.js');
const weekCoverage = require('../week-coverage.js');
const requestQuery = require('../request-query.js');

const KMA_URL = 'https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0/getVilageFcst';
const PAGE_SIZE = 1000;
const MAX_WEEK_PAGES = 3;

function buildKmaUrl({ apiKey, base, grid, pageNo }) {
  const url = new URL(KMA_URL);
  url.search = new URLSearchParams({
    pageNo: String(pageNo),
    numOfRows: String(PAGE_SIZE),
    dataType: 'JSON',
    base_date: base.baseDate,
    base_time: base.baseTime,
    nx: String(grid.nx),
    ny: String(grid.ny),
    authKey: apiKey
  }).toString();
  return url;
}

async function fetchKmaPage(options) {
  const response = await fetch(buildKmaUrl(options), { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const error = new Error('kma_http_error');
    error.status = response.status;
    throw error;
  }
  const payload = await response.json();
  const responseNode = payload.response || payload;
  const header = responseNode.header || {};
  if (header.resultCode && String(header.resultCode) !== '00') {
    const error = new Error('kma_api_error');
    error.code = String(header.resultCode);
    error.apiMessage = header.resultMsg || '';
    throw error;
  }
  return responseNode.body || {};
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const apiKey = process.env.KMA_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'kma_key_missing' });

  const query = requestQuery.parseWeatherRequestUrl(req.url);
  const latitude = Number(query.lat);
  const longitude = Number(query.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return res.status(400).json({ error: 'invalid_coordinates' });
  if (latitude < 32 || latitude > 39.5 || longitude < 124 || longitude > 132) return res.status(400).json({ error: 'outside_korea' });

  const extended = query.range === 'week';
  const grid = logic.toKmaGrid(latitude, longitude);
  const base = logic.chooseKmaBaseDateTime(new Date());

  try {
    const firstBody = await fetchKmaPage({ apiKey, base, grid, pageNo: 1 });
    let items = firstBody.items?.item || [];

    if (extended) {
      const totalCount = Number(firstBody.totalCount) || items.length;
      const pageCount = Math.min(MAX_WEEK_PAGES, Math.max(1, Math.ceil(totalCount / PAGE_SIZE)));
      for (let pageNo = 2; pageNo <= pageCount; pageNo += 1) {
        const body = await fetchKmaPage({ apiKey, base, grid, pageNo });
        items = items.concat(body.items?.item || []);
      }
    }

    const now = new Date();
    let hours = extended
      ? week.parseKmaForecastItems(items, now, week.KMA_MAX_HOURS)
      : logic.parseKmaForecastItems(items, now);
    if (extended) hours = weekCoverage.filterCompleteDaytimeDates(hours, now);

    if (!hours.length) return res.status(502).json({ error: 'kma_empty_forecast' });
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ source: 'KMA', grid, base, range: extended ? 'week' : 'short', hours });
  } catch (error) {
    console.error('KMA forecast failed', error);
    if (error.message === 'kma_http_error') return res.status(502).json({ error: 'kma_http_error', status: error.status });
    if (error.message === 'kma_api_error') return res.status(502).json({ error: 'kma_api_error', code: error.code, message: error.apiMessage });
    return res.status(502).json({ error: 'kma_unavailable' });
  }
};
