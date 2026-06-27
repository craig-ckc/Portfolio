import { ListItem } from './list-item'

type ListColumnProps = {
  title: string
  items: string[]
}

export function ListColumn({ title, items }: ListColumnProps) {
  const headingId = `${title.toLowerCase()}-title`

  return (
    <div className="flex flex-col gap-list-gap" aria-labelledby={headingId}>
      <h2 className="m-0 w-full text-section-title font-normal leading-normal text-content" id={headingId}>
        {title}
      </h2>
      <ul className="m-0 w-full list-none p-0 text-left">
        {items.map((item, index) => (
          <ListItem key={`${item}-${index}`} label={item} />
        ))}
      </ul>
    </div>
  )
}
