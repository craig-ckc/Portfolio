import { describe, expect, it } from 'vitest'
import { inquiryBody, inquiryMailto, type InquiryDraft } from './booking-inquiry'

const draft: InquiryDraft = {
  subject: 'A project & a question',
  greeting: 'Hi Craig,',
  prompts: ['Name', "What I'm building"],
}

describe('inquiryBody', () => {
  it('writes each prompt as a label with a blank line under it', () => {
    expect(inquiryBody(draft)).toBe(['Hi Craig,', '', 'Name:', '', "What I'm building:", ''].join('\n'))
  })

  it('is just the greeting when there is nothing to prompt for', () => {
    expect(inquiryBody({ ...draft, prompts: [] })).toBe('Hi Craig,\n')
  })
})

describe('inquiryMailto', () => {
  const url = inquiryMailto('someone@example.com', draft)

  it('addresses the message', () => {
    expect(url.startsWith('mailto:someone@example.com?')).toBe(true)
  })

  /* The reason this is not built with URLSearchParams. A `+` here reaches the
     mail client as a literal plus sign in the subject line. */
  it('encodes spaces as %20 rather than +', () => {
    expect(url).toContain('subject=A%20project%20%26%20a%20question')
    expect(url).not.toContain('+')
  })

  it('carries the line breaks the body is laid out with', () => {
    const body = new URL(url).searchParams.get('body')
    expect(body).toBe(inquiryBody(draft))
  })
})
