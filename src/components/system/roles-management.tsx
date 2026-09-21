import * as React from "react"
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Lock,
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  History,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Check,
  X,
  FileText,
  Clock,
  ShoppingCart,
  Package,
  Truck,
  Users,
  CheckCheck,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { rolesApi, Role, RolePermission, RoleAuditLog } from "@/lib/api"

// Default system permission modules if server returns empty list
const DEFAULT_PERMISSIONS: RolePermission[] = [
  // Sales Module
  { permissionId: 101, permissionName: "sales.view", name: "View Sales", module: "Sales & Billing", description: "Access quotations, orders, proforma invoices, and challans" },
  { permissionId: 102, permissionName: "sales.create", name: "Create Quotations & Orders", module: "Sales & Billing", description: "Generate new sales quotations and orders" },
  { permissionId: 103, permissionName: "sales.edit", name: "Edit Sales Documents", module: "Sales & Billing", description: "Modify pricing, terms, and items in sales documents" },
  { permissionId: 104, permissionName: "sales.approve", name: "Approve Quotations & Invoices", module: "Sales & Billing", description: "Authorize discount thresholds and approve transactions" },
  { permissionId: 105, permissionName: "sales.delete", name: "Cancel & Delete Orders", module: "Sales & Billing", description: "Cancel or void confirmed sales orders and invoices" },

  // Inventory Module
  { permissionId: 201, permissionName: "inventory.view", name: "View Products & Stock", module: "Inventory & Warehouse", description: "Browse catalog, SKU inventory, and warehouse storage" },
  { permissionId: 202, permissionName: "inventory.manage", name: "Manage Products & Variants", module: "Inventory & Warehouse", description: "Create and update product items, barcodes, and pricing" },
  { permissionId: 203, permissionName: "inventory.stock_inward", name: "Process Stock Inward", module: "Inventory & Warehouse", description: "Inspect, scan, and record inward shipments" },
  { permissionId: 204, permissionName: "inventory.dispatch", name: "Process Dispatch & Outward", module: "Inventory & Warehouse", description: "Verify packaging, scan items, and dispatch shipments" },
  { permissionId: 205, permissionName: "inventory.transfer", name: "Warehouse Stock Transfers", module: "Inventory & Warehouse", description: "Initiate and accept inter-warehouse inventory transfers" },

  // Purchasing Module
  { permissionId: 301, permissionName: "purchasing.view", name: "View Purchase Orders", module: "Purchasing & Procurement", description: "Browse purchase orders and vendor procurement history" },
  { permissionId: 302, permissionName: "purchasing.create", name: "Create Purchase Orders", module: "Purchasing & Procurement", description: "Draft and place purchase orders with vendors" },
  { permissionId: 303, permissionName: "purchasing.approve", name: "Approve Purchase Orders", module: "Purchasing & Procurement", description: "Authorize purchase expenditure and vendor contracts" },
  { permissionId: 304, permissionName: "purchasing.manage", name: "Manage Vendors & Warehouses", module: "Purchasing & Procurement", description: "Manage vendor contacts, terms, and warehouse layouts" },

  // Stakeholders Module
  { permissionId: 401, permissionName: "clients.view", name: "View Clients & Clinics", module: "Stakeholders & CRM", description: "Browse client database, doctor profiles, and order history" },
  { permissionId: 402, permissionName: "clients.manage", name: "Create & Edit Clients", module: "Stakeholders & CRM", description: "Add and maintain client accounts and branch locations" },
  { permissionId: 403, permissionName: "clients.delete", name: "Delete Clients", module: "Stakeholders & CRM", description: "Remove client records from active directory" },

  // System Administration
  { permissionId: 501, permissionName: "system.users", name: "Manage System Users", module: "System & Security", description: "Add, edit, deactivate user accounts and credentials" },
  { permissionId: 502, permissionName: "system.roles", name: "Manage Roles & Permissions", module: "System & Security", description: "Define roles and assign granular system permissions" },
  { permissionId: 503, permissionName: "system.masters", name: "Manage System Masters", module: "System & Security", description: "Configure companies, branches, departments, and categories" },
  { permissionId: 504, permissionName: "system.audit", name: "View Audit Logs", module: "System & Security", description: "Inspect system security logs, changes, and user activities" },
  { permissionId: 505, permissionName: "system.settings", name: "System Settings", module: "System & Security", description: "Update ERP global preferences and company profiles" },
]

export function RolesManagement() {
  const [roles, setRoles] = React.useState<Role[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [refreshKey, setRefreshKey] = React.useState(0)

  // System permissions state
  const [allPermissions, setAllPermissions] = React.useState<RolePermission[]>([])

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isPermsOpen, setIsPermsOpen] = React.useState(false)
  const [isAuditOpen, setIsAuditOpen] = React.useState(false)

  // Target role states
  const [activeRole, setActiveRole] = React.useState<Role | null>(null)
  const [formData, setFormData] = React.useState({ roleName: "", description: "" })
  const [formSubmitting, setFormSubmitting] = React.useState(false)

  // Permissions modal states
  const [rolePermissions, setRolePermissions] = React.useState<number[]>([])
  const [permsLoading, setPermsLoading] = React.useState(false)
  const [savingPerms, setSavingPerms] = React.useState(false)
  const [permSearch, setPermSearch] = React.useState("")
  const [selectedModuleFilter, setSelectedModuleFilter] = React.useState<string>("ALL")

  // Audit logs state
  const [auditLogs, setAuditLogs] = React.useState<RoleAuditLog[]>([])
  const [auditLoading, setAuditLoading] = React.useState(false)
  const [auditSearch, setAuditSearch] = React.useState("")

  // Load roles & permissions
  const loadRoles = React.useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const [fetchedRoles, fetchedPerms] = await Promise.all([
        rolesApi.getAll().catch((err: any) => {
          console.error("Failed to load roles from server:", err)
          throw err
        }),
        rolesApi.getPermissions().catch((err: any) => {
          console.error("Failed to load permissions from server:", err)
          return []
        }),
      ])

      setRoles(Array.isArray(fetchedRoles) ? fetchedRoles : [])
      setAllPermissions(Array.isArray(fetchedPerms) && fetchedPerms.length > 0 ? fetchedPerms : DEFAULT_PERMISSIONS)
    } catch (err: any) {
      console.error("Failed to load roles from server:", err)
      setRoles([])
      const msg = err instanceof Error ? err.message : "Failed to load roles from server"
      setLoadError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadRoles()
  }, [loadRoles, refreshKey])

  // Open Create Dialog
  const handleOpenCreate = () => {
    setFormData({ roleName: "", description: "" })
    setIsCreateOpen(true)
  }

  // Submit Create Role
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.roleName.trim()) {
      toast.error("Role name is required")
      return
    }

    setFormSubmitting(true)
    try {
      await rolesApi.create({
        roleName: formData.roleName.trim(),
        description: formData.description.trim(),
      })

      toast.success(`Role "${formData.roleName}" created successfully!`)
      setIsCreateOpen(false)
      loadRoles()
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Failed to create role"
      toast.error(`Failed to create role: ${message}`)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Open Edit Dialog
  const handleOpenEdit = (role: Role) => {
    setActiveRole(role)
    setFormData({
      roleName: role.roleName,
      description: role.description || "",
    })
    setIsEditOpen(true)
  }

  // Submit Edit Role
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeRole) return
    if (!formData.roleName.trim()) {
      toast.error("Role name is required")
      return
    }

    setFormSubmitting(true)
    try {
      await rolesApi.update(activeRole.roleId, {
        roleId: activeRole.roleId,
        roleName: formData.roleName.trim(),
        description: formData.description.trim(),
      })

      toast.success(`Role updated successfully!`)
      setIsEditOpen(false)
      loadRoles()
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Failed to update role"
      toast.error(`Failed to update role: ${message}`)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Open Delete Dialog
  const handleOpenDelete = (role: Role) => {
    setActiveRole(role)
    setIsDeleteOpen(true)
  }

  // Confirm Delete Role
  const handleDeleteConfirm = async () => {
    if (!activeRole) return
    setFormSubmitting(true)
    try {
      await rolesApi.delete(activeRole.roleId)
      toast.success(`Role "${activeRole.roleName}" deleted.`)
      setIsDeleteOpen(false)
      loadRoles()
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Failed to delete role"
      toast.error(`Failed to delete role: ${message}`)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Open Permissions Dialog for Role
  const handleOpenPermissions = async (role: Role) => {
    setActiveRole(role)
    setIsPermsOpen(true)
    setPermsLoading(true)
    setPermSearch("")
    setSelectedModuleFilter("ALL")

    try {
      const assigned = await rolesApi.getRolePermissions(role.roleId)
      let ids: number[] = []

      if (Array.isArray(assigned)) {
        ids = assigned.map((p) => (typeof p === "number" ? p : p.permissionId || p.id))
      }

      setRolePermissions(ids)
    } catch (err: any) {
      console.error(`Failed to fetch permissions for role ${role.roleId}:`, err)
      setRolePermissions([])
    } finally {
      setPermsLoading(false)
    }
  }

  // Toggle single permission checkbox
  const handleTogglePermission = (permId: number) => {
    setRolePermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    )
  }

  // Toggle all permissions within a specific module
  const handleToggleModulePermissions = (moduleName: string, enable: boolean) => {
    const modulePermIds = allPermissions
      .filter((p) => (p.module || "General") === moduleName)
      .map((p) => p.permissionId)

    if (enable) {
      setRolePermissions((prev) => Array.from(new Set([...prev, ...modulePermIds])))
    } else {
      setRolePermissions((prev) => prev.filter((id) => !modulePermIds.includes(id)))
    }
  }

  // Select all system permissions
  const handleSelectAllPermissions = () => {
    setRolePermissions(allPermissions.map((p) => p.permissionId))
  }

  // Clear all permissions
  const handleClearAllPermissions = () => {
    setRolePermissions([])
  }

  // Save assigned permissions
  const handleSavePermissions = async () => {
    if (!activeRole) return
    setSavingPerms(true)
    try {
      await rolesApi.assignPermissions(activeRole.roleId, rolePermissions)
      toast.success(`Assigned ${rolePermissions.length} permissions to "${activeRole.roleName}"!`)
      setIsPermsOpen(false)
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Failed to assign permissions"
      toast.error(`Failed to assign permissions: ${message}`)
    } finally {
      setSavingPerms(false)
    }
  }

  // Open Audit Logs
  const handleOpenAuditLogs = async () => {
    setIsAuditOpen(true)
    setAuditLoading(true)
    try {
      const logs = await rolesApi.getAuditLogs()
      setAuditLogs(Array.isArray(logs) ? logs : [])
    } catch (err: any) {
      console.error("Failed to load audit logs:", err)
      setAuditLogs([])
    } finally {
      setAuditLoading(false)
    }
  }

  // Filtered roles
  const filteredRoles = roles.filter(
    (r) =>
      r.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Group permissions by module
  const permissionsByModule = React.useMemo(() => {
    const map: Record<string, RolePermission[]> = {}
    allPermissions.forEach((perm) => {
      const mod = perm.module || perm.category || "General System"
      if (!map[mod]) map[mod] = []
      map[mod].push(perm)
    })
    return map
  }, [allPermissions])

  // Filtered permissions in modal
  const filteredModules = React.useMemo(() => {
    let base = permissionsByModule
    if (selectedModuleFilter !== "ALL" && permissionsByModule[selectedModuleFilter]) {
      base = { [selectedModuleFilter]: permissionsByModule[selectedModuleFilter] }
    }

    if (!permSearch.trim()) return base
    const query = permSearch.toLowerCase()
    const result: Record<string, RolePermission[]> = {}

    Object.entries(base).forEach(([moduleName, perms]) => {
      const matching = perms.filter(
        (p) =>
          p.permissionName?.toLowerCase().includes(query) ||
          p.name?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          moduleName.toLowerCase().includes(query)
      )
      if (matching.length > 0) {
        result[moduleName] = matching
      }
    })
    return result
  }, [permissionsByModule, permSearch, selectedModuleFilter])

  // Dynamic access percentage calculation
  const accessPercentage = React.useMemo(() => {
    if (allPermissions.length === 0) return 0
    return Math.round((rolePermissions.length / allPermissions.length) * 100)
  }, [rolePermissions.length, allPermissions.length])

  // Contextual icon per module
  const getModuleIcon = (moduleName: string) => {
    const lower = moduleName.toLowerCase()
    if (lower.includes("sales") || lower.includes("billing"))
      return <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
    if (lower.includes("inventory") || lower.includes("warehouse") || lower.includes("stock"))
      return <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
    if (lower.includes("purchas") || lower.includes("procure") || lower.includes("vendor"))
      return <Truck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
    if (lower.includes("client") || lower.includes("stakeholder") || lower.includes("crm"))
      return <Users className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
    return <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-background shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Roles</p>
              <h3 className="text-2xl font-bold text-foreground tracking-tight">{roles.length}</h3>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium block">
                Configured in system
              </span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-background shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Permissions</p>
              <h3 className="text-2xl font-bold text-foreground tracking-tight">{allPermissions.length}</h3>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                Granular operations
              </span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <KeyRound className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-background shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Access Control</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground tracking-tight">Active</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  RBAC
                </span>
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block">
                Policy enforcement
              </span>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/40 dark:to-background shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Audit Trail</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground tracking-tight">
                  {auditLogs.length > 0 ? auditLogs.length : "Active"}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  Live
                </span>
              </div>
              <button
                onClick={handleOpenAuditLogs}
                className="text-[11px] text-primary hover:underline font-medium block text-left"
              >
                View audit history →
              </button>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
              <History className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-xs overflow-hidden border">
        <CardHeader className="p-4 sm:p-6 pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
                <span>System Roles</span>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Define roles and assign fine-grained permissions across all Tejco ERP modules.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAuditLogs}
                className="text-xs h-9 flex-1 sm:flex-initial"
              >
                <History className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Audit Logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshKey((k) => k + 1)}
                className="text-xs h-9 px-3"
                title="Refresh Roles"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                onClick={handleOpenCreate}
                size="sm"
                className="text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex-1 sm:flex-initial shadow-xs"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Create Role
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search bar */}
          <div className="p-3 sm:p-4 border-b bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 w-full bg-background"
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium shrink-0">
              Showing <span className="font-semibold text-foreground">{filteredRoles.length}</span> of{" "}
              <span className="font-semibold text-foreground">{roles.length}</span> roles
            </span>
          </div>

          {/* Roles Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6 w-[200px] sm:w-[240px] whitespace-nowrap">Role Name</TableHead>
                  <TableHead className="min-w-[220px]">Description</TableHead>
                  <TableHead className="hidden md:table-cell w-[140px] whitespace-nowrap">Created</TableHead>
                  <TableHead className="text-right pr-4 sm:pr-6 w-[170px] whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-4 sm:pl-6 py-4">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell className="text-right pr-4 sm:pr-6">
                        <div className="h-8 w-24 bg-muted animate-pulse rounded ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : loadError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                        <p className="text-xs font-medium text-destructive">{loadError}</p>
                        <p className="text-[11px] text-muted-foreground">Unable to load roles from the server.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRefreshKey((k) => k + 1)}
                          className="mt-2 text-xs h-8"
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try Again
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-xs">
                      {searchQuery ? "No roles match your search query." : "No roles configured yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => (
                    <TableRow key={role.roleId} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="pl-4 sm:pl-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                            {role.roleName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                              {role.roleName}
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono font-normal text-muted-foreground px-1 py-0 h-4 border-slate-200 shrink-0"
                              >
                                ID #{role.roleId}
                              </Badge>
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs md:max-w-md">
                        <p className="line-clamp-2">
                          {role.description || <span className="italic text-slate-400">No description provided</span>}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">
                        {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : "System Default"}
                      </TableCell>
                      <TableCell className="text-right pr-4 sm:pr-6 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPermissions(role)}
                            className="h-8 text-xs font-medium border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:hover:bg-indigo-950/50"
                            title="Assign Permissions"
                          >
                            <KeyRound className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                            <span>Permissions</span>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Role Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleOpenPermissions(role)}>
                                <KeyRound className="mr-2 h-4 w-4 text-indigo-600" /> Manage Permissions
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(role)}>
                                <Pencil className="mr-2 h-4 w-4 text-slate-600" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleOpenDelete(role)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Role
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE ROLE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[540px] p-5 sm:p-6">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600 shrink-0" /> Create New Role
              </DialogTitle>
              <DialogDescription className="text-xs">
                Define a new user role. You can assign modular permissions immediately after creating.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Role Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Sales Coordinator, Inventory Inspector"
                  value={formData.roleName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, roleName: e.target.value }))}
                  required
                  className="text-xs h-9"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <Textarea
                  placeholder="Briefly describe what responsibilities this role entails..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={formSubmitting}
                className="text-xs w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formSubmitting || !formData.roleName.trim()}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto font-semibold shadow-xs"
              >
                {formSubmitting ? "Creating..." : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT ROLE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[540px] p-5 sm:p-6">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-indigo-600 shrink-0" /> Edit Role
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update role details and functional description.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Role Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.roleName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, roleName: e.target.value }))}
                  required
                  className="text-xs h-9"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={formSubmitting}
                className="text-xs w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formSubmitting || !formData.roleName.trim()}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto font-semibold shadow-xs"
              >
                {formSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ROLE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[460px] p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" /> Delete Role
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Are you sure you want to delete role <strong>"{activeRole?.roleName}"</strong>? This may affect users
              currently assigned to this role.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={formSubmitting}
              className="text-xs w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={formSubmitting}
              className="text-xs w-full sm:w-auto font-semibold"
            >
              {formSubmitting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSIGN PERMISSIONS MODAL */}
      <Dialog open={isPermsOpen} onOpenChange={setIsPermsOpen}>
        <DialogContent className="w-[96vw] sm:w-[95vw] sm:max-w-6xl xl:max-w-7xl h-[92vh] max-h-[960px] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl border-border/80">
          {/* Modal Header */}
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b bg-muted/25 shrink-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-6 sm:pr-0">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-sm shrink-0">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-xl font-bold text-foreground">
                      Configure Permissions
                    </DialogTitle>
                    <Badge
                      variant="secondary"
                      className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold px-2.5 py-0.5"
                    >
                      {activeRole?.roleName}
                    </Badge>
                    {activeRole?.roleId && (
                      <span className="text-xs text-muted-foreground font-mono">
                        ID #{activeRole.roleId}
                      </span>
                    )}
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Assign fine-grained access rights and granular operations across ERP modules.
                  </DialogDescription>
                </div>
              </div>

              {/* Dynamic Access Level Meter */}
              <div className="flex flex-col sm:items-end gap-1.5 shrink-0 bg-background/80 p-2.5 rounded-xl border border-border/60 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Access Scope:</span>
                  <span className="text-xs font-bold text-foreground font-mono">{accessPercentage}%</span>
                  <Badge
                    className={`${accessPercentage >= 80
                      ? "bg-emerald-600 text-white"
                      : accessPercentage >= 40
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-600 text-white"
                      } text-[10px] font-semibold px-2 py-0`}
                  >
                    {rolePermissions.length} of {allPermissions.length} Active
                  </Badge>
                </div>
                <div className="w-full sm:w-48 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${accessPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Toolbar: Search & Global Batch Toggles */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter permissions by keyword or action..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  className="pl-8 pr-8 text-xs h-9 bg-background w-full"
                />
                {permSearch && (
                  <button
                    onClick={() => setPermSearch("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRolePermissions(allPermissions.map((p) => p.permissionId))}
                  className="text-xs h-9 flex-1 sm:flex-initial text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Select All ({allPermissions.length})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRolePermissions([])}
                  className="text-xs h-9 flex-1 sm:flex-initial text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-rose-600" /> Clear All
                </Button>
              </div>
            </div>

            {/* Module Filter Tabs / Navigation Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1 pt-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedModuleFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${selectedModuleFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-background/90 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-background"
                  }`}
              >
                <span>All Modules</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${selectedModuleFilter === "ALL"
                    ? "bg-indigo-700 text-white"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {allPermissions.length}
                </span>
              </button>

              {Object.entries(permissionsByModule).map(([modName, modPerms]) => {
                const activeInMod = modPerms.filter((p) => rolePermissions.includes(p.permissionId)).length
                const isSelected = selectedModuleFilter === modName
                return (
                  <button
                    key={modName}
                    type="button"
                    onClick={() => setSelectedModuleFilter(isSelected ? "ALL" : modName)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-background/90 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-background"
                      }`}
                  >
                    {getModuleIcon(modName)}
                    <span>{modName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${isSelected
                        ? "bg-indigo-700 text-white"
                        : activeInMod === modPerms.length
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                          : activeInMod > 0
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {activeInMod}/{modPerms.length}
                    </span>
                  </button>
                )
              })}
            </div>
          </DialogHeader>

          {/* Permissions Matrix Grid Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-zinc-950/40">
            {permsLoading ? (
              <div className="py-24 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                <span>Loading permission matrix...</span>
              </div>
            ) : Object.keys(filteredModules).length === 0 ? (
              <div className="py-24 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <Search className="h-8 w-8 text-muted-foreground/50" />
                <span>No permissions match "{permSearch}".</span>
                {selectedModuleFilter !== "ALL" && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSelectedModuleFilter("ALL")}
                    className="text-xs text-indigo-600"
                  >
                    Show all modules
                  </Button>
                )}
              </div>
            ) : (
              Object.entries(filteredModules).map(([moduleName, perms]) => {
                const modulePermIds = perms.map((p) => p.permissionId)
                const isAllSelected = modulePermIds.every((id) => rolePermissions.includes(id))
                const activeCount = modulePermIds.filter((id) => rolePermissions.includes(id)).length

                return (
                  <div
                    key={moduleName}
                    className="rounded-2xl border border-border/80 bg-background/80 backdrop-blur-xs overflow-hidden shadow-xs"
                  >
                    {/* Module Section Header */}
                    <div className="bg-muted/30 px-4 sm:px-5 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-background border shadow-2xs">
                          {getModuleIcon(moduleName)}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground">{moduleName}</h4>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono font-medium px-2 py-0.5 border ${activeCount === modulePermIds.length
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : activeCount > 0
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300"
                                : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {activeCount} of {modulePermIds.length} Active
                          </Badge>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleModulePermissions(moduleName, !isAllSelected)}
                        className="text-xs h-7 px-2.5 text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400 font-medium shrink-0 self-end sm:self-auto"
                      >
                        {isAllSelected ? "Deselect All in Module" : "Select Entire Module"}
                      </Button>
                    </div>

                    {/* Responsive Card Grid (up to 3 columns on wide screens) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 p-4 sm:p-5 bg-muted/5">
                      {perms.map((perm) => {
                        const isChecked = rolePermissions.includes(perm.permissionId)

                        return (
                          <div
                            key={perm.permissionId}
                            onClick={() => handleTogglePermission(perm.permissionId)}
                            className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${isChecked
                              ? "bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 shadow-xs ring-1 ring-indigo-500/20"
                              : "bg-card/70 hover:bg-card border-border/70 hover:border-border hover:shadow-2xs"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-xs sm:text-sm text-foreground">
                                    {perm.name || perm.permissionName}
                                  </span>
                                  <code className="text-[10px] font-mono text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded border border-border/40">
                                    {perm.permissionName}
                                  </code>
                                </div>
                                {perm.description && (
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                    {perm.description}
                                  </p>
                                )}
                              </div>

                              <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                <Switch
                                  checked={isChecked}
                                  onCheckedChange={() => handleTogglePermission(perm.permissionId)}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Sticky Modern Footer */}
          <DialogFooter className="p-4 sm:px-6 border-t bg-background flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Selected for <strong className="text-foreground">{activeRole?.roleName}</strong>:</span>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 font-mono font-semibold">
                {rolePermissions.length} of {allPermissions.length} operations
              </Badge>
            </div>
            <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPermsOpen(false)}
                disabled={savingPerms}
                className="text-xs h-10 px-4 flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSavePermissions}
                disabled={savingPerms}
                className="text-xs h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex-1 sm:flex-initial shadow-xs"
              >
                {savingPerms ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  `Save Permissions (${rolePermissions.length})`
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AUDIT LOGS DIALOG */}
      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
        <DialogContent className="w-[96vw] sm:w-[95vw] sm:max-w-4xl lg:max-w-5xl h-[88vh] max-h-[900px] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl border-border/80">
          <DialogHeader className="p-5 sm:p-6 pb-3 border-b bg-muted/20 shrink-0">
            <div className="flex items-center justify-between pr-6 sm:pr-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <History className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    Roles & Security Audit Trail
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Historical record of all role assignments, permission modifications, and policy changes.
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search audit logs by role, user, or action..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-8 text-xs h-9 bg-background w-full"
                />
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50 dark:bg-zinc-950/40">
            {auditLoading ? (
              <div className="py-24 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                <span>Loading audit logs...</span>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-24 text-center text-sm text-muted-foreground">No audit logs recorded yet.</div>
            ) : (
              auditLogs
                .filter(
                  (log) =>
                    !auditSearch ||
                    (log.roleName && log.roleName.toLowerCase().includes(auditSearch.toLowerCase())) ||
                    (log.action && log.action.toLowerCase().includes(auditSearch.toLowerCase())) ||
                    (log.performedBy && log.performedBy.toLowerCase().includes(auditSearch.toLowerCase())) ||
                    (log.details && log.details.toLowerCase().includes(auditSearch.toLowerCase()))
                )
                .map((log, idx) => (
                  <div
                    key={log.logId || idx}
                    className="p-4 rounded-xl border border-border/80 bg-background/90 shadow-2xs flex items-start gap-3.5 hover:border-border transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {log.roleName || "System Role"}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono uppercase bg-indigo-50/50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 px-2 py-0"
                          >
                            {log.action || "MODIFIED"}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Recently"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed break-words">
                        {log.details || "Role settings or permission list updated."}
                      </p>
                      {log.performedBy && (
                        <span className="text-[11px] text-slate-500 font-mono mt-1.5 block">
                          By: <strong className="text-foreground/80">{log.performedBy}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>

          <DialogFooter className="p-4 sm:px-6 border-t bg-background shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAuditOpen(false)}
              className="text-xs h-9 px-4 w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
