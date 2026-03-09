"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X, Plus, Trash2, Building2, MapPin, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function AddCompanyPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)

    // Dynamic state for contacts
    const [contacts, setContacts] = React.useState([
        { id: Date.now(), name: "", email: "", phone: "", designation: "" }
    ])

    // Dynamic state for addresses
    const [addresses, setAddresses] = React.useState([
        { id: Date.now() + 1, type: "Head Office", address: "", gst: "", contact: "" }
    ])

    const addContact = () => {
        setContacts([...contacts, { id: Date.now(), name: "", email: "", phone: "", designation: "" }])
    }

    const removeContact = (id: number) => {
        if (contacts.length > 1) {
            setContacts(contacts.filter(c => c.id !== id))
        }
    }

    const addAddress = () => {
        setAddresses([...addresses, { id: Date.now(), type: "Branch Office", address: "", gst: "", contact: "" }])
    }

    const removeAddress = (id: number) => {
        if (addresses.length > 1) {
            setAddresses(addresses.filter(a => a.id !== id))
        }
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false)
            toast.success("Company registered successfully with " + contacts.length + " contacts and " + addresses.length + " addresses")
            router.push("/system/masters/companies")
        }, 1000)
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Register Company</h1>
                        <p className="text-muted-foreground">Add a new legal entity with multiple contacts and locations.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Legal Details
                            </CardTitle>
                            <CardDescription>
                                Official registration and identity information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Company Name</Label>
                                <Input id="name" placeholder="Tejco Surgical Instruments Pvt Ltd" required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="regNo">Registration Number</Label>
                                    <Input id="regNo" placeholder="CIN / Registration No" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="website">Corporate Website</Label>
                                    <Input id="website" type="url" placeholder="https://www.tejco.com" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="pan">PAN Number</Label>
                                <Input id="pan" placeholder="ABCDE1234F" className="max-w-md" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="grid gap-1">
                                <CardTitle className="flex items-center gap-2">
                                    <UserPlus className="h-5 w-5 text-blue-600" />
                                    Contact Persons
                                </CardTitle>
                                <CardDescription>
                                    Add one or more primary contact persons for this company.
                                </CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addContact}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Person
                            </Button>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            {contacts.map((contact, index) => (
                                <div key={contact.id} className="relative grid gap-4 p-4 border rounded-lg bg-muted/30">
                                    {contacts.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 text-destructive"
                                            onClick={() => removeContact(contact.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Full Name</Label>
                                            <Input placeholder="John Doe" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Designation</Label>
                                            <Input placeholder="Director / Manager" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Email</Label>
                                            <Input type="email" placeholder="john@example.com" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Phone</Label>
                                            <Input type="tel" placeholder="+91 98..." />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="grid gap-1">
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-emerald-600" />
                                    Office Locations
                                </CardTitle>
                                <CardDescription>
                                    Add registered office, branches, or warehouse addresses.
                                </CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addAddress}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Location
                            </Button>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            {addresses.map((address, index) => (
                                <div key={address.id} className="relative grid gap-6 p-4 border rounded-lg bg-muted/30">
                                    {addresses.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 text-destructive"
                                            onClick={() => removeAddress(address.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Location Type</Label>
                                            <Select defaultValue={address.type}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Head Office">Head Office</SelectItem>
                                                    <SelectItem value="Branch Office">Branch Office</SelectItem>
                                                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                                                    <SelectItem value="Manufacturing Unit">Manufacturing Unit</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>GST Number (Branch Specific)</Label>
                                            <Input placeholder="GSTIN if different" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Contact Number</Label>
                                            <Input type="tel" placeholder="Phone for this location" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Full Address</Label>
                                        <Textarea placeholder="Plot No, Street, City, State, PIN" rows={2} required />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-4">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="px-8 font-semibold">
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading ? "Saving..." : "Save Company Profile"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
