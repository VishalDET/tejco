import { notFound } from "next/navigation"
import { OutwardScanView } from "./outward-scan-view"
import { orderOutwardApi, salesOrderApi, warehousesApi, productsApi, apiClient } from "@/lib/api"
import { mapApiOutwardOrder, type OutwardOrder } from "../types"
import { mapApiSalesOrder } from "../../../sales/orders/types"

export default async function OrderOutwardScanPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  
  let order: OutwardOrder | null = null
  try {
    const apiOrder = await orderOutwardApi.getById(params.id)
    if (apiOrder) {
      order = mapApiOutwardOrder(apiOrder)
    }
  } catch (err) {
    console.log("Outward order not found on API, trying fallback to Sales Order:", err)
  }

  // Fallback to fetch from Sales Order directly if no outward order exists yet
  if (!order) {
    try {
      const salesOrderData = await salesOrderApi.getById(params.id)
      const rawSalesOrder = (salesOrderData as any)?.data || salesOrderData
      if (rawSalesOrder) {
        const mappedSales = mapApiSalesOrder(rawSalesOrder)
        
        // Fetch warehouse configurations and product catalog details in parallel
        const [resWarehouses] = await Promise.all([
          warehousesApi.getAll()
        ]).catch(() => [[]])

        // Fetch each product detail sequentially or in parallel using getById
        const productDetails = await Promise.all(
          mappedSales.items.map(async (item: any) => {
            try {
              const prodRes = await productsApi.getById(item.productId)
              return (prodRes as any)?.data || prodRes
            } catch (err) {
              console.warn(`Failed to fetch product details for ID ${item.productId}:`, err)
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

        order = {
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

  if (!order) {
    notFound()
  }

  return <OutwardScanView order={order} />
}
