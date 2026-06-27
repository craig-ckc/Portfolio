import { PlaceholderImage } from './placeholder'

type ListItemProps = {
  label: string
}

export function ListItem({ label }: ListItemProps) {
  return (
    <li className="flex h-12 w-full items-center gap-2 border-b border-primary py-2 text-micro leading-normal text-content">
      <PlaceholderImage className="size-8 flex-none" />
      <span>{label}</span>
    </li>
  )
}
