import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Calendar, LocaleConfig, type DateData } from 'react-native-calendars'
import { router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SessionDetailSheet } from '@/components/calendar/SessionDetailSheet'
import { useMonthlyLogs } from '@/hooks/use-monthly-logs'
import { colors, fontSize, space } from '@/theme/tokens'

LocaleConfig.locales.sv = {
  monthNames: [
    'Januari',
    'Februari',
    'Mars',
    'April',
    'Maj',
    'Juni',
    'Juli',
    'Augusti',
    'September',
    'Oktober',
    'November',
    'December',
  ],
  monthNamesShort: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Maj',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Dec',
  ],
  dayNames: ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'],
  dayNamesShort: ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'],
  today: 'Idag',
}
LocaleConfig.defaultLocale = 'sv'

function todayParts(now = new Date()) {
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function endOfCurrentMonthKey(now = new Date()) {
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const last = new Date(y, m, 0).getDate()
  return `${y}-${pad2(m)}-${pad2(last)}`
}

function todayKey(now = new Date()) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets()
  const now = useMemo(() => new Date(), [])
  const initial = todayParts(now)
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)
  const [selected, setSelected] = useState<string | null>(null)

  const { dog, logsByDay, markedDates, loading, error, reload, removeLog } = useMonthlyLogs(
    year,
    month,
  )

  useFocusEffect(
    useCallback(() => {
      void reload()
    }, [reload]),
  )

  const displayMarks = useMemo(() => {
    const marks = { ...markedDates }
    if (selected) {
      marks[selected] = {
        ...(marks[selected] ?? {}),
        selected: true,
        selectedColor: colors.primary,
        marked: marks[selected]?.marked,
        dotColor: marks[selected]?.dotColor ?? '#22c55e',
      }
    }
    return marks
  }, [markedDates, selected])

  const sheetSessions = selected ? (logsByDay[selected] ?? []) : []

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.lg }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Tillbaka"
        >
          <Text style={styles.backLabel}>← Tillbaka</Text>
        </Pressable>
        <Text style={styles.title}>Kalender</Text>
        <Text style={styles.meta}>
          {dog ? `${dog.name} · träningshistorik` : 'Träningshistorik'}
        </Text>
      </View>

      {loading && Object.keys(markedDates).length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Calendar
        current={todayKey(now)}
        maxDate={endOfCurrentMonthKey(now)}
        markedDates={displayMarks}
        onDayPress={(day: DateData) => setSelected(day.dateString)}
        onMonthChange={(day: DateData) => {
          setYear(day.year)
          setMonth(day.month)
        }}
        enableSwipeMonths
        theme={{
          backgroundColor: colors.bg,
          calendarBackground: colors.bg,
          textSectionTitleColor: colors.textMuted,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.border,
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          textMonthFontWeight: '600',
          textDayFontSize: fontSize.base,
          textMonthFontSize: fontSize.lg,
          textDayHeaderFontSize: fontSize.xs,
          dotColor: '#22c55e',
        }}
        style={styles.calendar}
      />

      <Text style={styles.hint}>Grön prick = loggat pass. Tryck på en dag för detaljer.</Text>

      <SessionDetailSheet
        visible={selected != null}
        dateKey={selected}
        sessions={sheetSessions}
        onClose={() => setSelected(null)}
        onDelete={async (id) => {
          await removeLog(id)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
  },
  header: { marginBottom: space.md },
  backBtn: { minHeight: 40, justifyContent: 'center', marginBottom: space.sm },
  backLabel: { color: colors.primary, fontWeight: '600', fontSize: fontSize.base },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.xs },
  calendar: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  hint: {
    marginTop: space.lg,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: { color: colors.error, marginBottom: space.md },
})
