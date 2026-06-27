import { PlaceholderImage } from './placeholder'

type ClientMetaProps = {
  client: string
  industry: string
}

export function ClientMeta({ client, industry }: ClientMetaProps) {
  return (
    <div className="flex w-full items-start gap-4">
      <PlaceholderImage className="size-10 flex-none" />
      <div>
        <p className="m-0 w-full text-caption font-semibold leading-copy">{client}</p>
        <p className="m-0 w-full text-caption leading-copy">{industry}</p>
      </div>
    </div>
  )
}
