import * as React from "react"
import { useParams } from "react-router-dom"
import { OutwardScanView } from "./outward-scan-view"
import { orderOutwardApi, salesOrderApi, warehousesApi, productsApi } from "@/lib/api"
import { mapApiOutwardOrder, type OutwardOrder } from "../types"
import { mapApiSalesOrder } from "../../../sales/orders/types"
import { Loader } from "@/components/ui/loader"

export default function OrderOutwardScanPage() {
  const params = useParams()
  const id = params?.id as string

  const [order, setOrder] = React.useState<OutwardOrder | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)

    async function loadData() {
      let resolvedOrder: OutwardOrder | null = null
      try {
        const apiOrder = await orderOutwardApi.getById(id)
        if (apiOrder) {
          resolvedOrder = mapApiOutwardOrder(apiOrder)
        }
      } catch (err) {
        console.log("Outward order not found on API, trying fallback to Sales Order:", err)
      }

      if (!resolvedOrder) {
        try {
          const salesOrderData = await salesOrderApi.getById(id)
          const rawSalesOrder = (salesOrderData as any)?.data || salesOrderData
          if (rawSalesOrder) {
            const mappedSales = mapApiSalesOrder(rawSalesOrder)
            const [resWarehouses] = await Promise.all([
              warehousesApi.getAll()
            ]).catch(() => [[]])

            const productDetails = await Promise.all(
              mappedSales.items.map(async (item: any) => {
                try {
                  const prodRes = await productsApi.getById(item.productId)
                  return (prodRes as any)?.data || prodRes
                } catch (err) {
                  return null
                }
              })
            )

            const barcodeMap = new Map<string, { barcode: string; variantName: string }>()
            productDetails.forEach((prod: any) => {
              if (prod && prod.variants && Array.isArray(prod.variants)) {
                prod.variants.forEach((v: any) => {
                  const sku = `${prod.baseSKU || ""}${v.skuSuffix || ""}`
                  if (sku) {
                    barcodeMap.set(sku.toLowerCase(), {
                      barcode: v.barcode || v.sku || sku,
                      variantName: v.variantName || ""
                    })
                  }
                })
              }
            })

            const defaultWarehouse = resWarehouses.find((w: any) => w.status === "Active") || resWarehouses[0]
            const whName = defaultWarehouse?.name || "Main Warehouse"
            const whCode = defaultWarehouse?.id ? `WH-${defaultWarehouse.id}` : "M-WH"

            resolvedOrder = {
              id: mappedSales.id,
              orderId: mappedSales.orderId,
              orderNumber: mappedSales.orderNumber,
              clientName: mappedSales.clientName,
              warehouseName: whName,
              warehouseCode: whCode,
              shippingAddress: mappedSales.shippingAddress || mappedSales.billingAddress || "",
              orderDate: mappedSales.date,
              promisedDate: mappedSales.deliveryDate || mappedSales.date,
              status: "Ready",
              priority: "Normal",
              pickerName: "Warehouse Operator",
              items: mappedSales.items.map((item: any) => {
                const skuLower = (item.sku || "").toLowerCase()
                const resolved = barcodeMap.get(skuLower)
                return {
                  id: item.id,
                  productId: item.productId,
                  productName: item.productName,
                  variantName: resolved?.variantName || item.name || "",
                  sku: item.sku,
                  barcode: resolved?.barcode || item.sku,
                  orderedQty: item.quantity,
                  scannedQty: 0,
                  locationCode: "A-1"
                }
              }),
              scanHistory: []
            }
          }
        } catch (salesErr) {
          console.error("Failed to load fallback sales order:", salesErr)
        }
      }

      if (active) {
        setOrder(resolvedOrder)
        setLoading(false)
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader layout="container" size="lg" text="Loading outward scan details..." />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-2">
        <h2 className="text-xl font-bold">Order Outward Record Not Found</h2>
        <p className="text-muted-foreground">The requested outward scanning record could not be loaded.</p>
      </div>
    )
  }

  return <OutwardScanView order={order} />
}
