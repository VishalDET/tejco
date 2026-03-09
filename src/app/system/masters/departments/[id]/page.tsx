"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Edit, LayoutGrid, User, Building2, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DepartmentDetailPage() {
    const router = useRouter()
    const params = useParams()

    const dept = {
        id: params.id,
        name: "Sales & Marketing",
        code: "SALES",
        hod: "Karan Singh",
        branch: "Mumbai HQ",
        company: "Tejco Surgical Instruments",
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{dept.name}</h1>
                        <p className="text-muted-foreground">{dept.code}</p>
                    </div>
                </div>
                <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Department
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <LayoutGrid className="h-5 w-5 text-amber-600" />
                            Unit Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-semibold uppercase">Dept Code</p>
                                <p className="text-sm font-medium">{dept.code}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-semibold uppercase">ID</p>
                                <p className="text-sm font-medium">{dept.id}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Head of Dept</p>
                            <div className="flex items-center text-sm font-medium">
                                <User className="h-4 w-4 mr-2" />
                                {dept.hod}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Organizational Context
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Branch</p>
                            <p className="text-sm font-medium">{dept.branch}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Company</p>
                            <p className="text-sm font-medium">{dept.company}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
