"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X, Loader2 } from "lucide-react"

import { apiClient } from "@/lib/api-client"
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
import { toast } from "sonner"

// --- Types ---
type MasterItem = {
    id: number | string
    name: string
}

export default function AddUserPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [isFetching, setIsFetching] = React.useState(true)

    // Master Data
    const [companies, setCompanies] = React.useState<MasterItem[]>([])
    const [branches, setBranches] = React.useState<MasterItem[]>([])
    const [departments, setDepartments] = React.useState<MasterItem[]>([])

    // Form State
    const [formData, setFormData] = React.useState({
        firstName: "",
        lastName: "",
        gender: "",
        employeeId: "",
        email: "",
        phone: "",
        companyId: "",
        branchId: "",
        departmentId: "",
        role: "User",
        handlerId: "",
    })

    React.useEffect(() => {
        async function fetchMasterData() {
            try {
                const [comps, brs] = await Promise.all([
                    apiClient.get<MasterItem[]>("/api/SystemMasters/companies"),
                    apiClient.get<MasterItem[]>("/api/SystemMasters/branches"),
                ])
                
                setCompanies(comps.map(c => ({ id: c.id, name: c.name || (c as any).registeredName })))
                setBranches(brs.map(b => ({ id: b.id, name: b.name })))
                // Mocking departments for now as there's no clear API yet, or using static list if none
                setDepartments([
                    { id: "admin", name: "Administration" },
                    { id: "sales", name: "Sales" },
                    { id: "inventory", name: "Inventory" },
                    { id: "manufacturing", name: "Manufacturing" },
                ])
            } catch (err) {
                toast.error("Failed to load organizational data")
            } finally {
                setIsFetching(false)
            }
        }
        fetchMasterData()
    }, [])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        console.log("Submitting User Data:", formData)

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false)
            toast.success("User / Employee created successfully")
            router.push("/system/masters/users")
        }, 1000)
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Add User / Employee</h1>
                        <p className="text-muted-foreground">Fill in the details to create a new system user and link them to organizational units.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                Basic identification details for the user.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input 
                                        id="firstName" 
                                        placeholder="Enter first name" 
                                        required 
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input 
                                        id="lastName" 
                                        placeholder="Enter last name" 
                                        required 
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select 
                                        value={formData.gender}
                                        onValueChange={(val) => setFormData({...formData, gender: val ?? ""})}
                                    >
                                        <SelectTrigger id="gender">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="employeeId">Employee ID</Label>
                                    <Input 
                                        id="employeeId" 
                                        placeholder="EMP-000" 
                                        required 
                                        value={formData.employeeId}
                                        onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contact & Employment</CardTitle>
                            <CardDescription>
                                Work-related contact and organizational details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        placeholder="email@tejco.com" 
                                        required 
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input 
                                        id="phone" 
                                        type="tel" 
                                        placeholder="+91 XXXXX XXXXX" 
                                        required 
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="company">Company <span className="text-destructive">*</span></Label>
                                    <Select 
                                        required 
                                        value={formData.companyId}
                                        onValueChange={(val) => setFormData({...formData, companyId: val ?? ""})}
                                    >
                                        <SelectTrigger id="company">
                                            <SelectValue placeholder={isFetching ? "Loading..." : "Select company"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="location">Branch / Office <span className="text-destructive">*</span></Label>
                                        <Select 
                                            required
                                            value={formData.branchId}
                                            onValueChange={(val) => setFormData({...formData, branchId: val ?? ""})}
                                        >
                                            <SelectTrigger id="location">
                                                <SelectValue placeholder={isFetching ? "Loading..." : "Select branch"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map(b => (
                                                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
                                        <Select 
                                            required
                                            value={formData.departmentId}
                                            onValueChange={(val) => setFormData({...formData, departmentId: val ?? ""})}
                                        >
                                            <SelectTrigger id="department">
                                                <SelectValue placeholder="Select department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map(d => (
                                                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="role">System Role <span className="text-destructive">*</span></Label>
                                    <Select 
                                        required
                                        value={formData.role}
                                        onValueChange={(val) => setFormData({...formData, role: val ?? ""})}
                                    >
                                        <SelectTrigger id="role">
                                            <SelectValue placeholder="Assign role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Administrator">Administrator</SelectItem>
                                            <SelectItem value="Manager">Manager</SelectItem>
                                            <SelectItem value="Sales">Sales</SelectItem>
                                            <SelectItem value="Warehouse">Warehouse</SelectItem>
                                            <SelectItem value="User">Standard User</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="handlerId">Handler (ID)</Label>
                                    <Input 
                                        id="handlerId" 
                                        placeholder="Enter superior/handler ID" 
                                        value={formData.handlerId}
                                        onChange={(e) => setFormData({...formData, handlerId: e.target.value})}
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
                        <Button type="submit" disabled={isLoading || isFetching}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isLoading ? "Saving..." : "Create User / Employee"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
