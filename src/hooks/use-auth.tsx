/**
 * useAuth & AuthProvider — Reactive authentication state + inactivity auto-logout.
 *
 * - AuthProvider: Wraps the app layout, providing synchronized auth state across all components.
 * - useAuth(): Hook exposing { isAuthenticated, user, login, logout, setIsAuthenticated }.
 * - Inactivity: Tracks mousemove, keydown, click, scroll, touchstart. Logs out after 30 mins with toast warning.
 * - Cross-tab sync: Listens for storage events to synchronize auth across tabs.
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { checkPermission, extractPermissionNames } from "@/lib/rbac"
import { rolesApi } from "@/lib/api"

const TOKEN_KEY = "tejco_auth_token"
const USER_KEY = "tejco_user"
const PERMISSIONS_KEY = "tejco_permissions"
const LAST_ACTIVITY_KEY = "tejco_last_activity"

/** Inactivity timeout in milliseconds (30 minutes) */
const INACTIVITY_MS = 30 * 60 * 1000

/** Warning shown 2 minutes before auto-logout */
const WARN_BEFORE_MS = 2 * 60 * 1000

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
    "mousemove",
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
    "click",
]

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

export function getStoredPermissions(): string[] {
    try {
        const raw = localStorage.getItem(PERMISSIONS_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(PERMISSIONS_KEY)
    localStorage.removeItem(LAST_ACTIVITY_KEY)
    // Clear cookie
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`
}

export function stampActivity() {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
}

export interface UserProfile {
    userId?: string
    firstName?: string
    lastName?: string
    email?: string
    role?: string
    roleId?: number | string
    permissions?: string[]
    phone?: string
    company?: string
    branch?: string
    department?: string
    imageUrl?: string | null
    createdAt?: string
    [key: string]: any
}

interface AuthContextType {
    isAuthenticated: boolean
    user: UserProfile | null
    permissions: string[]
    hasPermission: (permission: string | string[]) => boolean
    hasAnyPermission: (permissions: string[]) => boolean
    refreshPermissions: () => Promise<void>
    login: (token: string, userData?: UserProfile | null, permissions?: string[]) => void
    logout: (reason?: "manual" | "inactivity" | "expired") => void
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate()
    const [token, setToken] = React.useState<string | null>(() => getToken())
    const [user, setUser] = React.useState<UserProfile | null>(() => {
        try {
            const raw = localStorage.getItem(USER_KEY)
            return raw ? JSON.parse(raw) : null
        } catch {
            return null
        }
    })
    const [permissions, setPermissions] = React.useState<string[]>(() => getStoredPermissions())

    const isAuthenticated = !!token

    // Dynamic Permission Refresher
    const refreshPermissions = React.useCallback(async () => {
        if (!token || !user?.roleId) return
        try {
            const permRes = await rolesApi.getRolePermissions(user.roleId)
            const rawPerms = Array.isArray(permRes) ? permRes : (permRes as any)?.data || []
            const perms = extractPermissionNames(rawPerms)
            if (perms && perms.length > 0) {
                setPermissions(perms)
                localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms))
            }
        } catch (err) {
            console.warn(`Could not refresh role permissions for roleId ${user.roleId}:`, err)
        }
    }, [token, user?.roleId])

    // Synchronize latest permissions on load or when role changes
    React.useEffect(() => {
        if (!token || !user?.roleId) return

        // If permissions are missing from localStorage, fetch immediately
        if (!permissions || permissions.length === 0) {
            refreshPermissions()
        }

        // Listen for live permission updates from Roles Management or other tabs
        const handlePermUpdate = () => {
            refreshPermissions()
        }

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === PERMISSIONS_KEY && e.newValue) {
                try {
                    setPermissions(JSON.parse(e.newValue))
                } catch {}
            }
        }

        window.addEventListener("tejco_permissions_updated", handlePermUpdate)
        window.addEventListener("storage", handleStorageChange)

        return () => {
            window.removeEventListener("tejco_permissions_updated", handlePermUpdate)
            window.removeEventListener("storage", handleStorageChange)
        }
    }, [token, user?.roleId, refreshPermissions, permissions])

    const hasPermission = React.useCallback(
        (required: string | string[]) => {
            if (!required) return true
            // If super-admin, roleId 1, or wildcard
            if (permissions.includes("*") || user?.roleId === 1 || user?.role?.toLowerCase() === "administrator") {
                return true
            }
            return checkPermission(permissions, required)
        },
        [permissions, user?.role, user?.roleId]
    )

    const hasAnyPermission = React.useCallback(
        (reqs: string[]) => {
            if (!reqs || reqs.length === 0) return true
            return hasPermission(reqs)
        },
        [hasPermission]
    )

    const warnToastIdRef = React.useRef<string | number | null>(null)
    const inactivityTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const warnTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const logout = React.useCallback(
        (reason: "manual" | "inactivity" | "expired" = "manual") => {
            clearSession()
            setToken(null)
            setUser(null)
            setPermissions([])

            if (warnToastIdRef.current !== null) {
                toast.dismiss(warnToastIdRef.current)
                warnToastIdRef.current = null
            }

            if (reason === "inactivity") {
                toast.warning("You were logged out due to 30 minutes of inactivity.", {
                    duration: 6000,
                })
            } else if (reason === "expired") {
                toast.error("Your session has expired. Please log in again.", {
                    duration: 6000,
                })
            }

            navigate("/login", { replace: true })
        },
        [navigate]
    )

    const login = React.useCallback(
        (newToken: string, userData?: UserProfile | null, userPermissions?: string[]) => {
            localStorage.setItem(TOKEN_KEY, newToken)
            document.cookie = `${TOKEN_KEY}=${newToken}; path=/; max-age=86400; SameSite=Lax`
            stampActivity()
            setToken(newToken)

            if (userData) {
                localStorage.setItem(USER_KEY, JSON.stringify(userData))
                setUser(userData)
            }

            const permsToStore = userPermissions ?? userData?.permissions ?? []
            localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permsToStore))
            setPermissions(permsToStore)
        },
        []
    )

    const setIsAuthenticated = React.useCallback(
        (value: React.SetStateAction<boolean>) => {
            if (typeof value === "function") {
                const current = !!token
                const next = value(current)
                if (!next) logout("manual")
            } else if (!value) {
                logout("manual")
            }
        },
        [token, logout]
    )

    // -------------------------------------------------------------------------
    // Inactivity timer management
    // -------------------------------------------------------------------------

    const resetTimers = React.useCallback(() => {
        stampActivity()

        // Clear existing timers
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
        if (warnTimerRef.current) clearTimeout(warnTimerRef.current)

        // Dismiss any pending warning toast
        if (warnToastIdRef.current !== null) {
            toast.dismiss(warnToastIdRef.current)
            warnToastIdRef.current = null
        }

        // Set warning toast WARN_BEFORE_MS before logout
        warnTimerRef.current = setTimeout(() => {
            warnToastIdRef.current = toast.warning(
                "You will be logged out in 2 minutes due to inactivity.",
                { duration: WARN_BEFORE_MS, id: "inactivity-warn" }
            )
        }, INACTIVITY_MS - WARN_BEFORE_MS)

        // Set auto-logout timer
        inactivityTimerRef.current = setTimeout(() => {
            logout("inactivity")
        }, INACTIVITY_MS)
    }, [logout])

    // -------------------------------------------------------------------------
    // Attach / detach activity listeners when authenticated
    // -------------------------------------------------------------------------

    React.useEffect(() => {
        if (!isAuthenticated) return

        stampActivity()
        resetTimers()

        const handleActivity = () => resetTimers()
        ACTIVITY_EVENTS.forEach((ev) =>
            window.addEventListener(ev, handleActivity, { passive: true })
        )

        return () => {
            ACTIVITY_EVENTS.forEach((ev) =>
                window.removeEventListener(ev, handleActivity)
            )
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
            if (warnTimerRef.current) clearTimeout(warnTimerRef.current)
        }
    }, [isAuthenticated, resetTimers])

    // -------------------------------------------------------------------------
    // Cross-tab storage synchronization
    // -------------------------------------------------------------------------

    React.useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === TOKEN_KEY) {
                if (!e.newValue) {
                    setToken(null)
                    setUser(null)
                    setPermissions([])
                    navigate("/login", { replace: true })
                } else {
                    setToken(e.newValue)
                    const rawUser = localStorage.getItem(USER_KEY)
                    if (rawUser) {
                        try {
                            setUser(JSON.parse(rawUser))
                        } catch {
                            // ignore parse error
                        }
                    }
                    const rawPerms = localStorage.getItem(PERMISSIONS_KEY)
                    if (rawPerms) {
                        try {
                            setPermissions(JSON.parse(rawPerms))
                        } catch {
                            // ignore
                        }
                    }
                }
            } else if (e.key === PERMISSIONS_KEY) {
                if (e.newValue) {
                    try {
                        setPermissions(JSON.parse(e.newValue))
                    } catch {
                        // ignore
                    }
                } else {
                    setPermissions([])
                }
            }
        }
        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
    }, [navigate])

    const contextValue = React.useMemo(
        () => ({
            isAuthenticated,
            user,
            permissions,
            hasPermission,
            hasAnyPermission,
            refreshPermissions,
            login,
            logout,
            setIsAuthenticated,
        }),
        [isAuthenticated, user, permissions, hasPermission, hasAnyPermission, refreshPermissions, login, logout, setIsAuthenticated]
    )

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType {
    const context = React.useContext(AuthContext)
    if (!context) {
        // Fallback if accessed outside AuthProvider
        const token = getToken()
        const storedPerms = getStoredPermissions()
        return {
            isAuthenticated: !!token,
            user: null,
            permissions: storedPerms,
            hasPermission: (required: string | string[]) => {
                if (!required) return true
                if (storedPerms.includes("*")) return true
                return checkPermission(storedPerms, required)
            },
            hasAnyPermission: (reqs: string[]) => {
                if (!reqs || reqs.length === 0) return true
                if (storedPerms.includes("*")) return true
                return checkPermission(storedPerms, reqs)
            },
            refreshPermissions: async () => {},
            login: (newToken: string, userData?: UserProfile | null, userPermissions?: string[]) => {
                localStorage.setItem(TOKEN_KEY, newToken)
                document.cookie = `${TOKEN_KEY}=${newToken}; path=/; max-age=86400; SameSite=Lax`
                stampActivity()
                if (userData) {
                    localStorage.setItem(USER_KEY, JSON.stringify(userData))
                }
                const permsToStore = userPermissions ?? userData?.permissions ?? []
                localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permsToStore))
            },
            logout: () => {
                clearSession()
                window.location.href = "/login"
            },
            setIsAuthenticated: () => {},
        }
    }
    return context
}
