type BrandMarkProps = {
  className?: string
}

export function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <a
      className={`block h-5 w-logo-nav ${className}`}
      href="#top"
      aria-label="Craig Chihururu home"
      data-ui="brand-logo"
    >
      <img className="size-full max-w-none" src="/figma/logo.svg" alt="Craig." />
    </a>
  )
}
