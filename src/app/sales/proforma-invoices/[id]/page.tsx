import * as React from "react"
import { useParams } from "react-router-dom"
import { ProformaDetailsView } from "./proforma-details-view"
import { ProformaInvoice } from "@/app/sales/proforma-invoices/types"
import { proformaApi } from "@/lib/api"
import { Loader } from "@/components/ui/loader"

export default function ProformaDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const [proforma, setProforma] = React.useState<ProformaInvoice | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<any>(null)

  React.useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    setError(null)
    
    proformaApi.getById(id)
      .then(data => {
        if (active) {
          setProforma(data)
          setLoading(false)
        }
      })
      .catch(err => {
        if (active) {
          console.error("Error loading proforma:", err)
          setError(err)
          setLoading(false)
        }
      })
      
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader layout="container" size="lg" text="Loading proforma invoice details..." />
      </div>
    )
  }

  if (error || !proforma) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-2">
        <h2 className="text-xl font-bold">Proforma Invoice Not Found</h2>
        <p className="text-muted-foreground">The requested proforma invoice could not be loaded.</p>
      </div>
    )
  }

  return <ProformaDetailsView proforma={proforma} />
}
