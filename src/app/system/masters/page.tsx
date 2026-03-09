"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, GitBranch, LayoutGrid, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const masters = [
    {
        title: "Companies",
        description: "Manage legal entities, registration details, and contact information.",
        icon: Building2,
        href: "/system/masters/companies",
        count: "2 Entities",
        color: "bg-blue-500/10 text-blue-600",
    },
    {
        title: "Branches",
        description: "Maintain a list of physical office locations and branch managers.",
        icon: GitBranch,
        href: "/system/masters/branches",
        count: "4 Branches",
        color: "bg-emerald-500/10 text-emerald-600",
    },
    {
        title: "Departments",
        description: "Define organizational departments and departmental heads.",
        icon: LayoutGrid,
        href: "/system/masters/departments",
        count: "8 Departments",
        color: "bg-amber-500/10 text-amber-600",
    },
]

export default function MastersPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Masters</h1>
                <p className="text-muted-foreground">Configure foundational data for your enterprise resource planning.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {masters.map((master) => (
                    <Card key={master.title} className="group hover:shadow-md transition-all">
                        <CardHeader>
                            <div className={`p-2 w-fit rounded-lg mb-2 ${master.color}`}>
                                <master.icon className="h-6 w-6" />
                            </div>
                            <CardTitle>{master.title}</CardTitle>
                            <CardDescription>{master.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <span className="text-sm font-medium">{master.count}</span>
                            <Button variant="ghost" size="sm" render={<Link href={master.href} />} className="group-hover:translate-x-1 transition-transform">
                                Manage <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
