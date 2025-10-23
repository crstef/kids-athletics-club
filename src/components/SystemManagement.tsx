import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Layout, Users } from '@phosphor-icons/react'
import { apiClient } from '@/lib/api-client'
import type { Role, Dashboard } from '@/lib/types'
import DashboardManagement from './DashboardManagement'
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
          Administrează roluri și dashboards în mod dinamic
        </p>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-2">
          <TabsTrigger value="roles" className="gap-2">
            <Users className="w-4 h-4" />
            Roluri & Dashboards
          </TabsTrigger>
          <TabsTrigger value="dashboards" className="gap-2">
            <Layout className="w-4 h-4" />
            Dashboards Disponibile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-6">
          <RoleManagementEnhanced
            roles={roles}
            dashboards={dashboards}
            onRefresh={fetchData}
          />
        </TabsContent>

        <TabsContent value="dashboards" className="mt-6">
          <DashboardManagement
            dashboards={dashboards}
            onRefresh={fetchData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
