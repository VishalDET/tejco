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
    Phone,
    Mail,
    ShieldCheck,
    ExternalLink,
    Loader2,
    AlertCircle
} from "lucide-react"

import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactPerson = {
    name: string
    mobile: string
    email: string
    designation: string
    role: string
}

type OfficeLocation = {
    locationName: string
    address: string
    contactNo: string
}

type CompanyDetail = {
    companyId: number
    registeredName: string
    registrationNumber: string
    panNumber: string
    corporateWebsite: string
    mainContactNumber: string
    registeredAddress: string
    defaultShippingAddress: string
    officeLocations: OfficeLocation[]
    contactPersons: ContactPerson[]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanyDetailPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [company, setCompany] = React.useState<CompanyDetail | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        async function fetchDetail() {
            try {
                const data = await apiClient.get<CompanyDetail>(`/api/SystemMasters/companies/${id}`)
                setCompany(data)
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to load company details"
                setError(message)
            } finally {
                setIsLoading(false)
            }
        }
        if (id) fetchDetail()
    }, [id])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading company details...</p>
            </div>
        )
    }

    if (error || !company) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
                <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-6 w-6" />
                    <h2 className="text-xl font-bold">Error</h2>
                </div>
                <p className="text-muted-foreground max-w-md">{error || "Company not found"}</p>
                <Button onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{company.registeredName}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase">
                                Active
                            </Badge>
                            <span className="text-muted-foreground text-sm">ID: {company.companyId}</span>
                        </div>
                    </div>
                </div>
                <Button render={<Link href={`/system/masters/companies/edit/${id}`} />} nativeButton={false}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column: Legal Info */}
                <Card className="md:col-span-1 border-none shadow-sm bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Legal Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Registration No</p>
                            <p className="text-sm font-medium">{company.registrationNumber}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">PAN Number</p>
                            <p className="text-sm font-medium">{company.panNumber}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Main Contact</p>
                            <p className="text-sm font-medium">{company.mainContactNumber}</p>
                        </div>
                        {company.corporateWebsite && (
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Website</p>
                                <a
                                    href={company.corporateWebsite}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary flex items-center hover:underline"
                                >
                                    <Globe className="h-3 w-3 mr-1" />
                                    {company.corporateWebsite.replace(/^https?:\/\//, "")}
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                </a>
                            </div>
                        )}
                        <Separator />
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Registered Address</p>
                            <p className="text-sm italic">{company.registeredAddress}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Dynamic Info */}
                <div className="md:col-span-2 grid gap-6">
                    {/* Contact Persons */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                                Contact Persons
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {company.contactPersons.length > 0 ? (
                                    company.contactPersons.map((contact, idx) => (
                                        <div key={idx} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                            <p className="font-bold">{contact.name}</p>
                                            <p className="text-xs text-muted-foreground mb-3">{contact.designation || "Contact"}</p>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Phone className="h-3.5 w-3.5 mr-2" />
                                                    {contact.mobile}
                                                </div>
                                                {contact.email && (
                                                    <div className="flex items-center text-sm text-muted-foreground">
                                                        <Mail className="h-3.5 w-3.5 mr-2" />
                                                        {contact.email}
                                                    </div>
                                                )}
                                                {contact.role && (
                                                    <Badge variant="secondary" className="text-[10px] h-4 mt-2">
                                                        {contact.role}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground col-span-2 py-4 text-center">No contact persons listed.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Office Locations */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MapPin className="h-5 w-5 text-emerald-600" />
                                Office Locations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {company.officeLocations.length > 0 ? (
                                company.officeLocations.map((loc, idx) => (
                                    <div key={idx} className="p-4 border rounded-lg bg-muted/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="secondary">{loc.locationName}</Badge>
                                            {loc.contactNo && (
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <Phone className="h-3.5 w-3.5 mr-1" />
                                                    {loc.contactNo}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm leading-relaxed mb-1">{loc.address}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground py-4 text-center">No additional office locations listed.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    {company.defaultShippingAddress && (
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                    Shipping Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 border rounded-lg bg-indigo-50/30 border-indigo-100">
                                    <p className="text-xs text-indigo-700 uppercase font-bold mb-1">Default Shipping Address</p>
                                    <p className="text-sm">{company.defaultShippingAddress}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

function Separator() {
    return <div className="h-px bg-border my-2" />
}
