"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X, Plus, Trash2, Building2, MapPin, UserPlus } from "lucide-react"

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddCompanyPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)

    // Form State
    const [registeredName, setRegisteredName] = React.useState("")
    const [registrationNumber, setRegistrationNumber] = React.useState("")
    const [panNumber, setPanNumber] = React.useState("")
    const [corporateWebsite, setCorporateWebsite] = React.useState("")
    const [mainContactNumber, setMainContactNumber] = React.useState("")
    const [registeredAddress, setRegisteredAddress] = React.useState("")

    // ─── Submit ───────────────────────────────────────────────────────────────

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const payload = {
            companyId: 0,
            registeredName,
            registrationNumber,
            panNumber,
            corporateWebsite,
            mainContactNumber,
            registeredAddress,
        }

        try {
            await apiClient.post("/api/SystemMasters/companies", payload)
            toast.success("Company registered successfully!")
            router.push("/system/masters/companies")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast.error(`Failed to register company: ${message}`)
        } finally {
            setIsLoading(false)
        }
    }

    // ─── UI ───────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" type="button" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Register Company</h1>
                    <p className="text-muted-foreground">Add a new legal entity with multiple contacts and locations.</p>
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
                            <CardDescription>Official registration and identity information.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="registeredName">Registered Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="registeredName"
                                    placeholder="Tejco Surgical Instruments Pvt Ltd"
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
                                        placeholder="CIN / Reg No"
                                        required
                                        value={registrationNumber}
                                        onChange={e => setRegistrationNumber(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="panNumber">PAN Number <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="panNumber"
                                        placeholder="ABCDE1234F"
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
                                        placeholder="https://www.tejco.com"
                                        value={corporateWebsite}
                                        onChange={e => setCorporateWebsite(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="mainContactNumber">Main Contact Number <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="mainContactNumber"
                                        placeholder="+91-8048963382"
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
                                    placeholder="Full office address..."
                                    rows={3}
                                    required
                                    value={registeredAddress}
                                    onChange={e => setRegisteredAddress(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="px-8 font-semibold">
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading ? "Saving..." : "Save Company"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
