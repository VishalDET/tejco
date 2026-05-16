"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Edit, LayoutGrid, User, MapPin, Loader2 } from "lucide-react"

import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type Department = {
    id: number
    companyId: number
    branchId: number
    name: string
    code: string
    hod: string
    branch: string
    company: string
}

export default function DepartmentDetailPage() {
    const router = useRouter()
    const params = useParams()
    const deptId = params.id as string

    const [dept, setDept] = React.useState<Department | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        async function fetchDept() {
            try {
                const data = await apiClient.get<Department>(`/api/SystemMasters/departments/${deptId}`)
                setDept(data)
            } catch (err) {
                toast.error("Failed to load department details")
                router.push("/system/masters/departments")
            } finally {
                setIsLoading(false)
            }
        }
        fetchDept()
    }, [deptId, router])

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!dept) return null

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
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
                <Button onClick={() => router.push(`/system/masters/departments/edit/${deptId}`)}>
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
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                {dept.hod || "Unassigned"}
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
                            <p className="text-sm font-medium">{dept.branch || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Company</p>
                            <p className="text-sm font-medium">{dept.company || "N/A"}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
