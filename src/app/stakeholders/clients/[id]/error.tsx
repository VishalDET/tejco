"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCcw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Client Details Error:", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Something went wrong!
      </h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        {error.message || "An unexpected error occurred while fetching the client data."}
      </p>
      
      <div className="flex flex-col gap-4 items-center">
        {error.message?.includes("fetch") && (
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-900 mb-2">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Check your API:</strong> If you're using a local backend (localhost), 
              ensure it's running and accessible. If using HTTPS with a self-signed certificate, 
              try using HTTP instead in your <code>.env.local</code>.
            </p>
          </div>
        )}
        
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Page
          </Button>
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCcw className="h-4 w-4" /> Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
