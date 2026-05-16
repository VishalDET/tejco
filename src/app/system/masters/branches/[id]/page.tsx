"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Edit, GitBranch, MapPin, User, Loader2, Phone, Mail } from "lucide-react"

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

type Branch = {
    id: number
    companyId: number
    name: string
    company: string
    city: string
    manager: string
    address: string
    contactNumber: string
    officialEmail: string
    status: string
}

export default function BranchDetailPage() {
    const router = useRouter()
    const params = useParams()
    const branchId = params.id as string

    const [branch, setBranch] = React.useState<Branch | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        async function fetchBranch() {
            try {
                const data = await apiClient.get<Branch>(`/api/SystemMasters/branches/${branchId}`)
                setBranch(data)
            } catch (err) {
                toast.error("Failed to load branch details")
                router.push("/system/masters/branches")
            } finally {
                setIsLoading(false)
            }
        }
        fetchBranch()
    }, [branchId, router])

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!branch) return null

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{branch.name}</h1>
                        <p className="text-muted-foreground">{branch.company}</p>
                    </div>
                </div>
                <Button onClick={() => router.push(`/system/masters/branches/edit/${branchId}`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Branch
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <GitBranch className="h-5 w-5 text-emerald-600" />
                            Branch Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-semibold uppercase">Branch ID</p>
                                <p className="text-sm font-medium">{branch.id}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-semibold uppercase">Status</p>
                                <Badge variant={branch.status === "Active" ? "default" : "secondary"}>
                                    {branch.status || "Active"}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Manager</p>
                            <div className="flex items-center text-sm font-medium">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                {branch.manager || "Unassigned"}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Location & Contact
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">City</p>
                            <p className="text-sm font-medium">{branch.city}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Full Address</p>
                            <p className="text-sm font-medium leading-relaxed">{branch.address}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 pt-2 border-t mt-2">
                            {branch.contactNumber && (
                                <div className="flex items-center text-sm">
                                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {branch.contactNumber}
                                </div>
                            )}
                            {branch.officialEmail && (
                                <div className="flex items-center text-sm">
                                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {branch.officialEmail}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
