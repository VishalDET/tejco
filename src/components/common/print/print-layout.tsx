import React, { useRef } from "react"
import { PrintHeader, PrintHeaderProps } from "./print-header"
import { PrintFooter, PrintFooterProps } from "./print-footer"
import { CompanyPrintInfo, DEFAULT_TEJCO_COMPANY } from "./company-config"

export const STANDARD_LABEL_SIZE = {
  widthMm: 38,
  heightMm: 15,
  cssSize: "38mm 15mm",
} as const

export interface ExecutePrintOptions {
  documentTitle?: string
  pageOrientation?: "portrait" | "landscape"
  delayMs?: number
  /** Page size or preset (e.g. "A4", "38mm 15mm", "thermal") */
  pageSize?: "A4" | "38mm 15mm" | "thermal" | string
  /** Custom width in mm (e.g. 38 for 38mm) */
  widthMm?: number
  /** Custom height in mm (e.g. 15 for 15mm) */
  heightMm?: number
  /** Custom margin (e.g. "0" for thermal roll labels) */
  margin?: string
}

export interface PrintLayoutProps {
  /** Document Title, e.g. "TAX INVOICE", "SALES ORDER", "CREDIT NOTE" */
  documentTitle?: string
  /** Subtitle or voucher category */
  documentSubtitle?: string
  /** Company configuration */
  company?: CompanyPrintInfo
  /** Header properties override */
  headerProps?: Partial<PrintHeaderProps>
  /** Footer properties override */
  footerProps?: Partial<PrintFooterProps>
  /** Hide company header (default: false) */
  hideHeader?: boolean
  /** Hide company footer (default: false) */
  hideFooter?: boolean
  /** Page orientation for print dialog. Defaults to 'portrait' */
  pageOrientation?: "portrait" | "landscape"
  /** Page size: "A4", "38mm 15mm", "thermal", or custom */
  pageSize?: "A4" | "38mm 15mm" | "thermal" | string
  /** Custom width in mm (e.g. 38) */
  widthMm?: number
  /** Custom height in mm (e.g. 15) */
  heightMm?: number
  /** Content to render inside printable body */
  children: React.ReactNode
  /** Custom wrapper class */
  className?: string
  /** Ref to the printable container element */
  containerRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * Universal print trigger utility that opens an isolated print window
 * with necessary typography and CSS rules. Works in all browsers without blank pages.
 * Supports standard A4 sheets and 38mm x 15mm thermal labels.
 */
export function executePrint(
  targetElement: HTMLElement | null,
  options?: ExecutePrintOptions
) {
  if (!targetElement) {
    window.print()
    return
  }

  const printWindow = window.open("", "_blank", "width=900,height=800")
  if (!printWindow) {
    window.print()
    return
  }

  const orientation = options?.pageOrientation || "portrait"
  const title = options?.documentTitle || "Document"
  const delay = options?.delayMs ?? 350
  const contents = targetElement.innerHTML

  const isLabelSize =
    (options?.widthMm != null && options?.heightMm != null) ||
    options?.pageSize === "38mm 15mm" ||
    options?.pageSize === "thermal" ||
    Boolean(options?.pageSize && options.pageSize.includes("38mm"))

  const widthMm = options?.widthMm ?? (isLabelSize ? 38 : undefined)
  const heightMm = options?.heightMm ?? (isLabelSize ? 15 : undefined)

  const sizeCss = isLabelSize && widthMm && heightMm
    ? `${widthMm}mm ${heightMm}mm`
    : options?.pageSize
      ? options.pageSize
      : `A4 ${orientation}`

  const maxWidthCss = isLabelSize && widthMm
    ? `${widthMm}mm`
    : orientation === "landscape" ? "297mm" : "210mm"

  const marginCss = isLabelSize
    ? (options?.margin || "0mm")
    : (options?.margin || "6mm 8mm")

  printWindow.document.open()
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/src/app/globals.css" />
        <style>
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
          }
          @page {
            size: ${sizeCss};
            margin: ${marginCss};
          }
          #print-root {
            width: 100%;
            max-width: ${maxWidthCss};
            ${isLabelSize && heightMm ? `height: ${heightMm}mm; max-height: ${heightMm}mm; overflow: hidden;` : ""}
            margin: 0 auto;
            background: #fff;
          }
          ${isLabelSize ? `
            html, body {
              width: ${widthMm}mm !important;
              height: ${heightMm}mm !important;
              overflow: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            svg, rect {
              shape-rendering: crispEdges !important;
              image-rendering: pixelated !important;
            }
          ` : ""}
          table {
            border-collapse: collapse;
            width: 100%;
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
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
              window.close();
            }, ${delay});
          };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

/**
 * Universal PrintLayout component containing the standard Tejco corporate
 * header, structured content area, and customizable footer.
 */
export function PrintLayout({
  documentTitle,
  documentSubtitle,
  company = DEFAULT_TEJCO_COMPANY,
  headerProps,
  footerProps,
  hideHeader = false,
  hideFooter = false,
  pageOrientation = "portrait",
  pageSize,
  widthMm,
  heightMm,
  children,
  className = "",
  containerRef,
}: PrintLayoutProps) {
  const localRef = useRef<HTMLDivElement>(null)
  const resolvedRef = containerRef || localRef

  const isLabelSize =
    (widthMm != null && heightMm != null) ||
    pageSize === "38mm 15mm" ||
    pageSize === "thermal" ||
    Boolean(pageSize && pageSize.includes("38mm"))

  const targetWidth = widthMm ?? (isLabelSize ? 38 : undefined)
  const targetHeight = heightMm ?? (isLabelSize ? 15 : undefined)

  const maxWidth = isLabelSize && targetWidth
    ? `${targetWidth}mm`
    : pageOrientation === "landscape" ? "297mm" : "210mm"

  const maxHeight = isLabelSize && targetHeight
    ? `${targetHeight}mm`
    : undefined

  return (
    <div
      ref={resolvedRef}
      className={`print-document-layout bg-white text-slate-900 border print:border-none rounded-xl print:rounded-none shadow-sm print:shadow-none overflow-hidden mx-auto ${className}`}
      style={{
        width: "100%",
        maxWidth,
        maxHeight,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* 1. Header */}
      {!hideHeader && (
        <PrintHeader
          documentTitle={documentTitle}
          documentSubtitle={documentSubtitle}
          company={company}
          {...headerProps}
        />
      )}

      {/* 2. Document Content */}
      <div className="p-6 print:p-4 space-y-5">
        {children}

        {/* 3. Footer */}
        {!hideFooter && (
          <PrintFooter
            company={company}
            documentNumber={footerProps?.documentNumber}
            {...footerProps}
          />
        )}
      </div>
    </div>
  )
}
