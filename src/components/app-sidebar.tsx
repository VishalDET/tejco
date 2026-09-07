import * as React from "react"
import { useLocation, Link } from "react-router-dom"
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
                // { title: "Raw Materials", url: "/inventory/raw-materials" },
                { title: "Stock Inward", url: "/inventory/stock-inward" },
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
        // {
        //     title: "Manufacturing",
        //     url: "#",
        //     icon: Factory,
        //     items: [
        //         { title: "Production Orders", url: "/manufacturing/orders" },
        //         { title: "Batches", url: "/manufacturing/batches" },
        //     ],
        // },
        {
            title: "Sales & Orders",
            url: "#",
            icon: ShoppingCart,
            items: [
                { title: "Quotations", url: "/sales/quotations" },
                { title: "Proforma Invoices", url: "/sales/proforma-invoices" },
                { title: "Sales Order", url: "/sales/orders" },
                { title: "Invoices", url: "/sales/invoices" },
                // { title: "Challans", url: "/sales/challans" },
            ],
        },
        {
            title: "Stakeholders",
            url: "#",
            icon: UserRound,
            items: [
                { title: "Doctors / Clients", url: "/stakeholders/clients" },
                // { title: "Sales Team", url: "/stakeholders/sales-team" },
            ],
        },
        // {
        //     title: "Marketing",
        //     url: "#",
        //     icon: Megaphone,
        //     items: [
        //         { title: "Campaigns", url: "/marketing" },
        //         { title: "Templates", url: "/marketing/templates" },
        //     ],
        // },
        {
            title: "Intelligence",
            url: "#",
            icon: BarChart3,
            items: [
                { title: "Reports", url: "/intelligence/reports" },
                // { title: "Analytics", url: "/intelligence/analytics" },
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
                // { title: "General Settings", url: "/system/settings" },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const location = useLocation()
    const pathname = location.pathname

    function NavMainItem({ item, pathname }: { item: any; pathname: string | null }) {
        const isActive =
            item.url === pathname ||
            (item.items?.some((subItem: any) => pathname?.startsWith(subItem.url)));

        const [open, setOpen] = React.useState(isActive)

        // Sync open state when path changes externally (e.g. navigation)
        React.useEffect(() => {
            if (isActive) setOpen(true)
        }, [isActive])

        if (!item.items) {
            return (
                <SidebarMenuItem className="px-2.5 my-0.5">
                    <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        className={`transition-all duration-200 ease-in-out hover:bg-primary/10 hover:text-primary rounded-lg py-2.5 px-3 font-mono text-xs ${isActive
                            ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary'
                            : 'text-slate-600 dark:text-slate-400'
                            }`}
                        render={<Link to={item.url} />}
                    >
                        {item.icon && (
                            <item.icon
                                className={`h-4 w-4 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'
                                    }`}
                            />
                        )}
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
                className="group/collapsible px-2.5 my-0.5"
                render={<SidebarMenuItem />}
            >
                <CollapsibleTrigger
                    render={
                        <SidebarMenuButton
                            tooltip={item.title}
                            className={`group/trigger transition-all duration-200 ease-in-out hover:bg-primary/10 hover:text-primary rounded-lg py-2.5 px-3 font-mono text-xs ${isActive ? 'text-primary font-semibold' : 'text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            {item.icon && (
                                <item.icon
                                    className={`h-4 w-4 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-slate-400 group-hover/trigger:text-primary'
                                        }`}
                                />
                            )}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-hover/trigger:opacity-100" />
                        </SidebarMenuButton>
                    }
                />
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <SidebarMenuSub className="border-l border-slate-200 dark:border-slate-800 pl-3 ml-4 my-1 space-y-0.5">
                        {item.items.map((subItem: any) => {
                            const isSubActive = pathname?.startsWith(subItem.url);
                            return (
                                <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                        size="sm"
                                        isActive={isSubActive}
                                        className={`transition-all duration-200 hover:text-primary hover:bg-primary/5 rounded-md px-2 py-1 text-[11px] font-sans ${isSubActive
                                            ? 'text-primary font-semibold bg-primary/10'
                                            : 'text-slate-500 dark:text-slate-400'
                                            }`}
                                        render={<Link to={subItem.url} />}
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
        <Sidebar collapsible="icon" className="border-r border-slate-200/80 dark:border-slate-800 bg-card shadow-2xs" {...props}>
            <SidebarHeader className="py-0 px-3 border-b border-slate-100 dark:border-slate-800">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default h-full flex items-center">
                            <div className="flex h-full w-auto items-center justify-center overflow-hidden">
                                <img
                                    src="/assets/images/tejco_sidebar_logo.png"
                                    alt="Tejco Logo"
                                    className="h-12 w-auto object-contain transition-transform hover:scale-[1.02] duration-300 ease-out"
                                />
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="py-3 overflow-y-auto custom-scrollbar">
                <SidebarMenu>
                    {data.navMain.map((item) => (
                        <NavMainItem key={item.title} item={item} pathname={pathname} />
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-3 border-t border-slate-100 dark:border-slate-800">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            {/* <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                                <UserRound className="size-4" />
                            </div> */}
                            <div className="grid flex-1 text-left text-xs leading-tight ml-1 font-mono">
                                <span className="truncate text-slate-400 text-[10px] uppercase font-semibold">Developed By</span>
                                <a href="https://www.digitaledgetech.in/" target="_blank" rel="noopener noreferrer" className="truncate font-medium text-slate-700 dark:text-slate-300 hover:text-primary hover:underline cursor-pointer">DIGITAL EDGE TECHONOLOGIES</a>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
