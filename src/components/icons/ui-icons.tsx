'use client'

import type { Icon } from '@phosphor-icons/react'
import {
  ArrowsClockwise,
  BookOpen,
  CalendarBlank,
  Camera,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChatCircle,
  Check,
  CheckCircle,
  Circle,
  Dog,
  Flask,
  House,
  ListBullets,
  MoonStars,
  Notebook,
  PaperPlaneTilt,
  PawPrint,
  PencilSimple,
  Plus,
  Smiley,
  SmileyMeh,
  SmileySad,
  Target,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import { DvIcon, type IconSize } from './DvIcon'
import type { QuickRating } from '@/types'

export function IconCheck({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={Check} size={size} weight="bold" className={className} />
}

export function IconCheckCircle({ size = 'xl', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={CheckCircle} size={size} weight="fill" className={className} />
}

export function IconClose({ size = 'md', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={X} size={size} weight="bold" className={className} />
}

export function IconCaretRight({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={CaretRight} size={size} weight="bold" className={className} />
}

export function IconCaretLeft({ size = 'md', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={CaretLeft} size={size} weight="bold" className={className} />
}

export function IconCaretDown({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={CaretDown} size={size} weight="bold" className={className} />
}

export function IconPlus({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={Plus} size={size} weight="bold" className={className} />
}

export function IconChevronRight({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <IconCaretRight size={size} className={className} />
}

export function IconWarning({ size = 'md', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={Warning} size={size} weight="fill" className={className} />
}

export function IconWarningCircle({ size = 'md', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={WarningCircle} size={size} weight="fill" className={className} />
}

export function IconRestDay({ size = 'xl', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={MoonStars} size={size} weight="duotone" className={className} />
}

export function IconSwap({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={ArrowsClockwise} size={size} weight="bold" className={className} />
}

export function IconDog({
  size = 'hero',
  className,
  color,
}: {
  size?: IconSize
  className?: string
  color?: string
}) {
  return <DvIcon icon={Dog} size={size} weight="duotone" className={className} color={color} />
}

export function IconPaw({ size = 'lg', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={PawPrint} size={size} weight="duotone" className={className} />
}

export function IconCalendar({ size = 'md', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={CalendarBlank} size={size} weight="duotone" className={className} />
}

export function IconBook({ size = 'md', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={BookOpen} size={size} weight="duotone" className={className} />
}

export function IconNotebook({ size = 'md', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={Notebook} size={size} weight="duotone" className={className} />
}

export function IconPencil({ size = 'md', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={PencilSimple} size={size} weight="duotone" className={className} />
}

export function IconFlask({ size = 'md', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={Flask} size={size} weight="duotone" className={className} />
}

export function IconTarget({ size = 'md', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={Target} size={size} weight="duotone" className={className} />
}

export function IconSend({ size = 'md', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={PaperPlaneTilt} size={size} weight="fill" className={className} />
}

export function IconCamera({ size = 'md', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={Camera} size={size} weight="duotone" className={className} />
}

export function IconCircleFilled({
  size = 'sm',
  className,
  color,
}: {
  size?: IconSize
  className?: string
  color?: string
}) {
  return <DvIcon icon={Circle} size={size} weight="fill" className={className} color={color} />
}

export function IconCircleOutline({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={Circle} size={size} weight="regular" className={className} />
}

const RATING_ICONS = {
  good: Smiley,
  mixed: SmileyMeh,
  bad: SmileySad,
} as const satisfies Record<QuickRating, Icon>

export function RatingIcon({
  rating,
  size = 'lg',
  className,
}: {
  rating: QuickRating
  size?: IconSize
  className?: string
}) {
  return <DvIcon icon={RATING_ICONS[rating]} size={size} weight="duotone" className={className} />
}

export type BottomNavTab = 'dashboard' | 'chat' | 'log' | 'learn'

const NAV_ICONS: Record<BottomNavTab, Icon> = {
  dashboard: House,
  chat: ChatCircle,
  learn: BookOpen,
  log: ListBullets,
}

export function NavIcon({
  tab,
  size = 'lg',
  className,
}: {
  tab: BottomNavTab
  size?: IconSize
  className?: string
}) {
  return <DvIcon icon={NAV_ICONS[tab]} size={size} weight="regular" className={className} />
}

export type LandingFeatureId = 'schedule' | 'breed-docs' | 'progress'

const FEATURE_ICONS: Record<LandingFeatureId, Icon> = {
  schedule: CalendarBlank,
  'breed-docs': BookOpen,
  progress: PencilSimple,
}

export function LandingFeatureIcon({
  id,
  size = 'lg',
  className,
}: {
  id: LandingFeatureId
  size?: IconSize
  className?: string
}) {
  return <DvIcon icon={FEATURE_ICONS[id]} size={size} weight="duotone" className={className} />
}
