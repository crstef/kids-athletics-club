import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { SocialLinkUpdateInput, SocialLinksMap, SocialPlatform } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SocialLinksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  links: SocialLinksMap
  onSave: (links: SocialLinkUpdateInput[]) => Promise<void>
  saving?: boolean
}

interface LinkFormState {
  url: string
  isActive: boolean
}

const PLATFORM_CONFIG: Array<{ platform: SocialPlatform; label: string; placeholder: string }> = [
  {
    platform: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/ClubAtletismSibiu'
  },
  {
    platform: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/ClubAtletismSibiu'
  }
]

const buildInitialState = (links: SocialLinksMap): Record<SocialPlatform, LinkFormState> => ({
  facebook: {
    url: links.facebook?.url ?? '',
    isActive: !!links.facebook?.isActive && !!links.facebook?.url
  },
  instagram: {
    url: links.instagram?.url ?? '',
    isActive: !!links.instagram?.isActive && !!links.instagram?.url
  }
})

export const SocialLinksDialog: React.FC<SocialLinksDialogProps> = ({
  open,
  onOpenChange,
  links,
  onSave,
  saving = false
}) => {
  const [formState, setFormState] = useState<Record<SocialPlatform, LinkFormState>>(() => buildInitialState(links))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFormState(buildInitialState(links))
      setError(null)
    }
  }, [links, open])

  const payload = useMemo(() => {
    return PLATFORM_CONFIG.map(({ platform }) => {
      const state = formState[platform]
      const trimmedUrl = state.url.trim()
      return {
        platform,
        url: trimmedUrl.length > 0 ? trimmedUrl : null,
        isActive: state.isActive && trimmedUrl.length > 0
      }
    })
  }, [formState])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const invalid = payload.find((item) => item.isActive && !item.url)
    if (invalid) {
      setError('Introduce URL-ul înainte de a activa link-ul')
      return
    }

    try {
      await onSave(payload)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut salva link-urile')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>Link-uri social media</DialogTitle>
            <DialogDescription>
              Configurează adresele către paginile oficiale Facebook și Instagram. Link-urile active apar în antet și pe pagina de autentificare.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {PLATFORM_CONFIG.map(({ platform, label, placeholder }) => {
              const state = formState[platform]
              return (
                <div key={platform} className="space-y-2 rounded-lg border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label htmlFor={`social-${platform}`} className="text-sm font-medium">
                      {label}
                    </Label>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Activ</span>
                      <Switch
                        id={`social-${platform}-active`}
                        checked={state.isActive}
                        onCheckedChange={(checked) => {
                          setFormState((prev) => ({
                            ...prev,
                            [platform]: {
                              ...prev[platform],
                              isActive: Boolean(checked) && prev[platform].url.trim().length > 0
                            }
                          }))
                        }}
                      />
                    </div>
                  </div>
                  <Input
                    id={`social-${platform}`}
                    name={`social-${platform}`}
                    type="url"
                    value={state.url}
                    placeholder={placeholder}
                    onChange={(event) => {
                      const value = event.target.value
                      setFormState((prev) => ({
                        ...prev,
                        [platform]: {
                          url: value,
                          isActive: prev[platform].isActive && value.trim().length > 0
                        }
                      }))
                    }}
                    className={cn('text-sm')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Link vizibil în antet și pe pagina de autentificare.
                  </p>
                </div>
              )
            })}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Renunță
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Se salvează...' : 'Salvează link-urile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
