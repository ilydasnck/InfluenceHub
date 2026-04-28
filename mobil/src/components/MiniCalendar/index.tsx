import { useMemo, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import { calendarStrings } from '../../assets/Constants/calendarStrings';
import { createMiniCalendarStyles } from './styles';

interface MiniCalendarProps {
  /** Seçili günün ISO tarihi (YYYY-MM-DD) */
  selectedDate: string | null;
  /** Hangi günlerde nokta gösterilsin (key: YYYY-MM-DD, value: gönderi sayısı) */
  markedCounts: Record<string, number>;
  onSelectDate: (isoDate: string) => void;
}

export default function MiniCalendar({
  selectedDate,
  markedCounts,
  onSelectDate,
}: MiniCalendarProps) {
  const isDark = useColorScheme() === 'dark';
  const styles = useMemo(() => createMiniCalendarStyles(isDark), [isDark]);

  const today = new Date();
  const initial = selectedDate ? parseIso(selectedDate) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  function shiftMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  const todayKey = formatIso(today);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.navBtn}
          onPress={() => shiftMonth(-1)}
          accessibilityLabel={calendarStrings.prevMonth}>
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {calendarStrings.monthNames[viewMonth]} {viewYear}
        </Text>
        <Pressable
          style={styles.navBtn}
          onPress={() => shiftMonth(1)}
          accessibilityLabel={calendarStrings.nextMonth}>
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {calendarStrings.weekDayShort.map(d => (
          <Text key={d} style={styles.weekDay}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, i) => {
          const key = formatIso(cell.date);
          const isOff = !cell.inMonth;
          const isSelected = selectedDate === key;
          const isToday = todayKey === key;
          const count = markedCounts[key] ?? 0;
          return (
            <Pressable
              key={i}
              style={styles.cell}
              onPress={() => onSelectDate(key)}>
              <View
                style={[
                  styles.cellInner,
                  isSelected ? styles.cellInnerSelected : null,
                  !isSelected && isToday ? styles.cellInnerToday : null,
                ]}>
                <Text
                  style={[
                    styles.cellText,
                    isOff ? styles.cellTextOff : null,
                    isSelected ? styles.cellTextSelected : null,
                  ]}>
                  {cell.date.getDate()}
                </Text>
              </View>
              {count > 0 ? (
                <View style={styles.dotRow}>
                  {Array.from({ length: Math.min(count, 3) }).map((_, di) => (
                    <View
                      key={di}
                      style={[
                        styles.dot,
                        isSelected ? styles.dotSelected : null,
                      ]}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.dotRow} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface CellInfo {
  date: Date;
  inMonth: boolean;
}

function buildMonthGrid(year: number, month: number): CellInfo[] {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startWeekday);
  const cells: CellInfo[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    cells.push({
      date: d,
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(n => Number(n));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatIso(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export { formatIso, parseIso };
