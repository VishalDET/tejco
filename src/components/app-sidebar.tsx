"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
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
                { title: "Order Outward", url: "/inventory/order-outward" },
                { title: "Dispatch Orders", url: "/inventory/dispatch" },
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
                { title: "Countries", url: "/system/masters/countries" },
                { title: "Users & Employees", url: "/system/masters/users" },
                { title: "General Settings", url: "/system/settings" },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    function NavMainItem({ item, pathname }: { item: any; pathname: string | null }) {
        const isActive =
            item.url === pathname ||
            (item.items?.some((subItem: any) => pathname === subItem.url));

        const [open, setOpen] = React.useState(isActive)

        // Sync open state when path changes externally (e.g. navigation)
        React.useEffect(() => {
            if (isActive) setOpen(true)
        }, [isActive])

        if (!item.items) {
            return (
                <SidebarMenuItem className="px-2 my-0.5">
                    <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        className={`transition-all duration-200 ease-in-out hover:translate-x-1 hover:bg-indigo-50 hover:text-indigo-600 rounded-md py-2.5 ${isActive ? 'bg-indigo-50/80 text-indigo-600 font-semibold shadow-sm' : 'text-slate-600'}`}
                        render={<Link href={item.url} />}
                    >
                        {item.icon && <item.icon className={`transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />}
                        <span>{item.title}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )
        }

        return (
            <Collapsible
                key={item.title}
                open={open}
                onOpenChange={setOpen}
                className="group/collapsible px-2 my-0.5"
                render={<SidebarMenuItem />}
            >
                <CollapsibleTrigger
                    render={
                        <SidebarMenuButton 
                            tooltip={item.title} 
                            className={`group/trigger transition-all duration-200 ease-in-out hover:bg-indigo-50 hover:text-indigo-600 rounded-md py-2.5 ${isActive ? 'text-indigo-600 font-medium' : 'text-slate-600'}`}
                        >
                            {item.icon && <item.icon className={`transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover/trigger:text-indigo-500'}`} />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto opacity-50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-hover/trigger:opacity-100" />
                        </SidebarMenuButton>
                    }
                />
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <SidebarMenuSub className="border-l-2 border-indigo-100/50 pl-4 ml-3 mt-1.5 space-y-1">
                        {item.items.map((subItem: any) => {
                            const isSubActive = pathname === subItem.url;
                            return (
                                <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                        isActive={isSubActive}
                                        className={`transition-all duration-200 hover:text-indigo-600 hover:translate-x-0.5 rounded-md ${isSubActive ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`}
                                        render={<Link href={subItem.url} />}
                                    >
                                        <span>{subItem.title}</span>
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
        <Sidebar collapsible="icon" className="border-r shadow-sm bg-white" {...props}>
            <SidebarHeader className="py-4 px-3 border-b border-slate-100">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default">
                            <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md transition-transform hover:scale-105 duration-300 ease-out">
                                <Boxes className="size-5" />
                            </div>
                            <div className="flex flex-1 items-center ml-2">
                                {/* Use Tejco text or logo with proper contrast */}
                                <span className="text-xl font-bold tracking-tight text-slate-900">
                                    Tejco<span className="text-indigo-600">ERP</span>
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="pt-4 overflow-y-auto custom-scrollbar">
                <SidebarMenu>
                    {data.navMain.map((item) => (
                        <NavMainItem key={item.title} item={item} pathname={pathname} />
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-3 border-t border-slate-100">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="rounded-xl transition-all hover:bg-slate-50 hover:shadow-sm">
                            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold">
                                <UserRound className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                                <span className="truncate font-bold text-slate-800">Admin User</span>
                                <span className="truncate text-[11px] font-medium text-slate-500">admin@tejco.com</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
