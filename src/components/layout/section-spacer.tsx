type SectionSpacerProps = {
  className?: string
}

export function SectionSpacer({ className = '' }: SectionSpacerProps) {
  return <div className={`h-section-gap tablet:h-section-gap-tablet portrait:!h-section-gap-portrait ${className}`} aria-hidden="true" />
}
