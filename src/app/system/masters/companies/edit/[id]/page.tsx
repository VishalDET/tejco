"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, X, Plus, Trash2, Building2, MapPin, Users, ShieldCheck, Loader2 } from "lucide-react"

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

interface OfficeLocation {
    locationName: string
    address: string
    contactNo: string
}

interface ContactPerson {
    name: string
    mobile: string
    email: string
    designation: string
    role: string
}

interface CompanyDetail {
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

    // Arrays
    const [officeLocations, setOfficeLocations] = React.useState<OfficeLocation[]>([])
    const [contactPersons, setContactPersons] = React.useState<ContactPerson[]>([])

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
                
                // Initialize arrays or fallback to at least one empty item if none loaded
                setOfficeLocations(data.officeLocations && data.officeLocations.length > 0 
                    ? data.officeLocations 
                    : [{ locationName: "", address: "", contactNo: "" }]
                )
                setContactPersons(data.contactPersons && data.contactPersons.length > 0 
                    ? data.contactPersons 
                    : [{ name: "", mobile: "", email: "", designation: "", role: "" }]
                )
            } catch (err: unknown) {
                toast.error("Failed to load company data")
                router.back()
            } finally {
                setIsLoading(false)
            }
        }
        if (id) fetchCompany()
    }, [id, router])

    // ─── Array Helpers ────────────────────────────────────────────────────────
    
    const addLocation = () => {
        setOfficeLocations([...officeLocations, { locationName: "", address: "", contactNo: "" }])
    }

    const removeLocation = (index: number) => {
        setOfficeLocations(officeLocations.filter((_, i) => i !== index))
    }

    const updateLocation = (index: number, key: keyof OfficeLocation, value: string) => {
        setOfficeLocations(officeLocations.map((item, i) => {
            if (i === index) {
                return { ...item, [key]: value }
            }
            return item
        }))
    }

    const addContact = () => {
        setContactPersons([...contactPersons, { name: "", mobile: "", email: "", designation: "", role: "" }])
    }

    const removeContact = (index: number) => {
        setContactPersons(contactPersons.filter((_, i) => i !== index))
    }

    const updateContact = (index: number, key: keyof ContactPerson, value: string) => {
        setContactPersons(contactPersons.map((item, i) => {
            if (i === index) {
                return { ...item, [key]: value }
            }
            return item
        }))
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        
        if (!registeredName || !registrationNumber || !panNumber || !mainContactNumber || !registeredAddress) {
            toast.error("Please fill in all required legal details.")
            return
        }

        setIsSaving(true)

        // Filter out empty locations and contacts
        const validLocations = officeLocations.filter(loc => loc.locationName.trim() || loc.address.trim())
        const validContacts = contactPersons.filter(c => c.name.trim() || c.mobile.trim())

        const payload = {
            companyId: parseInt(id),
            registeredName,
            registrationNumber,
            panNumber,
            corporateWebsite,
            mainContactNumber,
            registeredAddress,
            defaultShippingAddress,
            officeLocations: validLocations,
            contactPersons: validContacts,
            modifiedByUserId: 0,
            modifiedByRoleId: 0
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
                                    rows={3}
                                    required
                                    value={registeredAddress}
                                    onChange={e => setRegisteredAddress(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                Shipping Information
                            </CardTitle>
                            <CardDescription>Default shipping settings for orders.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                <Label htmlFor="defaultShippingAddress">Default Shipping Address</Label>
                                <Textarea
                                    id="defaultShippingAddress"
                                    placeholder="Same as registered address, or different shipping depot..."
                                    rows={2}
                                    value={defaultShippingAddress}
                                    onChange={e => setDefaultShippingAddress(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Persons */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="grid gap-1">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    Contact Persons
                                </CardTitle>
                                <CardDescription>Key stakeholders associated with this company.</CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addContact}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Contact
                            </Button>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {contactPersons.map((contact, index) => (
                                <div key={index} className="relative p-4 border rounded-lg bg-muted/10 grid gap-4">
                                    {contactPersons.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 text-destructive hover:bg-destructive/10"
                                            onClick={() => removeContact(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="grid gap-1.5">
                                            <Label>Full Name <span className="text-destructive">*</span></Label>
                                            <Input
                                                placeholder="e.g. John Doe"
                                                required
                                                value={contact.name}
                                                onChange={e => updateContact(index, "name", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Mobile Number <span className="text-destructive">*</span></Label>
                                            <Input
                                                placeholder="e.g. 9876543210"
                                                required
                                                value={contact.mobile}
                                                onChange={e => updateContact(index, "mobile", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Email Address</Label>
                                            <Input
                                                type="email"
                                                placeholder="e.g. john@company.com"
                                                value={contact.email}
                                                onChange={e => updateContact(index, "email", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-1.5">
                                            <Label>Designation</Label>
                                            <Input
                                                placeholder="e.g. Purchase Manager"
                                                value={contact.designation}
                                                onChange={e => updateContact(index, "designation", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Role</Label>
                                            <Input
                                                placeholder="e.g. Finance Admin"
                                                value={contact.role}
                                                onChange={e => updateContact(index, "role", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Office Locations */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="grid gap-1">
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-emerald-600" />
                                    Office Locations
                                </CardTitle>
                                <CardDescription>Operational depots, warehouses, and branch structures.</CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addLocation}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Location
                            </Button>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {officeLocations.map((loc, index) => (
                                <div key={index} className="relative p-4 border rounded-lg bg-muted/10 grid gap-4">
                                    {officeLocations.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 text-destructive hover:bg-destructive/10"
                                            onClick={() => removeLocation(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-1.5">
                                            <Label>Location Name <span className="text-destructive">*</span></Label>
                                            <Input
                                                placeholder="e.g. Mumbai Warehouse, Head Office"
                                                required
                                                value={loc.locationName}
                                                onChange={e => updateLocation(index, "locationName", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label>Contact Number</Label>
                                            <Input
                                                placeholder="e.g. 022-24328900"
                                                value={loc.contactNo}
                                                onChange={e => updateLocation(index, "contactNo", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Address <span className="text-destructive">*</span></Label>
                                        <Textarea
                                            placeholder="Full office location address..."
                                            rows={2}
                                            required
                                            value={loc.address}
                                            onChange={e => updateLocation(index, "address", e.target.value)}
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
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {isSaving ? "Updating..." : "Update Company"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
