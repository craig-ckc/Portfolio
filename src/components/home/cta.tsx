import { contact, cta, siteNav, socials } from '../../content/home-page'
import { CtaMark, LinkedInLogo, WavingHand, XLogo } from './icons'

const socialIcons = {
  x: XLogo,
  linkedin: LinkedInLogo,
} as const

function Siteline() {
  return (
    <div className="hp-siteline">
      <nav className="hp-siteline__nav" aria-label="Sections">
        {siteNav.map((item) => (
          <a href={item.href} key={item.label}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="hp-siteline__actions">
        {/* Collapsed to just the hand; the label wipes open on hover/focus. */}
        <a className="hp-hello" href={contact.href}>
          <span className="hp-hello__hand">
            <WavingHand />
          </span>
          <span className="hp-hello__label">{contact.label}</span>
        </a>

        <div className="hp-social">
          {socials.map((social) => {
            const Icon = socialIcons[social.icon]
            return (
              <a href={social.href} key={social.label} target="_blank" rel="noreferrer" aria-label={social.label}>
                <Icon />
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function Cta() {
  return (
    <section className="hp-cta hp-container" id="contact" aria-labelledby="hp-cta-title">
      <span className="hp-cta__mark" aria-hidden="true">
        <CtaMark />
      </span>

      <h2 className="hp-cta__title" id="hp-cta-title">
        {cta.title}
      </h2>

      <p className="hp-cta__invitation">
        <span>{cta.invitationLead}</span>
        <a className="hp-cta__link" href={cta.invitationLink.href}>
          <span className="hp-cta__label">{cta.invitationLink.label}</span>
        </a>
      </p>

      <Siteline />
    </section>
  )
}
