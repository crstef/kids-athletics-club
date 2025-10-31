import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getAvatarColor, getInitials } from '@/lib/constants'
import { toast } from 'sonner'
import { Camera, MagicWand, Trash } from '@phosphor-icons/react'
import { AvatarEditorDialog, type AvatarEditorDialogResult } from './AvatarEditorDialog'

const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024

export interface AvatarUploadChangePayload {
  file: File | null
  dataUrl: string | null
  previewUrl: string | null
}

interface AvatarUploadControlProps {
  id: string
  label: string
  value?: string | null
  onChange: (payload: AvatarUploadChangePayload) => void
  description?: string
  disabled?: boolean
  allowRemove?: boolean
  className?: string
  fallbackId?: string
}

function extensionFromMime(mime: string) {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'png'
}

export function AvatarUploadControl({
  id,
  label,
  value,
  onChange,
  description,
  disabled,
  allowRemove = true,
  className,
  fallbackId,
}: AvatarUploadControlProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorSource, setEditorSource] = useState<string | null>(null)
  const [filenameHint, setFilenameHint] = useState('avatar')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  const fallbackColor = useMemo(() => getAvatarColor(fallbackId ?? id), [fallbackId, id])
  const [firstToken, secondToken] = useMemo(() => {
    if (!label) return ['A', 'V']
    const tokens = label.trim().split(/\s+/)
    if (tokens.length >= 2) return [tokens[0], tokens[1]]
    const single = tokens[0]
    const fallbackSecond = single.length > 1 ? single.slice(1) : 'User'
    return [single, fallbackSecond]
  }, [label])
  const initials = useMemo(() => getInitials(firstToken, secondToken), [firstToken, secondToken])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Selectează o imagine validă (PNG, JPG, WEBP)')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Fișierul este prea mare (maxim 6MB)')
      return
    }

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
    }

    const tempUrl = URL.createObjectURL(file)
    setObjectUrl(tempUrl)
    setFilenameHint(file.name.replace(/\.[^.]+$/, '') || 'avatar')
    setEditorSource(tempUrl)
    setEditorOpen(true)
  }

  const handleEditorComplete = (result: AvatarEditorDialogResult) => {
    const extension = extensionFromMime(result.blob.type)
    const safeName = filenameHint || 'avatar'
    const fileName = `${safeName}.${extension}`
    const finalFile = new File([result.blob], fileName, { type: result.blob.type })

    onChange({
      file: finalFile,
      dataUrl: result.dataUrl,
      previewUrl: result.dataUrl,
    })

    setEditorOpen(false)
    setEditorSource(null)
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      setObjectUrl(null)
    }
  }

  const handleCloseEditor = () => {
    setEditorOpen(false)
    setEditorSource(null)
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      setObjectUrl(null)
    }
  }

  const handleRemove = () => {
    onChange({ file: null, dataUrl: null, previewUrl: null })
  }

  const triggerFileDialog = () => {
    if (disabled) return
    if (!inputRef.current) return
    inputRef.current.click()
  }

  const handleReframe = () => {
    if (!value) {
      triggerFileDialog()
      return
    }
    setEditorSource(value)
    setFilenameHint('avatar')
    setEditorOpen(true)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {allowRemove && value && (
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={disabled} className="text-destructive hover:text-destructive">
            <Trash size={16} className="mr-1" /> Șterge
          </Button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 border-2 border-primary/40 bg-muted">
          {value ? (
            <AvatarImage src={value} alt="Previzualizare avatar" className="h-full w-full object-cover" />
          ) : (
            <AvatarFallback className={cn('text-white font-semibold', fallbackColor)}>
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={triggerFileDialog} disabled={disabled} className="gap-2">
              <Camera size={16} /> {value ? 'Încarcă altă poză' : 'Încarcă poză'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleReframe} disabled={disabled || (!value && !editorSource)} className="gap-2">
              <MagicWand size={16} /> Ajustează încadrerea
            </Button>
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          <p className="text-[11px] text-muted-foreground">
            Formate acceptate: PNG, JPG, WEBP • Dimensiune maximă: 6MB
          </p>
        </div>
      </div>
      <AvatarEditorDialog
        open={editorOpen}
        imageSrc={editorSource}
        onClose={handleCloseEditor}
        onComplete={handleEditorComplete}
      />
    </div>
  )
}
