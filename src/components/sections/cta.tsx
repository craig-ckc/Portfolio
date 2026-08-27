import { bookingTrigger, contact, cta, siteNav, socials } from '../../content/home-page'
import { CtaMark, LinkedInLogo, WavingHand, XLogo } from '../icons'

const socialIcons = {
  x: XLogo,
  linkedin: LinkedInLogo,
} as const

function Siteline() {
  return (
    <div className="siteline">
      <nav className="siteline__nav" aria-label="Sections">
        {siteNav.map((item) => (
          <a href={item.href} key={item.label}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="siteline__actions">
        {/* Collapsed to just the hand; the label wipes open on hover/focus. */}
        <a className="hello" href={contact.href}>
          <span className="hello__hand">
            <WavingHand />
          </span>
          <span className="hello__label">{contact.label}</span>
        </a>

        <div className="social">
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
    <section className="cta container" id="contact" aria-labelledby="cta-title">
      <span className="cta__mark" aria-hidden="true">
        <CtaMark />
      </span>

      <h2 className="cta__title" id="cta-title">
        {cta.title}
      </h2>

      <p className="cta__invitation">
        <span>{cta.invitationLead}</span>
        <a className="cta__link" href={cta.invitationLink.href} {...bookingTrigger}>
          <span className="cta__label">{cta.invitationLink.label}</span>
        </a>
      </p>

      <Siteline />
    </section>
  )
}
