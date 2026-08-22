import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'

type Keyword = 'brands' | 'websites' | 'apps'

const Arrow = ({ diagonal = false }: { diagonal?: boolean }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d={diagonal ? 'M7 17 17 7M8 7h9v9' : 'M5 12h14M14 7l5 5-5 5'} />
  </svg>
)

function KeywordArtifacts({ active }: { active: Keyword | null }) {
  return (
    <div className="keyword-artifacts" aria-hidden="true">
      <div className={`artifact-set artifact-brands ${active === 'brands' ? 'is-active' : ''}`}>
        <div className="brand-chip brand-chip-one"><span>DM</span></div>
        <div className="brand-chip brand-chip-two"><span className="brand-spark">✦</span> LUMA</div>
        <div className="brand-chip brand-chip-three"><span>P/</span></div>
      </div>

      <div className={`artifact-set artifact-websites ${active === 'websites' ? 'is-active' : ''}`}>
        <div className="floating-browser browser-one">
          <div className="mini-browser-bar"><i /><i /><i /></div>
          <div className="mini-browser-page">
            <span className="mini-kicker">A better way to begin</span>
            <span className="mini-title" />
            <span className="mini-title mini-title-short" />
            <span className="mini-button">Explore →</span>
          </div>
        </div>
        <div className="floating-browser browser-two">
          <div className="mini-browser-bar"><i /><i /><i /></div>
          <div className="mini-browser-grid"><span /><span /><span /></div>
        </div>
      </div>

      <div className={`artifact-set artifact-apps ${active === 'apps' ? 'is-active' : ''}`}>
        <div className="app-fragment app-fragment-one">
          <div className="app-avatar">CC</div>
          <div><b>New prototype</b><span>Ready to review</span></div>
          <i>↗</i>
        </div>
        <div className="app-fragment app-fragment-two">
          <span className="toggle-label">Publish changes</span><span className="toggle-ui"><i /></span>
        </div>
        <div className="app-fragment app-fragment-three">
          <span className="app-wave"><i /><i /><i /><i /><i /><i /></span>
          <small>01:24</small>
        </div>
      </div>
    </div>
  )
}

function ArchiveFolder({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className={`archive-wrap ${open ? 'is-open' : ''}`}>
      <button className="archive-button" type="button" aria-expanded={open} onClick={onToggle}>
        <span className="archive-cards" aria-hidden="true">
          <span className="archive-card archive-card-book"><i>READING</i><b>The Creative Act</b><small>Rick Rubin</small></span>
          <span className="archive-card archive-card-film"><i>WATCHING</i><b>Perfect Days</b><small>Wim Wenders</small></span>
          <span className="archive-card archive-card-music"><i>LISTENING</i><b>MRCY</b><small>VOLUME 2</small></span>
        </span>
        <span className="folder-back" aria-hidden="true"><i className="folder-tab" /></span>
        <span className="folder-front" aria-hidden="true">
          <span className="folder-label">CRAIG'S<br />ARCHIVE</span>
          <span className="folder-count">07</span>
        </span>
        <span className="sr-only">{open ? 'Close' : 'Open'} Craig&apos;s personal archive</span>
      </button>
      <div className="archive-meta">
        <span><i /> Recently added</span>
        <span>{open ? 'tap to close' : 'tap to open'}</span>
      </div>
    </div>
  )
}

function Hero() {
  const [activeKeyword, setActiveKeyword] = useState<Keyword | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const keyword = (word: Keyword) => (
    <button
      className={`hero-keyword keyword-${word} ${activeKeyword === word ? 'is-active' : ''}`}
      type="button"
      aria-pressed={activeKeyword === word}
      onPointerEnter={() => setActiveKeyword(word)}
      onPointerLeave={() => setActiveKeyword(null)}
      onFocus={() => setActiveKeyword(word)}
      onBlur={() => setActiveKeyword(null)}
      onClick={() => setActiveKeyword((current) => current === word ? null : word)}
    >
      {word}
      <span aria-hidden="true">↗</span>
    </button>
  )

  return (
    <section className="portfolio-hero" id="top" aria-labelledby="hero-heading">
      <nav className="hero-nav" aria-label="Primary navigation">
        <a className="site-signature" href="#top" aria-label="Craig — back to top">
          <span>C</span>
          <b>CRAIG<br />CHIHURURU</b>
        </a>
        <div className="hero-nav-links">
          <a href="#work">Work <sup>03</sup></a>
          <a href="mailto:hello@craigchihururu.com">Let&apos;s talk <Arrow diagonal /></a>
        </div>
      </nav>

      <KeywordArtifacts active={activeKeyword} />

      <div className="hero-copy">
        <p className="eyebrow"><span>01</span> Designer + developer, Johannesburg</p>
        <h1 id="hero-heading">
          I&apos;m Craig. I help {keyword('brands')} build {keyword('websites')} that convert and {keyword('apps')} people enjoy using.
        </h1>
        <p className="interaction-hint">Hover the underlined words <span>↗</span></p>
      </div>

      <div className="hero-bottom">
        <a className="hero-cta" href="#work">
          <span>See selected work</span>
          <i><Arrow /></i>
        </a>
        <ArchiveFolder open={archiveOpen} onToggle={() => setArchiveOpen((value) => !value)} />
      </div>
      <div className="hero-index" aria-hidden="true">C—26</div>
    </section>
  )
}

function DesigningMindsVisual() {
  return (
    <div className="project-canvas canvas-dm">
      <div className="dm-orbit orbit-one" />
      <div className="dm-orbit orbit-two" />
      <div className="dm-copy"><span>CURIOUS MINDS<br />BUILD BRAVE FUTURES</span><i>↘</i></div>
      <div className="device desktop-device">
        <div className="device-bar"><span /><span /><span /><b>designingminds.co.za</b></div>
        <div className="dm-site">
          <div className="dm-site-nav"><b>DM/</b><span>ABOUT&nbsp;&nbsp; WORK&nbsp;&nbsp; CONTACT</span></div>
          <div className="dm-site-title">Think.<br /><em>Make.</em><br />Move.</div>
          <div className="dm-site-art"><i /><i /><i /></div>
        </div>
      </div>
      <div className="device mobile-device">
        <div className="mobile-speaker" />
        <div className="dm-mobile-content"><b>DM/</b><span>Design for<br />what&apos;s next.</span><i>↗</i></div>
      </div>
      <span className="canvas-note">BRAND / DIGITAL / 2025</span>
    </div>
  )
}

function PreflightVisual() {
  return (
    <div className="project-canvas canvas-preflight">
      <div className="pf-grid" aria-hidden="true" />
      <div className="pf-window pf-main">
        <div className="pf-bar"><b>PREFLIGHT</b><span>● LIVE SESSION</span><i>•••</i></div>
        <div className="pf-body">
          <aside><b>P/</b><span>Overview</span><span>Reviews</span><span>Versions</span><span>Activity</span><i>CC</i></aside>
          <div className="pf-content">
            <div className="pf-heading"><span>Website launch</span><b>Ready for takeoff.</b></div>
            <div className="pf-progress"><i /><span>12 of 14 checks</span></div>
            <div className="pf-rows">
              <span><i>✓</i><b>Responsive layouts</b><small>Approved</small></span>
              <span><i>✓</i><b>Content review</b><small>Approved</small></span>
              <span><i>→</i><b>Final sign-off</b><small>In review</small></span>
            </div>
          </div>
        </div>
      </div>
      <div className="pf-comment"><span>MS</span><p><b>Looks sharp.</b><br />Ready from my side.</p><i>09:41</i></div>
      <div className="pf-status"><span>98</span><small>LAUNCH<br />SCORE</small><i>↗</i></div>
      <span className="canvas-note">PRODUCT DESIGN / DEVELOPMENT / 2026</span>
    </div>
  )
}

function LumacastVisual() {
  return (
    <div className="project-canvas canvas-luma">
      <div className="luma-glow" aria-hidden="true" />
      <div className="luma-player">
        <div className="luma-nav"><b>✦ LUMACAST</b><span>Discover&nbsp;&nbsp; Library&nbsp;&nbsp; Studio</span><i>CC</i></div>
        <div className="luma-feature">
          <span className="luma-label">NOW PLAYING · EP. 042</span>
          <h3>Designing<br />in public.</h3>
          <div className="luma-controls"><button aria-label="Play">▶</button><span><i /></span><small>24:18 / 48:02</small></div>
        </div>
      </div>
      <div className="luma-phone">
        <div className="mobile-speaker" />
        <div className="luma-cover"><span>THE<br />SIGNAL</span><i>042</i></div>
        <b>Designing in public</b><small>The Luma Sessions</small>
        <div className="luma-phone-controls"><i>↶</i><span>▶</span><i>↷</i></div>
      </div>
      <div className="luma-wave" aria-hidden="true">{Array.from({ length: 36 }, (_, index) => <i key={index} />)}</div>
      <span className="canvas-note">IDENTITY / PRODUCT / MOTION / 2025</span>
    </div>
  )
}

const work = [
  {
    number: '01',
    client: 'Designing Minds',
    mark: 'DM/',
    role: 'Brand platform · Digital experience',
    description: 'A vibrant identity and web experience that helps an education consultancy turn curiosity into meaningful action.',
    visual: <DesigningMindsVisual />,
  },
  {
    number: '02',
    client: 'Preflight',
    mark: 'P/',
    role: 'Product design · Front-end development',
    description: 'A focused review workflow that gives creative teams clarity, momentum and confidence before launch.',
    visual: <PreflightVisual />,
  },
  {
    number: '03',
    client: 'Lumacast',
    mark: '✦',
    role: 'Identity · Product · Motion',
    description: 'A cinematic listening experience built around the intimacy, rhythm and texture of independent audio.',
    visual: <LumacastVisual />,
  },
]

function Work() {
  const moveLight = (event: ReactPointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--cursor-x', `${event.clientX - box.left}px`)
    event.currentTarget.style.setProperty('--cursor-y', `${event.clientY - box.top}px`)
  }

  return (
    <section className="work-shell" id="work" aria-labelledby="work-heading">
      <div className="work-intro reveal-on-scroll">
        <p className="eyebrow dark"><span>02</span> Selected work</p>
        <div>
          <h2 id="work-heading">A few things I&apos;ve helped<br />bring into the world.</h2>
          <p>Strategy, design and code—connected from the start.</p>
        </div>
      </div>

      <div className="work-list">
        {work.map((project) => (
          <article className="work-project reveal-on-scroll" key={project.client}>
            <div className="project-meta">
              <div className="project-id"><span>{project.number}</span><b>{project.mark}</b></div>
              <div className="project-title">
                <h3>{project.client}</h3>
                <p>{project.role}</p>
              </div>
              <p className="project-description">{project.description}</p>
              <button className="project-link" type="button" aria-label={`${project.client} case study coming soon`}>
                <span>Case study soon</span><i><Arrow diagonal /></i>
              </button>
            </div>
            <div className="project-visual" onPointerMove={moveLight}>{project.visual}</div>
          </article>
        ))}
      </div>

      <div className="work-outro reveal-on-scroll">
        <span>More thoughtful work is<br />taking shape behind the scenes.</span>
        <a href="mailto:hello@craigchihururu.com?subject=Portfolio%20request">Request the full portfolio <Arrow diagonal /></a>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="portfolio-footer" aria-labelledby="footer-heading">
      <div className="footer-signal" aria-hidden="true">
        <span className="signal-ring ring-one" />
        <span className="signal-ring ring-two" />
        <span className="signal-core"><i /></span>
        <span className="signal-copy">OPEN TO<br />GOOD IDEAS</span>
      </div>
      <div className="footer-main">
        <p className="eyebrow footer-eyebrow"><span>03</span> Start a conversation</p>
        <h2 id="footer-heading">Have something in mind?<br /><a href="mailto:hello@craigchihururu.com">Let&apos;s make it real.<Arrow diagonal /></a></h2>
      </div>
      <div className="footer-bottom">
        <div className="footer-contact">
          <span>Johannesburg, South Africa</span>
          <a href="mailto:hello@craigchihururu.com">hello@craigchihururu.com</a>
        </div>
        <nav className="footer-links" aria-label="Social links">
          <a href="https://github.com/craig-ckc" target="_blank" rel="noreferrer">GitHub <sup>↗</sup></a>
          <a href="https://x.com" target="_blank" rel="noreferrer">X <sup>↗</sup></a>
          <a href="https://www.linkedin.com/in/craig-chihururu" target="_blank" rel="noreferrer">LinkedIn <sup>↗</sup></a>
        </nav>
        <div className="footer-build"><i /><span>V2.6 · BUILD 0731<br />UPDATED JUL 2026</span></div>
      </div>
      <div className="footer-wordmark" aria-hidden="true">CRAIG<span>®</span></div>
    </footer>
  )
}

export default function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible')
      }),
      { threshold: 0.12 },
    )

    document.querySelectorAll('.reveal-on-scroll').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="portfolio-page" data-theme="light">
      <main>
        <Hero />
        <Work />
      </main>
      <Footer />
    </div>
  )
}
