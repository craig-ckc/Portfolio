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
      <span className="block size-full bg-content logo-mask" aria-hidden="true" />
    </a>
  )
}
