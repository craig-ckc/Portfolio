import { useEffect, useState } from 'react'
import { Container } from '../layout/container'
import { BrandMark } from '../ui/brand-mark'
import { Tag } from '../ui/tag'

type NavTheme = 'light' | 'dark'

export function Navbar() {
  const [theme, setTheme] = useState<NavTheme>('dark')

  useEffect(() => {
    let frameId = 0

    const updateTheme = () => {
      frameId = 0

      const hero = document.querySelector<HTMLElement>('[data-section="hero"]')
      const nav = document.querySelector<HTMLElement>('[data-nav="site"]')

      if (!hero || !nav) {
        setTheme('light')
        return
      }

      const navHeight = nav.getBoundingClientRect().height
      const heroBottom = hero.getBoundingClientRect().bottom

      setTheme(heroBottom > navHeight ? 'dark' : 'light')
    }

    const requestUpdate = () => {
      if (frameId === 0) {
        frameId = window.requestAnimationFrame(updateTheme)
      }
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId)
      }

      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-20" data-nav="site" data-theme={theme}>
      <Container className="flex items-center justify-between py-4">
        <BrandMark />
        <Tag href="mailto:hello@craigchihururu.com" tone="surface">
          Contact
        </Tag>
      </Container>
    </header>
  )
}
