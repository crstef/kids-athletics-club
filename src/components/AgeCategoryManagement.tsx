import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, PencilSimple, Trash, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { AgeCategoryCustom } from '@/lib/types'

interface AgeCategoryManagementProps {
  ageCategories: AgeCategoryCustom[]
  currentUserId: string
  onAddCategory: (category: Omit<AgeCategoryCustom, 'id' | 'createdAt' | 'createdBy'>) => void
  onUpdateCategory: (categoryId: string, updates: Partial<AgeCategoryCustom>) => void
  onDeleteCategory: (categoryId: string) => void
}

interface CategoryForm {
  name: string
  ageFrom: string
  ageTo: string
  description: string
  isActive: boolean
}

export function AgeCategoryManagement({
  ageCategories,
  currentUserId,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}: AgeCategoryManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AgeCategoryCustom | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<AgeCategoryCustom | null>(null)
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    ageFrom: '',
    ageTo: '',
    description: '',
    isActive: true
  })

  const resetForm = () => {
    setFormData({
      name: '',
      ageFrom: '',
      ageTo: '',
      description: '',
      isActive: true
    })
    setEditingCategory(null)
  }

  const handleOpenDialog = (category?: AgeCategoryCustom) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        ageFrom: category.ageFrom.toString(),
        ageTo: category.ageTo.toString(),
        description: category.description || '',
        isActive: category.isActive
      })
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setTimeout(resetForm, 200)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Numele categoriei este obligatoriu')
      return
    }

    const ageFrom = parseInt(formData.ageFrom)
    const ageTo = parseInt(formData.ageTo)

    if (isNaN(ageFrom) || ageFrom < 1 || ageFrom > 100) {
      toast.error('Vârsta minimă trebuie să fie între 1 și 100')
      return
    }

    if (isNaN(ageTo) || ageTo < 1 || ageTo > 100) {
      toast.error('Vârsta maximă trebuie să fie între 1 și 100')
      return
    }

    if (ageFrom >= ageTo) {
      toast.error('Vârsta minimă trebuie să fie mai mică decât vârsta maximă')
      return
    }

    const categoryData = {
      name: formData.name.trim(),
      ageFrom,
      ageTo,
      description: formData.description.trim(),
      isActive: formData.isActive
    }

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, {
        ...categoryData,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUserId
      })
    } else {
      onAddCategory(categoryData)
    }

    handleCloseDialog()
  }

  const handleDeleteClick = (category: AgeCategoryCustom) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id)
      setCategoryToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const activeCategories = ageCategories.filter(c => c.isActive)
  const inactiveCategories = ageCategories.filter(c => !c.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categorii de Vârstă</h2>
          <p className="text-muted-foreground">Gestionează categoriile de vârstă pentru atleți</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus size={20} className="mr-2" />
          Adaugă Categorie
        </Button>
      </div>

      {activeCategories.length === 0 && inactiveCategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users size={64} weight="duotone" className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nu există categorii de vârstă create încă
            </p>
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus size={20} className="mr-2" />
              Adaugă Prima Categorie
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeCategories.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Categorii Active</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeCategories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{category.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {category.ageFrom} - {category.ageTo} ani
                          </CardDescription>
                        </div>
                        <Badge variant="default">Activă</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenDialog(category)}
                        >
                          <PencilSimple size={16} className="mr-2" />
                          Editează
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDeleteClick(category)}
                        >
                          <Trash size={16} className="mr-2" />
                          Șterge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {inactiveCategories.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Categorii Inactive</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactiveCategories.map((category) => (
                  <Card key={category.id} className="opacity-60">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{category.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {category.ageFrom} - {category.ageTo} ani
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">Inactivă</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenDialog(category)}
                        >
                          <PencilSimple size={16} className="mr-2" />
                          Editează
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDeleteClick(category)}
                        >
                          <Trash size={16} className="mr-2" />
                          Șterge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editează Categoria de Vârstă' : 'Adaugă Categoria de Vârstă'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Modifică informațiile categoriei de vârstă'
                : 'Completează informațiile pentru noua categorie de vârstă'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nume Categorie *</Label>
              <Input
                id="name"
                placeholder="ex: U12, Copii, Juniori"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ageFrom">Vârstă Minimă *</Label>
                <Input
                  id="ageFrom"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="ex: 10"
                  value={formData.ageFrom}
                  onChange={(e) => setFormData({ ...formData, ageFrom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageTo">Vârstă Maximă *</Label>
                <Input
                  id="ageTo"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="ex: 12"
                  value={formData.ageTo}
                  onChange={(e) => setFormData({ ...formData, ageTo: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                placeholder="Descriere opțională a categoriei"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Status Categorie</Label>
                <p className="text-sm text-muted-foreground">
                  Activează sau dezactivează categoria
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Anulează
            </Button>
            <Button onClick={handleSubmit}>
              {editingCategory ? 'Actualizează' : 'Adaugă'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare Ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi categoria <strong>{categoryToDelete?.name}</strong>?
              <br />
              <span className="text-destructive font-medium mt-2 block">
                Atenție: Această acțiune nu poate fi anulată.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
              Anulează
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
