import { Button } from '@base-ui/react/button'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type TagTone = 'primary' | 'dark' | 'light' | 'surface'

type TagBaseProps = {
  children: ReactNode
  className?: string
  tone?: TagTone
}

type TagLinkProps = TagBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className'> & {
    as?: 'a'
    href: string
  }

type TagButtonProps = TagBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    as: 'button'
  }

type TagProps = TagLinkProps | TagButtonProps

const toneClasses: Record<TagTone, string> = {
  primary: 'bg-accent text-on-accent',
  dark: 'bg-tag-dark text-on-dark',
  light: 'bg-surface-raised text-muted',
  surface: 'bg-surface text-content',
}

const baseClasses = 'inline-flex min-h-5 items-center justify-center whitespace-nowrap rounded-tag border-0 px-3 py-1 text-caption leading-copy no-underline normal-case'

export function Tag({ as = 'a', children, className = '', tone = 'light', ...props }: TagProps) {
  const classes = `${baseClasses} ${toneClasses[tone]} ${className}`

  if (as === 'button') {
    return (
      <Button className={classes} type="button" {...(props as Omit<TagButtonProps, 'as' | 'children' | 'className' | 'tone'>)}>
        {children}
      </Button>
    )
  }

  return (
    <a className={classes} {...(props as Omit<TagLinkProps, 'as' | 'children' | 'className' | 'tone'>)}>
      {children}
    </a>
  )
}
