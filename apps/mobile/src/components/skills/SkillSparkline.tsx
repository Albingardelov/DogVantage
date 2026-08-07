import { StyleSheet, View } from 'react-native'
import type { WeekBucket } from '@dogvantage/core'
import { colors, space } from '@/theme/tokens'

type Props = {
  weeks: WeekBucket[]
}

export function SkillSparkline({ weeks }: Props) {
  const max = Math.max(1, ...weeks.map((w) => w.attempts))
  return (
    <View style={styles.row}>
      {weeks.map((w) => {
        const h = w.attempts === 0 ? 2 : Math.max(4, Math.round(((w.success_rate ?? 0) * 20) + 4))
        const opacity = w.attempts === 0 ? 0.25 : 0.4 + (w.attempts / max) * 0.6
        return (
          <View
            key={w.week_start}
            style={[
              styles.bar,
              {
                height: h,
                opacity,
                backgroundColor: (w.success_rate ?? 0) >= 0.7 ? colors.primary : colors.accent,
              },
            ]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 24,
    marginTop: space.xs,
  },
  bar: {
    width: 6,
    borderRadius: 2,
  },
})
