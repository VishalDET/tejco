"use client"

import * as React from "react"
import { useParams, notFound } from "next/navigation"
import { QuotationDetailsView } from "./quotation-details-view"
import { Quotation } from "@/app/sales/quotations/types"
import { quotationsApi } from "@/lib/api"
import { Loader } from "@/components/ui/loader"

export default function QuotationDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const [quotation, setQuotation] = React.useState<Quotation | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<any>(null)

  React.useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    setError(null)
    
    quotationsApi.getById(id)
      .then(data => {
        if (active) {
          setQuotation(data)
          setLoading(false)
        }
      })
      .catch(err => {
        if (active) {
          console.error("Error loading quotation:", err)
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
        <Loader layout="container" size="lg" text="Loading quotation details..." />
      </div>
    )
  }

  if (error || !quotation) {
    notFound()
  }

  return <QuotationDetailsView quotation={quotation} />
}
