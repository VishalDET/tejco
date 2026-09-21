/**
 * RBAC Helper Utilities and Permission Definitions for Tejco ERP
 */

export const Permissions = {
  // Dashboard
  DASHBOARD_VIEW: "Dashboard.View",

  // Products & Inventory
  PRODUCTS_VIEW: "Products.View",
  PRODUCTS_MASKED_VIEW: "Products.MaskedView",
  PRODUCTS_CREATE: "Products.Create",
  PRODUCTS_EDIT: "Products.Edit",
  PRODUCTS_DELETE: "Products.Delete",

  // Clients / Stakeholders
  CLIENTS_VIEW: "Clients.View",
  CLIENTS_CREATE: "Clients.Create",
  CLIENTS_EDIT: "Clients.Edit",
  CLIENTS_DELETE: "Clients.Delete",

  // Sales Orders & Quotations
  SALES_ORDERS_VIEW: "SalesOrders.View",
  SALES_ORDERS_CREATE: "SalesOrders.Create",
  SALES_ORDERS_EDIT: "SalesOrders.Edit",
  SALES_ORDERS_DELETE: "SalesOrders.Delete",

  QUOTATIONS_VIEW: "Quotations.View",
  QUOTATIONS_CREATE: "Quotations.Create",
  QUOTATIONS_EDIT: "Quotations.Edit",
  QUOTATIONS_DELETE: "Quotations.Delete",

  INVOICES_VIEW: "Invoices.View",
  PROFORMA_VIEW: "ProformaInvoices.View",

  // Purchases & Vendors
  PURCHASES_VIEW: "Purchases.View",
  PURCHASES_CREATE: "Purchases.Create",
  VENDORS_VIEW: "Vendors.View",
  WAREHOUSES_VIEW: "Warehouses.View",

  // System Setup
  SYSTEM_USERS_VIEW: "System.Users.View",
  SYSTEM_ROLES_VIEW: "System.Roles.View",
  SYSTEM_MASTERS_VIEW: "System.Masters.View",
} as const

export type PermissionKey = string

/**
 * Normalizes raw API response into a deduplicated array of permission strings
 */
export function extractPermissionNames(rawPermissions: any[]): string[] {
  if (!Array.isArray(rawPermissions)) return []
  const names = new Set<string>()

  rawPermissions.forEach((item) => {
    if (!item) return
    if (typeof item === "string" && item.trim()) {
      names.add(item.trim())
    } else if (typeof item === "object") {
      const name = item.permissionName || item.name || item.code
      if (typeof name === "string" && name.trim()) {
        names.add(name.trim())
      }
    }
  })

  return Array.from(names)
}

/**
 * Checks whether user has the specified permission.
 * Supports:
 * - Wildcard "*" (full access, e.g. for superadmin)
 * - Single permission check
 * - Multiple permission check (any or all)
 */
export function checkPermission(
  userPermissions: string[],
  requiredPermission?: string | string[],
  matchAll = false
): boolean {
  if (!requiredPermission) return true
  if (userPermissions.includes("*")) return true

  const normalizedUserPerms = new Set(userPermissions.map((p) => p.toLowerCase()))

  const requiredList = Array.isArray(requiredPermission)
    ? requiredPermission
    : [requiredPermission]

  if (requiredList.length === 0) return true

  if (matchAll) {
    return requiredList.every((req) =>
      normalizedUserPerms.has(req.toLowerCase())
    )
  }

  return requiredList.some((req) =>
    normalizedUserPerms.has(req.toLowerCase())
  )
}
