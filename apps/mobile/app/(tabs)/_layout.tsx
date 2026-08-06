import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SubscriptionGate } from '@/components/billing/SubscriptionGate'
import { NavIcon, type BottomNavTab } from '@/components/NavIcon'
import { colors, fontSize, space } from '@/theme/tokens'

const TABS: { name: BottomNavTab; title: string }[] = [
  { name: 'dashboard', title: 'Hem' },
  { name: 'chat', title: 'Chatt' },
  { name: 'skills', title: 'Färdigheter' },
  { name: 'learn', title: 'Guider' },
]

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(space.xl, insets.bottom)

  return (
    <SubscriptionGate requireTier="basic">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: fontSize.xs,
            fontWeight: '400',
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: space.sm,
            paddingBottom: bottomPad,
            height: 56 + bottomPad,
          },
        }}
      >
        {TABS.map(({ name, title }) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title,
              tabBarIcon: ({ color, focused }) => (
                <NavIcon tab={name} focused={focused} color={String(color)} />
              ),
            }}
          />
        ))}
      </Tabs>
    </SubscriptionGate>
  )
}
