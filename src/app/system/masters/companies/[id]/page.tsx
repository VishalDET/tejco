"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import {
    ArrowLeft,
    Edit,
    Building2,
    MapPin,
    Users,
    Globe,
    FileText,
    Phone,
    Mail,
    ShieldCheck,
    ExternalLink
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function CompanyDetailPage() {
    const router = useRouter()
    const params = useParams()

    // Simulated data
    const company = {
        id: params.id,
        name: "Tejco Surgical Instruments Pvt Ltd",
        regNo: "CIN-U12345MH2020PTC123456",
        website: "https://www.tejco.com",
        pan: "ABCDE1234F",
        status: "Active",
        contacts: [
            { id: 1, name: "Dr. Vishal Kumar", designation: "Managing Director", email: "vishal.k@tejco.com", phone: "+91 98765 43210" },
            { id: 2, name: "Admin User", designation: "Operations Manager", email: "admin@tejco.com", phone: "+91 91234 56789" }
        ],
        addresses: [
            { id: 101, type: "Head Office", address: "123, Tejco Tower, Bandra Kurla Complex, Mumbai, Maharashtra - 400051", gst: "27ABCDE1234F1Z5", contact: "+91 22 1234 5678" },
            { id: 102, type: "Manufacturing Unit", address: "Plot No. 45, MIDC Industrial Area, Pimpri, Pune, Maharashtra - 411018", gst: "27ABCDE1234F1Z5", contact: "+91 20 9876 5432" }
        ]
    }

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                {company.status}
                            </Badge>
                            <span className="text-muted-foreground text-sm">ID: {company.id}</span>
                        </div>
                    </div>
                </div>
                <Button render={<Link href={`/system/masters/companies/edit`} />} nativeButton={false}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 border-none shadow-sm bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Legal Info</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Registration No</p>
                            <p className="text-sm font-medium">{company.regNo}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">PAN Number</p>
                            <p className="text-sm font-medium">{company.pan}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Website</p>
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center hover:underline">
                                {company.website} <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 grid gap-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                                Contact Persons
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {company.contacts.map((contact) => (
                                    <div key={contact.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                        <p className="font-bold">{contact.name}</p>
                                        <p className="text-xs text-muted-foreground mb-3">{contact.designation}</p>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Mail className="h-3.5 w-3.5 mr-2" />
                                                {contact.email}
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Phone className="h-3.5 w-3.5 mr-2" />
                                                {contact.phone}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MapPin className="h-5 w-5 text-emerald-600" />
                                office Locations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {company.addresses.map((addr) => (
                                <div key={addr.id} className="p-4 border rounded-lg bg-muted/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="secondary">{addr.type}</Badge>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                            GST: {addr.gst}
                                        </div>
                                    </div>
                                    <p className="text-sm mb-3 leading-relaxed">{addr.address}</p>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Phone className="h-3.5 w-3.5 mr-2" />
                                        {addr.contact}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
