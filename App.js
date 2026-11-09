import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import ExpenseCalendar from './src/components/ExpenseCalendar';
import { categories, dateKey, money, readExpenses, sortExpenses, summarize, validateExpense } from './src/analytics';

const STORAGE_KEY = '@hamyon/expenses/v1';
const blank = () => ({ amount: '', category: 'food', date: dateKey(), note: '' });
const C = { bg: '#F6F7FB', ink: '#172439', muted: '#8590A3', primary: '#5369E8', border: '#EDF0F5' };
function Button({ children, onPress, style = undefined, disabled = false, accessibilityLabel = undefined }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} disabled={disabled} onPress={onPress} style={({ pressed }) => [style, { opacity: disabled ? .45 : pressed ? .72 : 1 }]}>{children}</Pressable>;
}
function Application() {
  const [expenses, setExpenses] = useState([]), [ready, setReady] = useState(false), [storageError, setStorageError] = useState('');
  const [tab, setTab] = useState('dashboard'), [period, setPeriod] = useState('week'), [now, setNow] = useState(new Date());
  const [form, setForm] = useState(null), [editingId, setEditingId] = useState(null), [formError, setFormError] = useState(''), [saving, setSaving] = useState(false);
  const [historyCategory, setHistoryCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => dateKey());
  const [calendarMonth, setCalendarMonth] = useState(() => dateKey().slice(0, 7));
  const expenseDates = useMemo(() => new Set(expenses.map(item => item.date)), [expenses]);
  const lock = useRef(false);
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!live) return;
      setExpenses(raw ? readExpenses(raw) : []); setReady(true);
    }).catch(() => { if (live) setStorageError('Saqlangan ma’lumotlarni o‘qib bo‘lmadi. Ilovani qayta oching.'); });
    const timer = setInterval(() => setNow(new Date()), 60000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') setNow(new Date()); });
    return () => { live = false; clearInterval(timer); listener.remove(); };
  }, []);
  const stats = summarize(expenses, period, now);
  const history = useMemo(() => sortExpenses(expenses), [expenses]);
  const dailyExpenses = history.filter(e => (!selectedDate || e.date === selectedDate) && (historyCategory === 'all' || e.category === historyCategory));
  const dailyTotal = dailyExpenses.reduce((sum, item) => sum + item.amount, 0);
  async function persist(next) {
    if (lock.current || !ready) return false;
    lock.current = true; setSaving(true);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setExpenses(next); setStorageError(''); return true; }
    catch { setStorageError('Saqlab bo‘lmadi. Qayta urinib ko‘ring.'); return false; }
    finally { lock.current = false; setSaving(false); }
  }
  function openForm(expense = undefined) {
    setFormError(''); setEditingId(expense?.id || null);
    setForm(expense ? { ...expense, amount: String(expense.amount) } : blank());
  }
  async function save() {
    const error = validateExpense(form); if (error) { setFormError(error); return; }
    const item = { ...form, amount: Number(form.amount.replace(/\s/g, '').replace(',', '.')), note: form.note.trim(), id: editingId || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` };
    if (await persist(editingId ? expenses.map(e => e.id === editingId ? item : e) : [item, ...expenses])) setForm(null);
    else setFormError('Saqlab bo‘lmadi. Qayta urinib ko‘ring.');
  }
  function remove() {
    Alert.alert('Xarajatni o‘chirish', 'Bu xarajat tarix va analitikadan o‘chiriladi.', [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'O‘chirish', style: 'destructive', onPress: async () => { if (await persist(expenses.filter(e => e.id !== editingId))) setForm(null); } },
    ]);
  }
  function expenseRow(item) {
    const cat = categories.find(c => c.id === item.category);
    return <Button key={item.id} onPress={() => openForm(item)} style={s.expenseRow} accessibilityLabel={`${cat.name}, ${money(item.amount)} so‘m, tahrirlash`}>
      <View style={[s.categoryIcon, { backgroundColor: cat.color + '20' }]}><Text style={[s.categoryGlyph, { color: cat.color }]}>{cat.icon}</Text></View>
      <View style={{ flex: 1 }}><Text style={s.expenseTitle}>{item.note || cat.name}</Text><Text style={s.small}>{cat.name} · {item.date.split('-').reverse().join('.')}</Text></View>
      <Text style={s.expenseAmount}>−{money(item.amount)}<Text style={s.unit}> so‘m</Text></Text>
    </Button>;
  }
  if (!ready) return <SafeAreaView style={[s.safe, s.center]}><Text style={s.logo}>hamyon.</Text>{storageError ? <Text style={s.error}>{storageError}</Text> : <ActivityIndicator color={C.primary} />}</SafeAreaView>;
  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <View style={s.header}><View><Text style={s.eyebrow}>SHAXSIY MOLIYA</Text><Text style={s.logo}>hamyon<Text style={{ color: C.primary }}>.</Text></Text></View><View style={s.dateBadge}><Text style={s.small}>{now.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}</Text></View></View>
    {!!storageError && <Text accessibilityRole="alert" style={s.error}>{storageError}</Text>}
    {tab === 'dashboard' ? <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.sectionHeading}><Text style={s.pageTitle}>Xarajatlar tahlili</Text><View style={s.segment}>{[['day', 'Bugun'], ['week', '7 kun']].map(([key, label]) => <Button key={key} onPress={() => setPeriod(key)} style={[s.segmentItem, period === key && s.segmentActive]}><Text style={[s.segmentText, period === key && { color: C.primary }]}>{label}</Text></Button>)}</View></View>
      <View style={s.balanceCard}><Text style={s.balanceLabel}>{period === 'day' ? 'Bugungi xarajat' : 'Oxirgi 7 kundagi xarajat'}</Text><Text style={s.balance}>{money(stats.total)} <Text style={s.balanceUnit}>so‘m</Text></Text><View style={s.balanceFooter}><View style={s.changeBadge}><Text style={s.changeText}>{stats.previous ? `${stats.total >= stats.previous ? '↑' : '↓'} ${Math.abs((stats.total - stats.previous) / stats.previous * 100).toFixed(1)}%` : '—'}</Text></View><Text style={s.comparison}>{stats.previous ? (period === 'day' ? 'kechagi kunga nisbatan' : 'oldingi 7 kunga nisbatan') : 'Oldingi davrda xarajat yo‘q'}</Text></View></View>
      <View style={s.metrics}><View style={s.metric}><Text style={s.small}>Kunlik o‘rtacha</Text><Text style={s.metricValue}>{money(stats.average)} <Text style={s.unit}>so‘m</Text></Text></View><View style={s.metric}><Text style={s.small}>Xarajatlar soni</Text><Text style={s.metricValue}>{stats.selected.length} <Text style={s.unit}>ta</Text></Text></View></View>
      <View style={s.card}><View style={s.sectionHeading}><Text style={s.cardTitle}>Haftalik faollik</Text><Text style={s.small}>Oxirgi 7 kun</Text></View><View style={s.chart}>{stats.bars.map((bar, index) => <View key={bar.date} style={s.barColumn} accessibilityLabel={`${bar.date}: ${money(bar.value)} so‘m`}><Text numberOfLines={1} adjustsFontSizeToFit style={s.barValue}>{bar.value >= 1000000 ? `${(bar.value / 1000000).toFixed(1)}m` : bar.value >= 1000 ? `${Math.round(bar.value / 1000)}k` : bar.value || '—'}</Text><View style={s.barTrack}><View style={[s.bar, { height: bar.value ? `${Math.max(3, bar.value / Math.max(1, ...stats.bars.map(b => b.value)) * 100)}%` : 3, backgroundColor: index === 6 ? C.primary : '#D9DFFC' }]} /></View><Text style={[s.barDay, index === 6 && { color: C.primary, fontWeight: '700' }]}>{bar.day}</Text></View>)}</View></View>
      <View style={s.card}><Text style={s.cardTitle}>Kategoriyalar bo‘yicha</Text>{!stats.breakdown.length ? <Text style={s.empty}>Xarajat qo‘shing — tahlil shu yerda chiqadi.</Text> : stats.breakdown.map(cat => <View key={cat.id} style={s.categoryRow}><View style={s.sectionHeading}><Text style={s.categoryLabel}><Text style={{ color: cat.color }}>● </Text>{cat.name}</Text><Text style={s.categoryTotal}>{money(cat.value)} <Text style={s.unit}>so‘m</Text></Text></View><View style={s.progressTrack}><View style={{ width: `${cat.value / stats.total * 100}%`, height: 5, backgroundColor: cat.color, borderRadius: 5 }} /></View><Text style={s.percentage}>{(cat.value / stats.total * 100).toFixed(1)}%</Text></View>)}</View>
      <View style={s.sectionHeading}><Text style={s.cardTitle}>So‘nggi xarajatlar</Text><Button onPress={() => { setSelectedDate(null); setHistoryCategory('all'); setTab('history'); }}><Text style={s.link}>Barchasi →</Text></Button></View><View style={s.card}>{history.length ? history.slice(0, 5).map(expenseRow) : <Text style={s.empty}>Birinchi xarajatingizni + orqali kiriting.</Text>}</View>
      <Text style={s.privacy}>Ma’lumotlaringiz faqat shu qurilmada saqlanadi.</Text>
    </ScrollView> : <FlatList
      data={dailyExpenses}
      keyExtractor={item => item.id}
      renderItem={({ item }) => expenseRow(item)}
      contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 25 }}
      ListHeaderComponent={<View>
        <Text style={s.pageTitle}>Xarajatlar kalendari</Text>
        <ExpenseCalendar month={calendarMonth} onMonthChange={setCalendarMonth} selectedDate={selectedDate} onSelectDate={setSelectedDate} expenseDates={expenseDates} today={dateKey(now)} />
        <View style={s.sectionHeading}><Text style={s.cardTitle}>{selectedDate ? selectedDate.split('-').reverse().join('.') : 'Barcha sanalar'}</Text><Button onPress={() => setSelectedDate(null)}><Text style={s.link}>Barcha xarajatlar</Text></Button></View>
        <Text style={[s.small, { marginTop: 8 }]}>{dailyExpenses.length} ta xarajat · Jami {money(dailyTotal)} so‘m</Text>
        <Text style={[s.small, { marginTop: 8 }]}>Yangidan eskiga · Tahrirlash uchun xarajatni bosing</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{[{ id: 'all', name: 'Barchasi' }, ...categories].map(cat => <Button key={cat.id} style={[s.filter, historyCategory === cat.id && s.filterActive]} onPress={() => setHistoryCategory(cat.id)}><Text style={{ color: historyCategory === cat.id ? C.primary : C.muted, fontSize: 12 }}>{cat.name}</Text></Button>)}</ScrollView>
      </View>}
      ListEmptyComponent={<Text style={s.empty}>{selectedDate ? 'Bu sanada tanlangan kategoriya bo‘yicha xarajat yo‘q.' : 'Hozircha bu kategoriyada xarajatlar yo‘q.'}</Text>}
    />}
    <View style={s.navigation}><Button onPress={() => setTab('dashboard')} style={s.navItem}><Text style={[s.navSymbol, tab === 'dashboard' && s.activeText]}>▥</Text><Text style={[s.navText, tab === 'dashboard' && s.activeText]}>Dashboard</Text></Button><Button onPress={() => openForm()} style={s.addButton} accessibilityLabel="Yangi xarajat qo‘shish"><Text style={s.plus}>+</Text></Button><Button onPress={() => setTab('history')} style={s.navItem}><Text style={[s.navSymbol, tab === 'history' && s.activeText]}>≡</Text><Text style={[s.navText, tab === 'history' && s.activeText]}>Tarix</Text></Button></View>
    <Modal visible={!!form} animationType="slide" onRequestClose={() => { if (!saving) setForm(null); }}>
      <SafeAreaView style={s.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.formContent}>
        <View style={s.sectionHeading}><Text style={s.pageTitle}>{editingId ? 'Xarajatni tahrirlash' : 'Yangi xarajat'}</Text><Button disabled={saving} onPress={() => setForm(null)} accessibilityLabel="Yopish"><Text style={s.close}>×</Text></Button></View>
        <Text style={s.fieldLabel}>Summa · so‘m</Text><TextInput accessibilityLabel="Xarajat summasi" style={s.amountInput} value={form?.amount || ''} onChangeText={amount => setForm(f => ({ ...f, amount }))} keyboardType="number-pad" placeholder="0" placeholderTextColor="#B4BDCD" maxLength={18} />
        <Text style={s.fieldLabel}>Kategoriya</Text><View style={s.categoryGrid}>{categories.map(cat => <Button key={cat.id} style={[s.categoryOption, form?.category === cat.id && s.categorySelected]} onPress={() => setForm(f => ({ ...f, category: cat.id }))}><Text style={[s.categoryGlyph, { color: cat.color }]}>{cat.icon}</Text><Text style={s.categoryOptionText}>{cat.name}</Text></Button>)}</View>
        <Text style={s.fieldLabel}>Sana · YYYY-MM-DD</Text><TextInput accessibilityLabel="Xarajat sanasi" style={s.input} value={form?.date || ''} onChangeText={date => setForm(f => ({ ...f, date }))} placeholder="2026-10-26" maxLength={10} autoCapitalize="none" />
        <Text style={s.fieldLabel}>Izoh · ixtiyoriy</Text><TextInput accessibilityLabel="Xarajat izohi" style={s.input} value={form?.note || ''} onChangeText={note => setForm(f => ({ ...f, note }))} placeholder="Masalan, tushlik" maxLength={120} />
        {!!formError && <Text accessibilityRole="alert" style={s.error}>{formError}</Text>}
        <Button disabled={saving} style={s.saveButton} onPress={save}><Text style={s.saveText}>{saving ? 'Saqlanmoqda…' : 'Xarajatni saqlash'}</Text></Button>
        {!!editingId && <Button disabled={saving} style={s.deleteButton} onPress={remove}><Text style={{ color: '#DC526A', fontWeight: '600' }}>Xarajatni o‘chirish</Text></Button>}
      </ScrollView></KeyboardAvoidingView></SafeAreaView>
    </Modal>
  </SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><Application /></SafeAreaProvider>; }
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, center: { justifyContent: 'center', alignItems: 'center', gap: 20 },
  header: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, eyebrow: { fontSize: 9, letterSpacing: 2.3, color: C.muted, fontWeight: '600' }, logo: { fontSize: 29, fontWeight: '800', color: C.ink, letterSpacing: -1.3 }, dateBadge: { backgroundColor: '#FFF', padding: 11, borderRadius: 13 },
  content: { paddingHorizontal: 22, paddingBottom: 24, gap: 18 }, sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, pageTitle: { fontSize: 21, fontWeight: '700', color: C.ink, letterSpacing: -.7 }, segment: { flexDirection: 'row', padding: 3, backgroundColor: '#EDEFF7', borderRadius: 12 }, segmentItem: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 9 }, segmentActive: { backgroundColor: '#FFF' }, segmentText: { fontSize: 11, fontWeight: '600', color: C.muted },
  balanceCard: { backgroundColor: C.primary, borderRadius: 25, padding: 24, shadowColor: C.primary, shadowOpacity: .2, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 4 }, balanceLabel: { color: '#DDE3FF', fontSize: 13 }, balance: { color: '#FFF', fontSize: 37, fontWeight: '700', marginTop: 12, letterSpacing: -1 }, balanceUnit: { fontSize: 17, fontWeight: '400', color: '#DCE2FF' }, balanceFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8, flexWrap: 'wrap' }, changeBadge: { backgroundColor: '#FFFFFF24', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 }, changeText: { color: '#FFF', fontSize: 11, fontWeight: '600' }, comparison: { color: '#DDE3FF', fontSize: 10 },
  metrics: { flexDirection: 'row', gap: 12 }, metric: { flex: 1, padding: 16, backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: C.border }, small: { fontSize: 11, color: C.muted }, metricValue: { marginTop: 9, fontWeight: '700', color: C.ink, fontSize: 19 }, unit: { fontSize: 10, color: C.muted, fontWeight: '400' }, card: { backgroundColor: '#FFF', padding: 18, borderRadius: 20, borderColor: C.border, borderWidth: 1 }, cardTitle: { fontSize: 15, fontWeight: '700', color: C.ink, letterSpacing: -.3 },
  chart: { height: 170, flexDirection: 'row', gap: 10, marginTop: 22 }, barColumn: { flex: 1, alignItems: 'center' }, barTrack: { height: 115, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }, bar: { width: '72%', maxWidth: 30, borderRadius: 6 }, barValue: { fontSize: 9, color: C.muted, marginBottom: 8 }, barDay: { marginTop: 9, fontSize: 10, color: C.muted },
  categoryRow: { marginTop: 18 }, categoryLabel: { color: C.ink, fontSize: 12 }, categoryTotal: { color: C.ink, fontSize: 12, fontWeight: '600' }, progressTrack: { backgroundColor: '#F1F3F8', height: 5, borderRadius: 5, marginTop: 9 }, percentage: { marginTop: 4, color: C.muted, fontSize: 9, textAlign: 'right' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F3F4F8' }, categoryIcon: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center' }, categoryGlyph: { fontSize: 22, fontWeight: '600' }, expenseTitle: { fontSize: 13, fontWeight: '600', color: C.ink, marginBottom: 5 }, expenseAmount: { fontSize: 13, fontWeight: '700', color: C.ink }, link: { fontSize: 11, color: C.primary, fontWeight: '600' }, empty: { textAlign: 'center', color: C.muted, fontSize: 12, paddingVertical: 25, lineHeight: 20 }, privacy: { fontSize: 10, textAlign: 'center', color: C.muted },
  navigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: '#FFF' }, navItem: { alignItems: 'center', width: 95, gap: 3 }, navSymbol: { fontSize: 24, color: C.muted }, navText: { color: C.muted, fontSize: 10 }, activeText: { color: C.primary }, addButton: { height: 52, width: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary }, plus: { fontSize: 32, color: '#FFF', fontWeight: '300' }, filters: { gap: 8, paddingVertical: 18 }, filter: { paddingVertical: 10, paddingHorizontal: 13, borderRadius: 12, backgroundColor: '#FFF' }, filterActive: { backgroundColor: '#E8ECFF' },
  formContent: { padding: 24, paddingBottom: 45 }, close: { fontSize: 32, color: C.muted }, fieldLabel: { marginTop: 25, marginBottom: 12, fontSize: 12, color: C.muted, fontWeight: '500' }, amountInput: { fontSize: 42, color: C.ink, fontWeight: '700', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#DCE1F5' }, input: { padding: 16, borderRadius: 13, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E3E7F0', color: C.ink }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, categoryOption: { width: '30%', flexGrow: 1, padding: 15, borderRadius: 15, backgroundColor: '#FFF', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E9ECF3' }, categorySelected: { borderColor: C.primary, backgroundColor: '#EEF0FF' }, categoryOptionText: { fontSize: 10, color: C.ink }, saveButton: { padding: 18, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', marginTop: 30 }, saveText: { color: '#FFF', fontSize: 14, fontWeight: '700' }, deleteButton: { alignItems: 'center', padding: 18, marginTop: 8 }, error: { color: '#C73C56', padding: 14, fontSize: 12, lineHeight: 19 },
});
