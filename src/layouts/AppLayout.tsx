import React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { useLocation, Outlet, Navigate } from "react-router-dom"
import { useAuth, getToken } from "@/hooks/use-auth"

export function AppLayout() {
  const location = useLocation()
  const isLoginPage = location.pathname === "/login"

  // Mount auth + inactivity timer for the entire app shell
  const { isAuthenticated, logout } = useAuth()
  const authenticated = isAuthenticated || !!getToken()

  // Redirect unauthenticated users away from protected pages
  if (!isLoginPage && !authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Redirect already-logged-in users away from /login
  if (isLoginPage && authenticated) {
    const from = (location.state as any)?.from?.pathname ?? "/"
    return <Navigate to={from} replace />
  }

  return (
    <TooltipProvider>
      {isLoginPage ? (
        <main className="min-h-screen">
          <Outlet />
        </main>
      ) : (
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <SidebarInset className="flex flex-col">
            <TopNav onLogout={() => logout("manual")} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 mx-auto w-full max-w-[1320px]">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      )}
      <Toaster position="top-right" expand={false} richColors />
    </TooltipProvider>
  )
}
