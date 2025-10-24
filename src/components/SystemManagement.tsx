import { useState, useEffect } from 'react'
import { Users } from '@phosphor-icons/react'
import { apiClient } from '@/lib/api-client'
import type { Role, Dashboard } from '@/lib/types'
import RoleManagementEnhanced from './RoleManagementEnhanced'
import { toast } from 'sonner'

export default function SystemManagement() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [dashboardsRes, rolesRes] = await Promise.all([
        apiClient.getDashboards(),
        apiClient.getRoles(),
      ])
      setDashboards(dashboardsRes as Dashboard[])
      setRoles(rolesRes as Role[])
    } catch (error: any) {
      toast.error('Eroare la încărcarea datelor')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Se încarcă...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Management Sistem</h1>
        <p className="text-muted-foreground">
          Administrează roluri și vizibilitatea componentelor din dashboard
        </p>
      </div>

      <RoleManagementEnhanced
        roles={roles}
        dashboards={dashboards}
        onRefresh={fetchData}
      />
    </div>
  )
}
