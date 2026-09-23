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
        <SidebarProvider defaultOpen={true} className="min-h-screen w-full overflow-x-hidden max-w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col min-w-0 max-w-full overflow-x-hidden">
            <TopNav onLogout={() => logout("manual")} />
            <div className="flex-1 min-w-0 w-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-[1600px] min-w-0">
                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      )}
      <Toaster position="top-right" expand={false} richColors />
    </TooltipProvider>
  )
}
