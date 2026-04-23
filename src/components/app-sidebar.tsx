"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    Boxes,
    Users,
    Warehouse,
    Factory,
    ArrowLeftRight,
    ShoppingCart,
    UserRound,
    Users2,
    FileText,
    Receipt,
    BarChart3,
    Settings,
    ChevronRight,
    Search,
    Bell,
    Plus,
    Megaphone,
} from "lucide-react"

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
    SidebarProvider,
    SidebarRail,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
            isActive: true,
        },
        {
            title: "Inventory",
            url: "#",
            icon: Package,
            items: [
                { title: "Products", url: "/inventory/products" },
                { title: "Raw Materials", url: "/inventory/raw-materials" },
                { title: "Stock Transfer", url: "/inventory/stock-transfer" },
            ],
        },
        {
            title: "Supply Chain",
            url: "#",
            icon: Warehouse,
            items: [
                { title: "Vendors", url: "/supply-chain/vendors" },
                { title: "Warehouse", url: "/supply-chain/warehouse" },
            ],
        },
        {
            title: "Manufacturing",
            url: "#",
            icon: Factory,
            items: [
                { title: "Production Orders", url: "/manufacturing/orders" },
                { title: "Batches", url: "/manufacturing/batches" },
            ],
        },
        {
            title: "Sales & Orders",
            url: "#",
            icon: ShoppingCart,
            items: [
                { title: "Quotations", url: "/sales/quotations" },
                { title: "Proforma Invoices", url: "/sales/proforma-invoices" },
                { title: "Orders", url: "/sales/orders" },
                { title: "Invoices", url: "/sales/invoices" },
                { title: "Challans", url: "/sales/challans" },
            ],
        },
        {
            title: "Stakeholders",
            url: "#",
            icon: UserRound,
            items: [
                { title: "Doctors / Clients", url: "/stakeholders/clients" },
                { title: "Sales Team", url: "/stakeholders/sales-team" },
            ],
        },
        {
            title: "Marketing",
            url: "#",
            icon: Megaphone,
            items: [
                { title: "Campaigns", url: "/marketing" },
                { title: "Templates", url: "/marketing/templates" },
            ],
        },
        {
            title: "Intelligence",
            url: "#",
            icon: BarChart3,
            items: [
                { title: "Reports", url: "/intelligence/reports" },
                { title: "Analytics", url: "/intelligence/analytics" },
            ],
        },
        {
            title: "System Setup",
            url: "#",
            icon: Settings,
            items: [
                { title: "Companies", url: "/system/masters/companies" },
                { title: "Branches", url: "/system/masters/branches" },
                { title: "Departments", url: "/system/masters/departments" },
                { title: "Categories", url: "/system/masters/categories" },
                { title: "Users & Employees", url: "/system/masters/users" },
                { title: "General Settings", url: "/system/settings" },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-b">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Boxes className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">Tejco ERP</span>
                                <span className="truncate text-xs">Enterprise Suite</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {data.navMain.map((item) => {
                        const isActive =
                            item.url === pathname ||
                            (item.items?.some((subItem) => pathname?.startsWith(subItem.url)));

                        return (
                            <Collapsible
                                key={item.title}
                                defaultOpen={isActive}
                                className="group/collapsible"
                                render={<SidebarMenuItem />}
                            >
                                <CollapsibleTrigger
                                    render={
                                        <SidebarMenuButton tooltip={item.title} className="group/trigger">
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                            {item.items && (
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[panel-open]/trigger:rotate-90 group-data-[state=open]/trigger:rotate-90 group-data-open/trigger:rotate-90 group-data-[state=open]/collapsible:rotate-90" />
                                            )}
                                        </SidebarMenuButton>
                                    }
                                />
                                {item.items && (
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton href={subItem.url}>
                                                        <span>{subItem.title}</span>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                )}
                            </Collapsible>
                        )
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Users className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">Admin User</span>
                                <span className="truncate text-xs">admin@tejco.com</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
