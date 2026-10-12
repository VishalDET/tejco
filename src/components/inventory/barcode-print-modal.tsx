import * as React from "react"
import {
  Printer,
  Copy,
  Check,
  Package,
  Layers,
  Settings2,
  Eye,
  RefreshCw,
  Sparkles,
  Barcode as BarcodeIcon,
  Sliders,
  CheckSquare,
  Square,
  AlertCircle
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  encodeCode128B,
  LABEL_PRESETS,
  LabelPreset
} from "@/lib/barcode-utils"

interface BarcodePrintModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  initialVariantId?: number | "all"
}

interface VariantSelectionItem {
  variantId: number
  variantName: string
  sku: string
  barcodeNumber: string
  sellingPrice: number
  usdAmount: number
  size?: string
  currentQuantity: number
  selected: boolean
  printQuantity: number
}

export function BarcodePrintModal({
  open,
  onOpenChange,
  product,
  initialVariantId = "all"
}: BarcodePrintModalProps) {
  // Label Template Configuration
  const [selectedPresetId, setSelectedPresetId] = React.useState<string>("thermal_50x25")
  const currentPreset = LABEL_PRESETS.find(p => p.id === selectedPresetId) || LABEL_PRESETS[0]

  // Customization Options
  const [companyName, setCompanyName] = React.useState<string>("TEJCO GLOBAL LLP")
  const [includeCompany, setIncludeCompany] = React.useState<boolean>(true)
  const [includeProductName, setIncludeProductName] = React.useState<boolean>(true)
  const [includeVariantName, setIncludeVariantName] = React.useState<boolean>(true)
  const [includeSku, setIncludeSku] = React.useState<boolean>(true)
  const [includePrice, setIncludePrice] = React.useState<boolean>(true)
  const [currencyType, setCurrencyType] = React.useState<"INR" | "USD">("INR")
  const [includeHumanText, setIncludeHumanText] = React.useState<boolean>(true)
  const [barcodeHeightStyle, setBarcodeHeightStyle] = React.useState<"compact" | "normal" | "tall">("normal")

  // Preview cycle variant
  const [previewVariantIndex, setPreviewVariantIndex] = React.useState<number>(0)
  const [previewTab, setPreviewTab] = React.useState<"single" | "sheet">("single")

  // Variants selection state
  const [items, setItems] = React.useState<VariantSelectionItem[]>([])

  // Initialize variant items when dialog opens or product changes
  React.useEffect(() => {
    if (!product || !open) return

    const baseSku = product.baseSKU || ""
    const rawVariants: any[] = Array.isArray(product.variants) ? product.variants : []

    let initialItems: VariantSelectionItem[] = []

    if (rawVariants.length === 0) {
      // Single product with no variants
      initialItems = [
        {
          variantId: product.productId || 0,
          variantName: product.productName || "Standard",
          sku: baseSku,
          barcodeNumber: product.barcodeNumber || baseSku || `BC-${product.productId}`,
          sellingPrice: Number(product.sellingPrice) || 0,
          usdAmount: Number(product.exportSellingPrice || product.usdAmount) || 0,
          size: product.size || "",
          currentQuantity: Number(product.currentQuantity) || 1,
          selected: true,
          printQuantity: 1
        }
      ]
    } else {
      initialItems = rawVariants.map((v: any) => {
        const fullSku = `${baseSku}${v.skuSuffix || ""}`
        const barcode = v.barcodeNumber || product.barcodeNumber || fullSku
        const isTarget = initialVariantId === "all" || initialVariantId === v.variantId

        return {
          variantId: v.variantId,
          variantName: v.variantName || product.productName,
          sku: fullSku,
          barcodeNumber: barcode,
          sellingPrice: Number(v.sellingPrice) || 0,
          usdAmount: Number(v.usdAmount || v.exportSellingPrice) || 0,
          size: v.size || v.Size || "",
          currentQuantity: Number(v.currentQuantity) || 0,
          selected: isTarget,
          printQuantity: 1
        }
      })
    }

    setItems(initialItems)
    setPreviewVariantIndex(0)
  }, [product, open, initialVariantId])

  // Bulk Variant Actions
  const handleSelectAll = (select: boolean) => {
    setItems(prev => prev.map(item => ({ ...item, selected: select })))
  }

  const handleSetAllQuantities = (qty: number) => {
    setItems(prev => prev.map(item => ({ ...item, printQuantity: Math.max(1, qty) })))
  }

  const handleSetQuantitiesToStock = () => {
    setItems(prev =>
      prev.map(item => ({
        ...item,
        printQuantity: Math.max(1, item.currentQuantity || 1),
        selected: item.currentQuantity > 0 ? true : item.selected
      }))
    )
    toast.success("Quantities updated to match current inventory levels")
  }

  const handleUpdateItem = (variantId: number, changes: Partial<VariantSelectionItem>) => {
    setItems(prev =>
      prev.map(item => (item.variantId === variantId ? { ...item, ...changes } : item))
    )
  }

  // Summary statistics
  const selectedItems = items.filter(i => i.selected && i.printQuantity > 0)
  const totalLabelsCount = selectedItems.reduce((acc, curr) => acc + curr.printQuantity, 0)

  // Current preview item
  const activePreviewItem = selectedItems[previewVariantIndex] || selectedItems[0] || items[0]

  // Barcode height mapping in mm
  const getBarcodePixelHeight = () => {
    switch (barcodeHeightStyle) {
      case "compact": return 32
      case "tall": return 55
      case "normal":
      default: return 42
    }
  }

  // Format currency helper
  const formatPrice = (inr: number, usd: number) => {
    if (currencyType === "USD") {
      return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `₹${inr.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  // Generate HTML for a single label in printable layout
  const buildLabelHtml = (item: VariantSelectionItem, preset: LabelPreset) => {
    const encoded = encodeCode128B(item.barcodeNumber || item.sku)
    const priceText = formatPrice(item.sellingPrice, item.usdAmount)
    const barHeight = preset.heightMm <= 25 ? "28" : "38"

    const svgBars = encoded.bars
      .map(b => `<rect x="${b.x}" y="0" width="${b.width}" height="${barHeight}" fill="#000" />`)
      .join("")

    return `
      <div class="barcode-label" style="
        width: ${preset.widthMm}mm;
        height: ${preset.heightMm}mm;
        box-sizing: border-box;
        padding: 1.5mm 2mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        background: #fff;
        color: #000;
        text-align: center;
        overflow: hidden;
        page-break-inside: avoid;
      ">
        <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 0.2mm;">
          ${includeCompany ? `
            <div style="font-size: 6.5pt; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.1; color: #111;">
              ${companyName || "TEJCO GLOBAL LLP"}
            </div>
          ` : ""}
          ${includeProductName ? `
            <div style="font-size: 7pt; font-weight: 700; max-width: 96%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.15; color: #000;">
              ${product?.productName || item.variantName}
            </div>
          ` : ""}
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: 6pt; font-weight: 600; padding: 0 0.5mm; line-height: 1;">
            ${includeVariantName && item.variantName !== product?.productName ? `
              <span style="max-width: 55%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${item.size ? `Size: ${item.size}` : item.variantName}
              </span>
            ` : `<span></span>`}
            ${includePrice && item.sellingPrice > 0 ? `
              <span style="font-weight: 800; font-size: 6.5pt; color: #000;">
                MRP: ${priceText}
              </span>
            ` : ""}
          </div>
        </div>

        <div style="width: 95%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0.4mm 0;">
          <svg viewBox="0 0 ${encoded.totalWidth} ${barHeight}" style="width: 100%; height: ${preset.heightMm <= 25 ? "8mm" : "12mm"}; display: block;" preserveAspectRatio="none">
            ${svgBars}
          </svg>
          ${includeHumanText ? `
            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 6.5pt; font-weight: 700; letter-spacing: 0.6px; line-height: 1; margin-top: 0.5mm;">
              ${encoded.text}
            </div>
          ` : ""}
        </div>

        ${includeSku ? `
          <div style="width: 100%; display: flex; justify-content: space-between; font-size: 5.5pt; font-family: ui-monospace, monospace; color: #333; line-height: 1;">
            <span>SKU: ${item.sku}</span>
            <span>${product?.hsnCode ? `HSN: ${product.hsnCode}` : ""}</span>
          </div>
        ` : ""}
      </div>
    `
  }

  // Execute Print Routine
  const handlePrint = () => {
    if (totalLabelsCount === 0) {
      toast.error("Please select at least one variation with a quantity greater than 0")
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print barcode labels")
      return
    }

    // Build the expanded list of labels
    const allLabelsHtml: string[] = []
    selectedItems.forEach(item => {
      for (let i = 0; i < item.printQuantity; i++) {
        allLabelsHtml.push(buildLabelHtml(item, currentPreset))
      }
    })

    const isRoll = currentPreset.type === "roll"

    printWindow.document.open()
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcodes - ${product?.productName || "Product"}</title>
          <meta charset="utf-8" />
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            @page {
              ${isRoll ? `
                size: ${currentPreset.widthMm}mm ${currentPreset.heightMm}mm;
                margin: 0;
              ` : `
                size: A4 portrait;
                margin: 8mm;
              `}
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              background: #fff;
              color: #000;
            }

            ${isRoll ? `
              .roll-container {
                display: block;
              }
              .roll-container .barcode-label {
                page-break-after: always;
                page-break-inside: avoid;
                margin: 0 auto;
              }
            ` : `
              .sheet-page {
                display: grid;
                grid-template-columns: repeat(${currentPreset.columns}, ${currentPreset.widthMm}mm);
                grid-gap: ${currentPreset.gapMm || 1.5}mm;
                justify-content: center;
                page-break-after: always;
                padding-top: 4mm;
              }
              .sheet-page .barcode-label {
                border: 0.2mm solid #e2e8f0;
                border-radius: 1mm;
              }
            `}

            @media screen {
              body {
                background: #f1f5f9;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .barcode-label {
                border: 1px dashed #cbd5e1;
                margin-bottom: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              }
            }
          </style>
        </head>
        <body>
          ${isRoll ? `
            <div class="roll-container">
              ${allLabelsHtml.join("")}
            </div>
          ` : `
            ${(() => {
        // Group into pages for sheet layout
        const perPage = currentPreset.labelsPerPage || 24
        const pages: string[] = []
        for (let i = 0; i < allLabelsHtml.length; i += perPage) {
          const chunk = allLabelsHtml.slice(i, i + perPage)
          pages.push(`<div class="sheet-page">${chunk.join("")}</div>`)
        }
        return pages.join("")
      })()}
          `}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
    toast.success(`Sent ${totalLabelsCount} barcode ${totalLabelsCount === 1 ? "label" : "labels"} to printer`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[96vw] xl:max-w-6xl max-h-[92vh] flex flex-col gap-0 p-0 overflow-hidden shadow-2xl">
        {/* Top Dialog Header */}
        <DialogHeader className="px-4 sm:px-6 py-3.5 sm:py-4 border-b bg-muted/20 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0">
                  <BarcodeIcon className="h-4 w-4" />
                </div>
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
                  Barcode Label Printing
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Configure sticker sizes, select variations, adjust quantities, and generate professional thermal/sheet labels.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Badge variant="outline" className="px-3 py-1 font-semibold text-xs border-indigo-200 bg-indigo-50/50 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300">
                Total Labels to Print: <span className="font-bold ml-1 text-sm">{totalLabelsCount}</span>
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Main Content (Split Columns) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* ======================================================== */}
            {/* LEFT COLUMN: VARIATIONS & QUANTITY PICKER (7 cols)       */}
            {/* ======================================================== */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-muted/40 p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Variations & Quantities
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {selectedItems.length} of {items.length} selected
                  </Badge>
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => handleSelectAll(true)}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => handleSelectAll(false)}
                  >
                    Clear All
                  </Button>
                  <div className="h-4 w-px bg-border hidden sm:block" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5 bg-background text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 dark:border-indigo-900"
                    onClick={handleSetQuantitiesToStock}
                    title="Automatically set quantities matching each variation's current stock"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Match Stock Qty
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 bg-background"
                    onClick={() => handleSetAllQuantities(1)}
                  >
                    Set 1 Each
                  </Button>
                </div>
              </div>

              {/* Variations Table */}
              <div className="border rounded-xl overflow-hidden bg-card shadow-2xs">
                <div className="overflow-x-auto max-h-[380px] scrollbar-thin">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/70 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs border-b">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={items.length > 0 && items.every(i => i.selected)}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 align-middle cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3 min-w-[170px]">Variation & SKU</th>
                        <th className="py-2.5 px-3 text-center min-w-[110px]">Barcode</th>
                        <th className="py-2.5 px-3 text-right min-w-[80px]">Price</th>
                        <th className="py-2.5 px-3 text-center min-w-[75px]">In Stock</th>
                        <th className="py-2.5 px-3 text-center min-w-[120px] w-28">Print Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {items.map((item) => (
                        <tr
                          key={item.variantId}
                          className={`hover:bg-muted/30 transition-colors ${item.selected ? "bg-indigo-50/20 dark:bg-indigo-950/10" : "opacity-60"}`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) => handleUpdateItem(item.variantId, { selected: e.target.checked })}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 align-middle cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-foreground truncate max-w-[180px] sm:max-w-[220px]" title={item.variantName}>
                              {item.variantName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-mono text-muted-foreground truncate">
                                SKU: {item.sku}
                              </span>
                              {item.size && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                                  {item.size}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {item.barcodeNumber || item.sku}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {formatPrice(item.sellingPrice, item.usdAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block font-semibold text-xs px-2 py-0.5 rounded-full ${item.currentQuantity > 0
                                  ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300"
                                }`}
                            >
                              {item.currentQuantity}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center justify-center rounded-lg border bg-muted/20 p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(item.variantId, { printQuantity: Math.max(1, item.printQuantity - 1) })}
                                className="h-6 w-6 rounded hover:bg-background text-xs font-bold text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
                                disabled={!item.selected}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={999}
                                value={item.printQuantity}
                                disabled={!item.selected}
                                onChange={(e) => handleUpdateItem(item.variantId, { printQuantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="h-6 w-10 bg-transparent text-center text-xs font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-hidden disabled:opacity-40"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(item.variantId, { printQuantity: item.printQuantity + 1 })}
                                className="h-6 w-6 rounded hover:bg-background text-xs font-bold text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
                                disabled={!item.selected}
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Information Banner */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Standard Code 128 (Subset B):</strong> Generated barcodes comply with ISO/IEC 15417 standards. Handheld warehouse laser scanners and mobile cameras will detect and read the exact SKU / Barcode values automatically.
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* RIGHT COLUMN: PRESET DESIGN & LIVE PREVIEW (5 cols)     */}
            {/* ======================================================== */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Preset Format Picker */}
              <div className="p-4 rounded-xl border bg-card space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                    Label Paper & Size Preset
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {currentPreset.type === "roll" ? "1-Across Roll" : `${currentPreset.columns} Across Sheet`}
                  </span>
                </div>

                <Select value={selectedPresetId} onValueChange={(val) => { if (val) setSelectedPresetId(val) }}>
                  <SelectTrigger className="text-xs font-semibold h-9 bg-background">
                    <SelectValue placeholder="Choose label preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {LABEL_PRESETS.map(preset => (
                      <SelectItem key={preset.id} value={preset.id} className="text-xs">
                        <div className="flex flex-col py-0.5">
                          <span className="font-semibold text-foreground">{preset.name}</span>
                          <span className="text-[10px] text-muted-foreground">{preset.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Information Content Toggle Controls */}
              <div className="p-4 rounded-xl border bg-card space-y-3.5 shadow-2xs">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Settings2 className="h-3.5 w-3.5 text-indigo-600" />
                  Fields Included on Label
                </Label>

                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-muted/30 border border-muted-foreground/10">
                    <label className="text-xs font-semibold flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeCompany}
                        onChange={(e) => setIncludeCompany(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                      />
                      Company Header
                    </label>
                    {includeCompany && (
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Company name"
                        className="h-7 text-xs w-full sm:w-48 px-2 font-semibold bg-background"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeProductName}
                        onChange={(e) => setIncludeProductName(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-foreground">Product Title</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeVariantName}
                        onChange={(e) => setIncludeVariantName(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-foreground">Variant & Size</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeSku}
                        onChange={(e) => setIncludeSku(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-foreground">SKU Code & HSN</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includePrice}
                        onChange={(e) => setIncludePrice(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-foreground">Price (MRP)</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer select-none sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={includeHumanText}
                        onChange={(e) => setIncludeHumanText(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-foreground">Barcode Human Readable Digits</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground">Price Currency</Label>
                    <Select value={currencyType} onValueChange={(v) => setCurrencyType(v as "INR" | "USD")}>
                      <SelectTrigger className="h-8 text-xs mt-1 bg-background font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR" className="text-xs">INR (₹)</SelectItem>
                        <SelectItem value="USD" className="text-xs">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground">Barcode Height</Label>
                    <Select value={barcodeHeightStyle} onValueChange={(v) => setBarcodeHeightStyle(v as any)}>
                      <SelectTrigger className="h-8 text-xs mt-1 bg-background font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact" className="text-xs">Compact (Low)</SelectItem>
                        <SelectItem value="normal" className="text-xs">Standard (Optimal)</SelectItem>
                        <SelectItem value="tall" className="text-xs">Tall (High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* LIVE VISUAL LABEL PREVIEW                                */}
              {/* ======================================================== */}
              <div className="p-4 rounded-xl border bg-card text-card-foreground space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <Eye className="h-3.5 w-3.5 text-indigo-600" />
                    Live Label Preview
                  </div>

                  {selectedItems.length > 1 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="font-medium">Item {previewVariantIndex + 1} of {selectedItems.length}</span>
                      <div className="inline-flex rounded-md bg-muted p-0.5 border">
                        <button
                          type="button"
                          onClick={() => setPreviewVariantIndex(prev => (prev > 0 ? prev - 1 : selectedItems.length - 1))}
                          className="px-2 py-0.5 rounded text-xs hover:bg-background text-foreground transition-colors"
                          title="Previous variation"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewVariantIndex(prev => (prev < selectedItems.length - 1 ? prev + 1 : 0))}
                          className="px-2 py-0.5 rounded text-xs hover:bg-background text-foreground transition-colors"
                          title="Next variation"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rendered Sticker View Container */}
                <div className="w-full py-5 px-3 flex items-center justify-center bg-slate-100 dark:bg-slate-900/60 rounded-xl overflow-x-auto border shadow-inner">
                  {activePreviewItem ? (
                    <div
                      className="bg-white text-slate-900 rounded-lg shadow-md border border-slate-300 p-2.5 flex flex-col justify-between items-center transition-all select-none box-border shrink-0"
                      style={{
                        width: `${Math.min(320, Math.max(220, currentPreset.widthMm * 5.2))}px`,
                        minHeight: `${Math.max(110, currentPreset.heightMm * 4.6)}px`,
                      }}
                    >
                      {/* Company Header */}
                      {includeCompany && (
                        <div className="font-extrabold text-[10.5px] tracking-wider text-slate-900 uppercase text-center w-full truncate border-b border-slate-200/80 pb-0.5">
                          {companyName || "TEJCO GLOBAL LLP"}
                        </div>
                      )}

                      {/* Product Name */}
                      {includeProductName && (
                        <div
                          className="font-bold text-[11px] text-slate-900 text-center w-full truncate leading-tight mt-1 px-1"
                          title={product?.productName || activePreviewItem.variantName}
                        >
                          {product?.productName || activePreviewItem.variantName}
                        </div>
                      )}

                      {/* Variant and Price Row */}
                      <div className="w-full flex items-center justify-between text-[9.5px] font-semibold text-slate-700 px-1 mt-0.5 gap-2">
                        <span className="truncate max-w-[65%]" title={activePreviewItem.variantName}>
                          {includeVariantName
                            ? (activePreviewItem.size ? `Size: ${activePreviewItem.size}` : (activePreviewItem.variantName !== product?.productName ? activePreviewItem.variantName : ""))
                            : ""}
                        </span>
                        {includePrice && activePreviewItem.sellingPrice > 0 && (
                          <span className="font-bold text-slate-900 shrink-0">
                            MRP: {formatPrice(activePreviewItem.sellingPrice, activePreviewItem.usdAmount)}
                          </span>
                        )}
                      </div>

                      {/* Barcode Graphic */}
                      <div className="w-full my-1.5 flex flex-col items-center justify-center px-1">
                        {(() => {
                          const barcodeVal = activePreviewItem.barcodeNumber || activePreviewItem.sku || "000000"
                          const encoded = encodeCode128B(barcodeVal)
                          return (
                            <>
                              <svg
                                viewBox={`0 0 ${encoded.totalWidth} 40`}
                                className="w-full"
                                style={{ height: `${getBarcodePixelHeight()}px`, maxHeight: currentPreset.heightMm <= 25 ? "32px" : "48px" }}
                                preserveAspectRatio="none"
                              >
                                {encoded.bars.map((b, i) => (
                                  <rect key={i} x={b.x} y="0" width={b.width} height="40" fill="black" />
                                ))}
                              </svg>
                              {includeHumanText && (
                                <div className="font-mono text-[10px] font-bold tracking-wider text-slate-900 mt-0.5 text-center">
                                  {encoded.text}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>

                      {/* SKU & HSN Footer */}
                      {includeSku && (
                        <div className="w-full flex items-center justify-between text-[8.5px] font-mono text-slate-600 border-t border-slate-200 pt-1 px-1">
                          <span className="truncate max-w-[60%]">SKU: {activePreviewItem.sku}</span>
                          <span className="shrink-0">{product?.hsnCode ? `HSN: ${product.hsnCode}` : ""}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No variation selected for preview
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-muted-foreground pt-1 border-t">
                  <span className="font-mono">Dimension: {currentPreset.widthMm}mm × {currentPreset.heightMm}mm</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">100% Code 128 Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="m-0 mx-0 mb-0 px-4 sm:px-6 py-4 sm:py-4.5 border-t bg-muted/20 flex flex-row items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs sm:text-sm"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Ready to print <strong>{totalLabelsCount}</strong> {totalLabelsCount === 1 ? "sticker" : "stickers"}
            </span>

            <Button
              type="button"
              onClick={handlePrint}
              disabled={totalLabelsCount === 0}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 font-semibold text-xs sm:text-sm"
            >
              <Printer className="h-4 w-4" />
              Print Labels Now
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
