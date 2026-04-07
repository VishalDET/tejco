"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddBranchPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [isFetchingCompanies, setIsFetchingCompanies] = React.useState(true)
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

    // Fetch Companies for selection
    React.useEffect(() => {
        async function fetchCompanies() {
            try {
                // Assuming companies endpoint from previous task
                const data = await apiClient.get<CompanySummary[]>("/api/SystemMasters/companies")
                setCompanies(data)
            } catch (err: unknown) {
                toast.error("Failed to load companies list")
            } finally {
                setIsFetchingCompanies(false)
            }
        }
        fetchCompanies()
    }, [])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const selectedCompany = companies.find(c => c.id.toString() === companyId)

        const payload = {
            id: 0,
            companyId: parseInt(companyId),
            name,
            company: selectedCompany?.name || "",
            city,
            manager,
            address,
            contactNumber,
            officialEmail,
            status,
        }

        try {
            await apiClient.post("/api/SystemMasters/branches", payload)
            toast.success("Branch created successfully")
            router.push("/system/masters/branches")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast.error(`Failed to create branch: ${message}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" type="button" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Add Branch</h1>
                        <p className="text-muted-foreground">Create a new office location or branch office.</p>
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
                                    disabled={isFetchingCompanies}
                                >
                                    <SelectTrigger id="company">
                                        <SelectValue placeholder={isFetchingCompanies ? "Loading companies..." : "Select company"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map(company => (
                                            <SelectItem key={company.id} value={company.id.toString()}>
                                                {company.name}
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
                        <Button type="submit" disabled={isLoading || isFetchingCompanies}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {isLoading ? "Saving..." : "Create Branch"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
