import type { WorkItem } from '../../content/home'
import { ClientMeta } from './client-meta'
import { PlaceholderImage } from './placeholder'

type ProjectRowProps = {
  project: WorkItem
}

export function ProjectRow({ project }: ProjectRowProps) {
  return (
    <article className="grid grid-cols-4 gap-1 border-t border-primary py-4 desktop:grid-cols-4 tablet:grid-cols-1 tablet:gap-4">
      <div className="flex min-h-project-copy-min w-project-copy-w flex-col justify-between tablet:min-h-project-copy-min-tablet tablet:w-full tablet:gap-6">
        <ClientMeta client={project.client} industry={project.industry} />
        <p className="m-0 w-full text-micro leading-normal text-content">{project.description}</p>
      </div>
      <div className="col-span-3 flex items-start gap-1 portrait:flex-col">
        {project.images.map((image, index) => (
          <PlaceholderImage
            alt={image.alt}
            className="aspect-project h-auto min-w-0 flex-1"
            key={`${project.client}-image-${index}`}
            src={image.src}
          />
        ))}
      </div>
    </article>
  )
}
