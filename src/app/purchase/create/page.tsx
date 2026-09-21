import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Loader2, AlertTriangle, PackageX } from "lucide-react"
import { PurchaseOrderForm } from "../purchase-order-form"
import { RestockLineItem } from "../types"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export default function CreatePurchaseOrderPage() {
  const [searchParams] = useSearchParams()
  const restock = searchParams.get("restock") // "all" | "<productId>" | null

  const [prefilledItems, setPrefilledItems] = useState<RestockLineItem[] | null>(null)
  const [isLoadingRestock, setIsLoadingRestock] = useState(!!restock)
  const [restockError, setRestockError] = useState<string | null>(null)

  useEffect(() => {
    if (!restock) return

    const load = async () => {
      try {
        setIsLoadingRestock(true)
        setRestockError(null)

        // Fetch Low and OutOfStock products in parallel
        const [lowRes, oosRes] = await Promise.all([
          apiClient.get<any>("/api/Product/GetAll?StockStatus=Low&PageSize=200"),
          apiClient.get<any>("/api/Product/GetAll?StockStatus=OutOfStock&PageSize=200"),
        ])

        const allProducts: any[] = [
          ...(lowRes?.data ?? []),
          ...(oosRes?.data ?? []),
        ]

        // Scope to a specific product if requested
        const filtered =
          restock === "all"
            ? allProducts
            : allProducts.filter((p) => String(p.productId) === restock)

        // Build RestockLineItem list — deduplicate by variantId
        const items: RestockLineItem[] = []
        const seen = new Set<number>()

        for (const p of filtered) {
          for (const v of p.variants ?? []) {
            if (seen.has(v.variantId)) continue
            seen.add(v.variantId)

            const currentQty = Number(v.currentQuantity ?? 0)
            const reorderLevel = Number(v.reorderLevel ?? 0)
            // Top-up to reorder level, minimum 1
            const suggestedQty = Math.max(1, reorderLevel - currentQty)

            items.push({
              productId: p.productId,
              productName: p.productName,
              variantId: v.variantId ?? null,
              variantName: v.variantName ?? p.productName,
              sku: `${p.baseSKU ?? ""}${v.skuSuffix ?? ""}`.trim(),
              unitPrice: Number(v.purchasePrice ?? 0),
              suggestedQty,
              currentQty,
              reorderLevel,
            })
          }
        }

        setPrefilledItems(items)
      } catch (err: any) {
        console.error("Failed to load restock items:", err)
        setRestockError(err?.message || "Failed to load low stock items.")
      } finally {
        setIsLoadingRestock(false)
      }
    }

    load()
  }, [restock])

  // Loading state while fetching restock items
  if (isLoadingRestock) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-20 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
        <p className="font-semibold text-foreground">Loading low stock items…</p>
        <p className="text-sm text-muted-foreground">
          Fetching inventory data to pre-fill your restock order.
        </p>
      </div>
    )
  }

  // Error state
  if (restockError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-20 text-center">
        <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Failed to load restock data</p>
          <p className="text-sm text-muted-foreground mt-1">{restockError}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/inventory/products">
            <Button variant="outline" size="sm">Back to Inventory</Button>
          </Link>
          <Button size="sm" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // No items found when in restock mode
  if (restock && prefilledItems?.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-20 text-center">
        <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
          <PackageX className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="font-semibold text-foreground">No low stock items found</p>
          <p className="text-sm text-muted-foreground mt-1">
            All inventory is at healthy levels. No restock PO needed right now.
          </p>
        </div>
        <Link to="/inventory/products">
          <Button variant="outline" size="sm">Back to Inventory</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 md:p-8">
      <PurchaseOrderForm
        isEdit={false}
        prefilledItems={prefilledItems ?? undefined}
        restockMode={!!restock && (prefilledItems?.length ?? 0) > 0}
      />
    </div>
  )
}
