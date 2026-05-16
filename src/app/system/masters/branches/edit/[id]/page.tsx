"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, X, GitBranch, MapPin, User, Loader2 } from "lucide-react"

import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
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
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type CompanySummary = {
    id: number
    name: string
    registeredName?: string
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditBranchPage() {
    const router = useRouter()
    const params = useParams()
    const branchIdFromParams = params.id as string

    const [isLoading, setIsLoading] = React.useState(false)
    const [isFetchingInitial, setIsFetchingInitial] = React.useState(true)
    const [companies, setCompanies] = React.useState<CompanySummary[]>([])

    // Form State
    const [name, setName] = React.useState("")
    const [companyId, setCompanyId] = React.useState("")
    const [city, setCity] = React.useState("")
    const [manager, setManager] = React.useState("")
    const [address, setAddress] = React.useState("")
    const [contactNumber, setContactNumber] = React.useState("")
    const [officialEmail, setOfficialEmail] = React.useState("")
    const [status, setStatus] = React.useState("Active")

    // Fetch initial data
    React.useEffect(() => {
        async function fetchData() {
            try {
                const [companiesData, branchData] = await Promise.all([
                    apiClient.get<CompanySummary[]>("/api/SystemMasters/companies"),
                    apiClient.get<Branch>(`/api/SystemMasters/branches/${branchIdFromParams}`)
                ])
                
                setCompanies(companiesData)
                
                // Populate form
                if (branchData) {
                    setName(branchData.name || "")
                    setCompanyId((branchData.companyId || "").toString())
                    setCity(branchData.city || "")
                    setManager(branchData.manager || "")
                    setAddress(branchData.address || "")
                    setContactNumber(branchData.contactNumber || "")
                    setOfficialEmail(branchData.officialEmail || "")
                    setStatus(branchData.status || "Active")
                }
            } catch (err: unknown) {
                toast.error("Failed to load branch details")
                router.back()
            } finally {
                setIsFetchingInitial(false)
            }
        }
        fetchData()
    }, [branchIdFromParams, router])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const selectedCompany = companies.find(c => (c.id || (c as any).companyId)?.toString() === companyId)

        const payload = {
            id: parseInt(branchIdFromParams),
            companyId: parseInt(companyId),
            name,
            company: selectedCompany?.name || selectedCompany?.registeredName || "",
            city,
            manager,
            address,
            contactNumber,
            officialEmail,
            status,
        }

        try {
            await apiClient.put(`/api/SystemMasters/branches/${branchIdFromParams}`, payload)
            toast.success("Branch updated successfully")
            router.push("/system/masters/branches")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast.error(`Failed to update branch: ${message}`)
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetchingInitial) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" type="button" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Branch</h1>
                        <p className="text-muted-foreground">Modify details for this office location.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GitBranch className="h-5 w-5 text-emerald-600" />
                                Branch Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Branch Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Mumbai HQ, Delhi North"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="company">Parent Company <span className="text-destructive">*</span></Label>
                                <Select
                                    required
                                    onValueChange={(val) => setCompanyId(val ?? "")}
                                    value={companyId}
                                >
                                    <SelectTrigger id="company">
                                        <SelectValue placeholder="Select company">
                                            {companies.find(c => (c.id || (c as any).companyId)?.toString() === companyId)?.name || companies.find(c => (c.id || (c as any).companyId)?.toString() === companyId)?.registeredName}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map(company => (
                                            <SelectItem key={company.id || (company as any).companyId} value={(company.id || (company as any).companyId).toString()}>
                                                {company.name || company.registeredName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="city"
                                        placeholder="e.g. Mumbai"
                                        required
                                        value={city}
                                        onChange={e => setCity(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="manager">Branch Manager</Label>
                                    <Input
                                        id="manager"
                                        placeholder="Assign a manager"
                                        value={manager}
                                        onChange={e => setManager(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Branch Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={(val) => setStatus(val ?? "Active")}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                Contact & Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="address">Full Address <span className="text-destructive">*</span></Label>
                                <Textarea
                                    id="address"
                                    placeholder="Plot No, Street, City, State, PIN"
                                    rows={3}
                                    required
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Contact Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+91..."
                                        value={contactNumber}
                                        onChange={e => setContactNumber(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Official Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="branch@tejco.com"
                                        value={officialEmail}
                                        onChange={e => setOfficialEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-4">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {isLoading ? "Saving..." : "Update Branch"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
