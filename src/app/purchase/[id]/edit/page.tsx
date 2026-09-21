import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { purchaseOrderApi } from "@/lib/api"
import { PurchaseOrder } from "../../types"
import { PurchaseOrderForm } from "../../purchase-order-form"

export default function EditPurchaseOrderPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!id) return
    const fetchOrder = async () => {
      setIsLoading(true)
      try {
        const res = await purchaseOrderApi.getById(id)
        const data = (res as any)?.data || res
        if (data) setOrder(data)
      } catch (err: any) {
        toast.error(err?.message || "Failed to load purchase order for editing")
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex-1 p-6 md:p-8 max-w-[800px] mx-auto text-center space-y-4">
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-14 h-14 mx-auto flex items-center justify-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold">Purchase Order Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The purchase order you requested with ID #{id} could not be loaded for editing.
        </p>
        <Link to="/purchase">
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Purchase Orders</span>
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 md:p-8">
      <PurchaseOrderForm initialData={order} isEdit={true} />
    </div>
  )
}
