import * as React from "react"
import { Printer, Download, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { encodeCode128B, generateCode128SvgMarkup } from "@/lib/barcode-utils"

interface BarcodeDisplayProps {
    value: string
    label?: string
    showControls?: boolean
    height?: number
    className?: string
}

/**
 * ISO/IEC 15417 Code 128 SVG Barcode Component
 * Real scanner-readable barcode renderer with copy, SVG download, and instant print.
 */
export function BarcodeDisplay({
    value,
    label,
    showControls = true,
    height = 55,
    className = ""
}: BarcodeDisplayProps) {
    const [copied, setCopied] = React.useState(false)

    const encoded = React.useMemo(() => {
        return encodeCode128B(value || "00000000")
    }, [value])

    const handleCopy = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        toast.success("Barcode value copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownloadSvg = () => {
        const svgContent = generateCode128SvgMarkup(value, { height: 60, showText: true })
        const blob = new Blob([svgContent], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `barcode-${value}.svg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success("Barcode SVG downloaded")
    }

    const handlePrint = () => {
        const printWindow = window.open("", "_blank")
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Print Barcode - ${value}</title>
                        <style>
                            @page {
                                size: 50mm 25mm;
                                margin: 0;
                            }
                            body {
                                margin: 0;
                                padding: 2mm;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            .label-box {
                                width: 46mm;
                                text-align: center;
                            }
                            .product-title {
                                font-size: 8pt;
                                font-weight: 700;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                margin-bottom: 1.5mm;
                            }
                            svg {
                                width: 100%;
                                height: 12mm;
                            }
                            .code-text {
                                font-family: monospace;
                                font-size: 8pt;
                                font-weight: 600;
                                letter-spacing: 1px;
                                margin-top: 1mm;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="label-box">
                            ${label ? `<div class="product-title">${label}</div>` : ""}
                            <svg viewBox="0 0 ${encoded.totalWidth} 50" preserveAspectRatio="none">
                                ${encoded.bars.map(b => `<rect x="${b.x}" y="0" width="${b.width}" height="50" fill="#000" />`).join("")}
                            </svg>
                            <div class="code-text">${encoded.text}</div>
                        </div>
                        <script>
                            window.onload = () => { window.print(); window.close(); }
                        </script>
                    </body>
                </html>
            `)
            printWindow.document.close()
        }
    }

    return (
        <div className={`flex flex-col items-center p-5 border rounded-xl bg-white dark:bg-slate-900 shadow-xs border-dashed ${className}`}>
            <div className="w-full max-w-[320px] bg-white p-2 rounded-lg flex items-center justify-center overflow-hidden">
                <svg
                    viewBox={`0 0 ${encoded.totalWidth} 50`}
                    className="w-full"
                    style={{ height: `${height}px` }}
                    preserveAspectRatio="none"
                >
                    {encoded.bars.map((bar, i) => (
                        <rect key={i} x={bar.x} y="0" width={bar.width} height="50" fill="black" />
                    ))}
                </svg>
            </div>

            <div className="mt-3 text-center">
                <p className="text-base font-mono tracking-[0.2em] font-bold text-slate-900 dark:text-slate-100">
                    {encoded.text}
                </p>
                {label && (
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-[280px] truncate" title={label}>
                        {label}
                    </p>
                )}
            </div>

            {showControls && (
                <div className="flex gap-2 mt-5">
                    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 h-8 text-xs">
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadSvg} className="gap-1.5 h-8 text-xs">
                        <Download className="h-3.5 w-3.5" />
                        SVG
                    </Button>
                    <Button onClick={handlePrint} size="sm" className="gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Printer className="h-3.5 w-3.5" />
                        Print Label
                    </Button>
                </div>
            )}
        </div>
    )
}
