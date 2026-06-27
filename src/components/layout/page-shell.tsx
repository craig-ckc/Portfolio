import type { ReactNode } from 'react'

type PageShellProps = {
  children: ReactNode
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-surface font-sans text-content"
      data-theme="light"
      id="top"
    >
      {children}
    </div>
  )
}
