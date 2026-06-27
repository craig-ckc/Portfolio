import { Button } from '@base-ui/react/button'
import type { ReactNode } from 'react'

type TagTone = 'primary' | 'dark' | 'light'

type TagProps = {
  children: ReactNode
  tone?: TagTone
  interactive?: boolean
  className?: string
}

const toneClasses: Record<TagTone, string> = {
  primary: 'bg-accent text-on-accent',
  dark: 'bg-tag-dark text-on-dark',
  light: 'bg-surface-raised text-muted',
}

const baseClasses = 'inline-flex min-h-5 items-center justify-center whitespace-nowrap rounded-tag border-0 px-3 py-1 text-caption leading-copy normal-case'

export function Tag({ children, tone = 'light', interactive = false, className = '' }: TagProps) {
  const classes = `${baseClasses} ${toneClasses[tone]} ${className}`

  if (interactive) {
    return (
      <Button className={classes} type="button">
        {children}
      </Button>
    )
  }

  return <span className={classes}>{children}</span>
}
