import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck, ArrowRight } from '@phosphor-icons/react'
import { StatWidget } from '../StatWidget'
import type { Permission } from '@/lib/types'

interface StatsPermissionsWidgetProps {
  permissions: Permission[]
  onNavigateToTab?: (tab: string) => void
}

export function StatsPermissionsWidget({ permissions, onNavigateToTab }: StatsPermissionsWidgetProps) {
  const detailsContent = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Permisiuni active în sistem
      </p>
      <div className="space-y-2">
        {permissions.map((perm) => (
          <div key={perm.id} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium">{perm.name}</div>
              <Badge variant={perm.isActive ? 'default' : 'secondary'}>
                {perm.isActive ? 'Activă' : 'Inactivă'}
              </Badge>
            </div>
            {perm.description && (
              <div className="text-sm text-muted-foreground">{perm.description}</div>
            )}
          </div>
        ))}
        {permissions.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nicio permisiune configurată
          </div>
        )}
      </div>
      {onNavigateToTab && (
        <Button onClick={() => onNavigateToTab('permissions')} className="w-full mt-4">
          Mergi la Permisiuni <ArrowRight size={16} className="ml-2" />
        </Button>
      )}
    </div>
  )

  return (
    <StatWidget
      title="Permisiuni Active"
      value={permissions.length}
      icon={<ShieldCheck size={24} weight="fill" />}
      iconColor="text-green-500"
      subtitle={`${permissions.length} ${permissions.length === 1 ? 'drept acordat' : 'drepturi acordate'}`}
      detailsContent={detailsContent}
    />
  )
}
