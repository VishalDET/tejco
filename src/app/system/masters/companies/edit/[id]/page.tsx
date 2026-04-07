"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, X, Plus, Trash2, Building2, MapPin, UserPlus, Loader2 } from "lucide-react"

import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactPerson = {
    id: number // local-only key for UI
    name: string
    mobile: string
    email: string
    designation: string
    role: string
}

type OfficeLocation = {
    id: number // local-only key for UI
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

export default function EditCompanyPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)

    // Form State
    const [registeredName, setRegisteredName] = React.useState("")
    const [registrationNumber, setRegistrationNumber] = React.useState("")
    const [panNumber, setPanNumber] = React.useState("")
    const [corporateWebsite, setCorporateWebsite] = React.useState("")
    const [mainContactNumber, setMainContactNumber] = React.useState("")
    const [registeredAddress, setRegisteredAddress] = React.useState("")
    const [defaultShippingAddress, setDefaultShippingAddress] = React.useState("")

    // Dynamic Lists
    const [contactPersons, setContactPersons] = React.useState<ContactPerson[]>([])
    const [officeLocations, setOfficeLocations] = React.useState<OfficeLocation[]>([])

    // Load initial data
    React.useEffect(() => {
        async function fetchCompany() {
            try {
                const data = await apiClient.get<CompanyDetail>(`/api/SystemMasters/companies/${id}`)
                setRegisteredName(data.registeredName || "")
                setRegistrationNumber(data.registrationNumber || "")
                setPanNumber(data.panNumber || "")
                setCorporateWebsite(data.corporateWebsite || "")
                setMainContactNumber(data.mainContactNumber || "")
                setRegisteredAddress(data.registeredAddress || "")
                setDefaultShippingAddress(data.defaultShippingAddress || "")
                
                // Map incoming arrays to include local IDs for React keys
                setContactPersons(data.contactPersons?.map(cp => ({ ...cp, id: Math.random() })) || [])
                setOfficeLocations(data.officeLocations?.map(ol => ({ ...ol, id: Math.random() })) || [])
            } catch (err: unknown) {
                toast.error("Failed to load company data")
                router.back()
            } finally {
                setIsLoading(false)
            }
        }
        if (id) fetchCompany()
    }, [id, router])

    const addContact = () => {
        setContactPersons(prev => [...prev, { id: Date.now(), name: "", mobile: "", email: "", designation: "", role: "" }])
    }

    const removeContact = (id: number) => {
        setContactPersons(prev => prev.filter(c => c.id !== id))
    }

    const updateContact = (id: number, field: keyof ContactPerson, value: string) => {
        setContactPersons(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
    }

    const addLocation = () => {
        setOfficeLocations(prev => [...prev, { id: Date.now(), locationName: "", address: "", contactNo: "" }])
    }

    const removeLocation = (id: number) => {
        setOfficeLocations(prev => prev.filter(l => l.id !== id))
    }

    const updateLocation = (id: number, field: keyof OfficeLocation, value: string) => {
        setOfficeLocations(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSaving(true)

        const payload = {
            companyId: parseInt(id),
            registeredName,
            registrationNumber,
            panNumber,
            corporateWebsite,
            mainContactNumber,
            registeredAddress,
            defaultShippingAddress,
            officeLocations: officeLocations.map(({ id, ...rest }) => rest),
            contactPersons: contactPersons.map(({ id, ...rest }) => rest),
        }

        try {
            await apiClient.put(`/api/SystemMasters/companies/${id}`, payload)
            toast.success("Company updated successfully!")
            router.push(`/system/masters/companies/${id}`)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast.error(`Failed to update company: ${message}`)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading company profile...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" type="button" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Company</h1>
                    <p className="text-muted-foreground">Modify your legal entity details and structures.</p>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div className="grid gap-6">
                    {/* Legal Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Legal Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="registeredName">Registered Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="registeredName"
                                    required
                                    value={registeredName}
                                    onChange={e => setRegisteredName(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="registrationNumber">Registration Number <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="registrationNumber"
                                        required
                                        value={registrationNumber}
                                        onChange={e => setRegistrationNumber(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="panNumber">PAN Number <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="panNumber"
                                        required
                                        value={panNumber}
                                        onChange={e => setPanNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="corporateWebsite">Corporate Website</Label>
                                    <Input
                                        id="corporateWebsite"
                                        type="url"
                                        value={corporateWebsite}
                                        onChange={e => setCorporateWebsite(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="mainContactNumber">Main Contact Number <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="mainContactNumber"
                                        required
                                        value={mainContactNumber}
                                        onChange={e => setMainContactNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="registeredAddress">Registered Address <span className="text-destructive">*</span></Label>
                                <Textarea
                                    id="registeredAddress"
                                    rows={2}
                                    required
                                    value={registeredAddress}
                                    onChange={e => setRegisteredAddress(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="defaultShippingAddress">Default Shipping Address</Label>
                                <Textarea
                                    id="defaultShippingAddress"
                                    rows={2}
                                    value={defaultShippingAddress}
                                    onChange={e => setDefaultShippingAddress(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Persons */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg text-blue-600">
                                <UserPlus className="h-5 w-5" />
                                Contact Persons
                            </CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addContact}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Person
                            </Button>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            {contactPersons.map((contact, index) => (
                                <div key={contact.id} className="relative grid gap-4 p-4 border rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Person #{index + 1}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                            onClick={() => removeContact(contact.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Full Name <span className="text-destructive">*</span></Label>
                                            <Input
                                                required
                                                value={contact.name}
                                                onChange={e => updateContact(contact.id, "name", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Mobile <span className="text-destructive">*</span></Label>
                                            <Input
                                                required
                                                value={contact.mobile}
                                                onChange={e => updateContact(contact.id, "mobile", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                value={contact.email}
                                                onChange={e => updateContact(contact.id, "email", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Designation</Label>
                                            <Input
                                                value={contact.designation}
                                                onChange={e => updateContact(contact.id, "designation", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Role</Label>
                                            <Input
                                                value={contact.role}
                                                onChange={e => updateContact(contact.id, "role", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Office Locations */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg text-emerald-600">
                                <MapPin className="h-5 w-5" />
                                Office Locations
                            </CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addLocation}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Location
                            </Button>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            {officeLocations.map((loc, index) => (
                                <div key={loc.id} className="relative grid gap-4 p-4 border rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location #{index + 1}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                            onClick={() => removeLocation(loc.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Location Name <span className="text-destructive">*</span></Label>
                                            <Input
                                                required
                                                value={loc.locationName}
                                                onChange={e => updateLocation(loc.id, "locationName", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Contact Number</Label>
                                            <Input
                                                value={loc.contactNo}
                                                onChange={e => updateLocation(loc.id, "contactNo", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Full Address <span className="text-destructive">*</span></Label>
                                        <Textarea
                                            rows={2}
                                            required
                                            value={loc.address}
                                            onChange={e => updateLocation(loc.id, "address", e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="px-8 font-semibold">
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Updating..." : "Update Company"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
