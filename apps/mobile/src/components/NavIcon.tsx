import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/tokens'

export type BottomNavTab = 'dashboard' | 'chat' | 'skills' | 'learn'

const OUTLINE: Record<BottomNavTab, keyof typeof Ionicons.glyphMap> = {
  dashboard: 'home-outline',
  chat: 'chatbubble-outline',
  skills: 'medal-outline',
  learn: 'book-outline',
}

const FILLED: Record<BottomNavTab, keyof typeof Ionicons.glyphMap> = {
  dashboard: 'home',
  chat: 'chatbubble',
  skills: 'medal',
  learn: 'book',
}

export function NavIcon({
  tab,
  focused,
  color,
  size = 24,
}: {
  tab: BottomNavTab
  focused: boolean
  color?: string
  size?: number
}) {
  return (
    <Ionicons
      name={focused ? FILLED[tab] : OUTLINE[tab]}
      size={size}
      color={color ?? (focused ? colors.primary : colors.textMuted)}
    />
  )
}
