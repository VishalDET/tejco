import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
    User,
    Mail,
    Phone,
    Building2,
    Briefcase,
    Shield,
    LogOut,
    Camera,
    Calendar,
    MapPin,
    Loader2,
    AlertCircle,
    RefreshCw,
    BadgeCheck,
    IdCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { usersApi, systemMastersApi, rolesApi } from "@/lib/api"

export default function ProfilePage() {
    const navigate = useNavigate()
    const { logout, user: authUser } = useAuth()
    const [user, setUser] = React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState<boolean>(true)
    const [error, setError] = React.useState<string | null>(null)

    // Master name resolutions
    const [companyName, setCompanyName] = React.useState<string>("")
    const [branchName, setBranchName] = React.useState<string>("")
    const [departmentName, setDepartmentName] = React.useState<string>("")
    const [roleName, setRoleName] = React.useState<string>("")

    const fetchUserProfile = React.useCallback(async () => {
        setIsLoading(true)
        setError(null)

        // Determine target user ID - default to 6 as requested or logged-in user id
        const targetUserId = authUser?.userId || authUser?.id || "6"

        try {
            const [userRes, compsRes, branchesRes, deptsRes, rolesRes] = await Promise.all([
                usersApi.getById(String(targetUserId)).catch(async (err) => {
                    // Fallback to GetAll search if GetById returns error
                    try {
                        const allUsers = await usersApi.getAll()
                        const list = Array.isArray(allUsers) ? allUsers : (allUsers as any)?.data || []
                        const found = list.find((u: any) => String(u.userId || u.id) === String(targetUserId))
                        if (found) return found
                    } catch {
                        // ignore fallback error
                    }
                    throw err
                }),
                systemMastersApi.getCompanies().catch(() => []),
                systemMastersApi.getBranches().catch(() => []),
                systemMastersApi.getDepartments().catch(() => []),
                rolesApi.getAll().catch(() => []),
            ])

            const userData = userRes?.data ?? userRes
            if (!userData) {
                throw new Error(`User profile with ID "${targetUserId}" could not be found.`)
            }

            setUser(userData)

            // Parse master lists
            const compList = Array.isArray(compsRes) ? compsRes : ((compsRes as any)?.data || [])
            const brList = Array.isArray(branchesRes) ? branchesRes : ((branchesRes as any)?.data || [])
            const deptList = Array.isArray(deptsRes) ? deptsRes : ((deptsRes as any)?.data || [])
            const rList = Array.isArray(rolesRes) ? rolesRes : ((rolesRes as any)?.data || [])

            // Resolve Company Name
            const matchedCompany = compList.find(
                (c: any) => String(c.id ?? c.companyId ?? "") === String(userData.companyId)
            )
            setCompanyName(matchedCompany?.name ?? matchedCompany?.registeredName ?? (userData.company || "Tejco Group"))

            // Resolve Branch Name
            const matchedBranch = brList.find(
                (b: any) => String(b.id ?? b.branchId ?? b.BranchID ?? "") === String(userData.branchId)
            )
            setBranchName(matchedBranch?.name ?? matchedBranch?.branchName ?? (userData.branch || "Mumbai HQ"))

            // Resolve Department Name
            const matchedDept = deptList.find(
                (d: any) => String(d.id ?? d.departmentId ?? d.DepartmentID ?? "") === String(userData.departmentId)
            )
            setDepartmentName(
                matchedDept ? String(matchedDept.name ?? matchedDept.departmentName ?? "").trim() : (userData.department || "General Management")
            )

            // Resolve Role Name
            const matchedRole = rList.find(
                (r: any) => String(r.roleId ?? r.id ?? "") === String(userData.roleId)
            )
            setRoleName(matchedRole?.roleName ?? matchedRole?.name ?? userData.role ?? "User")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load user profile"
            console.error("Error fetching user profile:", err)
            setError(message)

            // Fallback to localStorage or mock if available
            const storedUser = localStorage.getItem("tejco_user")
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser))
                } catch {}
            }
        } finally {
            setIsLoading(false)
        }
    }, [authUser])

    React.useEffect(() => {
        fetchUserProfile()
    }, [fetchUserProfile])

    const handleLogout = () => {
        toast.success("Logged out successfully")
        logout("manual")
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
                <Loader2 className="h-9 w-9 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Loading profile information...</p>
            </div>
        )
    }

    if (error && !user) {
        return (
            <div className="max-w-xl mx-auto mt-12 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Profile Unavailable</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="flex gap-3">
                    <Button onClick={fetchUserProfile}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Go Back
                    </Button>
                </div>
            </div>
        )
    }

    const initials = (
        (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")
    ).toUpperCase() || (user?.email?.substring(0, 2) || "US").toUpperCase()

    const formattedCreatedAt = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "Recent"

    const isUserActive = String(user?.status || "active").toLowerCase() === "active"

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Profile Card */}
                <Card className="w-full md:w-[350px] shrink-0 overflow-hidden border-none shadow-lg pt-0 pb-6">
                    <div className="h-32 bg-gradient-to-r from-primary/80 to-blue-600/80" />
                    <CardContent className="relative pt-0 flex flex-col items-center -mt-16">
                        <div className="relative group">
                            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                                <AvatarImage src={user.imageUrl || undefined} alt={user.firstName} />
                                <AvatarFallback className="text-4xl bg-slate-100 text-primary font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <button className="absolute bottom-1 right-1 p-2 rounded-full bg-primary text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-4 text-center">
                            <h2 className="text-2xl font-bold">
                                {user.firstName || ""} {user.lastName || ""}
                            </h2>
                            <p className="text-muted-foreground font-medium text-sm mt-0.5">{roleName || user.role || "User"}</p>
                            <div className="flex gap-2 justify-center mt-3">
                                <Badge variant="secondary" className="font-normal">
                                    <Shield className="mr-1 h-3 w-3 text-indigo-600" />
                                    {user.employeeId ? `ID: ${user.employeeId}` : "Verified"}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className={`font-normal ${
                                        isUserActive
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}
                                >
                                    <BadgeCheck className="mr-1 h-3 w-3" />
                                    {user.status || "Active"}
                                </Badge>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="w-full space-y-4 px-2">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate">{user.email || "—"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>{user.phone || "—"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>{branchName || "Mumbai, India"}</span>
                            </div>
                        </div>

                        <Button
                            variant="destructive"
                            className="w-full mt-8 shadow-md"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Work Information</CardTitle>
                            <CardDescription>Details about your position and department.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Company</Label>
                                    <div className="flex items-center gap-2 font-medium text-slate-800">
                                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                                        <span>{companyName}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Branch / Office</Label>
                                    <div className="flex items-center gap-2 font-medium text-slate-800">
                                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                                        <span>{branchName}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Department</Label>
                                    <div className="flex items-center gap-2 font-medium text-slate-800">
                                        <Briefcase className="h-4 w-4 text-primary shrink-0" />
                                        <span>{departmentName}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Employee ID</Label>
                                    <div className="flex items-center gap-2 font-mono text-sm font-semibold text-slate-800">
                                        <IdCard className="h-4 w-4 text-primary shrink-0" />
                                        <span>{user.employeeId || "—"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Member Since</Label>
                                    <div className="flex items-center gap-2 font-medium text-slate-800">
                                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                                        <span>{formattedCreatedAt}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Account ID</Label>
                                    <div className="flex items-center gap-2 font-mono text-sm text-slate-800">
                                        #{user.userId || user.id || "6"}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Permissions & Roles</CardTitle>
                            <CardDescription>Assigned access levels and system privileges.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="font-semibold">{roleName || user.role || "User"} Access</p>
                                            <p className="text-sm text-muted-foreground">
                                                Active profile access configured for the Tejco ERP platform.
                                            </p>
                                        </div>
                                        <Shield className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {["System Masters", "Inventory Controls", "Sales Management", "User Management"].map((perm) => (
                                        <div
                                            key={perm}
                                            className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-white border border-slate-100 dark:bg-slate-950 dark:border-slate-800"
                                        >
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            {perm}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
