import React, { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  Printer,
  FileDown,
  Settings2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Eye,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { purchaseOrderApi, vendorsApi, productsApi, warehousesApi } from "@/lib/api"
import { PurchaseOrder } from "../../types"
import { Vendor } from "@/app/supply-chain/vendors/types"
import { Warehouse } from "@/app/supply-chain/warehouse/types"
import {
  PurchaseOrderPrintDocument,
  PurchaseOrderPrintSettings,
} from "../../print/purchase-order-print-document"
import { toast } from "sonner"

export default function PurchaseOrderPrintPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const autoPrint = searchParams.get("auto") === "true" || searchParams.get("autoPrint") === "true"

  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [zoomLevel, setZoomLevel] = useState<number>(100)

  // Print custom options
  const [settings, setSettings] = useState<PurchaseOrderPrintSettings>({
    showCompanyHeader: true,
    showSignatures: true,
    showNotes: true,
    showTerms: true,
  })

  useEffect(() => {
    async function loadData() {
      if (!id) return
      setIsLoading(true)
      try {
        const [res, prodRes, whRes, vListRes] = await Promise.all([
          purchaseOrderApi.getById(id),
          productsApi.getAll().catch(() => []),
          warehousesApi.getAll().catch(() => []),
          vendorsApi.getAll().catch(() => []),
        ])

        const data = (res as any)?.data || res
        if (data) {
          // Map products
          const pList = Array.isArray(prodRes) ? prodRes : (prodRes as any)?.data || []
          const pMap: Record<number, any> = {}
          pList.forEach((p: any) => {
            if (p.productId) pMap[p.productId] = p
          })

          // Enrich line items
          if (data.lineItems && Array.isArray(data.lineItems)) {
            data.lineItems = data.lineItems.map((item: any) => {
              const p = pMap[item.productId]
              const variant = p?.variants?.find((v: any) => v.variantId === item.variantId)
              return {
                ...item,
                productName: item.productName || p?.productName || `Product #${item.productId}`,
                variantName: item.variantName || variant?.variantName || (variant ? "Standard" : ""),
                sku: item.sku || (variant?.skuSuffix ? `${p?.baseSKU || ""}${variant.skuSuffix}` : p?.baseSKU) || item.sku,
              }
            })
          }

          setOrder(data)

          // Find warehouse
          const whList = Array.isArray(whRes) ? whRes : (whRes as any)?.data || []
          if (data.warehouseId) {
            const matched = whList.find((w: any) => String(w.warehouseId || w.id) === String(data.warehouseId))
            if (matched) setWarehouse(matched)
          } else if (data.shippingAddress) {
            const matched = whList.find((w: any) =>
              w.name && data.shippingAddress.toLowerCase().includes(w.name.toLowerCase())
            )
            if (matched) setWarehouse(matched)
          }

          // Find vendor
          if (data.vendorId) {
            const vList = Array.isArray(vListRes) ? vListRes : (vListRes as any)?.data || []
            const matchedVendor = vList.find(
              (v: any) => String(v.id) === String(data.vendorId) || String(v.vendorId) === String(data.vendorId)
            )
            if (matchedVendor) {
              setVendor(matchedVendor)
            } else {
              try {
                const vRes = await vendorsApi.getById(String(data.vendorId))
                const vData = (vRes as any)?.data || vRes
                if (vData) setVendor(vData)
              } catch {
                // Ignore vendor fetch failure fallback
              }
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to load PO for print:", err)
        toast.error("Failed to load purchase order details")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  // Trigger auto print if requested
  useEffect(() => {
    if (!isLoading && order && autoPrint) {
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isLoading, order, autoPrint])

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-6 flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Preparing Purchase Order for Print...</span>
        </div>
        <div className="w-[210mm] h-[297mm] bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Purchase Order Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested purchase order ID could not be loaded.</p>
        <Button onClick={() => navigate("/purchase")} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Purchase Orders
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* ──────────────── PRINT STYLESHEET ──────────────── */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #purchase-order-print-root,
          #purchase-order-print-root * {
            visibility: visible;
          }
          #purchase-order-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print-hidden,
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}} />

      {/* ──────────────── FLOATING TOOLBAR (SCREEN ONLY) ──────────────── */}
      <header className="print-hidden sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3">
            <Link to={`/purchase/${order.purchaseOrderId}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Back to Order Details">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {order.orderNumber}
                </h1>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                  {order.orderStatus}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">Print & Export Purchase Order Document</p>
            </div>
          </div>

          {/* Center: Zoom Controls */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 font-mono text-[11px] min-w-[42px] text-center">{zoomLevel}%</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => setZoomLevel(100)}
              title="Reset Zoom"
            >
              100%
            </Button>
          </div>

          {/* Right: Settings & Primary Print Action */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Options</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">Document Sections</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={settings.showCompanyHeader}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, showCompanyHeader: !!checked }))
                  }
                  className="text-xs"
                >
                  Tejco Corporate Header
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={settings.showSignatures}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, showSignatures: !!checked }))
                  }
                  className="text-xs"
                >
                  Signature & Stamp Blocks
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={settings.showNotes}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, showNotes: !!checked }))
                  }
                  className="text-xs"
                >
                  Order Notes & Instructions
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={settings.showTerms}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, showTerms: !!checked }))
                  }
                  className="text-xs"
                >
                  Terms & Conditions
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ──────────────── PREVIEW CANVAS ──────────────── */}
      <main className="flex-1 overflow-auto py-8 px-4 flex justify-center items-start">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="shadow-2xl rounded-sm overflow-hidden border border-slate-300 dark:border-slate-800"
        >
          <PurchaseOrderPrintDocument
            order={order}
            vendor={vendor}
            warehouse={warehouse}
            settings={settings}
            containerId="purchase-order-print-root"
          />
        </div>
      </main>
    </div>
  )
}
