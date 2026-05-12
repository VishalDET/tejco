"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
    MapPin
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
import { toast } from "sonner"

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = React.useState<any>(null)

    React.useEffect(() => {
        const storedUser = localStorage.getItem("tejco_user")
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        } else {
            // Fallback mock data if no user is found in storage
            setUser({
                firstName: "System",
                lastName: "Administrator",
                email: "admin@tejco.com",
                role: "Administrator",
                phone: "+91 98765 43210",
                company: "Tejco Group",
                branch: "Mumbai HO",
                department: "IT Infrastructure",
                imageUrl: null,
                createdAt: new Date().toISOString()
            })
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem("tejco_auth_token")
        localStorage.removeItem("tejco_user")
        toast.success("Logged out successfully")
        router.push("/login")
    }

    if (!user) return null

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Profile Card */}
                <Card className="w-full md:w-[350px] shrink-0 overflow-hidden border-none shadow-lg pt-0 pb-6">
                    <div className="h-32 bg-gradient-to-r from-primary/80 to-blue-600/80" />
                    <CardContent className="relative pt-0 flex flex-col items-center -mt-16">
                        <div className="relative group">
                            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                                <AvatarImage src={user.imageUrl} />
                                <AvatarFallback className="text-4xl bg-slate-100 text-primary">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <button className="absolute bottom-1 right-1 p-2 rounded-full bg-primary text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-4 text-center">
                            <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                            <p className="text-muted-foreground">{user.role}</p>
                            <div className="flex gap-2 justify-center mt-3">
                                <Badge variant="secondary" className="font-normal">
                                    <Shield className="mr-1 h-3 w-3" />
                                    Verified
                                </Badge>
                                <Badge variant="outline" className="font-normal bg-green-50 text-green-700 border-green-200">
                                    Online
                                </Badge>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="w-full space-y-4 px-2">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{user.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{user.branch || "Mumbai, India"}</span>
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
                                    <div className="flex items-center gap-2 font-medium">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        {user.company || "Tejco Group"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Department</Label>
                                    <div className="flex items-center gap-2 font-medium">
                                        <Briefcase className="h-4 w-4 text-primary" />
                                        {user.department || "General Management"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Member Since</Label>
                                    <div className="flex items-center gap-2 font-medium">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Account ID</Label>
                                    <div className="flex items-center gap-2 font-mono text-sm">
                                        #{user.userId || "0001"}
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
                                            <p className="font-semibold">{user.role} Access</p>
                                            <p className="text-sm text-muted-foreground">Full access to system configurations, user management, and advanced reporting modules.</p>
                                        </div>
                                        <Shield className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {['System Masters', 'Inventory Controls', 'Sales Management', 'Audit Logs'].map((perm) => (
                                        <div key={perm} className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-white border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
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
