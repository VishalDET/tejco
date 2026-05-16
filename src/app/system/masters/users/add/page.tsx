"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X, Loader2 } from "lucide-react"

import { apiClient, usersApi } from "@/lib/api"
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
    const [companies, setCompanies] = React.useState<any[]>([])
    const [branches, setBranches] = React.useState<any[]>([])
    const [departments, setDepartments] = React.useState<any[]>([])

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
        status: "Active",
        password: "",
    })

    React.useEffect(() => {
        async function fetchMasterData() {
            try {
                const [compsRes, brsRes, deptsRes] = await Promise.all([
                    apiClient.get<any>("/api/SystemMasters/companies"),
                    apiClient.get<any>("/api/SystemMasters/branches"),
                    apiClient.get<any>("/api/SystemMasters/departments"),
                ])
                
                const comps = Array.isArray(compsRes) ? compsRes : (compsRes?.data || [])
                const brs = Array.isArray(brsRes) ? brsRes : (brsRes?.data || [])
                const depts = Array.isArray(deptsRes) ? deptsRes : (deptsRes?.data || [])

                setCompanies(comps)
                setBranches(brs)
                setDepartments(depts)
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

        const payload = {
            userId: 0,
            firstName: formData.firstName,
            lastName: formData.lastName,
            gender: formData.gender,
            employeeId: formData.employeeId,
            email: formData.email,
            phone: formData.phone,
            companyId: parseInt(formData.companyId) || 0,
            branchId: parseInt(formData.branchId) || 0,
            departmentId: parseInt(formData.departmentId) || 0,
            role: formData.role,
            handlerId: parseInt(formData.handlerId) || 0,
            status: formData.status,
            lastLogin: new Date().toISOString(),
            imageUrl: "",
            passwordHash: formData.password,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        try {
            await usersApi.create(payload)
            toast.success("User created successfully")
            router.push("/system/masters/users")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast.error(`Failed to create user: ${message}`)
        } finally {
            setIsLoading(false)
        }
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
                                        onValueChange={(val) => setFormData({
                                            ...formData, 
                                            companyId: val ?? "", 
                                            branchId: "", 
                                            departmentId: ""
                                        })}
                                    >
                                        <SelectTrigger id="company">
                                            <SelectValue placeholder={isFetching ? "Loading..." : "Select company"}>
                                                {companies.find(c => (c.id || c.companyId)?.toString() === formData.companyId)?.name || companies.find(c => (c.id || c.companyId)?.toString() === formData.companyId)?.registeredName}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map(c => (
                                                <SelectItem key={c.id || c.companyId} value={(c.id || c.companyId).toString()}>
                                                    {c.name || c.registeredName}
                                                </SelectItem>
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
                                            onValueChange={(val) => setFormData({
                                                ...formData, 
                                                branchId: val ?? "", 
                                                departmentId: ""
                                            })}
                                            disabled={!formData.companyId}
                                        >
                                            <SelectTrigger id="location">
                                                <SelectValue placeholder={isFetching ? "Loading..." : "Select branch"}>
                                                    {branches.find(b => (b.id || b.branchId || b.BranchID)?.toString() === formData.branchId)?.name}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches
                                                    .filter(b => {
                                                        if (!formData.companyId) return false;
                                                        const bCompId = b.companyId || b.companyID || b.CompanyID || b.CompanyId || (b.company?.id || b.company?.companyId);
                                                        return String(bCompId) === String(formData.companyId);
                                                    })
                                                    .map(b => (
                                                    <SelectItem key={b.id || b.branchId || b.BranchID} value={(b.id || b.branchId || b.BranchID).toString()}>
                                                        {b.name}
                                                    </SelectItem>
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
                                            disabled={!formData.branchId}
                                        >
                                            <SelectTrigger id="department">
                                                <SelectValue placeholder="Select department">
                                                    {departments.find(d => (d.id || d.departmentId || d.DepartmentID)?.toString() === formData.departmentId)?.name}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments
                                                    .filter(d => {
                                                        if (!formData.branchId) return false;
                                                        const dBrId = d.branchId || d.branchID || d.BranchID || d.BranchId || (d.branch?.id || d.branch?.branchId);
                                                        return String(dBrId) === String(formData.branchId);
                                                    })
                                                    .map(d => (
                                                    <SelectItem key={d.id || d.departmentId || d.DepartmentID} value={(d.id || d.departmentId || d.DepartmentID).toString()}>
                                                        {d.name}
                                                    </SelectItem>
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Account & Security</CardTitle>
                            <CardDescription>
                                Set login credentials and account status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                                    <Input 
                                        id="password" 
                                        type="password" 
                                        placeholder="Set initial password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Account Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val) => setFormData({...formData, status: val || "Active"})}
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
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
