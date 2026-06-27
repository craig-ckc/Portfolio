type PlaceholderImageProps = {
  alt?: string
  className?: string
  imageClassName?: string
  src?: string
}

export function PlaceholderImage({
  alt = '',
  className = '',
  imageClassName = '',
  src = '/figma/placeholder.svg',
}: PlaceholderImageProps) {
  return (
    <div className={`relative overflow-hidden bg-surface-raised ${className}`} aria-hidden={alt === '' ? 'true' : undefined}>
      <img
        className={`absolute inset-0 block size-full max-w-none object-cover pointer-events-none ${imageClassName}`}
        src={src}
        alt={alt}
      />
    </div>
  )
}
