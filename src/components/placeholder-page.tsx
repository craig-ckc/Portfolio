import { useState } from 'react'
import '../styles/home-page.css'
import { Cta } from './home/cta'
import { Footer } from './home/footer'
import { NavBar } from './home/nav-bar'

/**
 * Shell for the sections that exist in the nav but have no content yet.
 *
 * Same chrome as the homepage on purpose: navbar (so the appearance switch is
 * on every page), then the CTA, then the footer. The CTA carries the site nav,
 * "Say hello" and the socials, so without it these pages had no way to reach
 * each other.
 *
 * Lenis is deliberately not started here: there are no scroll-linked effects on
 * these pages, and the footer's reveal reads from the shared frame loop, which
 * runs with or without it.
 */
export function PlaceholderPage({ title, blurb }: { title: string; blurb: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <div className="hp" data-theme={theme}>
      <NavBar
        homeHref="/"
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      />

      <main className="hp-content">
        <section className="hp-placeholder hp-container">
          <h1 className="hp-placeholder__title">{title}</h1>
          <p className="hp-placeholder__blurb">{blurb}</p>
          <a className="hp-placeholder__back" href="/">
            Back to the homepage
          </a>
        </section>

        <Cta />
      </main>

      <Footer />
    </div>
  )
}
