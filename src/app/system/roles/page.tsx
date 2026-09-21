import * as React from "react"
import { RolesManagement } from "@/components/system/roles-management"

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground">
          Configure security roles, assign granular module permissions, and view audit history.
        </p>
      </div>

      <RolesManagement />
    </div>
  )
}
