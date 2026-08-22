import { useEffect, useState } from 'react'
import '../styles/home-page.css'
import { Cta } from '../components/sections/cta'
import { Footer } from '../components/layout/footer'
import { Hero } from '../components/home/hero'
import { NavBar } from '../components/layout/nav-bar'
import { Statement } from '../components/home/statement'
import { Work } from '../components/home/work'
import { startSmoothScroll } from '../lib/smooth-scroll'

/**
 * The homepage as drawn in the Paper page frame: navbar, hero, work, CTA,
 * footer. Built alongside the current homepage rather than over it — to promote
 * it, swap the `FigmaHomePage` import in src/app.tsx for this module.
 */
export default function HomeNextPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Scoped to this page, so the other routes keep native scrolling.
  useEffect(startSmoothScroll, [])

  return (
    <div className="hp" data-theme={theme}>
      <NavBar
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      />
      {/* Opaque and above the footer — the footer is fixed and revealed as this
          scrolls past it. */}
      <main className="hp-content">
        <Hero />
        <Statement />
        <Work />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
