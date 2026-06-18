"use client"

import { Fira_Code, Fira_Sans } from "next/font/google"
import "./globals.css"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { usePathname } from "next/navigation"

const firaSans = Fira_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  return (
    <html lang="en">
      <body className={`${firaSans.variable} ${firaCode.variable} min-h-screen bg-background antialiased font-sans`}>
        <TooltipProvider>
          {isLoginPage ? (
            <main className="min-h-screen">
              {children}
            </main>
          ) : (
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="flex flex-col">
                <TopNav />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 mx-auto w-full max-w-9xl">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          )}
          <Toaster position="top-right" expand={false} richColors />
        </TooltipProvider>
      </body>
    </html>
  )
}
