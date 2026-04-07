"use client"

import * as React from "react"
import { Printer, Download, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface BarcodeDisplayProps {
    value: string
    label?: string
}

/**
 * A simple Code 128 (Subset B) SVG Barcode Generator
 * Note: For production use, a library like react-barcode is recommended.
 * This is a lightweight implementation for demonstration.
 */
export function BarcodeDisplay({ value, label }: BarcodeDisplayProps) {
    const [copied, setCopied] = React.useState(false)

    // A very simplified barcode-like visual if no real encoding is provided
    // In a real app, we'd use a proper encoding algorithm.
    // For now, let's create a "barcode" look based on the string.
    const generateBarcodePattern = (str: string) => {
        const pattern = []
        // Simple hash-based pattern for visual representation
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i)
            pattern.push((charCode % 4) + 1) // Bar widths 1, 2, 3, or 4
            pattern.push(1) // Space width 1
        }
        return pattern
    }

    const pattern = generateBarcodePattern(value || "000000000000")
    const totalWidth = pattern.reduce((a, b) => a + b, 0) * 2

    const handleCopy = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        toast.success("Barcode value copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Barcode - ${value}</title>
                        <style>
                            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                            .barcode-container { border: 1px solid #eee; padding: 40px; text-align: center; }
                            svg { width: 300px; height: 120px; }
                            .label { margin-top: 10px; font-size: 18px; font-weight: bold; letter-spacing: 2px; }
                            .product-name { margin-bottom: 20px; font-size: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="barcode-container">
                            ${label ? `<div class="product-name">${label}</div>` : ''}
                            <svg viewBox="0 0 ${totalWidth} 60" preserveAspectRatio="none">
                                ${pattern.map((width, i) => (
                i % 2 === 0 ? `<rect x="${pattern.slice(0, i).reduce((a, b) => a + b, 0) * 2}" y="0" width="${width * 2}" height="60" fill="black" />` : ''
            )).join('')}
                            </svg>
                            <div class="label">${value}</div>
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
        <div className="flex flex-col items-center p-6 border rounded-xl bg-white shadow-sm border-dashed">
            <div className="w-full max-w-[300px] h-[100px] bg-white flex items-center justify-center overflow-hidden">
                <svg viewBox={`0 0 ${totalWidth} 60`} className="w-full h-full" preserveAspectRatio="none">
                    {pattern.map((width, i) => {
                        const x = pattern.slice(0, i).reduce((a, b) => a + b, 0) * 2
                        return i % 2 === 0 ? (
                            <rect key={i} x={x} y="0" width={width * 2} height="60" fill="black" />
                        ) : null
                    })}
                </svg>
            </div>
            <div className="mt-4 text-center">
                <p className="text-xl font-mono tracking-[0.3em] font-bold text-gray-800">{value || "---"}</p>
                {label && <p className="text-sm text-muted-foreground mt-1">{label}</p>}
            </div>
            <div className="flex gap-2 mt-6">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    SVG
                </Button>
                <Button onClick={handlePrint} size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                    <Printer className="h-4 w-4" />
                    Print
                </Button>
            </div>
        </div>
    )
}
