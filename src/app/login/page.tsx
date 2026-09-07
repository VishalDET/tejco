
import * as React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Loader2, Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { authApi, usersApi } from "@/lib/api"
import { stampActivity } from "@/hooks/use-auth"
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
import { toast } from "sonner"

export default function LoginPage() {
  const navigate = useNavigate()
    const location = useLocation()
    const [isLoading, setIsLoading] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)
    const [formData, setFormData] = React.useState({
        username: "",
        password: "",
    })

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        try {
            const loginResponse = await authApi.login(formData)
            
            // Extract token
            const token = loginResponse.token || loginResponse.data?.token || loginResponse.accessToken || (typeof loginResponse === 'string' ? loginResponse : null)
            
            if (!token) {
                throw new Error("Invalid response from server. No token received.")
            }

            // Save token in localStorage and Cookie (Middleware needs the cookie)
            localStorage.setItem("tejco_auth_token", token)
            document.cookie = `tejco_auth_token=${token}; path=/; max-age=86400; SameSite=Lax`

            // Stamp initial activity so the inactivity timer starts clean
            stampActivity()

            // Fetch full user details by email
            try {
                const userRes = await usersApi.getByEmail(formData.username)
                const userData = userRes.data || userRes
                localStorage.setItem("tejco_user", JSON.stringify(userData))
            } catch (userErr) {
                console.error("Failed to fetch user details:", userErr)
            }

            toast.success("Login successful! Welcome back.")
            // Redirect to the page the user originally tried to visit
            const from = (location.state as any)?.from?.pathname ?? "/"
            navigate(from, { replace: true })
        } catch (err: any) {
            const message = err.message || "Invalid username or password"
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDevBypass = () => {
        setIsLoading(true)
        const mockToken = "dev-bypass-token"
        localStorage.setItem("tejco_auth_token", mockToken)
        document.cookie = `tejco_auth_token=${mockToken}; path=/; max-age=86400; SameSite=Lax`
        stampActivity()

        const mockUser = {
            userId: "0001",
            firstName: "Developer",
            lastName: "User",
            email: "dev@tejco.com",
            role: "Administrator",
            phone: "+91 98765 43210",
            company: "Tejco Group (Dev)",
            branch: "Mumbai HO",
            department: "IT Infrastructure",
            imageUrl: null,
            createdAt: new Date().toISOString()
        }
        localStorage.setItem("tejco_user", JSON.stringify(mockUser))
        toast.success("Bypassed login (Dev Mode)")
        const from = (location.state as any)?.from?.pathname ?? "/"
        navigate(from, { replace: true })
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
            </div>

            <Card className="w-full max-w-md relative border-none shadow-2xl bg-white/80 backdrop-blur-xl dark:bg-slate-900/80">
                <CardHeader className="space-y-2 text-center pb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Tejco System</CardTitle>
                    <CardDescription className="text-base">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Email or Username</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="username"
                                    placeholder="name@tejco.com"
                                    type="text"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    required
                                    className="pl-10 h-11 bg-white dark:bg-slate-950"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2 mb-8">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Button variant="link" className="px-0 font-normal text-xs text-muted-foreground hover:text-primary">
                                    Forgot password?
                                </Button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="pl-10 pr-10 h-11 bg-white dark:bg-slate-950"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pt-4">
                        <Button className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                        {import.meta.env.DEV && (
                            <Button 
                                type="button"
                                variant="outline" 
                                className="w-full h-11 text-base font-medium border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-all text-primary"
                                onClick={handleDevBypass}
                                disabled={isLoading}
                            >
                                Dev Mode: Bypass Login
                            </Button>
                        )}
                        <p className="text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Button variant="link" className="p-0 h-auto font-semibold text-primary">
                                Contact IT Dept
                            </Button>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
