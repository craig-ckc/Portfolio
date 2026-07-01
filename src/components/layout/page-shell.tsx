import type { ReactNode } from 'react'
import { Navbar } from '../sections/navbar';
import { FooterCta } from '../sections/footer-cta';

type PageShellProps = {
  children: ReactNode
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-surface font-sans text-content" data-theme="light" id="top" >
      <Navbar />
      <main>
        {children}
      </main>
      <FooterCta />
    </div>
  )
}
