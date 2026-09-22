import * as React from "react"
import { Link, useLocation, Outlet } from "react-router-dom"
import { Building2, GitBranch, LayoutGrid, Layers, ChevronRight, Users, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

const navigation = [
    {
        name: "Companies",
        href: "/system/masters/companies",
        icon: Building2,
        permission: ["Masters.View", "System.Masters.View"],
    },
    {
        name: "Branches",
        href: "/system/masters/branches",
        icon: GitBranch,
        permission: ["Masters.View", "System.Masters.View"],
    },
    {
        name: "Departments",
        href: "/system/masters/departments",
        icon: LayoutGrid,
        permission: ["Masters.View", "System.Masters.View"],
    },
    {
        name: "Categories",
        href: "/system/masters/categories",
        icon: Layers,
        permission: ["Categories.View", "Masters.View", "System.Masters.View"],
    },
    {
        name: "Users & Employees",
        href: "/system/masters/users",
        icon: Users,
        permission: ["Users.View", "System.Users.View"],
    },
    {
        name: "Roles & Permissions",
        href: "/system/roles",
        icon: Shield,
        permission: ["Roles.View", "System.Roles.View"],
    },
]

export default function MastersLayout() {
    const location = useLocation()
    const pathname = location.pathname
    const isDashboard = pathname === "/system/masters"
    const { hasPermission, permissions, user } = useAuth()

    const visibleNav = React.useMemo(() => {
        if (permissions.includes("*") || user?.roleId === 1 || user?.role?.toLowerCase() === "administrator") {
            return navigation
        }
        return navigation.filter((item) => !item.permission || hasPermission(item.permission))
    }, [hasPermission, permissions, user])

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link to="/system" className="hover:text-primary transition-colors">
                        System
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <Link
                        to="/system/masters"
                        className={cn(
                            "hover:text-primary transition-colors",
                            isDashboard && "text-primary font-medium"
                        )}
                    >
                        Masters
                    </Link>
                </div>

                <nav className="flex items-center space-x-1 border-b pb-1">
                    {visibleNav.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative",
                                    isActive
                                        ? "text-primary border-b-2 border-primary"
                                        : "text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-t-md"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <main><Outlet /></main>
        </div>
    )
}
