import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MagnifyingGlass, UserCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { User } from '@/lib/types'

interface RoleManagementProps {
  users: User[]
  currentUserId: string
  onUpdateUserRole: (userId: string, role: 'coach' | 'parent' | 'athlete') => void
}

export function RoleManagement({
  users,
  currentUserId,
  onUpdateUserRole
}: RoleManagementProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const nonAdminUsers = useMemo(() => {
    return users.filter(u => u.role !== 'superadmin' && u.id !== currentUserId)
  }, [users, currentUserId])

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return nonAdminUsers
    const query = searchQuery.toLowerCase()
    return nonAdminUsers.filter(u =>
      u.firstName.toLowerCase().includes(query) ||
      u.lastName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    )
  }, [nonAdminUsers, searchQuery])

  const handleRoleChange = (userId: string, newRole: 'coach' | 'parent' | 'athlete') => {
    onUpdateUserRole(userId, newRole)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle size={24} weight="fill" className="text-primary" />
          Gestionare Roluri Utilizatori
        </CardTitle>
        <CardDescription>
          Modifică rolurile utilizatorilor din sistem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <MagnifyingGlass 
            size={20} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
          />
          <Input
            placeholder="Caută utilizatori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizator</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol Curent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Modifică Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Niciun utilizator găsit
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Activ' : 'Inactiv'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as any)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="athlete">Athlete</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
