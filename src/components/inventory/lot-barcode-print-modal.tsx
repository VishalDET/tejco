import * as React from "react"
import { useState, useMemo, useRef } from "react"
import {
  Printer,
  Barcode as BarcodeIcon,
  Check,
  Copy,
  Package,
  Layers,
  Settings2,
  Eye,
  RefreshCw,
  Calendar,
  MapPin,
  Warehouse,
  Download,
  AlertCircle,
  Plus,
  Minus,
  Terminal,
  FileDown,
  Cpu,
  HelpCircle,
  Code2
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
import { toast } from "sonner"
import {
  encodeCode128B,
  LABEL_PRESETS,
  LabelPreset,
  generateCode128SvgMarkup,
  generateLotPrn,
  ThermalPrinterLanguage,
  ThermalPrinterDpi,
  ThermalPrintItem
} from "@/lib/barcode-utils"
import type { ProductLot } from "@/lib/api"

export interface LotBarcodePrintModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: {
    productId?: number
    productName?: string
    baseSKU?: string
  }
  variant?: {
    variantId?: number
    variantName?: string
    skuSuffix?: string
    size?: string
    sellingPrice?: number
    usdAmount?: number
  }
  lots: ProductLot[]
  initialSelectedLotId?: number | "all"
}

interface LotPrintItem {
  lot: ProductLot
  printQuantity: number
  selected: boolean
}

export function LotBarcodePrintModal({
  open,
  onOpenChange,
  product,
  variant,
  lots = [],
  initialSelectedLotId = "all"
}: LotBarcodePrintModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("thermal_40x15")
  const currentPreset = LABEL_PRESETS.find(p => p.id === selectedPresetId) || LABEL_PRESETS[0]

  // Thermal Printer (.PRN) Configuration
  const [prnLanguage, setPrnLanguage] = useState<ThermalPrinterLanguage>("zpl")
  const [prnDensity, setPrnDensity] = useState<ThermalPrinterDpi>(203)
  const [previewMode, setPreviewMode] = useState<"visual" | "prn">("visual")
  const [prnScope, setPrnScope] = useState<"active" | "batch">("active")
  const [showPrnHelp, setShowPrnHelp] = useState<boolean>(false)

  // Customization Toggles
  const [companyName, setCompanyName] = useState<string>("TEJCO GLOBAL LLP")
  const [includeCompany, setIncludeCompany] = useState<boolean>(true)
  const [includeProductName, setIncludeProductName] = useState<boolean>(true)
  const [includeVariantName, setIncludeVariantName] = useState<boolean>(true)
  const [includeSku, setIncludeSku] = useState<boolean>(true)
  const [includeLotNumber, setIncludeLotNumber] = useState<boolean>(true)
  const [includeExpiry, setIncludeExpiry] = useState<boolean>(true)
  const [includeLocation, setIncludeLocation] = useState<boolean>(true)
  const [includeHumanBarcode, setIncludeHumanBarcode] = useState<boolean>(true)

  // Lots configuration
  const [lotItems, setLotItems] = useState<LotPrintItem[]>([])
  const [activePreviewLotId, setActivePreviewLotId] = useState<number | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Initialize lot items when dialog opens or lots change
  React.useEffect(() => {
    if (!open || !lots || lots.length === 0) {
      setLotItems([])
      setActivePreviewLotId(null)
      return
    }

    const items: LotPrintItem[] = lots.map(lot => {
      const isTarget = initialSelectedLotId === "all" || initialSelectedLotId === lot.lotId
      const availQty = Number(lot.availableQuantity ?? lot.currentQuantity) || 1
      return {
        lot,
        printQuantity: isTarget ? Math.max(1, availQty) : 1,
        selected: isTarget
      }
    })

    setLotItems(items)

    const initialActive = items.find(i => i.selected)?.lot.lotId || lots[0]?.lotId || null
    setActivePreviewLotId(initialActive)
  }, [open, lots, initialSelectedLotId])

  // Active lot currently being previewed
  const currentItem = useMemo(() => {
    if (!lotItems.length) return null
    return lotItems.find(i => i.lot.lotId === activePreviewLotId) || lotItems.find(i => i.selected) || lotItems[0]
  }, [lotItems, activePreviewLotId])

  const selectedItems = useMemo(() => {
    return lotItems.filter(i => i.selected && i.printQuantity > 0)
  }, [lotItems])

  const totalLabelsToPrint = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + curr.printQuantity, 0)
  }, [selectedItems])

  const handleUpdateItem = (lotId: number, changes: Partial<LotPrintItem>) => {
    setLotItems(prev =>
      prev.map(item => (item.lot.lotId === lotId ? { ...item, ...changes } : item))
    )
  }

  const handleSetAllQuantities = (qty: number) => {
    setLotItems(prev => prev.map(item => ({ ...item, printQuantity: Math.max(1, qty) })))
  }

  const handleSetQuantitiesToAvailable = () => {
    setLotItems(prev =>
      prev.map(item => ({
        ...item,
        printQuantity: Math.max(1, Number(item.lot.availableQuantity ?? item.lot.currentQuantity) || 1),
        selected: (Number(item.lot.availableQuantity ?? item.lot.currentQuantity) || 0) > 0 ? true : item.selected
      }))
    )
    toast.success("Quantities set to available lot inventory")
  }

  const handleCopyBarcode = (code: string, key: string) => {
    navigator.clipboard.writeText(code)
    setCopiedKey(key)
    toast.success(`Copied: ${code}`)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const handleDownloadSvg = (barcodeValue: string, filename: string) => {
    const svgMarkup = generateCode128SvgMarkup(barcodeValue, { height: 50, showText: true })
    const blob = new Blob([svgMarkup], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Barcode SVG downloaded")
  }

  // Format expiry date for display and printing
  const formatLotExpiry = (dateStr?: string) => {
    if (!dateStr) return "N/A"
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return "N/A"
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    } catch {
      return dateStr.slice(0, 10)
    }
  }

  // PRN Thermal Printing Data Mappings & Script Generator
  const baseSku = product?.baseSKU || ""
  const prodName = product?.productName || ""

  const thermalPrintItems: ThermalPrintItem[] = useMemo(() => {
    return selectedItems.map(item => {
      const lot = item.lot
      const barcode = lot.lotBarcode || lot.lotNumber
      const vName = lot.variantName || variant?.variantName || prodName
      const fullSku = `${baseSku}${lot.skuSuffix || variant?.skuSuffix || ""}`
      const expDate = formatLotExpiry(lot.expiryDate)
      const wName = lot.warehouseName || "Main"
      const rack = lot.rackLocation || ""

      return {
        barcode,
        lotNumber: lot.lotNumber,
        productName: lot.productName || prodName,
        variantName: vName,
        sku: fullSku,
        expiryDate: expDate,
        warehouse: wName,
        rack,
        quantity: item.printQuantity
      }
    })
  }, [selectedItems, baseSku, prodName, variant])

  const activeThermalItem: ThermalPrintItem | null = useMemo(() => {
    if (!currentItem) return null
    const lot = currentItem.lot
    const barcode = lot.lotBarcode || lot.lotNumber
    const vName = lot.variantName || variant?.variantName || prodName
    const fullSku = `${baseSku}${lot.skuSuffix || variant?.skuSuffix || ""}`
    const expDate = formatLotExpiry(lot.expiryDate)
    const wName = lot.warehouseName || "Main"
    const rack = lot.rackLocation || ""

    return {
      barcode,
      lotNumber: lot.lotNumber,
      productName: lot.productName || prodName,
      variantName: vName,
      sku: fullSku,
      expiryDate: expDate,
      warehouse: wName,
      rack,
      quantity: Math.max(1, currentItem.printQuantity)
    }
  }, [currentItem, baseSku, prodName, variant])

  // Generated PRN script (ZPL II or TSPL)
  const generatedPrnScript = useMemo(() => {
    const itemsToPrint = prnScope === "active"
      ? (activeThermalItem ? [activeThermalItem] : [])
      : thermalPrintItems

    if (!itemsToPrint.length) {
      return `; No lots selected for thermal PRN generation\n; Please select at least one lot with print quantity > 0`
    }

    return generateLotPrn({
      language: prnLanguage,
      dpi: prnDensity,
      widthMm: currentPreset.widthMm,
      heightMm: currentPreset.heightMm,
      companyName,
      includeCompany,
      includeProductName,
      includeVariantName,
      includeSku,
      includeLotNumber,
      includeExpiry,
      includeLocation,
      includeHumanBarcode,
      items: itemsToPrint
    })
  }, [
    prnScope,
    activeThermalItem,
    thermalPrintItems,
    prnLanguage,
    prnDensity,
    currentPreset,
    companyName,
    includeCompany,
    includeProductName,
    includeVariantName,
    includeSku,
    includeLotNumber,
    includeExpiry,
    includeLocation,
    includeHumanBarcode
  ])

  const prnByteSize = useMemo(() => new Blob([generatedPrnScript]).size, [generatedPrnScript])
  const prnLineCount = useMemo(() => generatedPrnScript.split("\n").length, [generatedPrnScript])

  // Download raw .prn file for direct thermal printing
  const handleDownloadPrn = (targetScope: "batch" | "active" = "batch") => {
    const itemsToPrint = targetScope === "active"
      ? (activeThermalItem ? [activeThermalItem] : [])
      : thermalPrintItems

    if (!itemsToPrint.length) {
      toast.error("Please select at least one lot with quantity > 0")
      return
    }

    const script = generateLotPrn({
      language: prnLanguage,
      dpi: prnDensity,
      widthMm: currentPreset.widthMm,
      heightMm: currentPreset.heightMm,
      companyName,
      includeCompany,
      includeProductName,
      includeVariantName,
      includeSku,
      includeLotNumber,
      includeExpiry,
      includeLocation,
      includeHumanBarcode,
      items: itemsToPrint
    })

    const count = itemsToPrint.reduce((acc, curr) => acc + curr.quantity, 0)
    const blob = new Blob([script], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const cleanProd = (product?.productName || "Tejco").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 15)
    a.download = `${cleanProd}_Lots_${prnLanguage.toUpperCase()}_${prnDensity}DPI_${currentPreset.widthMm}x${currentPreset.heightMm}mm_${count}qty.prn`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`Downloaded ${prnLanguage.toUpperCase()} PRN file (${count} ${count === 1 ? "label" : "labels"})`)
  }

  // Copy raw PRN commands to clipboard
  const handleCopyPrn = () => {
    if (!generatedPrnScript) return
    navigator.clipboard.writeText(generatedPrnScript)
    setCopiedKey("prn-script")
    toast.success(`Copied ${prnLanguage.toUpperCase()} PRN script (${prnByteSize} bytes)`)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  // Generate and trigger browser print dialog
  const handlePrint = () => {
    if (selectedItems.length === 0 || totalLabelsToPrint === 0) {
      toast.error("Please select at least one lot with quantity > 0")
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print thermal labels.")
      return
    }

    // Build the array of label data for each printed unit
    const flatLabels: Array<{
      barcode: string
      lotNumber: string
      productName: string
      variantName: string
      sku: string
      expiryDate: string
      warehouse: string
      rack: string
    }> = []

    const baseSku = product?.baseSKU || ""
    const prodName = product?.productName || ""

    selectedItems.forEach(item => {
      const lot = item.lot
      const barcode = lot.lotBarcode || lot.lotNumber
      const vName = lot.variantName || variant?.variantName || prodName
      const fullSku = `${baseSku}${lot.skuSuffix || variant?.skuSuffix || ""}`
      const expDate = formatLotExpiry(lot.expiryDate)
      const wName = lot.warehouseName || "Main"
      const rack = lot.rackLocation || ""

      for (let i = 0; i < item.printQuantity; i++) {
        flatLabels.push({
          barcode,
          lotNumber: lot.lotNumber,
          productName: lot.productName || prodName,
          variantName: vName,
          sku: fullSku,
          expiryDate: expDate,
          warehouse: wName,
          rack
        })
      }
    })

    const isSheet = currentPreset.type === "sheet"
    const labelWidth = currentPreset.widthMm
    const labelHeight = currentPreset.heightMm

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lot Barcode Labels - ${variant?.variantName || product?.productName || "Tejco"}</title>
          <style>
            @page {
              size: ${isSheet ? "A4 portrait" : `${labelWidth}mm ${labelHeight}mm`};
              margin: ${isSheet ? "8mm" : "0"};
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background: #fff;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            ${
              isSheet
                ? `
              .sheet-container {
                display: grid;
                grid-template-columns: repeat(${currentPreset.columns || 3}, ${labelWidth}mm);
                grid-auto-rows: ${labelHeight}mm;
                gap: ${currentPreset.gapMm || 2}mm;
                justify-content: center;
              }
              .label-card {
                width: ${labelWidth}mm;
                height: ${labelHeight}mm;
                padding: ${labelHeight <= 18 ? "0.6mm 1mm" : "1.5mm 2mm"};
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                text-align: center;
                overflow: hidden;
                border: 0.2mm dashed #e2e8f0;
              }
            `
                : `
              .label-card {
                width: ${labelWidth}mm;
                height: ${labelHeight}mm;
                padding: ${labelHeight <= 18 ? "0.6mm 1mm" : "1.5mm 2mm"};
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                text-align: center;
                page-break-after: always;
                overflow: hidden;
              }
            `
            }
            .comp-name {
              font-size: ${labelHeight <= 18 ? "4.5pt" : "6.5pt"};
              font-weight: 800;
              letter-spacing: 0.3px;
              text-transform: uppercase;
              line-height: 1;
              color: #111;
              margin-bottom: 0.2px;
            }
            .prod-title {
              font-size: ${labelHeight <= 18 ? "5pt" : "7pt"};
              font-weight: 700;
              line-height: 1.05;
              max-width: 98%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .variant-spec {
              font-size: ${labelHeight <= 18 ? "4.5pt" : "6pt"};
              font-weight: 600;
              line-height: 1;
              color: #333;
              max-width: 98%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .barcode-box {
              width: 98%;
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0.2px 0;
            }
            .barcode-box svg {
              width: 100%;
              height: 100%;
              max-height: ${labelHeight <= 18 ? "6.2mm" : labelHeight <= 25 ? "8mm" : "12mm"};
            }
            .human-code {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: ${labelHeight <= 18 ? "4.8pt" : "6pt"};
              font-weight: 700;
              letter-spacing: 0.3px;
              line-height: 1;
              margin-top: 0.2px;
            }
            .meta-row {
              width: 100%;
              display: flex;
              justify-content: space-between;
              font-size: ${labelHeight <= 18 ? "4.5pt" : "5.5pt"};
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              color: #222;
              line-height: 1;
              margin-top: 0.2px;
              padding: 0 0.3mm;
            }
            .bold {
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          ${
            isSheet ? `<div class="sheet-container">` : ""
          }
          ${flatLabels
            .map(lbl => {
              const encoded = encodeCode128B(lbl.barcode)
              const rects = encoded.bars
                .map(b => `<rect x="${b.x}" y="0" width="${b.width}" height="32" fill="#000" />`)
                .join("")
              const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${encoded.totalWidth} 32" preserveAspectRatio="none">${rects}</svg>`

              return `
                <div class="label-card">
                  <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                    ${includeCompany ? `<div class="comp-name">${companyName || "TEJCO GLOBAL LLP"}</div>` : ""}
                    ${includeProductName ? `<div class="prod-title">${lbl.productName}</div>` : ""}
                    ${includeVariantName && lbl.variantName ? `<div class="variant-spec">${lbl.variantName}</div>` : ""}
                  </div>

                  <div class="barcode-box">
                    ${svgMarkup}
                  </div>

                  ${includeHumanBarcode ? `<div class="human-code">${lbl.barcode}</div>` : ""}

                  <div class="meta-row">
                    <span>${includeLotNumber ? `LOT: <span class="bold">${lbl.lotNumber}</span>` : (includeSku ? lbl.sku : "")}</span>
                    <span>${includeExpiry ? `EXP: <span class="bold">${lbl.expiryDate}</span>` : ""}</span>
                  </div>
                  ${
                    includeLocation && (lbl.rack || lbl.warehouse)
                      ? `
                    <div class="meta-row" style="font-size: 5pt; color: #555;">
                      <span>${lbl.warehouse}</span>
                      <span>${lbl.rack ? `Rack: ${lbl.rack}` : ""}</span>
                    </div>
                  `
                      : ""
                  }
                </div>
              `
            })
            .join("")}
          ${isSheet ? `</div>` : ""}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  // Render SVG preview for current selected lot
  const isTinyPreset = currentPreset.heightMm <= 18

  const previewBarcodeSvg = useMemo(() => {
    if (!currentItem) return null
    const code = currentItem.lot.lotBarcode || currentItem.lot.lotNumber || "SM000000"
    const encoded = encodeCode128B(code)
    const isTiny = currentPreset.heightMm <= 18
    const svgHeight = isTiny ? 25 : 35
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${encoded.totalWidth} ${svgHeight}`}
        className={`w-full ${isTiny ? "h-7 sm:h-8" : "h-11"}`}
        preserveAspectRatio="none"
      >
        {encoded.bars.map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.width} height={svgHeight} fill="#000" />
        ))}
      </svg>
    )
  }, [currentItem, currentPreset.heightMm])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col p-6 font-sans">
        {/* Header */}
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Printer className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">
                Print Lot Barcode Labels
              </DialogTitle>
            </div>
            {currentItem && (
              <Badge variant="outline" className="font-mono text-xs bg-indigo-50/50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300">
                Lot #{currentItem.lot.lotNumber}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {product?.productName} {variant?.variantName ? `• ${variant.variantName}` : ""}
            {product?.baseSKU ? ` (${product.baseSKU}${variant?.skuSuffix || ""})` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Modal Main Content: Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-2 flex-1 overflow-y-auto pr-1">
          {/* Left Column: Preset, Options & Lots List (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Label Preset Selection */}
            <div className="space-y-1.5 bg-muted/20 p-3 rounded-xl border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs font-bold text-foreground">Label Roll / Sheet Preset</Label>
                  <Badge variant="outline" className="text-[10px] font-mono bg-indigo-50/60 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                    {currentPreset.widthMm / 10}cm × {currentPreset.heightMm / 10}cm
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground">{currentPreset.description}</span>
              </div>
              <Select value={selectedPresetId} onValueChange={(val: any) => setSelectedPresetId(String(val || "thermal_40x15"))}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Choose label preset" />
                </SelectTrigger>
                <SelectContent>
                  {LABEL_PRESETS.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Thermal Printer Raw (.PRN) Setup */}
            <div className="space-y-2.5 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/20 dark:to-purple-950/10 p-3 rounded-xl border border-indigo-200/70 dark:border-indigo-800/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Thermal Printer (.PRN) Engine</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono bg-background text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                  Raw Command Mode
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Language Select */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Printer Command Language</Label>
                  <Select value={prnLanguage} onValueChange={(val: any) => setPrnLanguage(val as ThermalPrinterLanguage)}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zpl" className="text-xs">
                        <span className="font-semibold">ZPL II</span>
                        <span className="text-muted-foreground ml-1.5 text-[10px]">(Zebra, Godex, Citizen)</span>
                      </SelectItem>
                      <SelectItem value="tspl" className="text-xs">
                        <span className="font-semibold">TSPL</span>
                        <span className="text-muted-foreground ml-1.5 text-[10px]">(TSC, TVS, Xprinter)</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* DPI Select */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Print Head DPI (Density)</Label>
                  <Select value={String(prnDensity)} onValueChange={(val: any) => setPrnDensity(Number(val) as ThermalPrinterDpi)}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="203" className="text-xs">
                        <span className="font-semibold">203 DPI</span>
                        <span className="text-muted-foreground ml-1 text-[10px]">(8 dots/mm - Standard)</span>
                      </SelectItem>
                      <SelectItem value="300" className="text-xs">
                        <span className="font-semibold">300 DPI</span>
                        <span className="text-muted-foreground ml-1 text-[10px]">(12 dots/mm - High Res)</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Instructions / Command Guide Accordion */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowPrnHelp(prev => !prev)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <HelpCircle className="h-3 w-3" />
                  <span>{showPrnHelp ? "Hide direct print sending instructions" : "How to send .PRN directly to your thermal printer"}</span>
                </button>

                {showPrnHelp && (
                  <div className="mt-2 p-2.5 rounded-lg bg-background/90 border text-[11px] text-foreground space-y-1.5">
                    <p className="font-semibold text-indigo-700 dark:text-indigo-300 text-xs">
                      Send Raw .PRN to Thermal Printer:
                    </p>
                    <div className="space-y-1 text-muted-foreground font-mono text-[10px]">
                      <div>
                        <strong className="text-foreground">Windows Command Prompt:</strong>{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-neutral-900 dark:text-neutral-100">
                          copy /b file.prn \\localhost\Zebra_Printer
                        </code>
                      </div>
                      <div>
                        <strong className="text-foreground">macOS / Linux Terminal:</strong>{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-neutral-900 dark:text-neutral-100">
                          lpr -P Thermal_Printer -o raw file.prn
                        </code>
                      </div>
                      <div>
                        <strong className="text-foreground">Network Direct (Port 9100):</strong>{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-neutral-900 dark:text-neutral-100">
                          nc 192.168.1.100 9100 &lt; file.prn
                        </code>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground pt-0.5">
                      You can also send the downloaded file using <strong>Zebra Setup Utilities</strong>, <strong>TSC Diagnostic Tool</strong>, or your barcode print spooler.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Lots Selection & Quantity Controls */}
            <div className="space-y-2 bg-muted/20 p-3 rounded-xl border">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-xs font-bold text-foreground">
                  Select Lots & Quantities ({lotItems.length} Available)
                </Label>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] px-2"
                    onClick={() => handleSetAllQuantities(1)}
                  >
                    Set 1 Each
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    onClick={handleSetQuantitiesToAvailable}
                  >
                    Match Stock Qty
                  </Button>
                </div>
              </div>

              {/* Scrollable Lot Items */}
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 mt-1">
                {lotItems.map(item => {
                  const lot = item.lot
                  const isCurrent = lot.lotId === currentItem?.lot.lotId
                  const lotBarcode = lot.lotBarcode || lot.lotNumber
                  const avail = Number(lot.availableQuantity ?? lot.currentQuantity) || 0

                  return (
                    <div
                      key={lot.lotId}
                      onClick={() => setActivePreviewLotId(lot.lotId)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                        isCurrent
                          ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30 shadow-2xs"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      {/* Checkbox & Lot Information */}
                      <div className="flex items-start gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={e => {
                            e.stopPropagation()
                            handleUpdateItem(lot.lotId, { selected: e.target.checked })
                          }}
                          className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-foreground">{lot.lotNumber}</span>
                            <Badge
                              variant="outline"
                              className="text-[9px] h-4 px-1 font-mono text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300"
                            >
                              BC: {lotBarcode}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span>{lot.warehouseName || "Warehouse"}</span>
                            {lot.rackLocation && <span>• Rack: {lot.rackLocation}</span>}
                            <span>• Exp: {formatLotExpiry(lot.expiryDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Input Stepper */}
                      <div
                        className="flex items-center gap-2 self-end sm:self-auto shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex flex-col items-end mr-1">
                          <span className="text-[10px] text-muted-foreground font-semibold">Available</span>
                          <span className="font-bold text-xs text-foreground">{avail} PCS</span>
                        </div>

                        <div className="flex items-center border rounded-md overflow-hidden bg-background">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItem(lot.lotId, {
                                printQuantity: Math.max(1, item.printQuantity - 1),
                                selected: true
                              })
                            }
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.printQuantity}
                            onChange={e =>
                              handleUpdateItem(lot.lotId, {
                                printQuantity: Math.max(1, parseInt(e.target.value) || 1),
                                selected: true
                              })
                            }
                            className="w-12 h-6 text-center text-xs font-semibold focus:outline-hidden bg-transparent"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItem(lot.lotId, {
                                printQuantity: item.printQuantity + 1,
                                selected: true
                              })
                            }
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Customization Checkboxes */}
            <div className="space-y-2 bg-muted/20 p-3 rounded-xl border">
              <Label className="text-xs font-bold text-foreground">Label Content Toggles</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCompany}
                    onChange={e => setIncludeCompany(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Company Header</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeProductName}
                    onChange={e => setIncludeProductName(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Product Title</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeVariantName}
                    onChange={e => setIncludeVariantName(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Variant / Spec</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLotNumber}
                    onChange={e => setIncludeLotNumber(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Lot Number</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeExpiry}
                    onChange={e => setIncludeExpiry(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Expiry Date</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLocation}
                    onChange={e => setIncludeLocation(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Warehouse / Rack</span>
                </label>
              </div>

              {includeCompany && (
                <div className="pt-1">
                  <Input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Company branding text"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Visual Label Preview or Raw PRN View (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between bg-muted/20 rounded-xl border p-4">
            {/* Preview Header & Mode Switcher */}
            <div className="w-full flex items-center justify-between pb-2.5 border-b gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border">
                <button
                  type="button"
                  onClick={() => setPreviewMode("visual")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewMode === "visual"
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Sticker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("prn")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewMode === "prn"
                      ? "bg-background text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Raw .PRN</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {currentPreset.widthMm / 10}cm × {currentPreset.heightMm / 10}cm ({currentPreset.widthMm}×{currentPreset.heightMm}mm)
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono uppercase bg-indigo-50/60 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                >
                  {prnLanguage} • {prnDensity}DPI
                </Badge>
              </div>
            </div>

            {/* Mode 1: Visual Simulated Thermal Sticker */}
            {previewMode === "visual" && (
              <>
                <div className="my-auto py-3 flex items-center justify-center w-full">
                  {currentItem ? (
                    <div
                      className="bg-white text-black rounded shadow-md border border-neutral-300 flex flex-col justify-between items-center text-center transition-all"
                      style={{
                        width: `${Math.min(270, Math.max(180, currentPreset.widthMm * 4.8))}px`,
                        minHeight: `${Math.min(180, Math.max(88, currentPreset.heightMm * 5.8))}px`,
                        padding: isTinyPreset ? "5px 7px" : "8px 10px"
                      }}
                    >
                      {/* Top Branding & Product */}
                      <div className="w-full flex flex-col items-center">
                        {includeCompany && (
                          <div className={`${isTinyPreset ? "text-[7.5px]" : "text-[9px]"} font-extrabold uppercase tracking-wide text-neutral-900 leading-tight`}>
                            {companyName || "TEJCO GLOBAL LLP"}
                          </div>
                        )}
                        {includeProductName && (
                          <div className={`${isTinyPreset ? "text-[8.5px]" : "text-[10px]"} font-bold text-neutral-950 truncate max-w-full leading-tight mt-0.5`}>
                            {currentItem.lot.productName || product?.productName}
                          </div>
                        )}
                        {includeVariantName && (
                          <div className={`${isTinyPreset ? "text-[7.5px]" : "text-[8.5px]"} font-semibold text-neutral-700 truncate max-w-full leading-tight`}>
                            {currentItem.lot.variantName || variant?.variantName}
                          </div>
                        )}
                      </div>

                      {/* Center SVG Barcode */}
                      <div className="w-full flex flex-col items-center justify-center my-1">
                        <div className="w-full px-1">{previewBarcodeSvg}</div>
                        {includeHumanBarcode && (
                          <div className={`font-mono ${isTinyPreset ? "text-[7.5px]" : "text-[9px]"} font-bold tracking-wider text-black mt-0.5`}>
                            {currentItem.lot.lotBarcode || currentItem.lot.lotNumber}
                          </div>
                        )}
                      </div>

                      {/* Bottom Meta Row (Lot & Expiry) */}
                      <div className="w-full flex flex-col gap-0.5 pt-0.5 border-t border-neutral-200">
                        <div className={`w-full flex items-center justify-between ${isTinyPreset ? "text-[7px]" : "text-[8px]"} font-mono font-semibold text-neutral-900`}>
                          {includeLotNumber && <span>LOT: {currentItem.lot.lotNumber}</span>}
                          {includeExpiry && <span>EXP: {formatLotExpiry(currentItem.lot.expiryDate)}</span>}
                        </div>
                        {includeLocation && (currentItem.lot.rackLocation || currentItem.lot.warehouseName) && (
                          <div className={`w-full flex items-center justify-between ${isTinyPreset ? "text-[6.5px]" : "text-[7.5px]"} font-mono text-neutral-600`}>
                            <span>{currentItem.lot.warehouseName || "Main"}</span>
                            {currentItem.lot.rackLocation && <span>Rack: {currentItem.lot.rackLocation}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      No lot selected for preview
                    </div>
                  )}
                </div>

                {/* Quick Actions below visual preview */}
                {currentItem && (
                  <div className="w-full pt-3 border-t flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 gap-1"
                      onClick={() =>
                        handleCopyBarcode(
                          currentItem.lot.lotBarcode || currentItem.lot.lotNumber,
                          `prev-${currentItem.lot.lotId}`
                        )
                      }
                    >
                      {copiedKey === `prev-${currentItem.lot.lotId}` ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>Copy Barcode</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 gap-1"
                      onClick={() =>
                        handleDownloadSvg(
                          currentItem.lot.lotBarcode || currentItem.lot.lotNumber,
                          `barcode-lot-${currentItem.lot.lotNumber}`
                        )
                      }
                    >
                      <Download className="h-3 w-3" />
                      <span>Download SVG</span>
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Mode 2: Raw Thermal Printer Command (.PRN) Viewer */}
            {previewMode === "prn" && (
              <div className="w-full flex flex-col flex-1 my-2 min-h-[260px] gap-2">
                {/* PRN Scope Selector and Stats */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-muted-foreground font-semibold">Scope:</span>
                    <div className="inline-flex rounded-md border p-0.5 bg-background">
                      <button
                        type="button"
                        onClick={() => setPrnScope("active")}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          prnScope === "active"
                            ? "bg-indigo-600 text-white font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Active Lot
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrnScope("batch")}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          prnScope === "batch"
                            ? "bg-indigo-600 text-white font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        All Lots ({totalLabelsToPrint})
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                    <span className="bg-muted px-1.5 py-0.5 rounded">{prnLineCount} lines</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded">{prnByteSize} B</span>
                  </div>
                </div>

                {/* Terminal Monospace Output Block */}
                <div className="relative flex-1 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-200 overflow-hidden shadow-inner flex flex-col">
                  <div className="bg-neutral-900/90 px-3 py-1.5 border-b border-neutral-800 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-neutral-400">
                      {prnLanguage.toUpperCase()} • {currentPreset.widthMm}x{currentPreset.heightMm}mm
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px] text-neutral-300 hover:text-white hover:bg-neutral-800 gap-1"
                        onClick={handleCopyPrn}
                      >
                        {copiedKey === "prn-script" ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>{copiedKey === "prn-script" ? "Copied" : "Copy"}</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px] text-neutral-300 hover:text-white hover:bg-neutral-800 gap-1"
                        onClick={() => handleDownloadPrn(prnScope)}
                      >
                        <FileDown className="h-3 w-3 text-indigo-400" />
                        <span>Download</span>
                      </Button>
                    </div>
                  </div>

                  {/* Monospace code view */}
                  <pre className="p-3 font-mono text-[11px] leading-relaxed overflow-x-auto overflow-y-auto max-h-[220px] select-all whitespace-pre text-emerald-400/90 dark:text-emerald-300">
                    {generatedPrnScript}
                  </pre>
                </div>

                {/* PRN Format Information Footer */}
                <div className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded-lg border leading-tight">
                  <span className="font-semibold text-foreground">
                    {prnLanguage === "zpl" ? "ZPL II Engine:" : "TSPL Engine:"}
                  </span>{" "}
                  {prnLanguage === "zpl"
                    ? "Direct command format for Zebra, Godex, Citizen, and universal thermal barcode printers with Code 128 subset B."
                    : "Direct command format for TSC, TVS Electronics, Xprinter, and Gprinter barcode printers with Code 128."}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="border-t pt-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>
              Total: <strong>{totalLabelsToPrint}</strong> {totalLabelsToPrint === 1 ? "Label" : "Labels"} across{" "}
              <strong>{selectedItems.length}</strong> {selectedItems.length === 1 ? "Lot" : "Lots"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/50 font-medium"
              onClick={() => handleDownloadPrn("batch")}
              disabled={totalLabelsToPrint === 0}
              title={`Download raw ${prnLanguage.toUpperCase()} .PRN file for all selected lots`}
            >
              <FileDown className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Download .PRN ({prnLanguage.toUpperCase()})</span>
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-semibold px-4"
              onClick={handlePrint}
              disabled={totalLabelsToPrint === 0}
            >
              <Printer className="h-4 w-4" />
              <span>Print {totalLabelsToPrint} {totalLabelsToPrint === 1 ? "Label" : "Labels"}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
