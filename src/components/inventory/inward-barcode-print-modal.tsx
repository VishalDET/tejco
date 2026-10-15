import * as React from "react"
import { useState, useMemo, useRef } from "react"
import {
  Printer,
  Barcode as BarcodeIcon,
  Check,
  Package,
  Layers,
  Settings2,
  Eye,
  RefreshCw,
  Copy,
  ChevronLeft,
  ChevronRight
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
  LabelPreset
} from "@/lib/barcode-utils"
import type { InwardOrder, InwardOrderItem } from "@/app/inventory/stock-inward/types"

interface InwardBarcodePrintModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: InwardOrder
}

interface GeneratedUnitLabel {
  unitBarcode: string
  serialNumber: string
  productId: number
  productName: string
  variantName: string
  sku: string
  lotNumber: string
  inwardNumber: string
  inwardDate: string
}

export function InwardBarcodePrintModal({
  open,
  onOpenChange,
  order
}: InwardBarcodePrintModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("thermal_50x25")
  const currentPreset = LABEL_PRESETS.find(p => p.id === selectedPresetId) || LABEL_PRESETS[0]

  const [companyName, setCompanyName] = useState<string>("TEJCO GLOBAL LLP")
  const [includeCompany, setIncludeCompany] = useState<boolean>(true)
  const [includeProductName, setIncludeProductName] = useState<boolean>(true)
  const [includeVariantName, setIncludeVariantName] = useState<boolean>(true)
  const [includeSku, setIncludeSku] = useState<boolean>(true)
  const [includeLot, setIncludeLot] = useState<boolean>(true)
  const [previewIndex, setPreviewIndex] = useState<number>(0)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const printContainerRef = useRef<HTMLDivElement>(null)

  // Generate individual physical unit labels based on received / accepted qty
  const unitLabels = useMemo<GeneratedUnitLabel[]>(() => {
    if (!order || !order.items) return []

    const labels: GeneratedUnitLabel[] = []
    const cleanInwardNum = (order.orderNumber || order.inwardNumber || `INW-${order.id || "0"}`)
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()

    order.items.forEach((item, itemIdx) => {
      // Use acceptedQty or receivedQty or expectedQty (min 1)
      const rawQty = item.receivedQty > 0 ? item.receivedQty : item.expectedQty
      const qty = item.acceptedQty !== undefined ? item.acceptedQty : (rawQty || 1)
      const cleanSku = (item.sku || `SKU${item.productId}`).replace(/[^A-Za-z0-9]/g, "").toUpperCase()

      for (let i = 1; i <= qty; i++) {
        const seq = String(i).padStart(3, "0")
        const unitBarcode = `${cleanSku}-${cleanInwardNum}-${seq}`
        const serialNumber = `SN-${cleanInwardNum}-${String(itemIdx + 1).padStart(2, "0")}${seq}`

        labels.push({
          unitBarcode,
          serialNumber,
          productId: item.productId,
          productName: item.productName || `Product #${item.productId}`,
          variantName: item.variantName || "",
          sku: item.sku || `SKU-${item.productId}`,
          lotNumber: item.lotNumber || `LOT-${cleanInwardNum}`,
          inwardNumber: order.orderNumber || order.inwardNumber || "INW",
          inwardDate: order.orderDate || order.inwardDate || new Date().toISOString()
        })
      }
    })

    return labels
  }, [order])

  const currentLabel = unitLabels[previewIndex] || unitLabels[0]

  const handleCopyBarcode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(idx)
    toast.success(`Copied: ${code}`)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  const handlePrint = () => {
    if (unitLabels.length === 0) {
      toast.error("No unit labels to print")
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print thermal labels.")
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inward Unit Barcode Labels - ${order.orderNumber || "INW"}</title>
          <style>
            @page {
              size: ${currentPreset.widthMm}mm ${currentPreset.heightMm}mm;
              margin: 0;
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
            .label-page {
              width: ${currentPreset.widthMm}mm;
              height: ${currentPreset.heightMm}mm;
              box-sizing: border-box;
              padding: 1.5mm 2mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              text-align: center;
              page-break-after: always;
              overflow: hidden;
            }
            .comp-name {
              font-size: 7pt;
              font-weight: 800;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              line-height: 1;
              margin-bottom: 1px;
            }
            .prod-title {
              font-size: 7pt;
              font-weight: 700;
              line-height: 1.1;
              max-height: 14pt;
              overflow: hidden;
            }
            .variant-title {
              font-size: 6.5pt;
              font-weight: 600;
              color: #222;
              line-height: 1;
              margin-top: 1px;
            }
            .barcode-svg-container {
              width: 96%;
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 1px 0;
            }
            .barcode-svg-container svg {
              width: 100%;
              height: 100%;
              max-height: 12mm;
            }
            .human-code {
              font-family: monospace;
              font-size: 6.5pt;
              font-weight: 700;
              letter-spacing: 0.5px;
              line-height: 1;
            }
            .meta-row {
              width: 100%;
              display: flex;
              justify-content: space-between;
              font-size: 5.5pt;
              font-family: monospace;
              color: #333;
              line-height: 1;
              margin-top: 1px;
            }
          </style>
        </head>
        <body>
          ${unitLabels.map((lbl) => {
            const encoded = encodeCode128B(lbl.unitBarcode)
            const rects = encoded.bars
              .map(b => `<rect x="${b.x}" y="0" width="${b.width}" height="35" fill="#000" />`)
              .join("")
            const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${encoded.totalWidth} 35" preserveAspectRatio="none">${rects}</svg>`

            return `
              <div class="label-page">
                ${includeCompany ? `<div class="comp-name">${companyName}</div>` : ""}
                ${includeProductName ? `<div class="prod-title">${lbl.productName}</div>` : ""}
                ${includeVariantName && lbl.variantName ? `<div class="variant-title">${lbl.variantName}</div>` : ""}
                <div class="barcode-svg-container">
                  ${svgMarkup}
                </div>
                <div class="human-code">${lbl.unitBarcode}</div>
                <div class="meta-row">
                  <span>${includeSku ? lbl.sku : ""}</span>
                  <span>${includeLot ? lbl.lotNumber : ""}</span>
                </div>
              </div>
            `
          }).join("")}
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

  // Render barcode for the current preview label
  const renderPreviewBarcodeSvg = (barcodeText: string) => {
    const encoded = encodeCode128B(barcodeText || "000000")
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${encoded.totalWidth} 40`}
        className="w-full h-12"
        preserveAspectRatio="none"
      >
        {encoded.bars.map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.width} height={40} fill="#000" />
        ))}
      </svg>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 font-mono">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <BarcodeIcon className="h-5 w-5" />
              <DialogTitle className="text-base font-bold font-mono">
                Print Inward Physical Unit Barcodes ({unitLabels.length} Labels)
              </DialogTitle>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Receipt #{order.orderNumber || order.inwardNumber}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground font-mono">
            Automatically generated serialized barcodes for each accepted physical unit in this inward shipment. Ready for thermal roll or sticker sheet printing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-2 flex-1 overflow-y-auto">
          {/* Left Column: Preset & Formatting Controls */}
          <div className="md:col-span-5 space-y-4 pr-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Label Sheet / Roll Preset</Label>
              <Select value={selectedPresetId} onValueChange={(val: any) => setSelectedPresetId(String(val || "thermal_50x25"))}>
                <SelectTrigger className="text-xs font-mono h-9">
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent className="font-mono text-xs">
                  {LABEL_PRESETS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                {currentPreset.description}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Header Organization</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="text-xs font-mono h-8"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                Content Options
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCompany}
                    onChange={(e) => setIncludeCompany(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span>Company Name</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeProductName}
                    onChange={(e) => setIncludeProductName(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span>Product Title</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeVariantName}
                    onChange={(e) => setIncludeVariantName(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span>Variant Specs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLot}
                    onChange={(e) => setIncludeLot(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span>Lot / Inward #</span>
                </label>
              </div>
            </div>

            {/* Generated Barcodes Mini-List */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  Units in Queue ({unitLabels.length})
                </span>
                <span className="text-[10px] text-primary">
                  Label {previewIndex + 1} of {unitLabels.length || 1}
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 border border-border rounded p-1.5 bg-muted/20 text-[11px]">
                {unitLabels.map((lbl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewIndex(idx)}
                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                      previewIndex === idx
                        ? "bg-primary/10 border border-primary/30 font-bold"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <span className="truncate max-w-[170px]">{lbl.unitBarcode}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyBarcode(lbl.unitBarcode, idx)
                      }}
                      className="p-1 hover:bg-background rounded"
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Thermal Sticker Preview */}
          <div className="md:col-span-7 flex flex-col items-center justify-center p-6 border border-border rounded-lg bg-muted/10">
            <div className="flex items-center justify-between w-full max-w-sm mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Sticker Live Preview
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-6 w-6"
                  disabled={previewIndex <= 0}
                  onClick={() => setPreviewIndex((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-mono px-1">
                  {previewIndex + 1} / {unitLabels.length || 1}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-6 w-6"
                  disabled={previewIndex >= unitLabels.length - 1}
                  onClick={() => setPreviewIndex((p) => Math.min(unitLabels.length - 1, p + 1))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {currentLabel ? (
              <div
                className="w-72 bg-white text-black p-3.5 rounded shadow-md border border-neutral-300 flex flex-col justify-between items-center text-center transition-all select-none"
                style={{
                  minHeight: "155px"
                }}
              >
                {includeCompany && (
                  <div className="text-[10px] font-extrabold tracking-wider uppercase text-neutral-900 border-b border-neutral-200 w-full pb-0.5 mb-1">
                    {companyName}
                  </div>
                )}
                {includeProductName && (
                  <div className="text-[11px] font-bold text-neutral-900 leading-tight">
                    {currentLabel.productName}
                  </div>
                )}
                {includeVariantName && currentLabel.variantName && (
                  <div className="text-[10px] font-semibold text-neutral-700 mt-0.5">
                    [{currentLabel.variantName}]
                  </div>
                )}

                <div className="my-1.5 w-full flex items-center justify-center px-1">
                  {renderPreviewBarcodeSvg(currentLabel.unitBarcode)}
                </div>

                <div className="text-[10px] font-mono font-bold tracking-wider text-neutral-900">
                  {currentLabel.unitBarcode}
                </div>

                <div className="w-full flex items-center justify-between text-[9px] font-mono text-neutral-600 pt-1 border-t border-neutral-200 mt-1">
                  <span>{includeSku ? currentLabel.sku : ""}</span>
                  <span>{includeLot ? currentLabel.lotNumber : ""}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                No items available to generate labels.
              </div>
            )}

            <p className="text-[10px] text-muted-foreground mt-4 text-center">
              Print format: {currentPreset.widthMm}mm × {currentPreset.heightMm}mm ({currentPreset.name})
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-3 flex items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-mono cursor-pointer"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            disabled={unitLabels.length === 0}
            className="text-xs font-mono bg-primary text-primary-foreground cursor-pointer"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print All {unitLabels.length} Barcode Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
