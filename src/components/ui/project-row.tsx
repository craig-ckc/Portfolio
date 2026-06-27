import type { WorkItem } from '../../content/home'
import { ClientMeta } from './client-meta'
import { PlaceholderImage } from './placeholder'

type ProjectRowProps = {
  project: WorkItem
}

export function ProjectRow({ project }: ProjectRowProps) {
  return (
    <article className="grid grid-cols-4 gap-1 border-t border-primary py-4 compact:grid-cols-1 compact:gap-4">
      <div className="flex min-h-project-copy-min min-w-0 w-full max-w-project-copy-w flex-col justify-between compact:min-h-project-copy-min-tablet compact:max-w-none compact:gap-6">
        <ClientMeta client={project.client} industry={project.industry} />
        <p className="m-0 w-full text-micro leading-normal text-content max-w-70">{project.description}</p>
      </div>
      <div className="col-span-3 grid min-w-0 grid-cols-3 items-start gap-1 compact:col-span-full portrait:grid-cols-2">
        {project.images.map((image, index) => (
          <PlaceholderImage
            alt={image.alt}
            className={`aspect-project h-auto min-w-0 ${index === 0 ? 'portrait:col-span-2' : ''}`}
            key={`${project.client}-image-${index}`}
            src={image.src}
          />
        ))}
      </div>
    </article>
  )
}
