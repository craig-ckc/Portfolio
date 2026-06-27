import type { HTMLAttributes, ReactNode } from 'react'

type ThemeName = 'light' | 'dark'

type ThemeScopeProps = {
  as?: 'div' | 'section' | 'header' | 'footer' | 'main'
  children: ReactNode
  className?: string
  theme?: ThemeName
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'>

export function ThemeScope({
  as: Component = 'div',
  children,
  className = '',
  theme = 'light',
  ...props
}: ThemeScopeProps) {
  return (
    <Component className={className} data-theme={theme} {...props}>
      {children}
    </Component>
  )
}
