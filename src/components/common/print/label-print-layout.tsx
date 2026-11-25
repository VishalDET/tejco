import React, { useRef } from "react"
import { executePrint, STANDARD_LABEL_SIZE } from "./print-layout"
import { encodeCode128B } from "@/lib/barcode-utils"
import {
  QrLabel,
  QrLabelProps,
  buildThermalQrLabelHtml,
  executeQrLabelPrint,
} from "./qr-label"
import {
  generateQrMatrix,
  generateQrPath,
  generateQrSvgMarkup,
  generateQrDataUrl,
  type QrEccLevel,
  type QrCodeResult,
} from "@/lib/qr-utils"

export {
  STANDARD_LABEL_SIZE,
  QrLabel,
  type QrLabelProps,
  buildThermalQrLabelHtml,
  executeQrLabelPrint,
  generateQrMatrix,
  generateQrPath,
  generateQrSvgMarkup,
  generateQrDataUrl,
  type QrEccLevel,
  type QrCodeResult,
}

export interface LabelPrintLayoutProps {
  /** Width in millimeters, defaults to 38mm */
  widthMm?: number
  /** Height in millimeters, defaults to 15mm */
  heightMm?: number
  children: React.ReactNode
  className?: string
  containerRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * Renders a pixel-perfect Code 128 barcode directly onto a Canvas with exact integer
 * module widths (2px per module), solid black (#000000) on solid white (#ffffff),
 * and standard quiet zones.
 * Produces a lossless PNG image (Data URL) that scans 100% reliably on all physical optical/laser scanners.
 */
export function generateBarcodeDataUrl(
  rawText: string,
  options?: {
    moduleWidth?: number
    height?: number
  }
): string {
  if (typeof document === "undefined") return ""
  const encoded = encodeCode128B(rawText)
  const defaultModuleWidth = encoded.totalWidth > 180 ? 1 : 2
  const moduleWidth = Math.max(1, Math.round(options?.moduleWidth ?? defaultModuleWidth))
  const height = Math.max(20, Math.round(options?.height ?? 64))
  const width = encoded.totalWidth * moduleWidth

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""

  // Solid white background ensures white spaces and quiet zones
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)

  // Solid black bars with exact integer module multiples (1x, 2x, 3x, 4x)
  ctx.fillStyle = "#000000"
  for (const bar of encoded.bars) {
    ctx.fillRect(bar.x * moduleWidth, 0, bar.width * moduleWidth, height)
  }

  return canvas.toDataURL("image/png")
}

/**
 * Specialized printable container for thermal barcode stickers & roll labels.
 * Default dimensions: 38mm wide × 15mm height with zero padding and crisp rendering.
 */
export function LabelPrintLayout({
  widthMm = STANDARD_LABEL_SIZE.widthMm,
  heightMm = STANDARD_LABEL_SIZE.heightMm,
  children,
  className = "",
  containerRef,
}: LabelPrintLayoutProps) {
  const localRef = useRef<HTMLDivElement>(null)
  const resolvedRef = containerRef || localRef

  return (
    <div
      ref={resolvedRef}
      className={`print-label-layout bg-white text-black overflow-hidden flex flex-col justify-between items-center ${className}`}
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        maxWidth: `${widthMm}mm`,
        maxHeight: `${heightMm}mm`,
        padding: 0,
        margin: 0,
        boxSizing: "border-box",
        pageBreakInside: "avoid",
        pageBreakAfter: "always",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        shapeRendering: "crispEdges",
      }}
    >
      {children}
    </div>
  )
}

export interface BarcodeLabelProps {
  /** Barcode text / value to encode */
  barcode: string
  /** Product name */
  productName?: string
  /** Variant name */
  variantName?: string
  /** Company name header */
  companyName?: string
  showCompany?: boolean
  showProductName?: boolean
  showVariantName?: boolean
  /** Option to show or hide the barcode number below the barcode (default: true) */
  showBarcodeNumber?: boolean
  /**
   * Rendering format:
   * - "image": High-resolution pixel-perfect PNG image (recommended for 100% reliable scanner reads)
   * - "svg": Pure vector SVG with preserved aspect ratio
   * Defaults to "image".
   */
  renderMode?: "image" | "svg"
  widthMm?: number
  heightMm?: number
  className?: string
}

/**
 * Standard 38mm × 15mm thermal barcode sticker label component:
 * - Prints in high-resolution image format (PNG) or proportional SVG
 * - Barcode ratios (1:2:3:4) are strictly preserved without stretch distortion
 * - Full white quiet zones and crisp contrast for instant handheld scanner decoding
 * - Removed SKU
 * - Provides showBarcodeNumber toggle option
 */
export function BarcodeLabel({
  barcode,
  productName,
  variantName,
  companyName = "TEJCO GLOBAL LLP",
  showCompany = false,
  showProductName = true,
  showVariantName = true,
  showBarcodeNumber = true,
  renderMode = "image",
  widthMm = STANDARD_LABEL_SIZE.widthMm,
  heightMm = STANDARD_LABEL_SIZE.heightMm,
  className = "",
}: BarcodeLabelProps) {
  const encoded = React.useMemo(() => encodeCode128B(barcode || "000000"), [barcode])
  const [dataUrl, setDataUrl] = React.useState<string>("")

  React.useEffect(() => {
    if (renderMode === "image") {
      const defaultModWidth = encoded.totalWidth > 180 ? 1 : 2
      setDataUrl(generateBarcodeDataUrl(barcode || "000000", { moduleWidth: defaultModWidth, height: 64 }))
    }
  }, [barcode, renderMode, encoded.totalWidth])

  const barHeight = showBarcodeNumber ? 26 : 34

  return (
    <div
      className={`barcode-label-container flex flex-col justify-between items-center text-center bg-white text-black overflow-hidden ${className}`}
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        maxWidth: `${widthMm}mm`,
        maxHeight: `${heightMm}mm`,
        padding: 0,
        margin: 0,
        boxSizing: "border-box",
        pageBreakInside: "avoid",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Top Header details (No SKU) */}
      {(showCompany || showProductName || showVariantName) && (
        <div
          style={{
            width: "100%",
            lineHeight: 1.1,
            padding: "0.2mm 0.8mm 0",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {showCompany && (
            <div
              style={{
                fontSize: "4.8pt",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "#111",
              }}
            >
              {companyName}
            </div>
          )}
          {showProductName && productName && (
            <div
              style={{
                fontSize: "5.5pt",
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "#000",
              }}
            >
              {productName}
            </div>
          )}
          {showVariantName && variantName && variantName !== productName && (
            <div
              style={{
                fontSize: "5pt",
                fontWeight: 600,
                color: "#333",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {variantName}
            </div>
          )}
        </div>
      )}

      {/* Barcode Graphic: High-resolution PNG or Proportional SVG (never stretched) */}
      <div
        style={{
          width: "100%",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "0 0.8mm",
          minHeight: showBarcodeNumber ? "6.8mm" : "9.2mm",
        }}
      >
        {renderMode === "image" && dataUrl ? (
          <img
            src={dataUrl}
            alt={barcode}
            style={{
              maxHeight: "100%",
              maxWidth: "96%",
              height: "auto",
              display: "block",
              margin: "0 auto",
              imageRendering: "pixelated",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          />
        ) : (
          <svg
            viewBox={`0 0 ${encoded.totalWidth} ${barHeight}`}
            shapeRendering="crispEdges"
            style={{
              maxHeight: "100%",
              maxWidth: "96%",
              height: "auto",
              display: "block",
              margin: "0 auto",
              shapeRendering: "crispEdges",
            }}
            preserveAspectRatio="xMidYMid meet"
          >
            <rect x={0} y={0} width={encoded.totalWidth} height={barHeight} fill="#ffffff" />
            {encoded.bars.map((b, idx) => (
              <rect
                key={idx}
                x={b.x}
                y={0}
                width={b.width}
                height={barHeight}
                fill="#000000"
                shapeRendering="crispEdges"
              />
            ))}
          </svg>
        )}
      </div>

      {/* Barcode Number (Optionally Hidden) */}
      {showBarcodeNumber && (
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "5pt",
            fontWeight: 700,
            letterSpacing: "0.5px",
            lineHeight: 1,
            paddingBottom: "0.2mm",
            flexShrink: 0,
            color: "#000000",
          }}
        >
          {encoded.text}
        </div>
      )}
    </div>
  )
}

export interface PrintableLabelProps {
  /** Mode: "barcode" (default), "qr", or "auto" (auto selects QR if length > 16) */
  type?: "barcode" | "qr" | "auto"
  /** Barcode text or QR payload */
  value: string
  /** Product name */
  productName?: string
  /** Variant name */
  variantName?: string
  /** Company name header */
  companyName?: string
  showCompany?: boolean
  showProductName?: boolean
  showVariantName?: boolean
  /** Option to show or hide the code text / number (default: true) */
  showCodeText?: boolean
  /** QR layout: "horizontal" | "vertical" | "auto" (default: "auto") */
  qrLayout?: "horizontal" | "vertical" | "auto"
  /** QR Error correction level ('L' | 'M' | 'Q' | 'H') */
  eccLevel?: QrEccLevel
  /**
   * Rendering format:
   * - "image": High-resolution pixel-perfect PNG image (recommended)
   * - "svg": Pure vector SVG
   * Defaults to "image".
   */
  renderMode?: "image" | "svg"
  widthMm?: number
  heightMm?: number
  className?: string
}

/**
 * Universal printable label component that switches seamlessly between 1D Barcode and 2D QR Code.
 */
export function PrintableLabel({
  type = "barcode",
  value,
  productName,
  variantName,
  companyName = "TEJCO GLOBAL LLP",
  showCompany = false,
  showProductName = true,
  showVariantName = true,
  showCodeText = true,
  qrLayout = "auto",
  eccLevel = "M",
  renderMode = "image",
  widthMm = STANDARD_LABEL_SIZE.widthMm,
  heightMm = STANDARD_LABEL_SIZE.heightMm,
  className = "",
}: PrintableLabelProps) {
  const resolvedType =
    type === "auto"
      ? (value || "").length > 16
        ? "qr"
        : "barcode"
      : type

  if (resolvedType === "qr") {
    return (
      <QrLabel
        value={value}
        productName={productName}
        variantName={variantName}
        companyName={companyName}
        showCompany={showCompany}
        showProductName={showProductName}
        showVariantName={showVariantName}
        showCodeText={showCodeText}
        layout={qrLayout}
        eccLevel={eccLevel}
        renderMode={renderMode}
        widthMm={widthMm}
        heightMm={heightMm}
        className={className}
      />
    )
  }

  return (
    <BarcodeLabel
      barcode={value}
      productName={productName}
      variantName={variantName}
      companyName={companyName}
      showCompany={showCompany}
      showProductName={showProductName}
      showVariantName={showVariantName}
      showBarcodeNumber={showCodeText}
      renderMode={renderMode}
      widthMm={widthMm}
      heightMm={heightMm}
      className={className}
    />
  )
}

/**
 * Generates raw HTML for a 38mm × 15mm label without SKU, with zero padding,
 * and high-contrast scannable barcode (image or proportional SVG).
 */
export function buildThermalLabelHtml(options: {
  barcode: string
  productName?: string
  variantName?: string
  companyName?: string
  showCompany?: boolean
  showProductName?: boolean
  showVariantName?: boolean
  showBarcodeNumber?: boolean
  renderMode?: "image" | "svg"
  widthMm?: number
  heightMm?: number
}): string {
  const {
    barcode,
    productName,
    variantName,
    companyName = "TEJCO GLOBAL LLP",
    showCompany = false,
    showProductName = true,
    showVariantName = true,
    showBarcodeNumber = true,
    renderMode = "image",
    widthMm = STANDARD_LABEL_SIZE.widthMm,
    heightMm = STANDARD_LABEL_SIZE.heightMm,
  } = options

  const encoded = encodeCode128B(barcode || "000000")
  const barHeight = showBarcodeNumber ? 26 : 34

  const defaultModWidth = encoded.totalWidth > 180 ? 1 : 2
  const pngDataUrl = renderMode === "image" ? generateBarcodeDataUrl(barcode || "000000", { moduleWidth: defaultModWidth, height: 64 }) : ""

  const barcodeElementHtml =
    renderMode === "image" && pngDataUrl
      ? `
        <img
          src="${pngDataUrl}"
          alt="${barcode}"
          style="
            max-height: 100%;
            max-width: 96%;
            height: auto;
            display: block;
            margin: 0 auto;
            image-rendering: pixelated;
            image-rendering: -webkit-optimize-contrast;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          "
        />
      `
      : `
        <svg
          viewBox="0 0 ${encoded.totalWidth} ${barHeight}"
          shape-rendering="crispEdges"
          style="max-height: 100%; max-width: 96%; height: auto; display: block; margin: 0 auto; shape-rendering: crispEdges;"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect x="0" y="0" width="${encoded.totalWidth}" height="${barHeight}" fill="#ffffff" />
          ${encoded.bars
            .map(
              (b) =>
                `<rect x="${b.x}" y="0" width="${b.width}" height="${barHeight}" fill="#000000" shape-rendering="crispEdges" />`
            )
            .join("")}
        </svg>
      `

  return `
    <div class="barcode-label" style="
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      max-width: ${widthMm}mm;
      max-height: ${heightMm}mm;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      color: #000000;
      text-align: center;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: always;
      break-after: page;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    ">
      ${
        showCompany || showProductName || showVariantName
          ? `
        <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 0.1mm; padding: 0.2mm 0.8mm 0; flex-shrink: 0; line-height: 1.1;">
          ${
            showCompany
              ? `
            <div style="font-size: 4.8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; color: #111;">
              ${companyName}
            </div>
          `
              : ""
          }
          ${
            showProductName && productName
              ? `
            <div style="font-size: 5.5pt; font-weight: 700; max-width: 98%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000;">
              ${productName}
            </div>
          `
              : ""
          }
          ${
            showVariantName && variantName && variantName !== productName
              ? `
            <div style="font-size: 5pt; font-weight: 600; max-width: 98%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #333;">
              ${variantName}
            </div>
          `
              : ""
          }
        </div>
      `
          : ""
      }

      <div style="width: 100%; flex: 1; display: flex; align-items: center; justify-content: center; padding: 0 0.8mm; min-height: ${
        showBarcodeNumber ? "6.8mm" : "9.2mm"
      };">
        ${barcodeElementHtml}
      </div>

      ${
        showBarcodeNumber
          ? `
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 5pt; font-weight: 700; letter-spacing: 0.5px; line-height: 1; padding-bottom: 0.2mm; flex-shrink: 0; color: #000000;">
          ${encoded.text}
        </div>
      `
          : ""
      }
    </div>
  `
}

/**
 * High-performance, zero-latency print trigger specifically tuned for thermal barcode roll printers
 * (Zebra, TSC, TVS, Godex, Citizen, Xprinter) at 38mm wide × 15mm height.
 */
export function executeLabelPrint(
  targetElement: HTMLElement | null,
  options?: {
    documentTitle?: string
    widthMm?: number
    heightMm?: number
    delayMs?: number
  }
) {
  if (!targetElement) {
    window.print()
    return
  }

  const widthMm = options?.widthMm ?? STANDARD_LABEL_SIZE.widthMm
  const heightMm = options?.heightMm ?? STANDARD_LABEL_SIZE.heightMm
  const title = options?.documentTitle || "Barcode Label - 38mm x 15mm"
  const delay = options?.delayMs ?? 150
  const contents = targetElement.innerHTML

  const printWindow = window.open("", "_blank", "width=600,height=500")
  if (!printWindow) {
    // Fallback if popup blocker intercepts
    return executePrint(targetElement, {
      documentTitle: title,
      widthMm,
      heightMm,
      pageSize: `${widthMm}mm ${heightMm}mm`,
      margin: "0mm",
      delayMs: delay,
    })
  }

  printWindow.document.open()
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          * {
            box-sizing: border-box !important;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: ${widthMm}mm ${heightMm}mm !important;
            margin: 0mm !important;
          }
          html, body {
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: hidden !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          #print-root {
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
            max-width: ${widthMm}mm !important;
            max-height: ${heightMm}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          .print-label-layout,
          .barcode-label-container,
          .barcode-label,
          .qr-label-container,
          .qr-label {
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
            max-width: ${widthMm}mm !important;
            max-height: ${heightMm}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
          .qr-label-container, .qr-label {
            flex-direction: row !important;
          }
          .qr-label-vertical {
            flex-direction: column !important;
          }
          .print-label-layout:last-child,
          .barcode-label-container:last-child,
          .barcode-label:last-child,
          .qr-label-container:last-child,
          .qr-label:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          img {
            image-rendering: pixelated !important;
            image-rendering: -webkit-optimize-contrast !important;
          }
          svg, rect {
            shape-rendering: crispEdges !important;
            image-rendering: pixelated !important;
            -webkit-font-smoothing: none !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div id="print-root">
          ${contents}
        </div>
        <script>
          function triggerPrint() {
            setTimeout(function() {
              window.focus();
              window.print();
              window.close();
            }, ${delay});
          }
          if (document.readyState === "complete" || document.readyState === "interactive") {
            triggerPrint();
          } else {
            window.addEventListener("DOMContentLoaded", triggerPrint);
          }
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
