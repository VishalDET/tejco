"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, X, Loader2, AlertCircle } from "lucide-react"

import { apiClient, usersApi } from "@/lib/api"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// --- Types ---
type MasterItem = {
    id: number | string
    name: string
}

type ApiUser = {
    userId: number
    firstName: string
    lastName: string
    gender: string
    employeeId: string
    email: string
    phone: string
    companyId: number
    branchId: number
    departmentId: number
    role: string
    handlerId: number
    status: string
    lastLogin: string | null
    imageUrl: string | null
    passwordHash: string | null
    createdAt: string
    updatedAt: string | null
}

type ApiResponse<T> = {
    statusCode: number
    success: boolean
    message: string
    data: T
}

export default function EditUserPage() {
    const router = useRouter()
    const params = useParams()
    const userId = params.id as string

    const [isLoading, setIsLoading] = React.useState(false)
    const [isFetching, setIsFetching] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

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
        status: "Active",
        password: "", // Optional in edit
    })

    const [originalUser, setOriginalUser] = React.useState<ApiUser | null>(null)

    React.useEffect(() => {
        async function fetchData() {
            try {
                const [comps, brs, userRes] = await Promise.all([
                    apiClient.get<MasterItem[]>("/api/SystemMasters/companies"),
                    apiClient.get<MasterItem[]>("/api/SystemMasters/branches"),
                    usersApi.getById(userId)
                ])
                
                setCompanies(comps.map(c => ({ id: c.id, name: c.name || (c as any).registeredName })))
                setBranches(brs.map(b => ({ id: b.id, name: b.name })))
                setDepartments([
                    { id: "1", name: "Administration" },
                    { id: "2", name: "Sales" },
                    { id: "3", name: "Inventory" },
                    { id: "4", name: "Manufacturing" },
                ])

                const userData = userRes.data || userRes // Handle if wrapped in data or not
                setOriginalUser(userData)
                setFormData({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    gender: userData.gender,
                    employeeId: userData.employeeId,
                    email: userData.email,
                    phone: userData.phone,
                    companyId: String(userData.companyId),
                    branchId: String(userData.branchId),
                    departmentId: String(userData.departmentId),
                    role: userData.role,
                    handlerId: String(userData.handlerId),
                    status: userData.status,
                    password: "", // Don't show password hash
                })
            } catch (err: any) {
                setError(err.message || "Failed to load data")
                toast.error("Failed to load user details")
            } finally {
                setIsFetching(false)
            }
        }
        fetchData()
    }, [userId])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const payload = {
            ...originalUser,
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
            updatedAt: new Date().toISOString(),
        }

        // Only update password if provided
        if (formData.password) {
            (payload as any).passwordHash = formData.password
        }

        try {
            await usersApi.update(userId, payload)
            toast.success("User updated successfully")
            router.push("/system/masters/users")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast.error(`Failed to update user: ${message}`)
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto mt-10">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit User / Employee</h1>
                        <p className="text-muted-foreground">Modify details for {formData.firstName} {formData.lastName}.</p>
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
                                        required 
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input 
                                        id="lastName" 
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
                                            <SelectValue placeholder="Select company" />
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
                                                <SelectValue placeholder="Select branch" />
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
                                    <Label htmlFor="password">Change Password</Label>
                                    <Input 
                                        id="password" 
                                        type="password" 
                                        placeholder="Leave blank to keep current"
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
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isLoading ? "Saving..." : "Update User / Employee"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
