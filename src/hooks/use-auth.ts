/**
 * useAuth — Authentication state + 30-minute inactivity auto-logout.
 *
 * - isAuthenticated: true when a token exists in localStorage
 * - logout(reason?): clears session data and navigates to /login
 * - Activity is tracked via mousemove, keydown, click, scroll, touchstart
 * - After 30 minutes of silence the user is logged out with a toast warning
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

const TOKEN_KEY = "tejco_auth_token"
const USER_KEY = "tejco_user"
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

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(LAST_ACTIVITY_KEY)
    // Clear cookie too
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`
}

export function stampActivity() {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
}

export function useAuth() {
    const navigate = useNavigate()
    const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(
        () => !!getToken()
    )

    const warnToastIdRef = React.useRef<string | number | null>(null)
    const inactivityTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const warnTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const logout = React.useCallback(
        (reason: "manual" | "inactivity" | "expired" = "manual") => {
            clearSession()
            setIsAuthenticated(false)

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

        // Stamp initial activity
        stampActivity()

        // Start timers immediately
        resetTimers()

        const handleActivity = () => resetTimers()
        ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }))

        return () => {
            ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handleActivity))
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
            if (warnTimerRef.current) clearTimeout(warnTimerRef.current)
        }
    }, [isAuthenticated, resetTimers])

    // -------------------------------------------------------------------------
    // Listen for storage changes (multi-tab logout)
    // -------------------------------------------------------------------------

    React.useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === TOKEN_KEY && !e.newValue) {
                // Token was removed in another tab
                setIsAuthenticated(false)
                navigate("/login", { replace: true })
            }
            if (e.key === TOKEN_KEY && e.newValue) {
                setIsAuthenticated(true)
            }
        }
        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
    }, [navigate])

    return { isAuthenticated, logout, setIsAuthenticated }
}
