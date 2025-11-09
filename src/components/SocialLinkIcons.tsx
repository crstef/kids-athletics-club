import { FacebookLogo, InstagramLogo } from '@phosphor-icons/react'
import type { SocialLinksMap, SocialPlatform } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SocialLinkIconsProps {
  links?: SocialLinksMap
  size?: number
  className?: string
  variant?: 'header' | 'landing'
}

const ICON_COMPONENTS: Record<SocialPlatform, typeof FacebookLogo> = {
  facebook: FacebookLogo,
  instagram: InstagramLogo
}

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram'
}

export const SocialLinkIcons: React.FC<SocialLinkIconsProps> = ({
  links,
  size = 22,
  className,
  variant = 'header'
}) => {
  if (!links) {
    return null
  }

  const activeLinks = Object.entries(links).filter(([, value]) => value && value.url && value.isActive) as Array<[
    SocialPlatform,
    { url: string; isActive: boolean }
  ]>

  if (activeLinks.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {activeLinks.map(([platform, value]) => {
        const IconComponent = ICON_COMPONENTS[platform]
        const label = PLATFORM_LABEL[platform] ?? platform

        if (!IconComponent) {
          return null
        }

        return (
          <a
            key={platform}
            href={value.url ?? '#'}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={label}
            className={cn(
              'inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shadow-sm',
              variant === 'landing'
                ? 'bg-white/90 p-2 text-primary hover:bg-white'
                : 'bg-muted/80 p-2 text-primary hover:bg-primary hover:text-primary-foreground'
            )}
          >
            <IconComponent size={size} weight="fill" />
          </a>
        )
      })}
    </div>
  )
}
