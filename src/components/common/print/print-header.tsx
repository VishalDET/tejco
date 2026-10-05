import React from "react"
import { CompanyPrintInfo, DEFAULT_TEJCO_COMPANY } from "./company-config"

export interface PrintHeaderProps {
  /** Document title displayed on the right banner, e.g. "TAX INVOICE", "SALES ORDER", "CREDIT NOTE" */
  documentTitle?: string
  /** Subtitle or document category, e.g. "GOODS RETURN VOUCHER" */
  documentSubtitle?: string
  /** Company details override. Defaults to Tejco standard profile */
  company?: CompanyPrintInfo
  /** Optional custom right-side content instead of default title banner */
  rightContent?: React.ReactNode
  /** Height of the header banner in pixels. Defaults to 105 */
  height?: number
  className?: string
}

export function PrintHeader({
  documentTitle,
  documentSubtitle,
  company = DEFAULT_TEJCO_COMPANY,
  rightContent,
  height = 105,
  className = "",
}: PrintHeaderProps) {
  const barHeight = height - 19 // White / dark banner section height before accent stripes
  const logo = company.logoUrl || "/assets/images/tejco_sidebar_logo.png"

  return (
    <div
      className={`print-company-header select-none ${className}`}
      style={{
        position: "relative",
        width: "100%",
        height: `${height}px`,
        overflow: "hidden",
        flexShrink: 0,
        background: "#505052",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* ── 1. White Diagonal Zone for Logo & Tagline ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "240px",
          height: `${barHeight}px`,
          background: "#ffffff",
          clipPath: "polygon(0 0, 82% 0, 100% 100%, 0 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <img
          src={logo}
          alt={company.name}
          style={{
            height: "48px",
            width: "auto",
            objectFit: "contain",
            marginLeft: "-24px",
          }}
        />
        {company.tagline && (
          <div
            style={{
              fontSize: "7px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#505052",
              marginLeft: "-24px",
              marginTop: "3px",
              fontWeight: 600,
              fontFamily: "Verdana, sans-serif",
            }}
          >
            {company.tagline}
          </div>
        )}
      </div>

      {/* ── 2. Red Diagonal Slash ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "195px",
          width: "58px",
          height: `${barHeight}px`,
          background: "#d9232a",
          clipPath: "polygon(38% 0, 100% 0, 62% 100%, 0 100%)",
          zIndex: 1,
        }}
      />

      {/* ── 3. Corporate Title & Document Type on Dark Gray ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          left: "230px",
          height: `${barHeight}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingRight: "22px",
          zIndex: 2,
        }}
      >
        {rightContent ? (
          rightContent
        ) : (
          <>
            <div
              style={{
                color: "white",
                fontSize: "20px",
                fontWeight: "bold",
                letterSpacing: "0.06em",
                fontFamily: "Calibri, Arial, sans-serif",
                lineHeight: 1.2,
                textAlign: "right",
              }}
            >
              {company.legalName || company.name}
            </div>
            {documentTitle && (
              <div
                style={{
                  color: "#fecdd3",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  marginTop: "3px",
                }}
              >
                {documentTitle}
              </div>
            )}
            {documentSubtitle && (
              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginTop: "1px",
                }}
              >
                {documentSubtitle}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 4. Red Stripe Accent ── */}
      <div
        style={{
          position: "absolute",
          top: `${barHeight}px`,
          left: 0,
          right: 0,
          height: "10px",
          background: "#d9232a",
        }}
      />

      {/* ── 5. Light Gray Accent Stripe ── */}
      <div
        style={{
          position: "absolute",
          top: `${barHeight + 10}px`,
          left: 0,
          right: 0,
          height: "9px",
          background: "#e6e6e6",
        }}
      />
    </div>
  )
}
