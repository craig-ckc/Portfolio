import { describe, expect, it } from 'vitest'
import { calEmbedOptions, CAL_MOUNT_ID, type CalEmbed } from './cal-embed'

const embed: CalEmbed = {
  link: 'craig-chihururu/30min',
  namespace: '30min',
  origin: 'https://app.cal.com',
}

describe('calEmbedOptions', () => {
  it('points Cal at the element the dialog renders for it', () => {
    expect(calEmbedOptions(embed, 'light').inline.elementOrSelector).toBe(`#${CAL_MOUNT_ID}`)
  })

  it('books the event the site advertises', () => {
    expect(calEmbedOptions(embed, 'light').inline.calLink).toBe('craig-chihururu/30min')
  })

  /* Both halves, and not just the `ui` call: the layout Cal opens on is read
     off the inline config, and a calendar that arrives light and then repaints
     dark is worse than one that was never in step at all. */
  it('carries the appearance into the calendar and the booker alike', () => {
    const { inline, ui } = calEmbedOptions(embed, 'dark')

    expect(inline.config.theme).toBe('dark')
    expect(ui.theme).toBe('dark')
  })

  /* The dialog's own left-hand side says what the call is and how long it
     takes. Cal saying it again beside that is the duplication this hides. */
  it('leaves the event description to the dialog', () => {
    expect(calEmbedOptions(embed, 'light').ui.hideEventTypeDetails).toBe(true)
  })
})
