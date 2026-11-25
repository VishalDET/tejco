import * as React from "react"
import { Printer, Download, Copy, Check, QrCode as QrIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  generateQrMatrix,
  generateQrPath,
  generateQrSvgMarkup,
  generateQrDataUrl,
  QrEccLevel,
} from "@/lib/qr-utils"

interface QrDisplayProps {
  value: string
  label?: string
  sublabel?: string
  showControls?: boolean
  size?: number
  eccLevel?: QrEccLevel
  className?: string
}

/**
 * Standard ISO/IEC 18004 QR Code Display Component.
 * Scanner-readable 2D QR Code with instant copy, SVG/PNG download, and thermal label print.
 */
export function QrDisplay({
  value,
  label,
  sublabel,
  showControls = true,
  size = 140,
  eccLevel = "M",
  className = "",
}: QrDisplayProps) {
  const [copied, setCopied] = React.useState(false)

  const qr = React.useMemo(() => {
    return generateQrMatrix(value || "000000", eccLevel)
  }, [value, eccLevel])

  const quietZone = 2
  const totalDim = qr.size + quietZone * 2
  const pathD = React.useMemo(() => generateQrPath(qr, quietZone), [qr, quietZone])

  const handleCopy = () => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success("QR value copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadSvg = () => {
    const svgContent = generateQrSvgMarkup(value, {
      size: 400,
      quietZone: 2,
      eccLevel,
    })
    const blob = new Blob([svgContent], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `qrcode-${(value || "code").replace(/[^a-zA-Z0-9_-]/g, "_")}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("QR Code SVG downloaded")
  }

  const handleDownloadPng = () => {
    const dataUrl = generateQrDataUrl(value, {
      moduleSize: 10,
      quietZone: 2,
      eccLevel,
    })
    if (!dataUrl) return
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `qrcode-${(value || "code").replace(/[^a-zA-Z0-9_-]/g, "_")}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success("QR Code PNG downloaded")
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const dataUrl = generateQrDataUrl(value, {
        moduleSize: 6,
        quietZone: 2,
        eccLevel,
      })
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print QR Label - ${value}</title>
            <style>
              @page {
                size: 38mm 15mm;
                margin: 0;
              }
              *, *::before, *::after {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              body {
                width: 38mm;
                height: 15mm;
                margin: 0;
                padding: 0.6mm 1mm;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                background: #ffffff;
                color: #000000;
                overflow: hidden;
              }
              .qr-box {
                height: 100%;
                width: 13.5mm;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
              }
              .qr-box img {
                max-width: 100%;
                max-height: 100%;
                image-rendering: pixelated;
              }
              .info-box {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding-left: 1.2mm;
                line-height: 1.15;
              }
              .title {
                font-size: 5.5pt;
                font-weight: 700;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: #000;
              }
              .subtitle {
                font-size: 5pt;
                font-weight: 600;
                color: #444;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .code-text {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 4.8pt;
                font-weight: 700;
                letter-spacing: 0.2px;
                margin-top: 0.3mm;
                color: #000;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            </style>
          </head>
          <body>
            <div class="qr-box">
              <img src="${dataUrl}" alt="${value}" />
            </div>
            <div class="info-box">
              ${label ? `<div class="title">${label}</div>` : ""}
              ${sublabel ? `<div class="subtitle">${sublabel}</div>` : ""}
              <div class="code-text">${value}</div>
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.focus();
                  window.print();
                  window.close();
                }, 100);
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <div
      className={`flex flex-col items-center p-5 border rounded-xl bg-white dark:bg-slate-900 shadow-xs border-dashed ${className}`}
    >
      <div
        className="bg-white p-3 rounded-lg flex items-center justify-center border shadow-xs"
        style={{ width: `${size + 24}px`, height: `${size + 24}px` }}
      >
        <svg
          viewBox={`0 0 ${totalDim} ${totalDim}`}
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className="display-block"
        >
          <rect width={totalDim} height={totalDim} fill="#ffffff" />
          <path d={pathD} fill="#000000" shapeRendering="crispEdges" />
        </svg>
      </div>

      <div className="mt-3 text-center">
        <p className="text-sm font-mono tracking-wide font-bold text-slate-900 dark:text-slate-100 max-w-[280px] break-all">
          {value}
        </p>
        {label && (
          <p className="text-xs font-semibold text-muted-foreground mt-0.5 max-w-[280px] truncate" title={label}>
            {label}
          </p>
        )}
        {sublabel && (
          <p className="text-[11px] text-muted-foreground/80 max-w-[280px] truncate" title={sublabel}>
            {sublabel}
          </p>
        )}
      </div>

      {showControls && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 h-8 text-xs">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadSvg} className="gap-1.5 h-8 text-xs">
            <Download className="h-3.5 w-3.5" />
            SVG
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPng} className="gap-1.5 h-8 text-xs">
            <Download className="h-3.5 w-3.5" />
            PNG
          </Button>
          <Button
            onClick={handlePrint}
            size="sm"
            className="gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Label
          </Button>
        </div>
      )}
    </div>
  )
}

