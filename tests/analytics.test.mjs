import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../src/analytics.js', import.meta.url), 'utf8');
const { dateKey, validDate, summarize, validateExpense, readExpenses } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const now = new Date(2026, 9, 26, 12);
const expense = (date, amount, category = 'food') => ({ id: date + amount, date, amount, category, note: '' });
test('local dates, leap days and invalid dates', () => {
  assert.equal(dateKey(now), '2026-10-26');
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2026-13-01'), false);
});
test('rolling week includes today and six prior days, compares preceding week', () => {
  const data = [expense('2026-10-26', 50), expense('2026-10-20', 30), expense('2026-10-19', 20), expense('2026-10-13', 10), expense('2026-10-27', 500)];
  const result = summarize(data, 'week', now);
  assert.equal(result.total, 80);
  assert.equal(result.previous, 30);
  assert.equal(result.bars.reduce((s,b) => s+b.value,0), 80);
  assert.equal(result.average, 11);
});
test('daily categories and previous-day comparison', () => {
  const result = summarize([expense('2026-10-26', 200), expense('2026-10-26', 100, 'transport'), expense('2026-10-25', 50)], 'day', now);
  assert.equal(result.total, 300);
  assert.equal(result.previous, 50);
  assert.equal(result.breakdown[0].id, 'food');
  assert.equal(result.breakdown.reduce((s,c)=>s+c.value,0),result.total);
});
test('empty data has finite totals', () => {
  const result = summarize([], 'week', now);
  assert.equal(result.total, 0); assert.equal(result.average, 0); assert.equal(result.bars.length, 7);
});
test('invalid amounts and corrupted storage are rejected', () => {
  assert.ok(validateExpense({amount:'-2', date:'2026-10-20', category:'food', note:''}));
  assert.ok(validateExpense({amount:'Infinity', date:'2026-10-20', category:'food', note:''}));
  assert.ok(validateExpense({amount:'2.5', date:'2026-10-20', category:'food', note:''}));
  assert.equal(validateExpense({amount:'15 000', date:'2026-10-20', category:'food', note:''}), '');
  assert.throws(()=>readExpenses('{bad'));
  assert.throws(()=>readExpenses('[{"id":"x"}]'));
  assert.deepEqual(readExpenses(JSON.stringify([expense('2026-10-20',20)])),[expense('2026-10-20',20)]);
});

test('calendar aligns Monday first and includes leap days', async () => {
  const { monthDays, shiftMonth } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const february = monthDays('2024-02');
  assert.deepEqual(february.slice(0, 4), [null, null, null, '2024-02-01']);
  assert.equal(february.filter(Boolean).length, 29);
  assert.equal(february.length % 7, 0);
  assert.equal(monthDays('2026-02').filter(Boolean).length, 28);
  assert.equal(monthDays('2026-03').length, 42);
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
});
test('expenses sort by date then numeric creation time without mutating storage', async () => {
  const { sortExpenses } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const items = [
    { ...expense('2026-10-28', 10), id: '9-a' },
    { ...expense('2026-10-27', 20), id: '200-a' },
    { ...expense('2026-10-28', 30), id: '100-a' },
  ];
  assert.deepEqual(sortExpenses(items).map(e => e.id), ['100-a', '9-a', '200-a']);
  assert.equal(items[0].id, '9-a');
});
