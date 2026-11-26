import React, { useRef } from "react"
import { printHtmlViaIframe, STANDARD_LABEL_SIZE } from "./print-layout"
import { encodeCode128Auto } from "@/lib/barcode-utils"
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
  const encoded = encodeCode128Auto(rawText)
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
  showCompany = true,
  showProductName = false,
  showVariantName = false,
  showBarcodeNumber = true,
  renderMode = "image",
  widthMm = STANDARD_LABEL_SIZE.widthMm,
  heightMm = STANDARD_LABEL_SIZE.heightMm,
  className = "",
}: BarcodeLabelProps) {
  const encoded = React.useMemo(() => encodeCode128Auto(barcode || "000000"), [barcode])
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
      className={`barcode-label-container flex flex-col justify-center items-center text-center bg-white text-black overflow-hidden ${className}`}
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        maxWidth: `${widthMm}mm`,
        maxHeight: `${heightMm}mm`,
        padding: "0.8mm 2mm",
        margin: 0,
        gap: "0.4mm",
        boxSizing: "border-box",
        pageBreakInside: "avoid",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Top Header details (Company Name by default, Product Name optionally hidden) */}
      {(showCompany || (showProductName && productName)) && (
        <div
          style={{
            width: "100%",
            lineHeight: 1.1,
            padding: 0,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {showCompany && (
            <div
              style={{
                fontSize: "5.2pt",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "#000",
              }}
            >
              {companyName}
            </div>
          )}
          {showProductName && productName && (
            <div
              style={{
                fontSize: "4.8pt",
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "#000",
              }}
            >
              {productName}
            </div>
          )}
        </div>
      )}

      {/* Barcode Graphic: Fills remaining vertical space cleanly within safe margins */}
      <div
        style={{
          width: "100%",
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: 0,
          margin: "0 auto",
        }}
      >
        {renderMode === "image" && dataUrl ? (
          <img
            src={dataUrl}
            alt={barcode}
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              width: "auto",
              height: "100%",
              objectFit: "contain",
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
              maxWidth: "100%",
              width: "auto",
              height: "100%",
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
            fontWeight: 500,
            letterSpacing: "0.3px",
            lineHeight: 1.1,
            paddingBottom: 0,
            flexShrink: 0,
            color: "#000000",
            maxWidth: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
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
  showCompany = true,
  showProductName = false,
  showVariantName = false,
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
  lotNumber?: string
  showLotNumber?: boolean
  invoiceNumber?: string
  showInvoiceNumber?: boolean
  expiryDate?: string
  showExpiryDate?: boolean
  renderMode?: "image" | "svg"
  widthMm?: number
  heightMm?: number
}): string {
  const {
    barcode,
    productName,
    variantName,
    companyName = "TEJCO GLOBAL LLP",
    showCompany = true,
    showProductName = false,
    showVariantName = false,
    showBarcodeNumber = true,
    lotNumber,
    showLotNumber = false,
    invoiceNumber,
    showInvoiceNumber = false,
    expiryDate,
    showExpiryDate = false,
    renderMode = "image",
    widthMm = STANDARD_LABEL_SIZE.widthMm,
    heightMm = STANDARD_LABEL_SIZE.heightMm,
  } = options

  const encoded = encodeCode128Auto(barcode || "000000")
  const barHeight = showBarcodeNumber ? 26 : 34

  // Target up to ~30mm bar width on 38mm labels so both left and right sides keep generous (~3.5-4mm) quiet zones.
  const quietZoneModules = 10
  const barModules = Math.max(1, encoded.totalWidth - quietZoneModules * 2)
  const maxContentWidthMm = Math.max(10, widthMm - 7.5)
  const availableWidthMm = widthMm <= 40 ? Math.min(maxContentWidthMm, 30) : maxContentWidthMm
  const dotMm = 0.125
  const twoDotWidthMm = barModules * (dotMm * 2)
  const oneDotWidthMm = barModules * dotMm
  const exactBarcodeWidthMm =
    twoDotWidthMm <= availableWidthMm
      ? twoDotWidthMm
      : oneDotWidthMm <= availableWidthMm
        ? Math.min(availableWidthMm, Math.max(oneDotWidthMm, availableWidthMm))
        : availableWidthMm

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
            max-width: 100%;
            width: ${exactBarcodeWidthMm.toFixed(3)}mm;
            height: 100%;
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
          viewBox="${quietZoneModules} 0 ${barModules} ${barHeight}"
          shape-rendering="crispEdges"
          style="max-height: 100%; max-width: 100%; width: ${exactBarcodeWidthMm.toFixed(3)}mm; height: 100%; display: block; margin: 0 auto; shape-rendering: crispEdges;"
          preserveAspectRatio="none"
        >
          <rect x="${quietZoneModules}" y="0" width="${barModules}" height="${barHeight}" fill="#ffffff" />
          ${encoded.bars
        .map(
          (b) =>
            `<rect x="${b.x}" y="0" width="${b.width}" height="${barHeight}" fill="#000000" shape-rendering="crispEdges" />`
        )
        .join("")}
        </svg>
      `

  const showMeta = (showLotNumber && lotNumber) || (showInvoiceNumber && invoiceNumber) || (showExpiryDate && expiryDate)

  return `
    <div class="barcode-label" style="
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      max-width: ${widthMm}mm;
      max-height: ${heightMm}mm;
      box-sizing: border-box;
      padding: 1.5mm 4.5mm 0.3mm 3mm;
      margin: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0.4mm;
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
      ${showCompany || (showProductName && productName) || (showVariantName && variantName)
      ? `
        <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 0.1mm; padding: 0; flex-shrink: 0; line-height: 1.1;">
          ${showCompany
        ? `
            <div style="font-size: 5.2pt; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; color: #000; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${companyName}
            </div>
          `
        : ""
      }
          ${showProductName && productName
        ? `
            <div style="font-size: 4.8pt; font-weight: 500; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000;">
              ${productName}
            </div>
          `
        : ""
      }
          ${showVariantName && variantName && variantName !== productName
        ? `
            <div style="font-size: 4.2pt; font-weight: 400; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #333;">
              ${variantName}
            </div>
          `
        : ""
      }
        </div>
      `
      : ""
    }

      <div style="width: 100%; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0; margin: 0 auto; overflow: hidden;">
        ${barcodeElementHtml}
      </div>

      ${showBarcodeNumber
      ? `
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 5pt; font-weight: 500; letter-spacing: 0.3px; line-height: 1.1; padding: 0; flex-shrink: 0; color: #000000; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${encoded.text}
        </div>
      `
      : ""
    }

      ${showMeta
      ? `
        <div style="width: 100%; display: flex; justify-content: space-between; font-family: ui-monospace, monospace; font-size: 4pt; font-weight: 400; color: #333; line-height: 1; flex-shrink: 0;">
          <span>${showLotNumber && lotNumber ? lotNumber : ""}${showInvoiceNumber && invoiceNumber ? ` ${invoiceNumber}` : ""}</span>
          <span>${showExpiryDate && expiryDate ? `Exp: ${expiryDate.slice(0, 10)}` : ""}</span>
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
  const safeWidthMm = Math.max(10, widthMm - 0.5)
  const safeHeightMm = Math.max(10, heightMm - 0.5)
  const title = options?.documentTitle || "Barcode Label - 38mm x 15mm"
  const contents = targetElement.innerHTML

  printHtmlViaIframe(`
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
            width: ${safeWidthMm}mm !important;
            height: ${safeHeightMm}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: hidden !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          #print-root {
            width: ${safeWidthMm}mm !important;
            height: ${safeHeightMm}mm !important;
            max-width: ${safeWidthMm}mm !important;
            max-height: ${safeHeightMm}mm !important;
            margin: 0 !important;
            overflow: hidden !important;
          }
          .print-label-layout,
          .barcode-label-container,
          .barcode-label,
          .qr-label-container,
          .qr-label {
            width: ${safeWidthMm}mm !important;
            height: ${safeHeightMm}mm !important;
            max-width: ${safeWidthMm}mm !important;
            max-height: ${safeHeightMm}mm !important;
            margin: 0 !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
            display: flex !important;
            align-items: center !important;
          }
          .qr-label-container, .qr-label {
            flex-direction: row !important;
          }
          .barcode-label-container, .barcode-label {
            padding: 1.5mm 4mm 0.3mm 0mm !important;
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
      </body>
    </html>
  `)
}
