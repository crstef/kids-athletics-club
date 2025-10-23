import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldCheck } from '@phosphor-icons/react'
import { useAuth } from '@/lib/auth-context'

export function MyPermissionsDialog() {
  const { currentUser } = useAuth()
  const [open, setOpen] = useState(false)
  const perms = (currentUser?.permissions || []).slice().sort()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <ShieldCheck size={14} />
          Permisiuni
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Permisiunile mele</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {perms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nu există permisiuni rezolvate pentru acest cont.</p>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {perms.map((p) => (
                <li key={p} className="py-0.5">{p}</li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
