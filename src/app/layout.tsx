import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tejco ERP | Inventory & Management System",
  description: "Modern Inventory, Manufacturing, Warehouse, and Sales Management System",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col">
              <TopNav />
              <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 mx-auto">
                {children}
              </main>
            </SidebarInset>
            <Toaster position="top-right" expand={false} richColors />
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
