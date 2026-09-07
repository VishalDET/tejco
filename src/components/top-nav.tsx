import * as React from "react"
import { User, LogOut, Settings as SettingsIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { toast } from "sonner"

interface TopNavProps {
    /** Called when the user clicks Log out — provided by AppLayout so it
     *  goes through the centralized useAuth logout (clears timers, storage, etc.) */
    onLogout?: () => void
}

export function TopNav({ onLogout }: TopNavProps) {
    const navigate = useNavigate()
    const [user, setUser] = React.useState<any>(null)

    React.useEffect(() => {
        const storedUser = localStorage.getItem("tejco_user")
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
    }, [])

    const handleLogout = () => {
        if (onLogout) {
            // Use centralized logout from useAuth (clears timers, storage, cookie, navigates)
            toast.success("Logged out successfully")
            onLogout()
        } else {
            // Fallback (should never happen once AppLayout is wired)
            localStorage.removeItem("tejco_auth_token")
            localStorage.removeItem("tejco_user")
            document.cookie = "tejco_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            toast.success("Logged out successfully")
            navigate("/login")
        }
    }

    const userName = user ? `${user.firstName} ${user.lastName}` : "Admin User"
    const userEmail = user ? user.email : "admin@tejco.com"
    const userInitials = user ? `${user.firstName?.[0]}${user.lastName?.[0]}` : "AD"

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="-ml-1" />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.imageUrl} alt={userName} />
                                    <AvatarFallback>{userInitials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        }
                    />
                    <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{userName}</p>
                                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/system/profile")}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <SettingsIcon className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
