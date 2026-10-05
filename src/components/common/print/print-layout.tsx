import React, { useRef } from "react"
import { PrintHeader, PrintHeaderProps } from "./print-header"
import { PrintFooter, PrintFooterProps } from "./print-footer"
import { CompanyPrintInfo, DEFAULT_TEJCO_COMPANY } from "./company-config"

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
 */
export function executePrint(
  targetElement: HTMLElement | null,
  options?: {
    documentTitle?: string
    pageOrientation?: "portrait" | "landscape"
    delayMs?: number
  }
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
            size: A4 ${orientation};
            margin: 6mm 8mm;
          }
          #print-root {
            width: 100%;
            max-width: ${orientation === "landscape" ? "297mm" : "210mm"};
            margin: 0 auto;
            background: #fff;
          }
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
  children,
  className = "",
  containerRef,
}: PrintLayoutProps) {
  const localRef = useRef<HTMLDivElement>(null)
  const resolvedRef = containerRef || localRef

  return (
    <div
      ref={resolvedRef}
      className={`print-document-layout bg-white text-slate-900 border print:border-none rounded-xl print:rounded-none shadow-sm print:shadow-none overflow-hidden mx-auto ${className}`}
      style={{
        width: "100%",
        maxWidth: pageOrientation === "landscape" ? "297mm" : "210mm",
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
