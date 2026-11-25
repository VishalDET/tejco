import React, { useRef } from "react"
import { STANDARD_LABEL_SIZE, executePrint } from "./print-layout"
import {
  generateQrMatrix,
  generateQrPath,
  generateQrDataUrl,
  QrEccLevel,
} from "@/lib/qr-utils"

export interface QrLabelProps {
  /** QR code text/payload to encode (e.g. SKU, serial number, product URL, or unique ID) */
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
  /** Option to show or hide the value text (default: true) */
  showCodeText?: boolean
  /** Optional Lot number */
  lotNumber?: string
  showLotNumber?: boolean
  /** Optional Invoice / PO reference */
  invoiceNumber?: string
  showInvoiceNumber?: boolean
  /** Optional Expiry date */
  expiryDate?: string
  showExpiryDate?: boolean
  /** Error correction level ('L' | 'M' | 'Q' | 'H', default: 'M') */
  eccLevel?: QrEccLevel
  /**
   * Layout orientation:
   * - "horizontal": QR on left, product & metadata on right (recommended for wide roll labels like 38mm × 15mm)
   * - "vertical": Stacked vertically (recommended for square or tall labels like 38mm × 25mm or 50mm × 50mm)
   * - "auto": Defaults to "horizontal" if widthMm >= heightMm * 1.5, otherwise "vertical"
   */
  layout?: "horizontal" | "vertical" | "auto"
  /**
   * Rendering format:
   * - "image": High-resolution pixel-perfect PNG image (recommended for 100% reliable scanner reads)
   * - "svg": Pure vector SVG with crisp edges
   * Defaults to "image".
   */
  renderMode?: "image" | "svg"
  widthMm?: number
  heightMm?: number
  className?: string
}

/**
 * Standard Thermal QR Code Sticker Label Component:
 * - Dedicated QR label designed for thermal roll sticker printers (38mm × 15mm and custom sizes)
 * - Supports side-by-side horizontal layout (QR on left, details on right) and stacked vertical layout
 * - Crisp, high-contrast, scanner-readable rendering (lossless PNG image or vector SVG)
 * - Zero external dependencies, offline capable
 */
export function QrLabel({
  value,
  productName,
  variantName,
  companyName = "TEJCO GLOBAL LLP",
  showCompany = false,
  showProductName = true,
  showVariantName = true,
  showCodeText = true,
  lotNumber,
  showLotNumber = true,
  invoiceNumber,
  showInvoiceNumber = false,
  expiryDate,
  showExpiryDate = false,
  eccLevel = "M",
  layout = "auto",
  renderMode = "image",
  widthMm = STANDARD_LABEL_SIZE.widthMm,
  heightMm = STANDARD_LABEL_SIZE.heightMm,
  className = "",
}: QrLabelProps) {
  const resolvedLayout =
    layout === "auto"
      ? widthMm >= heightMm * 1.5
        ? "horizontal"
        : "vertical"
      : layout

  const qr = React.useMemo(() => {
    return generateQrMatrix(value || "000000", eccLevel)
  }, [value, eccLevel])

  const [dataUrl, setDataUrl] = React.useState<string>("")

  React.useEffect(() => {
    if (renderMode === "image") {
      setDataUrl(
        generateQrDataUrl(value || "000000", {
          moduleSize: 6,
          quietZone: 2,
          eccLevel,
        })
      )
    }
  }, [value, renderMode, eccLevel])

  const quietZone = 2
  const totalDim = qr.size + quietZone * 2
  const pathD = React.useMemo(() => generateQrPath(qr, quietZone), [qr])

  const renderQrGraphic = () => {
    if (renderMode === "image" && dataUrl) {
      return (
        <img
          src={dataUrl}
          alt={value}
          style={{
            maxHeight: "100%",
            maxWidth: "100%",
            height: "auto",
            display: "block",
            margin: "0 auto",
            imageRendering: "pixelated",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        />
      )
    }

    return (
      <svg
        viewBox={`0 0 ${totalDim} ${totalDim}`}
        shapeRendering="crispEdges"
        style={{
          maxHeight: "100%",
          maxWidth: "100%",
          height: "auto",
          display: "block",
          margin: "0 auto",
          shapeRendering: "crispEdges",
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width={totalDim} height={totalDim} fill="#ffffff" />
        <path d={pathD} fill="#000000" shapeRendering="crispEdges" />
      </svg>
    )
  }

  if (resolvedLayout === "horizontal") {
    return (
      <div
        className={`qr-label-container flex flex-row items-center justify-between bg-white text-black overflow-hidden ${className}`}
        style={{
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          maxWidth: `${widthMm}mm`,
          maxHeight: `${heightMm}mm`,
          padding: "0.4mm 0.8mm",
          margin: 0,
          boxSizing: "border-box",
          pageBreakInside: "avoid",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* Left QR Column */}
        <div
          style={{
            height: "100%",
            maxHeight: `${heightMm - 0.8}mm`,
            width: `${heightMm - 0.8}mm`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {renderQrGraphic()}
        </div>

        {/* Right Details Column */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: "1mm",
            overflow: "hidden",
            lineHeight: 1.15,
            textAlign: "left",
          }}
        >
          {showCompany && (
            <div
              style={{
                fontSize: "4.5pt",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.2px",
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
          {showCodeText && (
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "4.8pt",
                fontWeight: 700,
                letterSpacing: "0.3px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "#000",
                marginTop: "0.1mm",
              }}
            >
              {value}
            </div>
          )}
          {showLotNumber && lotNumber && (
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "4.2pt",
                fontWeight: 600,
                color: "#333",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Lot: {lotNumber}
            </div>
          )}
          {((showInvoiceNumber && invoiceNumber) || (showExpiryDate && expiryDate)) && (
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "4pt",
                color: "#444",
                display: "flex",
                justifyContent: "space-between",
                gap: "1mm",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {showInvoiceNumber && invoiceNumber && <span>Inv: {invoiceNumber}</span>}
              {showExpiryDate && expiryDate && <span>Exp: {expiryDate.slice(0, 10)}</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Stacked Vertical Layout
  return (
    <div
      className={`qr-label-container flex flex-col justify-between items-center text-center bg-white text-black overflow-hidden ${className}`}
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        maxWidth: `${widthMm}mm`,
        maxHeight: `${heightMm}mm`,
        padding: "0.4mm 0.6mm",
        margin: 0,
        boxSizing: "border-box",
        pageBreakInside: "avoid",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Header Info */}
      {(showCompany || showProductName || showVariantName) && (
        <div
          style={{
            width: "100%",
            lineHeight: 1.1,
            padding: "0.1mm 0.4mm 0",
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

      {/* Center QR Graphic */}
      <div
        style={{
          width: "100%",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "0.2mm",
        }}
      >
        {renderQrGraphic()}
      </div>

      {/* Value Text */}
      {showCodeText && (
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "4.8pt",
            fontWeight: 700,
            letterSpacing: "0.5px",
            lineHeight: 1,
            paddingBottom: "0.2mm",
            flexShrink: 0,
            color: "#000000",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "96%",
          }}
        >
          {value}
        </div>
      )}
    </div>
  )
}

/**
 * Generates raw HTML for thermal QR roll printing (Zebra, TSC, TVS, Godex, Citizen).
 */
export function buildThermalQrLabelHtml(options: {
  value: string
  productName?: string
  variantName?: string
  companyName?: string
  showCompany?: boolean
  showProductName?: boolean
  showVariantName?: boolean
  showCodeText?: boolean
  lotNumber?: string
  showLotNumber?: boolean
  invoiceNumber?: string
  showInvoiceNumber?: boolean
  expiryDate?: string
  showExpiryDate?: boolean
  eccLevel?: QrEccLevel
  layout?: "horizontal" | "vertical" | "auto"
  renderMode?: "image" | "svg"
  widthMm?: number
  heightMm?: number
}): string {
  const {
    value,
    productName,
    variantName,
    companyName = "TEJCO GLOBAL LLP",
    showCompany = false,
    showProductName = true,
    showVariantName = true,
    showCodeText = true,
    lotNumber,
    showLotNumber = true,
    invoiceNumber,
    showInvoiceNumber = false,
    expiryDate,
    showExpiryDate = false,
    eccLevel = "M",
    layout = "auto",
    renderMode = "image",
    widthMm = STANDARD_LABEL_SIZE.widthMm,
    heightMm = STANDARD_LABEL_SIZE.heightMm,
  } = options

  const resolvedLayout =
    layout === "auto"
      ? widthMm >= heightMm * 1.5
        ? "horizontal"
        : "vertical"
      : layout

  const qr = generateQrMatrix(value || "000000", eccLevel)
  const quietZone = 2
  const totalDim = qr.size + quietZone * 2
  const pathD = generateQrPath(qr, quietZone)

  const pngDataUrl =
    renderMode === "image"
      ? generateQrDataUrl(value || "000000", {
          moduleSize: 6,
          quietZone: 2,
          eccLevel,
        })
      : ""

  const qrElementHtml =
    renderMode === "image" && pngDataUrl
      ? `
        <img
          src="${pngDataUrl}"
          alt="${value}"
          style="
            max-height: 100%;
            max-width: 100%;
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
          viewBox="0 0 ${totalDim} ${totalDim}"
          shape-rendering="crispEdges"
          style="max-height: 100%; max-width: 100%; height: auto; display: block; margin: 0 auto; shape-rendering: crispEdges;"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="${totalDim}" height="${totalDim}" fill="#ffffff" />
          <path d="${pathD}" fill="#000000" shape-rendering="crispEdges" />
        </svg>
      `

  if (resolvedLayout === "horizontal") {
    return `
      <div class="qr-label" style="
        width: ${widthMm}mm;
        height: ${heightMm}mm;
        max-width: ${widthMm}mm;
        max-height: ${heightMm}mm;
        box-sizing: border-box;
        padding: 0.4mm 0.8mm;
        margin: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        background: #ffffff;
        color: #000000;
        overflow: hidden;
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-after: always;
        break-after: page;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      ">
        <div style="height: 100%; max-height: ${heightMm - 0.8}mm; width: ${heightMm - 0.8}mm; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;">
          ${qrElementHtml}
        </div>
        <div style="flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; justify-content: center; padding-left: 1mm; overflow: hidden; line-height: 1.15; text-align: left;">
          ${
            showCompany
              ? `<div style="font-size: 4.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2px; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${companyName}</div>`
              : ""
          }
          ${
            showProductName && productName
              ? `<div style="font-size: 5.5pt; font-weight: 700; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${productName}</div>`
              : ""
          }
          ${
            showVariantName && variantName && variantName !== productName
              ? `<div style="font-size: 5pt; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${variantName}</div>`
              : ""
          }
          ${
            showCodeText
              ? `<div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 4.8pt; font-weight: 700; letter-spacing: 0.3px; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 0.1mm;">${value}</div>`
              : ""
          }
          ${
            showLotNumber && lotNumber
              ? `<div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 4.2pt; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Lot: ${lotNumber}</div>`
              : ""
          }
          ${
            (showInvoiceNumber && invoiceNumber) || (showExpiryDate && expiryDate)
              ? `<div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 4pt; color: #555; display: flex; justify-content: space-between; gap: 1mm; white-space: nowrap; overflow: hidden;">
                  ${showInvoiceNumber && invoiceNumber ? `<span>Inv: ${invoiceNumber}</span>` : ""}
                  ${showExpiryDate && expiryDate ? `<span>Exp: ${expiryDate.slice(0, 10)}</span>` : ""}
                </div>`
              : ""
          }
        </div>
      </div>
    `
  }

  // Vertical HTML
  return `
    <div class="qr-label" style="
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      max-width: ${widthMm}mm;
      max-height: ${heightMm}mm;
      box-sizing: border-box;
      padding: 0.4mm 0.6mm;
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
        <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 0.1mm; padding: 0.1mm 0.4mm 0; flex-shrink: 0; line-height: 1.1;">
          ${
            showCompany
              ? `<div style="font-size: 4.8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${companyName}</div>`
              : ""
          }
          ${
            showProductName && productName
              ? `<div style="font-size: 5.5pt; font-weight: 700; max-width: 98%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000;">${productName}</div>`
              : ""
          }
          ${
            showVariantName && variantName && variantName !== productName
              ? `<div style="font-size: 5pt; font-weight: 600; max-width: 98%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #333;">${variantName}</div>`
              : ""
          }
        </div>
      `
          : ""
      }

      <div style="width: 100%; flex: 1; display: flex; align-items: center; justify-content: center; padding: 0.2mm;">
        ${qrElementHtml}
      </div>

      ${
        showCodeText
          ? `<div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 4.8pt; font-weight: 700; letter-spacing: 0.5px; line-height: 1; padding-bottom: 0.2mm; flex-shrink: 0; color: #000000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 96%;">${value}</div>`
          : ""
      }
      ${
        showLotNumber && lotNumber
          ? `<div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 4.2pt; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 96%;">Lot: ${lotNumber}</div>`
          : ""
      }
      ${
        (showInvoiceNumber && invoiceNumber) || (showExpiryDate && expiryDate)
          ? `<div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 4pt; color: #555; display: flex; justify-content: space-between; width: 95%; white-space: nowrap; overflow: hidden;">
              ${showInvoiceNumber && invoiceNumber ? `<span>Inv: ${invoiceNumber}</span>` : ""}
              ${showExpiryDate && expiryDate ? `<span>Exp: ${expiryDate.slice(0, 10)}</span>` : ""}
            </div>`
          : ""
      }
    </div>
  `
}

/**
 * Triggers thermal printing specifically formatted for QR code sticker roll printers.
 */
export function executeQrLabelPrint(
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
  const title = options?.documentTitle || `QR Label - ${widthMm}mm x ${heightMm}mm`
  const delay = options?.delayMs ?? 150
  const contents = targetElement.innerHTML

  const printWindow = window.open("", "_blank", "width=600,height=500")
  if (!printWindow) {
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
          @page {
            size: ${widthMm}mm ${heightMm}mm;
            margin: 0mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          .qr-label-container {
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
            max-width: ${widthMm}mm !important;
            max-height: ${heightMm}mm !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          img, svg {
            image-rendering: pixelated;
            image-rendering: -webkit-optimize-contrast;
            shape-rendering: crispEdges;
          }
        </style>
      </head>
      <body>
        ${contents}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
              setTimeout(function() {
                try { window.close(); } catch(e) {}
              }, 400);
            }, ${delay});
          };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

