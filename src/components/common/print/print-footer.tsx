import React from "react"
import { CompanyPrintInfo, DEFAULT_TEJCO_COMPANY } from "./company-config"

export interface PrintFooterProps {
  /** Optional custom terms & conditions or policy bullet points */
  terms?: string[]
  /** Optional bank details override or boolean to display default company bank details */
  showBankDetails?: boolean
  bankDetailsOverride?: string[]
  /** Optional label for the verified / inspected signature box */
  verifiedByLabel?: string
  /** Optional label for the authorized signatory box */
  authorizedSignatoryLabel?: string
  company?: CompanyPrintInfo
  /** Document number / voucher reference shown on bottom metadata line */
  documentNumber?: string
  /** Optional custom print timestamp */
  printTimestamp?: string
  /** Show computer generated document disclaimer line */
  showComputerGeneratedDisclaimer?: boolean
  /** Custom signatures block override */
  customSignatures?: React.ReactNode
  className?: string
}

export function PrintFooter({
  terms,
  showBankDetails = false,
  bankDetailsOverride,
  verifiedByLabel = "Prepared / Verified By",
  authorizedSignatoryLabel,
  company = DEFAULT_TEJCO_COMPANY,
  documentNumber,
  printTimestamp,
  showComputerGeneratedDisclaimer = true,
  customSignatures,
  className = "",
}: PrintFooterProps) {
  const currentFormattedTime =
    printTimestamp ||
    new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const bankLines =
    bankDetailsOverride ||
    (company.bankDetails?.lines ? company.bankDetails.lines : [])

  const defaultAuthorizer =
    authorizedSignatoryLabel || `Authorized Signatory (FOR ${company.legalName || company.name})`

  return (
    <div
      className={`print-company-footer w-full pt-4 space-y-4 text-xs select-none ${className}`}
      style={{
        pageBreakInside: "avoid",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* ── Terms / Bank Details Section (Optional) ── */}
      {(terms && terms.length > 0 || (showBankDetails && bankLines.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t pt-3">
          {terms && terms.length > 0 && (
            <div className="border rounded-md p-3 bg-slate-50/50 space-y-1">
              <div className="font-bold text-[10px] uppercase tracking-wider text-slate-700">
                Terms &amp; Conditions:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                {terms.map((t, idx) => (
                  <li key={idx} className="leading-snug">{t}</li>
                ))}
              </ul>
            </div>
          )}

          {showBankDetails && bankLines.length > 0 && (
            <div className="border rounded-md p-3 bg-slate-50/50 space-y-1">
              <div className="font-bold text-[10px] uppercase tracking-wider text-blue-700">
                {company.bankDetails?.title || "Bank Details"}:
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                {bankLines.map((line, idx) => (
                  <div key={idx} className={idx === 0 ? "font-bold text-slate-800" : ""}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Signatures Row ── */}
      {customSignatures ? (
        customSignatures
      ) : (
        <div className="grid grid-cols-2 gap-8 pt-6 border-t mt-4">
          <div className="text-center space-y-12">
            <div className="h-8" />
            <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-600 font-medium">
              {verifiedByLabel}
            </div>
          </div>
          <div className="text-center space-y-12">
            <div className="h-8" />
            <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-800 font-semibold">
              {defaultAuthorizer}
            </div>
          </div>
        </div>
      )}

      {/* ── Document Bottom Bar / Metadata ── */}
      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-2 border-t">
        <div>
          {documentNumber && (
            <span className="font-mono font-medium">Doc Ref: {documentNumber}</span>
          )}
        </div>
        {showComputerGeneratedDisclaimer && (
          <div className="text-center italic">
            This is a computer-generated document.
          </div>
        )}
        <div>
          <span>Printed on: {currentFormattedTime}</span>
        </div>
      </div>
    </div>
  )
}
