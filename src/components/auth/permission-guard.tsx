import * as React from "react"
import { useAuth } from "@/hooks/use-auth"

export interface PermissionGuardProps {
  /** Permission or list of permissions required */
  permission?: string | string[]
  /** If true, requires all listed permissions. Defaults to false (any match allows access). */
  requireAll?: boolean
  /** Restrict to Super Admin only */
  superAdminOnly?: boolean
  /** Hide content from Sales Person role */
  hideFromSalesPerson?: boolean
  /** Fallback content to render if permission check fails. Defaults to null. */
  fallback?: React.ReactNode
  /** Content to render if permission is granted */
  children: React.ReactNode
}

/**
 * Conditionally renders children if current user has the required permission(s) or role access.
 */
export function PermissionGuard({
  permission,
  requireAll = false,
  superAdminOnly = false,
  hideFromSalesPerson = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, permissions, user, isSuperAdmin, isSalesPerson } = useAuth()

  // If flagged to hide from sales person, block if current user is sales person (unless super admin)
  if (hideFromSalesPerson && isSalesPerson && !isSuperAdmin) {
    return <>{fallback}</>
  }

  // If restricted to Super Admin only
  if (superAdminOnly) {
    if (!isSuperAdmin) {
      return <>{fallback}</>
    }
    return <>{children}</>
  }

  if (!permission) {
    return <>{children}</>
  }

  // Superadmin, roleId 1, or wildcard bypass
  if (isSuperAdmin || permissions.includes("*") || user?.roleId === 1 || user?.role?.toLowerCase() === "administrator") {
    return <>{children}</>
  }

  const isAllowed = hasPermission(permission)

  if (!isAllowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
