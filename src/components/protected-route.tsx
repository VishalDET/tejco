/**
 * ProtectedRoute — Redirects unauthenticated users to /login.
 * Preserves the attempted path so we can redirect back after login.
 */

import * as React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { getToken } from "@/hooks/use-auth"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const isAuthenticated = !!getToken()

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return <>{children}</>
}
