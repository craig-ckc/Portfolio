type ContactLinkProps = {
  className?: string
}

export function ContactLink({ className = '' }: ContactLinkProps) {
  return (
    <a
      className={`inline-flex min-h-5 items-center justify-center rounded-tag bg-surface px-3 py-1 text-caption leading-copy text-content no-underline ${className}`}
      href="mailto:hello@craigchihururu.com"
    >
      Contact
    </a>
  )
}
