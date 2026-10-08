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

      // Fetch product catalog and warehouses in parallel
      const [resProducts, resWarehouses] = await Promise.all([
        productsApi.getAll().catch(() => []),
        warehousesApi.getAll().catch(() => [])
      ])

      const productCatalog = Array.isArray(resProducts) ? resProducts : (Array.isArray((resProducts as any)?.data) ? (resProducts as any).data : [])
      const productByIdMap = new Map<number, any>()
      const variantByIdMap = new Map<number, any>()
      const barcodeMap = new Map<string, { barcode: string; variantName: string; productName: string }>()

      productCatalog.forEach((prod: any) => {
        const pId = Number(prod.id || prod.productId || 0)
        if (pId) productByIdMap.set(pId, prod)
        if (prod.variants && Array.isArray(prod.variants)) {
          prod.variants.forEach((v: any) => {
            const vId = Number(v.id || v.variantId || 0)
            if (vId) variantByIdMap.set(vId, { ...v, productName: prod.name || prod.productName })
            const sku = `${prod.baseSKU || ""}${v.skuSuffix || ""}`
            if (sku) {
              barcodeMap.set(sku.toLowerCase(), {
                barcode: v.barcode || v.sku || sku,
                variantName: v.variantName || "",
                productName: prod.name || prod.productName || ""
              })
            }
          })
        }
      })

      // Try fetching existing outward order
      try {
        const apiOrder = await orderOutwardApi.getById(id)
        const rawOrder = (apiOrder as any)?.data || apiOrder
        if (rawOrder && (rawOrder.outwardOrderId || (rawOrder.items && rawOrder.items.length > 0))) {
          const mapped = mapApiOutwardOrder(rawOrder)
          if (mapped && mapped.items && mapped.items.length > 0) {
            resolvedOrder = mapped
          }
        }
      } catch (err) {
        console.log("Outward order not found on API, trying fallback to Sales Order:", err)
      }

      // Fallback to Sales Order if outward order is not found or has no items
      if (!resolvedOrder || resolvedOrder.items.length === 0) {
        try {
          let rawSalesOrder: any = null
          try {
            const salesOrderData = await salesOrderApi.getById(id)
            rawSalesOrder = (salesOrderData as any)?.data || salesOrderData
          } catch {
            // If getById fails, find order in GetAll
            const allApproved = await salesOrderApi.getAll({ Status: "Approved", PageSize: 500 }).catch(() => [])
            const list = Array.isArray(allApproved) ? allApproved : ((allApproved as any)?.data || [])
            rawSalesOrder = list.find((o: any) => 
              String(o.orderId) === String(id) || 
              String(o.id) === String(id) || 
              String(o.orderNumber || "").toLowerCase() === String(id).toLowerCase()
            )
          }

          if (rawSalesOrder && (rawSalesOrder.orderId || rawSalesOrder.orderNumber)) {
            const mappedSales = mapApiSalesOrder(rawSalesOrder)

            // If some products weren't in productCatalog, fetch individual product details
            await Promise.all(
              mappedSales.items.map(async (item: any) => {
                const pId = Number(item.productId || 0)
                if (pId && !productByIdMap.has(pId)) {
                  try {
                    const prodRes = await productsApi.getById(pId)
                    const pData = (prodRes as any)?.data || prodRes
                    if (pData) {
                      productByIdMap.set(pId, pData)
                      if (pData.variants && Array.isArray(pData.variants)) {
                        pData.variants.forEach((v: any) => {
                          const vId = Number(v.id || v.variantId || 0)
                          if (vId) variantByIdMap.set(vId, { ...v, productName: pData.name || pData.productName })
                        })
                      }
                    }
                  } catch {
                    // ignore
                  }
                }
              })
            )

            const rawWarehouses = Array.isArray(resWarehouses) ? resWarehouses : ((resWarehouses as any)?.data || [])
            const defaultWarehouse = rawWarehouses.find((w: any) => w.status === "Active") || rawWarehouses[0]
            const whName = defaultWarehouse?.name || "Main Warehouse"
            const whCode = defaultWarehouse?.id ? `WH-${defaultWarehouse.id}` : "M-WH"

            const items = mappedSales.items.map((item: any) => {
              const skuLower = (item.sku || "").toLowerCase()
              const resolved = barcodeMap.get(skuLower)
              const resolvedProd = productByIdMap.get(Number(item.productId || 0))
              const resolvedVar = variantByIdMap.get(Number(item.variantId || 0))

              const rawProdName = item.productName || ""
              const isValidProdName = rawProdName && rawProdName !== "null" && rawProdName !== "na" && !rawProdName.startsWith("Product #") && rawProdName.trim() !== ""
              const finalProdName = isValidProdName
                ? rawProdName
                : resolvedVar?.productName || resolvedProd?.name || resolvedProd?.productName || (item.name && item.name !== "na" && item.name !== "null" ? item.name : "") || `Product #${item.productId}`

              const rawVarName = item.variantName || ""
              const isValidVarName = rawVarName && rawVarName !== "null" && rawVarName !== "na" && rawVarName.trim() !== ""
              const finalVarName = isValidVarName
                ? rawVarName
                : resolvedVar?.variantName || resolvedVar?.name || (item.name && item.name !== finalProdName && item.name !== "na" ? item.name : "")

              const rawSku = item.sku || ""
              const isValidSku = rawSku && rawSku !== "null" && rawSku !== "na" && rawSku.trim() !== ""
              const finalSku = isValidSku
                ? rawSku
                : resolvedVar?.sku || (resolvedProd?.baseSKU ? `${resolvedProd.baseSKU}${resolvedVar?.skuSuffix || ""}` : `SKU-${item.productId}`)

              const finalBarcode = resolvedVar?.barcode || resolved?.barcode || (isValidSku ? rawSku : `BC-${item.productId}`)

              return {
                id: String(item.id || item.orderItemId || Math.random().toString(36).substring(2, 9)),
                productId: String(item.productId),
                productName: finalProdName,
                variantName: finalVarName,
                sku: finalSku,
                barcode: finalBarcode,
                orderedQty: Number(item.quantity || 1),
                scannedQty: 0,
                locationCode: "A-1"
              }
            })

            resolvedOrder = {
              id: String(mappedSales.orderId || mappedSales.id || id),
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
              items,
              scanHistory: []
            }
          }
        } catch (salesErr) {
          console.error("Failed to load fallback sales order:", salesErr)
        }
      }

      // Enrich items with product details if needed
      if (resolvedOrder && resolvedOrder.items) {
        resolvedOrder.items = resolvedOrder.items.map((item) => {
          const skuLower = (item.sku || "").toLowerCase()
          const resolved = barcodeMap.get(skuLower)
          const resolvedProd = productByIdMap.get(Number(item.productId || 0))
          const resolvedVar = variantByIdMap.get(Number(item.productId || 0)) || (resolvedProd?.variants && Array.isArray(resolvedProd.variants) ? resolvedProd.variants[0] : null)

          const rawProdName = item.productName || ""
          const isValidProdName = rawProdName && rawProdName !== "null" && rawProdName !== "na" && !rawProdName.startsWith("Product #") && rawProdName.trim() !== ""
          const finalProdName = isValidProdName
            ? rawProdName
            : resolvedVar?.productName || resolvedProd?.name || resolvedProd?.productName || `Product #${item.productId}`

          const rawSku = item.sku || ""
          const isValidSku = rawSku && rawSku !== "null" && rawSku !== "na" && rawSku.trim() !== ""
          const finalSku = isValidSku
            ? rawSku
            : resolvedVar?.sku || (resolvedProd?.baseSKU ? `${resolvedProd.baseSKU}${resolvedVar?.skuSuffix || ""}` : `SKU-${item.productId}`)

          const finalBarcode = item.barcode && item.barcode !== "na" && item.barcode !== ""
            ? item.barcode
            : resolvedVar?.barcode || resolved?.barcode || finalSku || `BC-${item.productId}`

          return {
            ...item,
            productName: finalProdName,
            sku: finalSku,
            barcode: finalBarcode
          }
        })
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
