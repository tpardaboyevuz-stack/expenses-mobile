import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { monthDays, shiftMonth } from '../analytics';

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
export default function ExpenseCalendar({ month, onMonthChange, selectedDate, onSelectDate, expenseDates, today }) {
  const [year, number] = month.split('-').map(Number);
  return <View style={s.card}>
    <View style={s.heading}>
      <Pressable accessibilityRole="button" accessibilityLabel="Oldingi oy" onPress={() => onMonthChange(shiftMonth(month, -1))} style={s.arrow}><Text style={s.arrowText}>‹</Text></Pressable>
      <Text accessibilityRole="header" style={s.title}>{MONTHS[number - 1]} {year}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Keyingi oy" onPress={() => onMonthChange(shiftMonth(month, 1))} style={s.arrow}><Text style={s.arrowText}>›</Text></Pressable>
    </View>
    <View style={s.grid}>{WEEKDAYS.map(day => <View key={day} style={s.weekday}><Text style={s.muted}>{day}</Text></View>)}</View>
    <View style={s.grid}>{monthDays(month).map((date, index) => {
      if (!date) return <View key={`blank-${index}`} style={s.cell} />;
      const selected = date === selectedDate;
      const marked = expenseDates.has(date);
      return <Pressable key={date} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${date.split('-').reverse().join('.')}${date === today ? ', bugun' : ''}, ${marked ? 'xarajat bor' : 'xarajat yo‘q'}`} onPress={() => onSelectDate(date)} style={s.cell}>
        <View style={[s.day, date === today && s.today, selected && s.selected]}>
          <Text style={[s.dayText, selected && s.selectedText]}>{Number(date.slice(-2))}</Text>
          <View style={[s.dot, marked && { backgroundColor: selected ? '#FFF' : '#5369E8' }]} />
        </View>
      </Pressable>;
    })}</View>
    <View style={s.footer}><Text style={s.muted}><Text style={{ color: '#5369E8' }}>● </Text>Xarajat qilingan kun</Text><Pressable accessibilityRole="button" onPress={() => { onMonthChange(today.slice(0, 7)); onSelectDate(today); }} style={s.todayButton}><Text style={s.link}>Bugun</Text></Pressable></View>
  </View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 10, marginVertical: 18, borderWidth: 1, borderColor: '#EDF0F5' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#172439', fontSize: 16, fontWeight: '700' },
  arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: '#5369E8', fontSize: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.285714%', alignItems: 'center', paddingVertical: 10 },
  muted: { color: '#8590A3', fontSize: 11 },
  cell: { width: '14.285714%', minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  day: { width: '100%', maxWidth: 44, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent', paddingVertical: 5 },
  today: { borderColor: '#5369E8' }, selected: { backgroundColor: '#5369E8' },
  dayText: { color: '#172439', fontSize: 13, fontWeight: '600' }, selectedText: { color: '#FFF' },
  dot: { height: 5, width: 5, borderRadius: 3, marginTop: 3, backgroundColor: 'transparent' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8, marginTop: 8 },
  todayButton: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' }, link: { color: '#5369E8', fontSize: 12, fontWeight: '600' },
});
