import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
    ArrowLeft,
    Save,
    X,
    Building2,
    User as UserIcon,
    Mail,
    Shield,
    Loader2,
    Lock,
    Image as ImageIcon,
    AlertCircle,
} from "lucide-react"

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { usersApi, rolesApi, systemMastersApi } from "@/lib/api"

interface CompanyOption {
    id: number
    name: string
}

interface BranchOption {
    id: number
    companyId?: number
    name: string
}

interface DepartmentOption {
    id: number
    branchId?: number
    name: string
}

interface RoleOption {
    roleId: number
    roleName: string
}

const DEFAULT_COMPANIES: CompanyOption[] = [
    { id: 1, name: "Tejco Vision Corp" },
    { id: 2, name: "Tejco Surgical Solutions" },
]

const DEFAULT_BRANCHES: BranchOption[] = [
    { id: 1, companyId: 1, name: "Mumbai HQ - Andheri" },
    { id: 2, companyId: 1, name: "Delhi Branch - Okhla" },
    { id: 3, companyId: 2, name: "Bangalore Tech Hub" },
]

const DEFAULT_DEPARTMENTS: DepartmentOption[] = [
    { id: 1, branchId: 1, name: "Administration" },
    { id: 2, branchId: 1, name: "Sales & Marketing" },
    { id: 3, branchId: 1, name: "Inventory & Warehousing" },
    { id: 4, branchId: 2, name: "Customer Support" },
    { id: 5, branchId: 3, name: "R&D / Engineering" },
]

const DEFAULT_ROLES: RoleOption[] = [
    { roleId: 1, roleName: "Administrator" },
    { roleId: 2, roleName: "Manager" },
    { roleId: 3, roleName: "Sales Representative" },
    { roleId: 4, roleName: "Inventory Specialist" },
    { roleId: 5, roleName: "Viewer" },
]

export default function EditUserPage() {
    const navigate = useNavigate()
    const params = useParams<{ id: string }>()
    const userId = params.id as string

    const [isLoading, setIsLoading] = React.useState(false)
    const [isFetching, setIsFetching] = React.useState(true)
    const [fetchError, setFetchError] = React.useState<string | null>(null)

    // Master Options
    const [companies, setCompanies] = React.useState<CompanyOption[]>([])
    const [branches, setBranches] = React.useState<BranchOption[]>([])
    const [departments, setDepartments] = React.useState<DepartmentOption[]>([])
    const [roles, setRoles] = React.useState<RoleOption[]>([])

    // Raw initial user object from server
    const [originalUser, setOriginalUser] = React.useState<any>(null)

    // Form State
    const [formData, setFormData] = React.useState({
        firstName: "",
        lastName: "",
        gender: "Male",
        employeeId: "",
        email: "",
        phone: "",
        companyId: "1",
        branchId: "1",
        departmentId: "1",
        roleId: "1",
        handlerId: "0",
        status: "Active",
        password: "",
        confirmPassword: "",
        imageUrl: "",
    })

    // Load master data & user details
    React.useEffect(() => {
        let isMounted = true

        async function loadData() {
            if (!userId) {
                setFetchError("User ID is missing.")
                setIsFetching(false)
                return
            }

            setIsFetching(true)
            setFetchError(null)

            try {
                const [compsRes, brsRes, deptsRes, rolesRes, userRes] = await Promise.all([
                    systemMastersApi.getCompanies().catch(() => []),
                    systemMastersApi.getBranches().catch(() => []),
                    systemMastersApi.getDepartments().catch(() => []),
                    rolesApi.getAll().catch(() => []),
                    usersApi.getById(userId).catch(async (err) => {
                        // Fallback: search in getAll if getById fails
                        try {
                            const allUsers = await usersApi.getAll()
                            const list = Array.isArray(allUsers) ? allUsers : (allUsers as any)?.data || []
                            const found = list.find((u: any) => String(u.userId || u.id) === String(userId))
                            if (found) return found
                        } catch {
                            // ignore fallback error
                        }
                        throw err
                    }),
                ])

                if (!isMounted) return

                const compList = Array.isArray(compsRes) ? compsRes : ((compsRes as any)?.data || [])
                const brList = Array.isArray(brsRes) ? brsRes : ((brsRes as any)?.data || [])
                const deptList = Array.isArray(deptsRes) ? deptsRes : ((deptsRes as any)?.data || [])
                const rList = Array.isArray(rolesRes) ? rolesRes : ((rolesRes as any)?.data || [])

                if (compList.length > 0) {
                    setCompanies(
                        compList.map((c: any) => ({
                            id: Number(c.id ?? c.companyId ?? 0),
                            name: String(c.name ?? c.registeredName ?? c.companyName ?? `Company #${c.id}`),
                        }))
                    )
                }

                if (brList.length > 0) {
                    setBranches(
                        brList.map((b: any) => ({
                            id: Number(b.id ?? b.branchId ?? b.BranchID ?? 0),
                            companyId: Number(b.companyId ?? b.companyID ?? b.CompanyId ?? b.company?.id ?? 0),
                            name: String(b.name ?? b.branchName ?? `Branch #${b.id}`),
                        }))
                    )
                }

                if (deptList.length > 0) {
                    setDepartments(
                        deptList.map((d: any) => ({
                            id: Number(d.id ?? d.departmentId ?? d.DepartmentID ?? 0),
                            companyId: Number(d.companyId ?? d.companyID ?? d.CompanyId ?? 0),
                            branchId: Number(d.branchId ?? d.branchID ?? d.BranchID ?? d.branch?.id ?? 0),
                            name: String(d.name ?? d.departmentName ?? `Dept #${d.id}`).trim(),
                            code: d.code,
                            branchName: d.branch,
                        }))
                    )
                }

                if (rList.length > 0) {
                    setRoles(
                        rList.map((r: any) => ({
                            roleId: Number(r.roleId ?? r.id ?? 0),
                            roleName: String(r.roleName ?? r.name ?? `Role #${r.roleId}`),
                        }))
                    )
                }

                const userData = userRes?.data ?? userRes
                if (!userData) {
                    throw new Error(`User with ID "${userId}" was not found.`)
                }

                setOriginalUser(userData)

                // Match gender value
                const rawGender = String(userData.gender || "Male")
                const normalizedGender =
                    rawGender.toLowerCase() === "female"
                        ? "Female"
                        : rawGender.toLowerCase() === "male"
                        ? "Male"
                        : rawGender.toLowerCase() === "other"
                        ? "Other"
                        : rawGender.toLowerCase().includes("prefer")
                        ? "Prefer not to say"
                        : rawGender

                // Match role ID
                let resolvedRoleId = String(userData.roleId || "")
                if (!resolvedRoleId || resolvedRoleId === "0") {
                    const matchedRole = rList.find((r: any) => (r.roleName ?? r.name) === userData.role)
                    if (matchedRole) {
                        resolvedRoleId = String(matchedRole.roleId ?? matchedRole.id)
                    } else {
                        resolvedRoleId = "1"
                    }
                }

                setFormData({
                    firstName: userData.firstName || "",
                    lastName: userData.lastName || "",
                    gender: normalizedGender,
                    employeeId: userData.employeeId || "",
                    email: userData.email || "",
                    phone: userData.phone || "",
                    companyId: userData.companyId ? String(userData.companyId) : "",
                    branchId: userData.branchId ? String(userData.branchId) : "",
                    departmentId: userData.departmentId ? String(userData.departmentId) : "",
                    roleId: resolvedRoleId,
                    handlerId: String(userData.handlerId ?? "0"),
                    status: userData.status || "Active",
                    password: "",
                    confirmPassword: "",
                    imageUrl: userData.imageUrl || "",
                })
            } catch (err: unknown) {
                if (!isMounted) return
                const message = err instanceof Error ? err.message : "Failed to load user details"
                console.error("Error fetching user data:", err)
                setFetchError(message)
                toast.error("Failed to fetch user details")
            } finally {
                if (isMounted) setIsFetching(false)
            }
        }

        loadData()

        return () => {
            isMounted = false
        }
    }, [userId])

    // Filter branches & departments based on selection (with fallback to all if no matches)
    const availableBranches = React.useMemo(() => {
        if (!formData.companyId) return branches
        const filtered = branches.filter((b) => !b.companyId || String(b.companyId) === String(formData.companyId))
        return filtered.length > 0 ? filtered : branches
    }, [branches, formData.companyId])

    const availableDepartments = React.useMemo(() => {
        if (!formData.branchId) return departments
        const filtered = departments.filter((d) => !d.branchId || String(d.branchId) === String(formData.branchId))
        return filtered.length > 0 ? filtered : departments
    }, [departments, formData.branchId])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match. Please verify your entries.")
            return
        }

        setIsLoading(true)

        const now = new Date().toISOString()
        const selectedRole = roles.find((r) => String(r.roleId) === String(formData.roleId))
        const roleName = selectedRole ? selectedRole.roleName : originalUser?.role || "User"

        const payload: any = {
            ...originalUser,
            userId: Number(userId) || originalUser?.userId || 0,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            gender: formData.gender,
            employeeId: formData.employeeId.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            companyId: Number(formData.companyId) || 0,
            branchId: Number(formData.branchId) || 0,
            departmentId: Number(formData.departmentId) || 0,
            roleId: Number(formData.roleId) || 0,
            role: roleName,
            handlerId: Number(formData.handlerId) || 0,
            status: formData.status,
            imageUrl: formData.imageUrl.trim(),
            updatedAt: now,
        }

        // Only update password if a new password is provided
        if (formData.password) {
            payload.passwordHash = formData.password
        }

        try {
            await usersApi.update(userId, payload)
            toast.success("User updated successfully")
            navigate("/system/users")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast.error(`Failed to update user: ${message}`)
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[420px] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Loading user information...</p>
            </div>
        )
    }

    if (fetchError) {
        return (
            <div className="max-w-2xl mx-auto mt-12 flex flex-col gap-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Unable to load user</AlertTitle>
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate("/system/users")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Users
                    </Button>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        )
    }

    const fullName = `${formData.firstName} ${formData.lastName}`.trim() || formData.email || `User #${userId}`

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
                        <p className="text-muted-foreground text-sm">
                            Modify details, organizational placement, and permissions for <span className="font-semibold text-slate-800">{fullName}</span> (ID: {userId}).
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div className="grid gap-6">
                    {/* PERSONAL INFORMATION */}
                    <Card className="shadow-sm border">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Personal Information</CardTitle>
                            </div>
                            <CardDescription>
                                Basic identification details and personal profile info.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="firstName">
                                        First Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="firstName"
                                        placeholder="Enter first name"
                                        required
                                        value={formData.firstName}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lastName">
                                        Last Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Enter last name"
                                        required
                                        value={formData.lastName}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(val) => setFormData((prev) => ({ ...prev, gender: val ?? "Male" }))}
                                    >
                                        <SelectTrigger id="gender">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="employeeId">
                                        Employee ID <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="employeeId"
                                        placeholder="EMP-000"
                                        required
                                        value={formData.employeeId}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="imageUrl" className="flex items-center gap-1.5">
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    Profile Image URL <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="imageUrl"
                                    type="url"
                                    placeholder="https://example.com/profile-photo.jpg"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* CONTACT & ORGANIZATIONAL DETAILS */}
                    <Card className="shadow-sm border">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Contact & Organization</CardTitle>
                            </div>
                            <CardDescription>
                                Official contact channels and organizational branch/department placement.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="flex items-center gap-1.5">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        Email Address <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@tejco.com"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">
                                        Phone Number <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="companyId">Company</Label>
                                    <Select
                                        value={formData.companyId}
                                        onValueChange={(val) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                companyId: val ?? "1",
                                                branchId: "",
                                                departmentId: "",
                                            }))
                                        }
                                    >
                                        <SelectTrigger id="companyId">
                                            <SelectValue placeholder="Select company">
                                                {companies.find((c) => String(c.id) === String(formData.companyId))?.name}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map((c) => (
                                                 <SelectItem key={c.id} value={String(c.id)}>
                                                     {c.name}
                                                 </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="branchId">Branch / Location</Label>
                                    <Select
                                        value={formData.branchId}
                                        onValueChange={(val) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                branchId: val ?? "",
                                            }))
                                        }
                                    >
                                        <SelectTrigger id="branchId">
                                            <SelectValue placeholder="Select branch">
                                                {branches.find((b) => String(b.id) === String(formData.branchId))?.name}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map((b) => (
                                                <SelectItem key={b.id} value={String(b.id)}>
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="departmentId">Department</Label>
                                    <Select
                                        value={formData.departmentId}
                                        onValueChange={(val) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                departmentId: val ?? "",
                                            }))
                                        }
                                    >
                                        <SelectTrigger id="departmentId">
                                            <SelectValue placeholder="Select department">
                                                {departments.find((d) => String(d.id) === String(formData.departmentId))?.name}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((d) => (
                                                <SelectItem key={d.id} value={String(d.id)}>
                                                    {d.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="handlerId">
                                    Handler / Superior ID <span className="text-xs text-muted-foreground font-normal">(Optional manager ID)</span>
                                </Label>
                                <Input
                                    id="handlerId"
                                    type="number"
                                    min={0}
                                    placeholder="Enter reporting manager / handler ID (e.g. 0)"
                                    value={formData.handlerId}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, handlerId: e.target.value }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* AUTHENTICATION & SYSTEM ACCESS */}
                    <Card className="shadow-sm border">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Authentication & Access Control</CardTitle>
                            </div>
                            <CardDescription>
                                Set system role, update password (optional), and manage account status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="roleId" className="flex items-center gap-1.5">
                                        <Shield className="h-4 w-4 text-indigo-600" />
                                        System Role <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={formData.roleId}
                                        onValueChange={(val) => setFormData((prev) => ({ ...prev, roleId: val ?? "1" }))}
                                    >
                                        <SelectTrigger id="roleId">
                                            <SelectValue placeholder="Select role">
                                                {roles.find((r) => String(r.roleId) === String(formData.roleId))?.roleName}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem key={r.roleId} value={String(r.roleId)}>
                                                    {r.roleName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Account Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val ?? "Active" }))}
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Suspended">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        New Password <span className="text-xs text-muted-foreground font-normal">(Leave blank to keep current)</span>
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="confirmPassword">
                                        Confirm New Password
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button variant="outline" type="button" onClick={() => navigate(-1)} disabled={isLoading}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving Changes...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
