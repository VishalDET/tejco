import * as React from "react"
import { Link } from "react-router-dom"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProtectedRouteProps {
  permission?: string | string[]
  superAdminOnly?: boolean
  children: React.ReactNode
}

export function ProtectedRoute({ permission, superAdminOnly = false, children }: ProtectedRouteProps) {
  const { hasPermission, permissions, user, isSuperAdmin } = useAuth()

  // Restrict to Super Admin only if flag is present
  if (superAdminOnly) {
    if (!isSuperAdmin) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Card className="max-w-md w-full text-center border-border shadow-md">
            <CardHeader className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl font-bold">Access Restricted</CardTitle>
              <CardDescription className="text-xs">
                This module is restricted to Super Admin only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg text-xs font-mono text-muted-foreground border">
                Role Required: Super Admin
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs bg-indigo-600 hover:bg-indigo-700"
                  render={<Link to="/" />}
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    return <>{children}</>
  }

  // Wildcard, roleId 1, or Administrator full access
  if (permissions.includes("*") || user?.roleId === 1 || user?.role?.toLowerCase() === "administrator" || isSuperAdmin) {
    return <>{children}</>
  }

  const allowed = permission ? hasPermission(permission) : true

  if (!allowed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full text-center border-border shadow-md">
          <CardHeader className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-bold">Access Restricted</CardTitle>
            <CardDescription className="text-xs">
              You do not have the required permission to access this module or view its data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted/40 rounded-lg text-xs font-mono text-muted-foreground border">
              Required: {Array.isArray(permission) ? permission.join(", ") : permission}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="default"
                className="text-xs bg-indigo-600 hover:bg-indigo-700"
                render={<Link to="/" />}
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
