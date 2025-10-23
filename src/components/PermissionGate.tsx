import React from 'react'
import { useAuth } from '@/lib/auth-context'

type Mode = 'any' | 'all'

interface PermissionGateProps {
  perm: string | string[]
  mode?: Mode
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({ perm, mode = 'any', fallback = null, children }: PermissionGateProps) {
  const { hasPermission } = useAuth()

  const perms = Array.isArray(perm) ? perm : [perm]
  const allowed = mode === 'all'
    ? perms.every(p => hasPermission(p))
    : perms.some(p => hasPermission(p))

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}

export default PermissionGate
