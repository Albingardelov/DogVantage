'use client'

import type { Icon, IconProps } from '@phosphor-icons/react'

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero'

const SIZE_MAP: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  hero: 48,
}

type DvIconProps = {
  icon: Icon
  size?: IconSize | number
  weight?: IconProps['weight']
  className?: string
} & Omit<IconProps, 'size' | 'weight' | 'className'>

export function DvIcon({
  icon: IconComponent,
  size = 'md',
  weight = 'regular',
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: DvIconProps) {
  const px = typeof size === 'number' ? size : SIZE_MAP[size]
  return (
    <IconComponent
      size={px}
      weight={weight}
      className={className}
      aria-hidden={ariaHidden}
      {...rest}
    />
  )
}
