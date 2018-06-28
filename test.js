
const Promise = require('bluebird');
const cache = require('./index.js').init();

function getDate() {
  return Date.now();
}

function asyncGetDate() {
  return Promise.resolve(Date.now());
}

function funcUseThisAndParm(...args) {
  return Promise.resolve(args.join(this.separator));
}

test('cache', async () => {
  const result = await cache.get('syncfuncCache', getDate());
  const cacheResult = await cache.get('syncfuncCache', getDate());
  expect(result).toBe(cacheResult);
});

test('cache async', async () => {
  const result = await cache.get('syncfuncCache', asyncGetDate());
  const cacheResult = await cache.get('syncfuncCache', asyncGetDate());
  expect(result).toBe(cacheResult);
});

test('set key', async () => {
  const key = 'cache-set-key';
  cache.setKey(key, asyncGetDate);
  const now = Date.now();
  await Promise.delay(100);
  const result = await cache.getByKey(key);
  expect(result).toBeGreaterThan(now);
});

test('function binded this not lost', async () => {
  const that = { separator: '|' };
  const array = [5, 6, 7];
  const key = 'cache-set-key-with-this';
  cache.setKey(key, funcUseThisAndParm.bind(that), ...array);
  const result = await cache.getByKey(key);
  expect(result).toBe(await funcUseThisAndParm.apply(that, array));
});

