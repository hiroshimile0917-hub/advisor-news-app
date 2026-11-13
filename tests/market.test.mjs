import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler, { parseJpxTopix, fetchSymbol } from '../api/market.js';
const sym = { label: 'TOPIX', decimals: 2, suffix: '', jpx: true };
const data = { Topix: { Topix: { currentPrice: '3,967.54', previousDayRatio: '-0.77' } } };
test('exact TOPIX, commas, previous close ratio and missing values', () => {
  assert.deepEqual(parseJpxTopix(data, sym), { label: 'TOPIX', value: '3,967.54', change: '-0.77%', up: false, source: 'jpx' });
  for (const value of ['', null, '--', 'NaN', 0]) assert.throws(() => parseJpxTopix({ Topix: { Topix: { currentPrice: value } } }, sym));
  assert.equal(parseJpxTopix({ Topix: { Topix: { currentPrice: '3000', previousDayRatio: '' } } }, sym).change, '--');
  assert.throws(() => parseJpxTopix({ MainStockIndex: data.Topix }, sym));
});
test('failure returns reason, logs and avoids incorrect alternative tickers', async () => {
  const originalFetch = globalThis.fetch, originalLog = console.error;
  const urls = [], logs = [];
  try {
    globalThis.fetch = async url => { urls.push(url); return new Response('', { status: 503 }); };
    console.error = (...args) => logs.push(args);
    const result = await fetchSymbol(sym, null);
    assert.equal(result.value, '--');
    assert.deepEqual(result.errors, [{ source: 'jpx', reason: 'JPX HTTP 503' }]);
    assert.equal(logs.length, 1);
    assert.equal(urls.length, 1);
    assert.match(urls[0], /jpx.co.jp/);
  } finally { globalThis.fetch = originalFetch; console.error = originalLog; }
});
test('handler preserves array contract on partial failures', async () => {
  const originalFetch = globalThis.fetch, originalLog = console.error;
  try {
    globalThis.fetch = async url => url.includes('jpx.co.jp') ? Response.json(data) : new Response('', { status: 503 });
    console.error = () => {};
    const rows = await (await handler()).json();
    assert.equal(rows.length, 7);
    assert.equal(rows.find(row => row.label === 'TOPIX').value, '3,967.54');
    assert(rows.find(row => row.label === 'USD/JPY').errors.length >= 2);
  } finally { globalThis.fetch = originalFetch; console.error = originalLog; }
});
