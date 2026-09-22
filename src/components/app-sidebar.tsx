import * as React from "react"
import { useLocation, Link } from "react-router-dom"
import {
    LayoutDashboard,
    Package,
    Warehouse,
    ShoppingCart,
    ShoppingBag,
    UserRound,
    BarChart3,
    Settings,
    ChevronRight,
} from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface NavSubItem {
    title: string
    url: string
    permission?: string | string[]
}

interface NavItem {
    title: string
    url: string
    icon: any
    permission?: string | string[]
    items?: NavSubItem[]
}

const data: { navMain: NavItem[] } = {
    navMain: [
        {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
            permission: "Dashboard.View",
        },
        {
            title: "Inventory",
            url: "#",
            icon: Package,
            permission: ["Products.View", "Products.MaskedView", "Products.FullView", "Inventory.View", "StockInward.View", "OrderOutward.View", "Dispatch.View"],
            items: [
                { title: "Products", url: "/inventory/products", permission: ["Products.View", "Products.MaskedView", "Products.FullView"] },
                { title: "Stock Inward", url: "/inventory/stock-inward", permission: ["StockInward.View", "Inventory.StockInward", "Inventory.View"] },
                { title: "Stock Transfer", url: "/inventory/stock-transfer", permission: ["Inventory.Transfer", "Inventory.View", "Warehouses.View"] },
                { title: "Order Outward", url: "/inventory/order-outward", permission: ["OrderOutward.View", "Inventory.Dispatch", "Inventory.View"] },
                { title: "Dispatch Orders", url: "/inventory/dispatch", permission: ["Dispatch.View", "Inventory.Dispatch", "Inventory.View"] },
            ],
        },
        {
            title: "Purchases",
            url: "#",
            icon: ShoppingBag,
            permission: ["PurchaseOrders.View", "Purchases.View"],
            items: [
                { title: "Purchase Orders", url: "/purchase", permission: ["PurchaseOrders.View", "Purchases.View"] },
            ],
        },
        {
            title: "Supply Chain",
            url: "#",
            icon: Warehouse,
            permission: ["Vendors.View", "Warehouses.View"],
            items: [
                { title: "Vendors", url: "/supply-chain/vendors", permission: "Vendors.View" },
                { title: "Warehouse", url: "/supply-chain/warehouse", permission: "Warehouses.View" },
            ],
        },
        {
            title: "Sales & Orders",
            url: "#",
            icon: ShoppingCart,
            permission: ["SalesOrders.View", "Quotations.View", "ProformaInvoices.View", "Invoices.View"],
            items: [
                { title: "Sales Dashboard", url: "/sales/dashboard", permission: "SalesOrders.View" },
                { title: "Quotations", url: "/sales/quotations", permission: "Quotations.View" },
                { title: "Proforma Invoices", url: "/sales/proforma-invoices", permission: "ProformaInvoices.View" },
                { title: "Sales Order", url: "/sales/orders", permission: "SalesOrders.View" },
                { title: "Invoices", url: "/sales/invoices", permission: ["Invoices.View", "SalesOrders.View", "ProformaInvoices.View"] },
            ],
        },
        {
            title: "Stakeholders",
            url: "#",
            icon: UserRound,
            permission: "Clients.View",
            items: [
                { title: "Doctors / Clients", url: "/stakeholders/clients", permission: "Clients.View" },
            ],
        },
        {
            title: "Intelligence",
            url: "#",
            icon: BarChart3,
            permission: "Reports.View",
            items: [
                { title: "Reports", url: "/intelligence/reports", permission: "Reports.View" },
            ],
        },
        {
            title: "System Setup",
            url: "#",
            icon: Settings,
            permission: ["Users.View", "Roles.View", "Masters.View", "Categories.View", "System.Users.View", "System.Roles.View", "System.Masters.View"],
            items: [
                { title: "Companies", url: "/system/masters/companies", permission: ["Masters.View", "System.Masters.View"] },
                { title: "Branches", url: "/system/masters/branches", permission: ["Masters.View", "System.Masters.View"] },
                { title: "Departments", url: "/system/masters/departments", permission: ["Masters.View", "System.Masters.View"] },
                { title: "Categories", url: "/system/masters/categories", permission: ["Categories.View", "Masters.View", "System.Masters.View"] },
                { title: "Countries", url: "/system/masters/countries", permission: ["Masters.View", "System.Masters.View"] },
                { title: "Users & Employees", url: "/system/users", permission: ["Users.View", "System.Users.View"] },
                { title: "Roles & Permissions", url: "/system/roles", permission: ["Roles.View", "System.Roles.View"] },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const location = useLocation()
    const pathname = location.pathname
    const { hasPermission, permissions, user } = useAuth()

    // Filter nav items strictly based on user permissions
    const visibleNavItems = React.useMemo(() => {
        // Super-admin / roleId 1 / wildcard bypass
        if (permissions.includes("*") || user?.roleId === 1 || user?.role?.toLowerCase() === "administrator") {
            return data.navMain
        }

        const activePermissions = permissions && permissions.length > 0 
            ? permissions 
            : (user?.permissions && user.permissions.length > 0 ? user.permissions : [])

        return data.navMain
            .map((item) => {
                // If item has sub-items, filter visible sub-items strictly
                if (item.items && item.items.length > 0) {
                    const visibleSubItems = item.items.filter((sub) => {
                        if (!sub.permission) return true
                        if (activePermissions.length === 0) return false
                        return hasPermission(sub.permission)
                    })
                    // If no sub-items are visible/allowed, hide the entire parent menu
                    if (visibleSubItems.length === 0) return null
                    return { ...item, items: visibleSubItems }
                }

                // Direct item (e.g. Dashboard)
                if (item.permission) {
                    if (activePermissions.length === 0) return null
                    if (!hasPermission(item.permission)) {
                        return null
                    }
                }
                return item
            })
            .filter((item): item is NavItem => item !== null)
    }, [hasPermission, permissions, user])

    function NavMainItem({ item, pathname }: { item: any; pathname: string | null }) {
        const hasActiveSubItem = item.items?.some((subItem: any) =>
            pathname === subItem.url || (subItem.url !== "/" && pathname?.startsWith(subItem.url))
        )
        const isDirectActive = item.url === pathname
        const isActive = isDirectActive || hasActiveSubItem

        const [open, setOpen] = React.useState(isActive)

        React.useEffect(() => {
            if (isActive) setOpen(true)
        }, [isActive])

        // Single direct nav item (e.g. Dashboard)
        if (!item.items) {
            return (
                <SidebarMenuItem className="px-3 my-1">
                    <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                            isActive
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-slate-700 dark:text-slate-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/70 font-medium"
                        }`}
                        render={<Link to={item.url} />}
                    >
                        {item.icon && (
                            <item.icon
                                className={`h-5 w-5 shrink-0 transition-colors ${
                                    isActive ? "text-primary-foreground" : "text-slate-500 dark:text-slate-400 group-hover:text-foreground"
                                }`}
                            />
                        )}
                        <span className="text-[14px] leading-snug flex-1">{item.title}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )
        }

        // Collapsible parent nav item with sub-items
        return (
            <Collapsible
                key={item.title}
                open={open}
                onOpenChange={setOpen}
                className="group/collapsible px-3 my-1"
                render={<SidebarMenuItem />}
            >
                <CollapsibleTrigger
                    render={
                        <SidebarMenuButton
                            tooltip={item.title}
                            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                                isActive
                                    ? "bg-primary/10 text-primary dark:bg-primary/20 font-semibold"
                                    : "text-slate-700 dark:text-slate-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/70 font-medium"
                            }`}
                        >
                            {item.icon && (
                                <item.icon
                                    className={`h-5 w-5 shrink-0 transition-colors ${
                                        isActive ? "text-primary" : "text-slate-500 dark:text-slate-400"
                                    }`}
                                />
                            )}
                            <span className="text-[14px] leading-snug flex-1 text-left">{item.title}</span>
                            <ChevronRight className="h-4 w-4 shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                    }
                />
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <SidebarMenuSub className="border-l-2 border-slate-200 dark:border-slate-800 ml-5 pl-3.5 py-1.5 my-1 space-y-1">
                        {item.items.map((subItem: any) => {
                            const isSubActive = pathname === subItem.url || (subItem.url !== "/" && pathname?.startsWith(subItem.url))
                            return (
                                <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                        size="md"
                                        isActive={isSubActive}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13.5px] transition-all duration-200 ${
                                            isSubActive
                                                ? "bg-primary/15 text-primary dark:bg-primary/25 font-semibold"
                                                : "text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium"
                                        }`}
                                        render={<Link to={subItem.url} />}
                                    >
                                        <span className="truncate">{subItem.title}</span>
                                        {isSubActive && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 ml-2" />
                                        )}
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            )
                        })}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
        )
    }

    return (
        <Sidebar collapsible="icon" className="border-r border-border/80 bg-card shadow-xs" {...props}>
            {/* Header with Logo */}
            <SidebarHeader className="py-4 px-4 border-b border-border/60">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default h-auto p-0 flex items-center gap-3">
                            <div className="flex h-11 w-auto items-center justify-center">
                                <img
                                    src="/assets/images/tejco_sidebar_logo.png"
                                    alt="Tejco Logo"
                                    className="h-10 w-auto object-contain transition-transform hover:scale-[1.02] duration-300 ease-out"
                                />
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Navigation Menu */}
            <SidebarContent className="py-3 overflow-y-auto custom-scrollbar">
                <SidebarMenu>
                    {visibleNavItems.map((item) => (
                        <NavMainItem key={item.title} item={item} pathname={pathname} />
                    ))}
                </SidebarMenu>
            </SidebarContent>

            {/* Footer with System Status & Branding */}
            <SidebarFooter className="p-3 border-t border-border/60">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30">
                            <div className="grid flex-1 text-left leading-tight min-w-0">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Tejco Platform</span>
                                <a
                                    href="https://www.digitaledgetech.in/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-foreground hover:text-primary hover:underline truncate mt-0.5"
                                >
                                    Digital Edge Technologies
                                </a>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
                            </div>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
