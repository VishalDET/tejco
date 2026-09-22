/**
 * RBAC Helper Utilities and Permission Definitions for Tejco ERP
 */

export const Permissions = {
  // Dashboard
  DASHBOARD_VIEW: "Dashboard.View",

  // Products
  PRODUCTS_VIEW: "Products.View",
  PRODUCTS_FULL_VIEW: "Products.FullView",
  PRODUCTS_MASKED_VIEW: "Products.MaskedView",
  PRODUCTS_CREATE: "Products.Create",
  PRODUCTS_EDIT: "Products.Edit",
  PRODUCTS_DELETE: "Products.Delete",

  // Categories
  CATEGORIES_VIEW: "Categories.View",
  CATEGORIES_CREATE: "Categories.Create",
  CATEGORIES_EDIT: "Categories.Edit",
  CATEGORIES_DELETE: "Categories.Delete",

  // System Masters
  MASTERS_VIEW: "Masters.View",
  MASTERS_CREATE: "Masters.Create",
  MASTERS_EDIT: "Masters.Edit",

  // Clients / Stakeholders
  CLIENTS_VIEW: "Clients.View",
  CLIENTS_CREATE: "Clients.Create",
  CLIENTS_EDIT: "Clients.Edit",
  CLIENTS_DELETE: "Clients.Delete",

  // Vendors
  VENDORS_VIEW: "Vendors.View",
  VENDORS_CREATE: "Vendors.Create",
  VENDORS_EDIT: "Vendors.Edit",
  VENDORS_DELETE: "Vendors.Delete",

  // Users
  USERS_VIEW: "Users.View",
  USERS_CREATE: "Users.Create",
  USERS_EDIT: "Users.Edit",
  USERS_DELETE: "Users.Delete",

  // Roles
  ROLES_VIEW: "Roles.View",
  ROLES_CREATE: "Roles.Create",
  ROLES_EDIT: "Roles.Edit",
  ROLES_DELETE: "Roles.Delete",

  // Sales Orders
  SALES_ORDERS_VIEW: "SalesOrders.View",
  SALES_ORDERS_CREATE: "SalesOrders.Create",
  SALES_ORDERS_EDIT: "SalesOrders.Edit",
  SALES_ORDERS_DELETE: "SalesOrders.Delete",
  SALES_ORDERS_APPROVE: "SalesOrders.Approve",

  // Quotations
  QUOTATIONS_VIEW: "Quotations.View",
  QUOTATIONS_CREATE: "Quotations.Create",
  QUOTATIONS_EDIT: "Quotations.Edit",
  QUOTATIONS_DELETE: "Quotations.Delete",
  QUOTATIONS_CONVERT: "Quotations.Convert",

  // Proforma Invoices
  PROFORMA_INVOICES_VIEW: "ProformaInvoices.View",
  PROFORMA_INVOICES_CREATE: "ProformaInvoices.Create",
  PROFORMA_INVOICES_EDIT: "ProformaInvoices.Edit",
  PROFORMA_INVOICES_DELETE: "ProformaInvoices.Delete",
  PROFORMA_INVOICES_CONVERT: "ProformaInvoices.Convert",

  // Purchase Orders
  PURCHASE_ORDERS_VIEW: "PurchaseOrders.View",
  PURCHASE_ORDERS_CREATE: "PurchaseOrders.Create",
  PURCHASE_ORDERS_EDIT: "PurchaseOrders.Edit",
  PURCHASE_ORDERS_DELETE: "PurchaseOrders.Delete",

  // Inventory
  INVENTORY_VIEW: "Inventory.View",
  INVENTORY_ADJUST: "Inventory.Adjust",

  // Warehouses
  WAREHOUSES_VIEW: "Warehouses.View",
  WAREHOUSES_CREATE: "Warehouses.Create",
  WAREHOUSES_EDIT: "Warehouses.Edit",
  WAREHOUSES_DELETE: "Warehouses.Delete",

  // Stock Inward
  STOCK_INWARD_VIEW: "StockInward.View",
  STOCK_INWARD_CREATE: "StockInward.Create",
  STOCK_INWARD_EDIT: "StockInward.Edit",

  // Order Outward
  ORDER_OUTWARD_VIEW: "OrderOutward.View",
  ORDER_OUTWARD_CREATE: "OrderOutward.Create",
  ORDER_OUTWARD_EDIT: "OrderOutward.Edit",
  ORDER_OUTWARD_DELETE: "OrderOutward.Delete",
  ORDER_OUTWARD_OVERRIDE: "OrderOutward.Override",

  // Dispatch
  DISPATCH_VIEW: "Dispatch.View",
  DISPATCH_CREATE: "Dispatch.Create",
  DISPATCH_EDIT: "Dispatch.Edit",
  DISPATCH_DELETE: "Dispatch.Delete",

  // Reports
  REPORTS_VIEW: "Reports.View",

  // Audit Logs
  AUDIT_LOGS_VIEW: "AuditLogs.View",

  // Email Templates
  EMAIL_TEMPLATES_VIEW: "EmailTemplates.View",
  EMAIL_TEMPLATES_CREATE: "EmailTemplates.Create",
  EMAIL_TEMPLATES_EDIT: "EmailTemplates.Edit",

  // Backward compatibility / UI convenience aliases
  SYSTEM_USERS_VIEW: "Users.View",
  SYSTEM_ROLES_VIEW: "Roles.View",
  SYSTEM_MASTERS_VIEW: "Masters.View",
  PURCHASES_VIEW: "PurchaseOrders.View",
  PURCHASES_CREATE: "PurchaseOrders.Create",
  INVOICES_VIEW: "SalesOrders.View",
  PROFORMA_VIEW: "ProformaInvoices.View",
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
 * Permission alias dictionary ensuring bidirectional compatibility between
 * different UI names and API naming conventions.
 */
const PERMISSION_EQUIVALENTS: Record<string, string[]> = {
  "dashboard.view": ["dashboard.view", "dashboard"],

  "products.view": [
    "products.view",
    "products.fullview",
    "products.maskedview",
    "products.create",
    "products.edit",
    "products.delete",
  ],
  "products.maskedview": ["products.maskedview", "products.view", "products.fullview"],
  "products.fullview": ["products.fullview", "products.view"],
  "products.create": ["products.create"],
  "products.edit": ["products.edit"],
  "products.delete": ["products.delete"],

  "purchases.view": [
    "purchaseorders.view",
    "purchaseorders.create",
    "purchaseorders.edit",
    "purchaseorders.delete",
    "purchases.view",
    "purchasing.view",
  ],
  "purchaseorders.view": [
    "purchaseorders.view",
    "purchaseorders.create",
    "purchaseorders.edit",
    "purchaseorders.delete",
    "purchases.view",
    "purchasing.view",
  ],
  "purchases.create": ["purchaseorders.create", "purchases.create", "purchasing.create"],
  "purchaseorders.create": ["purchaseorders.create", "purchases.create", "purchasing.create"],
  "purchases.edit": ["purchaseorders.edit", "purchases.edit"],
  "purchaseorders.edit": ["purchaseorders.edit", "purchases.edit"],
  "purchases.delete": ["purchaseorders.delete", "purchases.delete"],
  "purchaseorders.delete": ["purchaseorders.delete", "purchases.delete"],

  "system.users.view": ["users.view", "users.create", "users.edit", "users.delete", "system.users.view"],
  "users.view": ["users.view", "users.create", "users.edit", "users.delete", "system.users.view"],
  "users.create": ["users.create", "system.users.create"],
  "users.edit": ["users.edit", "system.users.edit"],
  "users.delete": ["users.delete", "system.users.delete"],

  "system.roles.view": ["roles.view", "roles.create", "roles.edit", "roles.delete", "system.roles.view"],
  "roles.view": ["roles.view", "roles.create", "roles.edit", "roles.delete", "system.roles.view"],
  "roles.create": ["roles.create", "system.roles.create"],
  "roles.edit": ["roles.edit", "system.roles.edit"],
  "roles.delete": ["roles.delete", "system.roles.delete"],

  "system.masters.view": [
    "masters.view",
    "masters.create",
    "masters.edit",
    "categories.view",
    "categories.create",
    "categories.edit",
    "system.masters.view",
  ],
  "masters.view": [
    "masters.view",
    "masters.create",
    "masters.edit",
    "system.masters.view",
  ],
  "categories.view": [
    "categories.view",
    "categories.create",
    "categories.edit",
    "categories.delete",
    "masters.view",
    "system.masters.view",
  ],

  "inventory.stockinward": [
    "stockinward.view",
    "stockinward.create",
    "stockinward.edit",
    "inventory.stockinward",
    "inventory.view",
  ],
  "stockinward.view": [
    "stockinward.view",
    "stockinward.create",
    "stockinward.edit",
    "inventory.stockinward",
  ],
  "inventory.dispatch": [
    "orderoutward.view",
    "orderoutward.create",
    "orderoutward.edit",
    "dispatch.view",
    "dispatch.create",
    "dispatch.edit",
    "inventory.dispatch",
    "inventory.view",
  ],
  "orderoutward.view": [
    "orderoutward.view",
    "orderoutward.create",
    "orderoutward.edit",
    "orderoutward.delete",
    "orderoutward.override",
    "inventory.dispatch",
  ],
  "dispatch.view": [
    "dispatch.view",
    "dispatch.create",
    "dispatch.edit",
    "dispatch.delete",
    "inventory.dispatch",
  ],
  "inventory.transfer": [
    "inventory.transfer",
    "inventory.view",
    "warehouses.view",
    "inventory.adjust",
  ],
  "inventory.view": [
    "inventory.view",
    "inventory.adjust",
    "products.view",
    "products.fullview",
    "products.maskedview",
  ],

  "invoices.view": [
    "invoices.view",
    "salesorders.view",
    "salesorders.create",
    "proformainvoices.view",
    "proformainvoices.create",
  ],
  "proformainvoices.view": [
    "proformainvoices.view",
    "proformainvoices.create",
    "proformainvoices.edit",
    "proformainvoices.delete",
    "proformainvoices.convert",
    "salesorders.view",
  ],
  "salesorders.view": [
    "salesorders.view",
    "salesorders.create",
    "salesorders.edit",
    "salesorders.delete",
    "salesorders.approve",
  ],
  "quotations.view": [
    "quotations.view",
    "quotations.create",
    "quotations.edit",
    "quotations.delete",
    "quotations.convert",
  ],
  "clients.view": [
    "clients.view",
    "clients.create",
    "clients.edit",
    "clients.delete",
  ],
  "vendors.view": [
    "vendors.view",
    "vendors.create",
    "vendors.edit",
    "vendors.delete",
  ],
  "warehouses.view": [
    "warehouses.view",
    "warehouses.create",
    "warehouses.edit",
    "warehouses.delete",
  ],
  "reports.view": ["reports.view", "auditlogs.view"],
  "auditlogs.view": ["auditlogs.view", "system.audit"],
  "emailtemplates.view": [
    "emailtemplates.view",
    "emailtemplates.create",
    "emailtemplates.edit",
  ],
}

/**
 * Checks whether user has the specified permission.
 * Supports:
 * - Wildcard "*" (full access, e.g. for superadmin)
 * - Single permission check
 * - Multiple permission check (any or all)
 * - Automatic alias expansion
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

  const hasPermMatch = (req: string): boolean => {
    const lowerReq = req.toLowerCase()
    if (normalizedUserPerms.has(lowerReq)) return true

    // Check alias equivalents
    const equivalents = PERMISSION_EQUIVALENTS[lowerReq]
    if (equivalents && equivalents.some((eq) => normalizedUserPerms.has(eq))) {
      return true
    }

    return false
  }

  if (matchAll) {
    return requiredList.every(hasPermMatch)
  }

  return requiredList.some(hasPermMatch)
}
