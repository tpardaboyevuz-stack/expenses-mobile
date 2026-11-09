export const categories = [
  { id: 'food', name: 'Oziq-ovqat', icon: '◉', color: '#F2A65A' },
  { id: 'transport', name: 'Transport', icon: '↗', color: '#6C8CFF' },
  { id: 'shopping', name: 'Xaridlar', icon: '◇', color: '#B48BF3' },
  { id: 'home', name: 'Uy-ro‘zg‘or', icon: '⌂', color: '#53B8A0' },
  { id: 'health', name: 'Salomatlik', icon: '+', color: '#F18296' },
  { id: 'other', name: 'Boshqa', icon: '•••', color: '#91A1B7' },
];
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime()) && dateKey(d) === value;
}
export function validateExpense({ amount, date, category, note }) {
  const value = Number(String(amount).replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0 || value > 1e12 || !Number.isInteger(value)) return 'Summani butun so‘mda to‘g‘ri kiriting.';
  if (!validDate(date)) return 'Sanani YYYY-MM-DD ko‘rinishida kiriting.';
  if (date > dateKey()) return 'Kelajak sanasiga xarajat kiritib bo‘lmaydi.';
  if (!categories.some(c => c.id === category)) return 'Kategoriyani tanlang.';
  if ((note || '').length > 120) return 'Izoh 120 belgidan oshmasin.';
  return '';
}
export function summarize(expenses, period = 'week', now = new Date()) {
  const days = period === 'day' ? 1 : 7;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const start = new Date(end); start.setDate(start.getDate() - days + 1);
  const previousStart = new Date(start); previousStart.setDate(previousStart.getDate() - days);
  const startKey = dateKey(start), endKey = dateKey(end), previousKey = dateKey(previousStart);
  const selected = expenses.filter(e => e.date >= startKey && e.date <= endKey);
  const total = selected.reduce((sum, e) => sum + e.amount, 0);
  const previous = expenses.filter(e => e.date >= previousKey && e.date < startKey).reduce((sum, e) => sum + e.amount, 0);
  const bars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end); d.setDate(d.getDate() - 6 + i);
    const key = dateKey(d);
    return { date: key, day: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'][d.getDay()], value: expenses.filter(e => e.date === key).reduce((sum, e) => sum + e.amount, 0) };
  });
  return { selected, total, previous, average: Math.round(total / days), bars,
    breakdown: categories.map(c => ({ ...c, value: selected.filter(e => e.category === c.id).reduce((sum, e) => sum + e.amount, 0) })).filter(c => c.value > 0).sort((a, b) => b.value - a.value) };
}
export function money(value) { return Math.round(value).toLocaleString('ru-RU'); }
export function readExpenses(raw) {
  const data = JSON.parse(raw);
  if (!Array.isArray(data) || data.some(e => !e || typeof e.id !== 'string' || !Number.isInteger(e.amount) || e.amount <= 0 || e.amount > 1e12 || !validDate(e.date) || !categories.some(c => c.id === e.category) || typeof e.note !== 'string')) throw new Error('Invalid expense storage');
  return data;
}

// Use local noon so calendar dates do not shift with UTC or daylight saving.
export function monthDays(month) {
  const [year, number] = month.split('-').map(Number);
  const first = new Date(year, number - 1, 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(year, number, 0, 12).getDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= count ? dateKey(new Date(year, number - 1, day, 12)) : null;
  });
}
export function shiftMonth(month, offset) {
  const [year, number] = month.split('-').map(Number);
  return dateKey(new Date(year, number - 1 + offset, 1, 12)).slice(0, 7);
}
export function sortExpenses(expenses) {
  return [...expenses].sort((a, b) => b.date.localeCompare(a.date)
    || (Number(b.id.split('-')[0]) || 0) - (Number(a.id.split('-')[0]) || 0)
    || b.id.localeCompare(a.id));
}
