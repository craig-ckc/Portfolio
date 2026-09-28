/**
 * The written way in, behind every booking CTA.
 *
 * The calendar is the main path and this is the one beside it, for the visitor
 * who would rather write than talk, who is not ready to put a time in a diary,
 * or whose browser never got Cal's script in the first place. The site is
 * static, so there is no server to post a form to and nothing on the page can
 * take a message itself. A draft email can, and it needs nothing from anybody.
 *
 * The draft asks for the same three things a short inquiry form would, written
 * as labelled blank lines: opening a mail window onto an empty message asks
 * the visitor to work out what to say, and about a third of them decide not
 * to bother. Prompts turn that into filling in the gaps.
 */

export type InquiryDraft = {
  subject: string
  /** The first line of the message, above the prompts. */
  greeting: string
  /** One per prompt, each written into the body as a label with a gap under it. */
  prompts: readonly string[]
}

/**
 * The message body, as plain text.
 *
 * Kept apart from the URL so the shape of the draft can be read (and tested)
 * without percent-encoding in the way.
 */
export function inquiryBody(draft: InquiryDraft): string {
  return [draft.greeting, '', ...draft.prompts.flatMap((prompt) => [`${prompt}:`, ''])].join('\n')
}

/**
 * A `mailto:` carrying the draft.
 *
 * Hand-encoded rather than built with URLSearchParams, which is the obvious
 * tool and the wrong one: it writes spaces as `+`, a form-encoding convention
 * that mail clients do not decode, so a subject line would arrive with plus
 * signs where its spaces were. encodeURIComponent gives `%20`, which they do.
 */
export function inquiryMailto(address: string, draft: InquiryDraft): string {
  const subject = encodeURIComponent(draft.subject)
  const body = encodeURIComponent(inquiryBody(draft))

  return `mailto:${address}?subject=${subject}&body=${body}`
}
