"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Edit, GitBranch, MapPin, User, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function BranchDetailPage() {
    const router = useRouter()
    const params = useParams()

    const branch = {
        id: params.id,
        name: "Mumbai HQ",
        company: "Tejco Surgical Instruments",
        city: "Mumbai",
        manager: "Dr. Vishal Kumar",
        address: "123, Tejco Tower, BKC, Mumbai - 400051",
        status: "Active"
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
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
                <Button variant="outline">
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
                                <Badge variant="outline">{branch.status}</Badge>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Manager</p>
                            <div className="flex items-center text-sm font-medium">
                                <User className="h-4 w-4 mr-2" />
                                {branch.manager}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Location Details
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
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
