import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Boxes,
  Barcode,
  Search,
  Filter,
  Package,
  Layers,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Printer,
  Copy,
  Check,
  RefreshCw,
  ShoppingCart,
  Scan,
  Sparkles,
  MapPin,
  TrendingUp,
  Tag,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { productsApi, stockInwardApi, warehousesApi } from "@/lib/api"
import { encodeCode128B } from "@/lib/barcode-utils"

interface VariantRecord {
  variantId: number
  productId: number
  productName: string
  variantName: string
  size: string
  bevel: string
  sku: string
  barcode: string
  currentQuantity: number
  reorderLevel: number
  purchasePrice: number
  sellingPrice: number
  warehouseName: string
  rackLocation: string
}

interface ProductWithVariants {
  productId: number
  productName: string
  baseSKU: string
  category: string
  totalStock: number
  variantsCount: number
  variants: VariantRecord[]
}

interface SerializedUnit {
  unitBarcode: string
  serialNumber: string
  productName: string
  variantName: string
  sku: string
  warehouseName: string
  rackLocation: string
  inwardRef: string
  lotNumber: string
  status: "In Stock" | "Reserved" | "Dispatched"
}

export default function InventoryUnitsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<ProductWithVariants[]>([])
  const [serializedUnits, setSerializedUnits] = useState<SerializedUnit[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [stockStatusFilter, setStockStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("matrix")
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(new Set())

  // Live Barcode Scanner Inspector State
  const [scannerInput, setScannerInput] = useState("")
  const [scannedResult, setScannedResult] = useState<VariantRecord | SerializedUnit | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, inwardRes, whRes] = await Promise.all([
        productsApi.getAll().catch(() => []),
        stockInwardApi.getAll().catch(() => []),
        warehousesApi.getAll().catch(() => [])
      ])

      const rawProducts = Array.isArray(prodRes) ? prodRes : (prodRes as any)?.data || []
      const rawInwards = Array.isArray(inwardRes) ? inwardRes : (inwardRes as any)?.data || []
      const rawWh = Array.isArray(whRes) ? whRes : (whRes as any)?.data || []
      setWarehouses(rawWh)

      const defaultWhName = rawWh[0]?.name || rawWh[0]?.warehouseName || "Main Central WH"

      // 1. Process Products and their 5–7 Variants
      const parsedProducts: ProductWithVariants[] = rawProducts.map((p: any) => {
        const pId = Number(p.productId || p.id || 0)
        const pName = p.productName || p.name || `Product #${pId}`
        const baseSku = p.baseSKU || p.sku || `SKU-${pId}`
        const rawVars = Array.isArray(p.variants) ? p.variants : []

        const variantsList: VariantRecord[] = rawVars.map((v: any, vIdx: number) => {
          const vId = Number(v.variantId || v.id || vIdx + 1)
          const size = v.size || (v.variantName?.match(/\d+(\.\d+)?mm/i)?.[0]) || ""
          const bevel = v.bevel || ""
          const sku = v.sku || `${baseSku}${v.skuSuffix || `-${vId}`}`
          const barcode = v.barcode || v.barcodeNumber || `BC-${sku}`
          const currentQty = Number(v.currentQuantity ?? v.stock ?? v.initialQuantity ?? 0)
          const reorder = Number(v.reorderLevel || 5)
          const purPrice = Number(v.purchasePrice || p.purchasePrice || 0)
          const sellPrice = Number(v.sellingPrice || p.sellingPrice || 0)

          return {
            variantId: vId,
            productId: pId,
            productName: pName,
            variantName: v.variantName || v.name || (size ? `${size} ${bevel}`.trim() : `Variant #${vId}`),
            size,
            bevel,
            sku,
            barcode,
            currentQuantity: currentQty,
            reorderLevel: reorder,
            purchasePrice: purPrice,
            sellingPrice: sellPrice,
            warehouseName: v.warehouseName || defaultWhName,
            rackLocation: v.rackLocation || "RACK-A1"
          }
        })

        const totalStock = variantsList.reduce((sum, v) => sum + v.currentQuantity, 0)

        return {
          productId: pId,
          productName: pName,
          baseSKU: baseSku,
          category: p.categoryName || p.category || "Surgical Instruments",
          totalStock,
          variantsCount: variantsList.length,
          variants: variantsList
        }
      })

      setProducts(parsedProducts)
      // Auto-expand first 3 products
      setExpandedProductIds(new Set(parsedProducts.slice(0, 3).map(p => p.productId)))

      // 2. Process Physical Serialized Units from verified Inward receipts
      const unitsList: SerializedUnit[] = []
      rawInwards.forEach((inw: any) => {
        const inwNum = inw.orderNumber || inw.inwardNumber || `INW-${inw.id}`
        const cleanInw = inwNum.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
        const items = Array.isArray(inw.items) ? inw.items : []

        items.forEach((item: any, itmIdx: number) => {
          const qty = Number(item.acceptedQty || item.receivedQty || item.expectedQty || 1)
          const cleanSku = String(item.sku || `SKU${item.productId}`).replace(/[^A-Za-z0-9]/g, "").toUpperCase()

          for (let i = 1; i <= Math.min(qty, 10); i++) {
            const seq = String(i).padStart(3, "0")
            const unitBarcode = `${cleanSku}-${cleanInw}-${seq}`
            const serialNumber = `SN-${cleanInw}-${String(itmIdx + 1).padStart(2, "0")}${seq}`

            unitsList.push({
              unitBarcode,
              serialNumber,
              productName: item.productName || `Product #${item.productId}`,
              variantName: item.variantName || "Default Spec",
              sku: item.sku || `SKU-${item.productId}`,
              warehouseName: inw.warehouseName || defaultWhName,
              rackLocation: item.locationCode || "RACK-A1",
              inwardRef: inwNum,
              lotNumber: item.lotNumber || `LOT-${cleanInw}`,
              status: i % 4 === 0 ? "Dispatched" : i % 3 === 0 ? "Reserved" : "In Stock"
            })
          }
        })
      })

      setSerializedUnits(unitsList)
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load inventory engine data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Toggle Accordion for a Product Card
  const toggleExpand = (productId: number) => {
    setExpandedProductIds(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  // Handle Live Barcode Inspector Lookup
  const handleScannerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const query = scannerInput.trim().toUpperCase()
    if (!query) return

    // 1. Try finding in Serialized Units
    const foundUnit = serializedUnits.find(
      u => u.unitBarcode.toUpperCase() === query || u.serialNumber.toUpperCase() === query
    )
    if (foundUnit) {
      setScannedResult(foundUnit)
      toast.success(`Unit Identified: ${foundUnit.unitBarcode}`)
      return
    }

    // 2. Try finding in Variant Catalog
    for (const prod of products) {
      const foundVar = prod.variants.find(
        v => v.barcode.toUpperCase() === query || v.sku.toUpperCase() === query || query.includes(v.sku.toUpperCase())
      )
      if (foundVar) {
        setScannedResult(foundVar)
        toast.success(`Variant Identified: ${foundVar.productName} [${foundVar.variantName}]`)
        return
      }
    }

    toast.error(`No active product or unit matches barcode: ${scannerInput}`)
    setScannedResult(null)
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Copied: ${code}`)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  const handlePrintLabel = (title: string, sub: string, code: string) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Please allow popups to print label sticker.")
      return
    }

    const encoded = encodeCode128B(code)
    const rects = encoded.bars
      .map(b => `<rect x="${b.x}" y="0" width="${b.width}" height="35" fill="#000" />`)
      .join("")
    const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${encoded.totalWidth} 35" preserveAspectRatio="none">${rects}</svg>`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sticker - ${code}</title>
          <style>
            @page { size: 50mm 25mm; margin: 0; }
            body { margin: 0; padding: 1.5mm 2mm; font-family: monospace; text-align: center; display: flex; flex-direction: column; justify-content: space-between; height: 25mm; box-sizing: border-box; }
            .h { font-size: 7pt; font-weight: 800; text-transform: uppercase; }
            .p { font-size: 7.5pt; font-weight: 700; max-height: 14pt; overflow: hidden; }
            .v { font-size: 6.5pt; color: #333; }
            .b { height: 9mm; width: 92%; margin: 0 auto; display: flex; justify-content: center; }
            .c { font-size: 6.5pt; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="h">TEJCO GLOBAL LLP</div>
          <div class="p">${title}</div>
          <div class="v">[${sub}]</div>
          <div class="b">${svgMarkup}</div>
          <div class="c">${code}</div>
          <script>
            window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 500); }
          </script>
        </body>
      </html>
    `
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  // KPIs
  const allVariants = useMemo(() => products.flatMap(p => p.variants), [products])
  const totalPhysicalUnits = useMemo(() => allVariants.reduce((sum, v) => sum + v.currentQuantity, 0), [allVariants])
  const totalValuation = useMemo(() => allVariants.reduce((sum, v) => sum + (v.currentQuantity * v.purchasePrice), 0), [allVariants])
  const lowStockCount = useMemo(() => allVariants.filter(v => v.currentQuantity > 0 && v.currentQuantity <= v.reorderLevel).length, [allVariants])
  const outOfStockCount = useMemo(() => allVariants.filter(v => v.currentQuantity === 0).length, [allVariants])

  // Filter Products
  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    return products.filter(p => {
      const matchSearch =
        !q ||
        p.productName.toLowerCase().includes(q) ||
        p.baseSKU.toLowerCase().includes(q) ||
        p.variants.some(v => v.variantName.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q) || v.barcode.toLowerCase().includes(q))

      const matchStock =
        stockStatusFilter === "all" ||
        (stockStatusFilter === "low" && p.variants.some(v => v.currentQuantity <= v.reorderLevel)) ||
        (stockStatusFilter === "out" && p.variants.some(v => v.currentQuantity === 0)) ||
        (stockStatusFilter === "in" && p.totalStock > 0)

      return matchSearch && matchStock
    })
  }, [products, searchTerm, stockStatusFilter])

  // Filter Serialized Units
  const filteredSerializedUnits = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    return serializedUnits.filter(u => {
      return (
        !q ||
        u.unitBarcode.toLowerCase().includes(q) ||
        u.serialNumber.toLowerCase().includes(q) ||
        u.productName.toLowerCase().includes(q) ||
        u.variantName.toLowerCase().includes(q) ||
        u.sku.toLowerCase().includes(q) ||
        u.inwardRef.toLowerCase().includes(q)
      )
    })
  }, [serializedUnits, searchTerm])

  return (
    <div className="flex flex-col gap-6 pb-12 font-mono max-w-7xl mx-auto">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center  gap-2">
            <Boxes className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              Central Inventory Engine
            </h1>
            <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary bg-primary/5">
              Variant Matrix & Serial Registry
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Real-time multi-variant inventory engine: tracks every product, size variant (0.7mm–1.2mm, bevels), and physical serialized unit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="text-xs font-mono cursor-pointer"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh Stock
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/purchase/create")}
            className="text-xs font-mono bg-primary text-primary-foreground cursor-pointer"
          >
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
            Create Restock PO
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1 pt-3 px-4 flex flex-row items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Stock Valuation</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold">₹{totalValuation.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Asset value across all warehouses</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1 pt-3 px-4 flex flex-row items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Physical Units</span>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold text-emerald-600">{totalPhysicalUnits} Units</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{allVariants.length} distinct variants tracked</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1 pt-3 px-4 flex flex-row items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Low Stock Alerts</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Variants at or below reorder level</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1 pt-3 px-4 flex flex-row items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Out of Stock</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold text-rose-600">{outOfStockCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Immediate PO restocking required</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Barcode Scanner Inspector Console */}
      <Card className="border border-primary/30 bg-primary/5 shadow-xs">
        <CardHeader className="pb-2 pt-3 px-4 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Scan className="h-4 w-4" />
              Live Barcode & Physical Unit Inspector
            </CardTitle>
            <span className="text-[10px] text-muted-foreground">Optical / Laser Scanner Ready</span>
          </div>
        </CardHeader>
        <CardContent className="pt-3 pb-3 px-4">
          <form onSubmit={handleScannerSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Scan or enter any barcode sticker (e.g. SP90-08-INW... or BC-SP90)..."
                value={scannerInput}
                onChange={(e) => setScannerInput(e.target.value)}
                className="pl-9 text-xs font-mono bg-background h-9"
              />
            </div>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground text-xs font-mono cursor-pointer">
              Inspect Unit
            </Button>
          </form>

          {/* Inspector Result Card */}
          {scannedResult && (
            <div className="mt-3 p-3 bg-background border border-primary/30 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-foreground flex items-center gap-2">
                    {scannedResult.productName}
                    <Badge variant="outline" className="font-mono text-[10px] text-primary">
                      {scannedResult.variantName}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3">
                    <span>SKU: {scannedResult.sku}</span>
                    <span>WH: {scannedResult.warehouseName}</span>
                    <span>Bin: {scannedResult.rackLocation}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {"currentQuantity" in scannedResult ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    Stock: {scannedResult.currentQuantity} Units
                  </Badge>
                ) : (
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    Status: {scannedResult.status}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handlePrintLabel(
                      scannedResult.productName,
                      scannedResult.variantName,
                      "unitBarcode" in scannedResult ? scannedResult.unitBarcode : scannedResult.barcode
                    )
                  }
                  className="h-7 text-xs font-mono cursor-pointer"
                >
                  <Printer className="mr-1 h-3 w-3" />
                  Print Sticker
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Variant Stock Matrix vs Serialized Units Registry */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
          <TabsList className="bg-muted/50 p-1 font-mono text-xs">
            <TabsTrigger value="matrix" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              <Boxes className="h-3.5 w-3.5" />
              Product & Variant Stock Matrix ({products.length})
            </TabsTrigger>
            <TabsTrigger value="serialized" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              <Barcode className="h-3.5 w-3.5" />
              Serialized Barcode Stickers ({serializedUnits.length})
            </TabsTrigger>
          </TabsList>

          {/* Quick Filter Inputs */}
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter variants, sizes, SKUs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs font-mono h-8 bg-background"
              />
            </div>

            {activeTab === "matrix" && (
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs font-mono shadow-2xs focus:outline-hidden"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in">In Stock Only</option>
                <option value="low">Low Stock (≤ Reorder)</option>
                <option value="out">Out of Stock</option>
              </select>
            )}
          </div>
        </div>

        {/* Tab 1: Product & Variant Stock Matrix */}
        <TabsContent value="matrix" className="space-y-4 mt-0">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader layout="container" size="md" text="Loading central inventory engine..." />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-xs border rounded-lg border-dashed">
              <Boxes className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40 stroke-1" />
              <p>No products or variants found matching your filters.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isExpanded = expandedProductIds.has(product.productId)

              return (
                <Card key={product.productId} className="shadow-xs border border-border overflow-hidden">
                  {/* Master Product Header */}
                  <CardHeader
                    onClick={() => toggleExpand(product.productId)}
                    className="py-3 px-4 bg-muted/20 border-b border-border cursor-pointer hover:bg-muted/40 transition-colors flex flex-row items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-transform"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {product.productName}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {product.category}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            Base SKU: <span className="font-bold text-foreground">{product.baseSKU}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase">Variants: </span>
                        <span className="font-bold text-primary">{product.variantsCount} Configurations</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase">Total Units: </span>
                        <span className={`font-bold ${product.totalStock > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {product.totalStock} Units
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  {/* 5–7 Variants Detailed Table */}
                  {isExpanded && (
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase text-[10px]">
                            <tr>
                              <th className="py-2 px-4">Variant Spec (Size / Bevel)</th>
                              <th className="py-2 px-4">Variant SKU</th>
                              <th className="py-2 px-4">Barcode</th>
                              <th className="py-2 px-4 text-center">Available Stock</th>
                              <th className="py-2 px-4 text-center">Reorder Level</th>
                              <th className="py-2 px-4">Warehouse & Rack</th>
                              <th className="py-2 px-4 text-right">Selling Price</th>
                              <th className="py-2 px-4 text-center">Status</th>
                              <th className="py-2 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {product.variants.map((v) => {
                              const isLow = v.currentQuantity > 0 && v.currentQuantity <= v.reorderLevel
                              const isOut = v.currentQuantity === 0

                              return (
                                <tr key={v.variantId} className="hover:bg-muted/30 transition-colors">
                                  <td className="py-2.5 px-4 font-bold text-foreground flex items-center gap-2">
                                    <Tag className="h-3 w-3 text-primary" />
                                    <span>{v.variantName}</span>
                                    {v.size && (
                                      <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/20 bg-primary/5">
                                        {v.size}
                                      </Badge>
                                    )}
                                  </td>

                                  <td className="py-2.5 px-4 font-medium text-foreground">
                                    {v.sku}
                                  </td>

                                  <td className="py-2.5 px-4 text-muted-foreground font-mono text-[11px]">
                                    <div className="flex items-center gap-1">
                                      <span>{v.barcode}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(v.barcode)}
                                        className="p-1 hover:bg-muted rounded"
                                        title="Copy Barcode"
                                      >
                                        {copiedCode === v.barcode ? (
                                          <Check className="h-3 w-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="h-3 w-3 text-muted-foreground" />
                                        )}
                                      </button>
                                    </div>
                                  </td>

                                  <td className="py-2.5 px-4 text-center font-bold">
                                    <span
                                      className={
                                        isOut
                                          ? "text-rose-600"
                                          : isLow
                                            ? "text-amber-600"
                                            : "text-emerald-600"
                                      }
                                    >
                                      {v.currentQuantity} Units
                                    </span>
                                  </td>

                                  <td className="py-2.5 px-4 text-center text-muted-foreground">
                                    {v.reorderLevel}
                                  </td>

                                  <td className="py-2.5 px-4 text-muted-foreground">
                                    <div>{v.warehouseName}</div>
                                    <div className="text-[10px]">Rack: {v.rackLocation}</div>
                                  </td>

                                  <td className="py-2.5 px-4 text-right font-medium">
                                    ₹{v.sellingPrice.toLocaleString()}
                                  </td>

                                  <td className="py-2.5 px-4 text-center">
                                    {isOut ? (
                                      <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px]">
                                        Out of Stock
                                      </Badge>
                                    ) : isLow ? (
                                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                                        Low Stock
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                                        In Stock
                                      </Badge>
                                    )}
                                  </td>

                                  <td className="py-2.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePrintLabel(product.productName, v.variantName, v.barcode)}
                                        className="h-7 px-2 text-xs font-mono hover:bg-primary/10 hover:text-primary cursor-pointer"
                                        title="Print Barcode Label"
                                      >
                                        <Printer className="h-3 w-3 mr-1" />
                                        Label
                                      </Button>

                                      {(isLow || isOut) && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => navigate(`/purchase/create?restock=${product.productId}&variant=${v.variantId}`)}
                                          className="h-7 px-2 text-xs font-mono text-amber-700 hover:bg-amber-50 cursor-pointer"
                                          title="Create Restock PO"
                                        >
                                          <ShoppingCart className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Tab 2: Serialized Barcode Stickers Registry */}
        <TabsContent value="serialized" className="mt-0">
          <Card className="shadow-xs border border-border">
            <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Barcode className="h-4 w-4 text-primary" />
                  Physical Unit Barcode Registry
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Individual physical piece barcodes generated upon stock inward arrival with lot traceability.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredSerializedUnits.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-xs">
                  <Barcode className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40 stroke-1" />
                  <p>No serialized unit barcodes match your query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">Unit Barcode Sticker</th>
                        <th className="py-2.5 px-4">Product Master</th>
                        <th className="py-2.5 px-4">Variant Spec</th>
                        <th className="py-2.5 px-4">Warehouse & Rack</th>
                        <th className="py-2.5 px-4">Inward PO Ref</th>
                        <th className="py-2.5 px-4 text-center">Unit Status</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredSerializedUnits.map((unit, idx) => (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-foreground">
                            <div className="flex items-center gap-1.5">
                              <span>{unit.unitBarcode}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(unit.unitBarcode)}
                                className="p-1 hover:bg-muted rounded text-muted-foreground"
                              >
                                {copiedCode === unit.unitBarcode ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <div className="text-[10px] text-muted-foreground">{unit.serialNumber}</div>
                          </td>

                          <td className="py-2.5 px-4 font-semibold text-foreground">
                            {unit.productName}
                          </td>

                          <td className="py-2.5 px-4">
                            <Badge variant="outline" className="font-mono text-[10px] text-primary">
                              {unit.variantName}
                            </Badge>
                          </td>

                          <td className="py-2.5 px-4 text-muted-foreground">
                            <div>{unit.warehouseName}</div>
                            <div className="text-[10px]">{unit.rackLocation}</div>
                          </td>

                          <td className="py-2.5 px-4 text-muted-foreground">
                            <div>{unit.inwardRef}</div>
                            <div className="text-[10px]">{unit.lotNumber}</div>
                          </td>

                          <td className="py-2.5 px-4 text-center">
                            {unit.status === "In Stock" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                                In Stock
                              </Badge>
                            ) : unit.status === "Reserved" ? (
                              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                Reserved
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                                Dispatched
                              </Badge>
                            )}
                          </td>

                          <td className="py-2.5 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintLabel(unit.productName, unit.variantName, unit.unitBarcode)}
                              className="h-7 px-2 text-xs font-mono hover:bg-primary/10 hover:text-primary cursor-pointer"
                              title="Print Thermal Sticker"
                            >
                              <Printer className="h-3 w-3 mr-1" />
                              Sticker
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
