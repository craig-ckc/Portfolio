import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type SectionTheme = 'light' | 'dark'

type SectionProps = {
  children: ReactNode
  className?: string
  theme?: SectionTheme
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'>

export function Section({ children, className = '', theme = 'light', ...props }: SectionProps) {
  return (
    <section className={cn(className)} data-theme={theme} {...props}>
      {children}
    </section>
  )
}
