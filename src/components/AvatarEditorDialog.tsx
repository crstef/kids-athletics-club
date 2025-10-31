import { useCallback, useEffect, useMemo, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const OUTPUT_FORMATS = [
  { value: 'image/png', label: 'PNG (transparent)' },
  { value: 'image/jpeg', label: 'JPEG (fond alb)' },
] as const

const MAX_OUTPUT_SIZE = 512

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossorigin', 'anonymous')
    image.src = src
  })
}

async function generateCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
  outputFormat: 'image/png' | 'image/jpeg',
  backgroundColor: string,
) {
  const image = await loadImage(imageSrc)
  const rotRad = getRadianAngle(rotation)

  const maxSide = Math.max(image.width, image.height)
  const safeArea = Math.round(2 * ((maxSide / 2) * Math.sqrt(2)))
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Contextul canvas nu este disponibil')
  }

  canvas.width = safeArea
  canvas.height = safeArea

  const centerX = safeArea / 2
  const centerY = safeArea / 2

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(rotRad)
  ctx.translate(-centerX, -centerY)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, centerX - image.width / 2, centerY - image.height / 2)
  ctx.restore()

  const cropX = Math.round(centerX - image.width / 2 + pixelCrop.x)
  const cropY = Math.round(centerY - image.height / 2 + pixelCrop.y)
  const cropWidth = Math.round(pixelCrop.width)
  const cropHeight = Math.round(pixelCrop.height)

  const imageData = ctx.getImageData(cropX, cropY, cropWidth, cropHeight)

  canvas.width = cropWidth
  canvas.height = cropHeight

  const drawCtx = canvas.getContext('2d')
  if (!drawCtx) {
    throw new Error('Contextul canvas nu este disponibil')
  }

  if (outputFormat === 'image/jpeg') {
    drawCtx.fillStyle = backgroundColor
    drawCtx.fillRect(0, 0, canvas.width, canvas.height)
  } else {
    drawCtx.clearRect(0, 0, canvas.width, canvas.height)
  }

  drawCtx.putImageData(imageData, 0, 0)

  const finalSize = Math.min(MAX_OUTPUT_SIZE, canvas.width)
  if (canvas.width !== finalSize || canvas.height !== finalSize) {
    const resized = document.createElement('canvas')
    resized.width = finalSize
    resized.height = finalSize
    const resizedCtx = resized.getContext('2d')
    if (!resizedCtx) {
      throw new Error('Contextul canvas nu este disponibil pentru redimensionare')
    }
    resizedCtx.imageSmoothingQuality = 'high'
    resizedCtx.drawImage(canvas, 0, 0, finalSize, finalSize)
    const dataUrl = resized.toDataURL(outputFormat, outputFormat === 'image/jpeg' ? 0.92 : undefined)
    const blob = await new Promise<Blob>((resolve, reject) => {
      resized.toBlob((value) => {
        if (value) resolve(value)
        else reject(new Error('Nu s-a putut genera fișierul'))
      }, outputFormat, outputFormat === 'image/jpeg' ? 0.92 : undefined)
    })
    return { blob, dataUrl }
  }

  const dataUrl = canvas.toDataURL(outputFormat, outputFormat === 'image/jpeg' ? 0.92 : undefined)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value)
      else reject(new Error('Nu s-a putut genera fișierul'))
    }, outputFormat, outputFormat === 'image/jpeg' ? 0.92 : undefined)
  })

  return { blob, dataUrl }
}

export interface AvatarEditorDialogResult {
  blob: Blob
  dataUrl: string
}

interface AvatarEditorDialogProps {
  open: boolean
  imageSrc: string | null
  onClose: () => void
  onComplete: (result: AvatarEditorDialogResult) => void
  title?: string
}

export function AvatarEditorDialog({ open, imageSrc, onClose, onComplete, title }: AvatarEditorDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1.2)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cropShape, setCropShape] = useState<'round' | 'square'>('round')
  const [outputFormat, setOutputFormat] = useState<'image/png' | 'image/jpeg'>('image/png')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')

  useEffect(() => {
    if (!open) {
      setCrop({ x: 0, y: 0 })
      setZoom(1.2)
      setRotation(0)
      setCroppedAreaPixels(null)
    }
  }, [open])

  const canConfirm = useMemo(() => Boolean(imageSrc && croppedAreaPixels && !isProcessing), [croppedAreaPixels, imageSrc, isProcessing])

  const handleCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const result = await generateCroppedImage(imageSrc, croppedAreaPixels, rotation, outputFormat, backgroundColor)
      onComplete(result)
    } catch (error) {
      console.error('Avatar crop failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [backgroundColor, croppedAreaPixels, imageSrc, onComplete, outputFormat, rotation])

  const resetView = useCallback(() => {
    setCrop({ x: 0, y: 0 })
    setZoom(1.2)
    setRotation(0)
  }, [])

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title ?? 'Ajustează avatarul'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="relative h-[320px] overflow-hidden rounded-xl bg-muted md:h-[420px]">
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape={cropShape}
                showGrid
                zoomWithScroll
                objectFit="cover"
                onCropChange={setCrop}
                onZoomChange={(value) => setZoom(value)}
                onRotationChange={setRotation}
                onCropComplete={handleCropComplete}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Selectează o imagine pentru a începe retușarea
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Zoom</Label>
                <span className="text-xs text-muted-foreground">{zoom.toFixed(2)}x</span>
              </div>
              <Slider min={1} max={4} step={0.05} value={[zoom]} onValueChange={([value]) => setZoom(value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Rotire</Label>
                <span className="text-xs text-muted-foreground">{rotation.toFixed(0)}°</span>
              </div>
              <Slider min={-45} max={45} step={1} value={[rotation]} onValueChange={([value]) => setRotation(value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={cropShape === 'round' ? 'default' : 'outline'} onClick={() => setCropShape('round')}>
                Cerc
              </Button>
              <Button type="button" size="sm" variant={cropShape === 'square' ? 'default' : 'outline'} onClick={() => setCropShape('square')}>
                Pătrat
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={resetView}>
                Resetare cadru
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Format</Label>
              <Select value={outputFormat} onValueChange={(value) => setOutputFormat(value as 'image/png' | 'image/jpeg')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTPUT_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {outputFormat === 'image/jpeg' && (
                <div className="space-y-1">
                  <Label htmlFor="avatar-background" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Culoare fundal
                  </Label>
                  <input
                    id="avatar-background"
                    type="color"
                    value={backgroundColor}
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    className="h-9 w-full cursor-pointer rounded-md border border-input bg-background p-1"
                  />
                </div>
              )}
            </div>
            <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 p-3 text-xs text-muted-foreground">
              • Folosește zoom pentru a centra fața în cadrul circular.<br />
              • Rotirea te ajută să corectezi imaginile înclinate.<br />
              • Poți reveni oricând pentru a ajusta din nou avatarul.
            </div>
          </div>
        </div>
        <DialogFooter className={cn('mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end')}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
            Anulează
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!canConfirm}>
            {isProcessing ? 'Se procesează...' : 'Salvează avatarul'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
