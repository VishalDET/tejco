"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, GitBranch, LayoutGrid, Layers, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
    {
        name: "Companies",
        href: "/system/masters/companies",
        icon: Building2,
    },
    {
        name: "Branches",
        href: "/system/masters/branches",
        icon: GitBranch,
    },
    {
        name: "Departments",
        href: "/system/masters/departments",
        icon: LayoutGrid,
    },
    {
        name: "Categories",
        href: "/system/masters/categories",
        icon: Layers,
    },
]

export default function MastersLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isDashboard = pathname === "/system/masters"

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/system" className="hover:text-primary transition-colors">
                        System
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <Link
                        href="/system/masters"
                        className={cn(
                            "hover:text-primary transition-colors",
                            isDashboard && "text-primary font-medium"
                        )}
                    >
                        Masters
                    </Link>
                </div>

                <nav className="flex items-center space-x-1 border-b pb-1">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
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

            <main>{children}</main>
        </div>
    )
}
