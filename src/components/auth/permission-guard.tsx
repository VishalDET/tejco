import * as React from "react"
import { useAuth } from "@/hooks/use-auth"

export interface PermissionGuardProps {
  /** Permission or list of permissions required */
  permission?: string | string[]
  /** If true, requires all listed permissions. Defaults to false (any match allows access). */
  requireAll?: boolean
  /** Fallback content to render if permission check fails. Defaults to null. */
  fallback?: React.ReactNode
  /** Content to render if permission is granted */
  children: React.ReactNode
}

/**
 * Conditionally renders children if current user has the required permission(s).
 */
export function PermissionGuard({
  permission,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, permissions, user } = useAuth()

  if (!permission) {
    return <>{children}</>
  }

  // Superadmin or wildcard bypass
  if (permissions.includes("*") || user?.role?.toLowerCase() === "administrator") {
    return <>{children}</>
  }

  const userPerms = new Set(permissions.map((p) => p.toLowerCase()))
  const requiredList = Array.isArray(permission) ? permission : [permission]

  const isAllowed = requireAll
    ? requiredList.every((req) => userPerms.has(req.toLowerCase()))
    : requiredList.some((req) => userPerms.has(req.toLowerCase()))

  if (!isAllowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
