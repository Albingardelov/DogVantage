'use client'

import type { Icon } from '@phosphor-icons/react'
import {
  Binoculars,
  Compass,
  Drop,
  Eye,
  Hand,
  Hourglass,
  LinkSimple,
  MegaphoneSimple,
  MoonStars,
  Octagon,
  PawPrint,
  Person,
  Tag,
  TennisBall,
  UsersThree,
} from '@phosphor-icons/react'
import { DvIcon, type IconSize } from './DvIcon'

const EXERCISE_ICON_MAP: Record<string, Icon> = {
  inkallning: MegaphoneSimple,
  namn: Tag,
  namntraning: Tag,
  sitt: PawPrint,
  ligg: MoonStars,
  stanna: Hand,
  koppel: LinkSimple,
  hantering: Hand,
  apportering: TennisBall,
  vatten: Drop,
  socialisering: UsersThree,
  stoppsignal: Octagon,
  fokus: Eye,
  stadga: Person,
  orientering: Compass,
  kontrollerat_sok: Binoculars,
  impulskontroll: Hourglass,
  marker: Tag,
  nosework: Binoculars,
  vallning: Compass,
  fot: PawPrint,
  plats: MoonStars,
}

export function ExerciseIcon({
  exerciseId,
  size = 'md',
  className,
  weight = 'duotone',
}: {
  exerciseId: string
  size?: IconSize | number
  className?: string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
}) {
  const IconComponent = EXERCISE_ICON_MAP[exerciseId] ?? PawPrint
  return <DvIcon icon={IconComponent} size={size} weight={weight} className={className} />
}
