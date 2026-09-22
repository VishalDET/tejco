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
  // Dashboard
  { permissionId: 1, permissionName: "Dashboard.View", name: "Dashboard.View", module: "Dashboard", description: "Allows viewing the dashboard and KPIs" },

  // Products
  { permissionId: 2, permissionName: "Products.View", name: "Products.View", module: "Products", description: "Allows viewing basic product details" },
  { permissionId: 3, permissionName: "Products.FullView", name: "Products.FullView", module: "Products", description: "Allows viewing all product details including cost price and vendor" },
  { permissionId: 4, permissionName: "Products.MaskedView", name: "Products.MaskedView", module: "Products", description: "Allows viewing products with cost price and vendor masked (Sales Person view)" },
  { permissionId: 5, permissionName: "Products.Create", name: "Products.Create", module: "Products", description: "Allows creating new products" },
  { permissionId: 6, permissionName: "Products.Edit", name: "Products.Edit", module: "Products", description: "Allows editing existing products" },
  { permissionId: 7, permissionName: "Products.Delete", name: "Products.Delete", module: "Products", description: "Allows deleting products" },

  // Categories
  { permissionId: 8, permissionName: "Categories.View", name: "Categories.View", module: "Categories", description: "Allows viewing categories" },
  { permissionId: 9, permissionName: "Categories.Create", name: "Categories.Create", module: "Categories", description: "Allows creating categories" },
  { permissionId: 10, permissionName: "Categories.Edit", name: "Categories.Edit", module: "Categories", description: "Allows editing categories" },
  { permissionId: 11, permissionName: "Categories.Delete", name: "Categories.Delete", module: "Categories", description: "Allows deleting categories" },

  // Masters
  { permissionId: 12, permissionName: "Masters.View", name: "Masters.View", module: "Masters", description: "Allows viewing system masters (Countries, etc)" },
  { permissionId: 13, permissionName: "Masters.Create", name: "Masters.Create", module: "Masters", description: "Allows creating system masters" },
  { permissionId: 14, permissionName: "Masters.Edit", name: "Masters.Edit", module: "Masters", description: "Allows editing system masters" },

  // Clients
  { permissionId: 15, permissionName: "Clients.View", name: "Clients.View", module: "Clients", description: "Allows viewing client data" },
  { permissionId: 16, permissionName: "Clients.Create", name: "Clients.Create", module: "Clients", description: "Allows creating new clients" },
  { permissionId: 17, permissionName: "Clients.Edit", name: "Clients.Edit", module: "Clients", description: "Allows editing existing clients" },
  { permissionId: 18, permissionName: "Clients.Delete", name: "Clients.Delete", module: "Clients", description: "Allows deleting clients" },

  // Vendors
  { permissionId: 19, permissionName: "Vendors.View", name: "Vendors.View", module: "Vendors", description: "Allows viewing vendor data" },
  { permissionId: 20, permissionName: "Vendors.Create", name: "Vendors.Create", module: "Vendors", description: "Allows creating new vendors" },
  { permissionId: 21, permissionName: "Vendors.Edit", name: "Vendors.Edit", module: "Vendors", description: "Allows editing existing vendors" },
  { permissionId: 22, permissionName: "Vendors.Delete", name: "Vendors.Delete", module: "Vendors", description: "Allows deleting vendors" },

  // Users
  { permissionId: 23, permissionName: "Users.View", name: "Users.View", module: "Users", description: "Allows viewing user accounts" },
  { permissionId: 24, permissionName: "Users.Create", name: "Users.Create", module: "Users", description: "Allows creating user accounts" },
  { permissionId: 25, permissionName: "Users.Edit", name: "Users.Edit", module: "Users", description: "Allows editing user accounts" },
  { permissionId: 26, permissionName: "Users.Delete", name: "Users.Delete", module: "Users", description: "Allows deleting user accounts" },

  // Roles
  { permissionId: 27, permissionName: "Roles.View", name: "Roles.View", module: "Roles", description: "Allows viewing roles and permissions" },
  { permissionId: 28, permissionName: "Roles.Create", name: "Roles.Create", module: "Roles", description: "Allows creating new roles" },
  { permissionId: 29, permissionName: "Roles.Edit", name: "Roles.Edit", module: "Roles", description: "Allows editing roles and modifying permissions" },
  { permissionId: 30, permissionName: "Roles.Delete", name: "Roles.Delete", module: "Roles", description: "Allows deleting roles" },

  // Sales Orders
  { permissionId: 31, permissionName: "SalesOrders.View", name: "SalesOrders.View", module: "SalesOrders", description: "Allows viewing sales orders" },
  { permissionId: 32, permissionName: "SalesOrders.Create", name: "SalesOrders.Create", module: "SalesOrders", description: "Allows creating sales orders" },
  { permissionId: 33, permissionName: "SalesOrders.Edit", name: "SalesOrders.Edit", module: "SalesOrders", description: "Allows editing sales orders" },
  { permissionId: 34, permissionName: "SalesOrders.Delete", name: "SalesOrders.Delete", module: "SalesOrders", description: "Allows deleting sales orders" },
  { permissionId: 35, permissionName: "SalesOrders.Approve", name: "SalesOrders.Approve", module: "SalesOrders", description: "Allows approving sales orders" },

  // Quotations
  { permissionId: 36, permissionName: "Quotations.View", name: "Quotations.View", module: "Quotations", description: "Allows viewing quotations" },
  { permissionId: 37, permissionName: "Quotations.Create", name: "Quotations.Create", module: "Quotations", description: "Allows creating quotations" },
  { permissionId: 38, permissionName: "Quotations.Edit", name: "Quotations.Edit", module: "Quotations", description: "Allows editing quotations" },
  { permissionId: 39, permissionName: "Quotations.Delete", name: "Quotations.Delete", module: "Quotations", description: "Allows deleting quotations" },
  { permissionId: 40, permissionName: "Quotations.Convert", name: "Quotations.Convert", module: "Quotations", description: "Allows converting quotations to sales orders" },

  // Proforma Invoices
  { permissionId: 41, permissionName: "ProformaInvoices.View", name: "ProformaInvoices.View", module: "ProformaInvoices", description: "Allows viewing proforma invoices" },
  { permissionId: 42, permissionName: "ProformaInvoices.Create", name: "ProformaInvoices.Create", module: "ProformaInvoices", description: "Allows creating proforma invoices" },
  { permissionId: 43, permissionName: "ProformaInvoices.Edit", name: "ProformaInvoices.Edit", module: "ProformaInvoices", description: "Allows editing proforma invoices" },
  { permissionId: 44, permissionName: "ProformaInvoices.Delete", name: "ProformaInvoices.Delete", module: "ProformaInvoices", description: "Allows deleting proforma invoices" },
  { permissionId: 45, permissionName: "ProformaInvoices.Convert", name: "ProformaInvoices.Convert", module: "ProformaInvoices", description: "Allows converting proforma invoices to sales orders" },

  // Purchase Orders
  { permissionId: 46, permissionName: "PurchaseOrders.View", name: "PurchaseOrders.View", module: "PurchaseOrders", description: "Allows viewing purchase orders" },
  { permissionId: 47, permissionName: "PurchaseOrders.Create", name: "PurchaseOrders.Create", module: "PurchaseOrders", description: "Allows creating purchase orders" },
  { permissionId: 48, permissionName: "PurchaseOrders.Edit", name: "PurchaseOrders.Edit", module: "PurchaseOrders", description: "Allows editing purchase orders" },
  { permissionId: 49, permissionName: "PurchaseOrders.Delete", name: "PurchaseOrders.Delete", module: "PurchaseOrders", description: "Allows deleting purchase orders" },

  // Inventory
  { permissionId: 50, permissionName: "Inventory.View", name: "Inventory.View", module: "Inventory", description: "Allows viewing stock levels" },
  { permissionId: 51, permissionName: "Inventory.Adjust", name: "Inventory.Adjust", module: "Inventory", description: "Allows manual adjustment of stock levels" },

  // Warehouses
  { permissionId: 52, permissionName: "Warehouses.View", name: "Warehouses.View", module: "Warehouses", description: "Allows viewing warehouses" },
  { permissionId: 53, permissionName: "Warehouses.Create", name: "Warehouses.Create", module: "Warehouses", description: "Allows creating warehouses" },
  { permissionId: 54, permissionName: "Warehouses.Edit", name: "Warehouses.Edit", module: "Warehouses", description: "Allows editing warehouses" },
  { permissionId: 55, permissionName: "Warehouses.Delete", name: "Warehouses.Delete", module: "Warehouses", description: "Allows deleting warehouses" },

  // Stock Inward
  { permissionId: 56, permissionName: "StockInward.View", name: "StockInward.View", module: "StockInward", description: "Allows viewing stock inward entries" },
  { permissionId: 57, permissionName: "StockInward.Create", name: "StockInward.Create", module: "StockInward", description: "Allows creating stock inward entries" },
  { permissionId: 58, permissionName: "StockInward.Edit", name: "StockInward.Edit", module: "StockInward", description: "Allows editing stock inward entries" },

  // Order Outward
  { permissionId: 59, permissionName: "OrderOutward.View", name: "OrderOutward.View", module: "OrderOutward", description: "Allows viewing outward orders" },
  { permissionId: 60, permissionName: "OrderOutward.Create", name: "OrderOutward.Create", module: "OrderOutward", description: "Allows creating outward orders" },
  { permissionId: 61, permissionName: "OrderOutward.Edit", name: "OrderOutward.Edit", module: "OrderOutward", description: "Allows editing outward orders" },
  { permissionId: 62, permissionName: "OrderOutward.Delete", name: "OrderOutward.Delete", module: "OrderOutward", description: "Allows deleting outward orders" },
  { permissionId: 63, permissionName: "OrderOutward.Override", name: "OrderOutward.Override", module: "OrderOutward", description: "Allows overriding the strict state machine for order dispatch (Super Admin view)" },

  // Dispatch
  { permissionId: 64, permissionName: "Dispatch.View", name: "Dispatch.View", module: "Dispatch", description: "Allows viewing dispatches" },
  { permissionId: 65, permissionName: "Dispatch.Create", name: "Dispatch.Create", module: "Dispatch", description: "Allows creating dispatches" },
  { permissionId: 66, permissionName: "Dispatch.Edit", name: "Dispatch.Edit", module: "Dispatch", description: "Allows editing dispatches" },
  { permissionId: 67, permissionName: "Dispatch.Delete", name: "Dispatch.Delete", module: "Dispatch", description: "Allows deleting dispatches" },

  // Reports
  { permissionId: 68, permissionName: "Reports.View", name: "Reports.View", module: "Reports", description: "Allows generating and viewing system reports" },

  // Audit Logs
  { permissionId: 69, permissionName: "AuditLogs.View", name: "AuditLogs.View", module: "AuditLogs", description: "Allows viewing system audit logs" },

  // Email Templates
  { permissionId: 70, permissionName: "EmailTemplates.View", name: "EmailTemplates.View", module: "EmailTemplates", description: "Allows viewing email templates" },
  { permissionId: 71, permissionName: "EmailTemplates.Create", name: "EmailTemplates.Create", module: "EmailTemplates", description: "Allows creating email templates" },
  { permissionId: 72, permissionName: "EmailTemplates.Edit", name: "EmailTemplates.Edit", module: "EmailTemplates", description: "Allows editing email templates" },
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
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ALLOTTED" | "UNASSIGNED">("ALL")

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
    setStatusFilter("ALL")

    try {
      const assigned: any = await rolesApi.getRolePermissions(role.roleId)
      const raw = Array.isArray(assigned)
        ? assigned
        : Array.isArray(assigned?.data)
          ? assigned.data
          : Array.isArray(assigned?.data?.data)
            ? assigned.data.data
            : []

      const permissionsPool = allPermissions.length > 0 ? allPermissions : DEFAULT_PERMISSIONS
      const resolvedIds: number[] = []

      if (Array.isArray(raw)) {
        raw.forEach((p: any) => {
          if (typeof p === "number" && !isNaN(p)) {
            resolvedIds.push(p)
            return
          }
          if (typeof p === "string") {
            const num = Number(p.trim())
            if (!isNaN(num) && num > 0) {
              resolvedIds.push(num)
              return
            }
            const cleanStr = p.trim().toLowerCase()
            const matched = permissionsPool.find(
              (ap) =>
                ap.permissionName?.toLowerCase() === cleanStr ||
                ap.name?.toLowerCase() === cleanStr
            )
            if (matched) resolvedIds.push(matched.permissionId)
            return
          }
          if (p && typeof p === "object") {
            const possibleId = p.permissionId ?? p.PermissionId ?? p.id ?? p.Id
            if (possibleId !== undefined && possibleId !== null && !isNaN(Number(possibleId))) {
              resolvedIds.push(Number(possibleId))
              return
            }
            const nameStr = (p.permissionName || p.PermissionName || p.name || p.Name || "")
              .toString()
              .trim()
              .toLowerCase()
            if (nameStr) {
              const matched = permissionsPool.find(
                (ap) =>
                  ap.permissionName?.toLowerCase() === nameStr ||
                  ap.name?.toLowerCase() === nameStr
              )
              if (matched) resolvedIds.push(matched.permissionId)
            }
          }
        })
      }

      setRolePermissions(Array.from(new Set(resolvedIds)))
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
      
      // Notify active auth sessions and window listeners to refresh live permissions
      window.dispatchEvent(new Event("tejco_permissions_updated"))
      
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

    const query = permSearch.trim().toLowerCase()
    const result: Record<string, RolePermission[]> = {}

    Object.entries(base).forEach(([moduleName, perms]) => {
      const matching = perms.filter((p) => {
        // Status filter (Allotted vs Unassigned)
        const isAllotted = rolePermissions.includes(p.permissionId)
        if (statusFilter === "ALLOTTED" && !isAllotted) return false
        if (statusFilter === "UNASSIGNED" && isAllotted) return false

        // Search query filter
        if (query) {
          return (
            p.permissionName?.toLowerCase().includes(query) ||
            p.name?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query) ||
            moduleName.toLowerCase().includes(query)
          )
        }
        return true
      })

      if (matching.length > 0) {
        result[moduleName] = matching
      }
    })
    return result
  }, [permissionsByModule, permSearch, selectedModuleFilter, statusFilter, rolePermissions])

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

            {/* Toolbar: Search, Status Filter & Global Batch Toggles */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
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

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60 self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${statusFilter === "ALL"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  All ({allPermissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALLOTTED")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${statusFilter === "ALLOTTED"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40"
                    }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Allotted ({rolePermissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("UNASSIGNED")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${statusFilter === "UNASSIGNED"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Unassigned ({Math.max(0, allPermissions.length - rolePermissions.length)})
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllPermissions}
                  className="text-xs h-9 flex-1 sm:flex-initial text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium"
                >
                  <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Select All ({allPermissions.length})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllPermissions}
                  className="text-xs h-9 flex-1 sm:flex-initial text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium"
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
              <div className="py-24 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
                <Search className="h-8 w-8 text-muted-foreground/50" />
                <span className="text-sm font-medium">
                  {statusFilter === "ALLOTTED"
                    ? "No permissions are currently allotted to this role."
                    : statusFilter === "UNASSIGNED"
                      ? "All permissions are assigned to this role."
                      : `No permissions match "${permSearch}".`}
                </span>
                {(selectedModuleFilter !== "ALL" || statusFilter !== "ALL" || permSearch) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedModuleFilter("ALL")
                      setStatusFilter("ALL")
                      setPermSearch("")
                    }}
                    className="text-xs text-indigo-600 border-indigo-200"
                  >
                    Reset all filters
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
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 border ${activeCount === modulePermIds.length
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : activeCount > 0
                                ? "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300"
                                : "bg-muted text-muted-foreground border-border/60"
                              }`}
                          >
                            {activeCount} of {modulePermIds.length} Allotted
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

                    {/* Responsive Card Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 p-4 sm:p-5 bg-muted/5">
                      {perms.map((perm) => {
                        const isChecked = rolePermissions.includes(perm.permissionId)

                        return (
                          <div
                            key={perm.permissionId}
                            onClick={() => handleTogglePermission(perm.permissionId)}
                            className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 select-none ${isChecked
                              ? "bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-white dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-background border-emerald-300 dark:border-emerald-700 shadow-xs ring-1 ring-emerald-500/20 border-l-4 border-l-emerald-600 dark:border-l-emerald-400"
                              : "bg-card/70 hover:bg-card border-border/70 hover:border-border hover:shadow-2xs border-l-4 border-l-transparent"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-semibold text-xs sm:text-sm ${isChecked ? "text-emerald-950 dark:text-emerald-200" : "text-foreground"
                                    }`}>
                                    {perm.name || perm.permissionName}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] font-mono px-1.5 py-0 h-4.5 rounded ${isChecked
                                      ? "bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold"
                                      : "bg-muted/80 text-muted-foreground border-border/60"
                                      }`}
                                  >
                                    ID #{perm.permissionId}
                                  </Badge>
                                </div>
                                <code className="text-[11px] font-mono text-muted-foreground block truncate">
                                  {perm.permissionName}
                                </code>
                                {perm.description && (
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                    {perm.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                <Switch
                                  checked={isChecked}
                                  onCheckedChange={() => handleTogglePermission(perm.permissionId)}
                                  className={isChecked ? "data-[state=checked]:bg-emerald-600" : ""}
                                />
                                {isChecked ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/90 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                                    <CheckCircle2 className="h-3 w-3" /> Allotted
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                                    Not Allotted
                                  </span>
                                )}
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
          <DialogFooter className="py-4 px-8 sm:px-6 mb-0 border-t bg-background flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-sm  ">
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
