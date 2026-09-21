import React from "react"
import { PurchaseOrder, formatCurrency } from "../types"
import { Vendor } from "@/app/supply-chain/vendors/types"
import { Warehouse } from "@/app/supply-chain/warehouse/types"

export interface PurchaseOrderPrintSettings {
  showCompanyHeader?: boolean
  showSignatures?: boolean
  showNotes?: boolean
  showTerms?: boolean
}

export interface PurchaseOrderPrintDocumentProps {
  order: PurchaseOrder
  vendor?: Vendor | null
  warehouse?: Warehouse | null
  settings?: PurchaseOrderPrintSettings
  containerId?: string
}

export const TEJCO_COMPANY = {
  name: "TEJCO GLOBAL LLP",
  tagline: "Hair • Skin • Optics",
  gstin: "27AAUFT6646F1ZJ",
  pan: "AAUFT6646F",
  address: "Plot 14, Industrial Estate, Senapati Bapat Marg, Lower Parel (W), Mumbai - 400013, Maharashtra, India",
  email: "purchase@tejcoglobal.com",
  phone: "+91 22 2490 8899",
  website: "www.tejcoglobal.com",
  forLine: "FOR TEJCO GLOBAL LLP",
}

/** Convert a numeric amount into Indian Rupees in Words (e.g. "Rupees Forty-Two Thousand...") */
export function numberToWordsINR(amount: number): string {
  if (isNaN(amount) || amount === 0) return "Rupees Zero Only"

  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function convertTwoDigits(n: number): string {
    if (n === 0) return ""
    if (n < 10) return units[n]
    if (n < 20) return teens[n - 10]
    const unitDigit = n % 10
    return `${tens[Math.floor(n / 10)]}${unitDigit > 0 ? " " + units[unitDigit] : ""}`
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100)
    const rest = n % 100
    let str = ""
    if (hundred > 0) {
      str += `${units[hundred]} Hundred`
      if (rest > 0) str += " and "
    }
    if (rest > 0) {
      str += convertTwoDigits(rest)
    }
    return str
  }

  const rounded = Math.round(amount * 100) / 100
  const integerPart = Math.floor(rounded)
  const decimalPart = Math.round((rounded - integerPart) * 100)

  let crores = Math.floor(integerPart / 10000000)
  let remainder = integerPart % 10000000
  let lakhs = Math.floor(remainder / 100000)
  remainder = remainder % 100000
  let thousands = Math.floor(remainder / 1000)
  let hundreds = remainder % 1000

  let words = ""

  if (crores > 0) {
    words += `${convertThreeDigits(crores)} Crore `
  }
  if (lakhs > 0) {
    words += `${convertTwoDigits(lakhs)} Lakh `
  }
  if (thousands > 0) {
    words += `${convertTwoDigits(thousands)} Thousand `
  }
  if (hundreds > 0) {
    words += `${convertThreeDigits(hundreds)} `
  }

  words = words.trim()
  if (!words) words = "Zero"

  let result = `Rupees ${words}`
  if (decimalPart > 0) {
    result += ` and ${convertTwoDigits(decimalPart)} Paise`
  }
  result += " Only"

  return result
}

export function PurchaseOrderPrintDocument({
  order,
  vendor,
  warehouse,
  settings = {
    showCompanyHeader: true,
    showSignatures: true,
    showNotes: true,
    showTerms: true,
  },
  containerId = "purchase-order-print-root",
}: PurchaseOrderPrintDocumentProps) {
  const vendorDisplayName =
    order.vendorName ||
    vendor?.name ||
    (vendor as any)?.vendorName ||
    `Vendor #${order.vendorId}`

  const currency = order.currencyType || "INR"

  // Calculations
  const calculatedSubtotal =
    order.subtotal ||
    (order.lineItems || []).reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice - (item.discountAmount || 0)),
      0
    )

  const calculatedTax = Number(order.gstAmount || 0)
  const calculatedTotal = Number(order.totalAmount || calculatedSubtotal + calculatedTax)

  // GST Breakdown (assume 50/50 CGST & SGST if not inter-state)
  const halfTax = calculatedTax / 2

  const formattedOrderDate = order.orderDate
    ? new Date(order.orderDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—"

  const formattedDeliveryDate = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Immediate / As agreed"

  const printTime = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div
      id={containerId}
      className="po-print-sheet bg-white text-slate-900 mx-auto"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "0",
        boxSizing: "border-box",
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
        color: "#1e293b",
        fontSize: "12px",
        lineHeight: "1.4",
        position: "relative",
        background: "#ffffff",
      }}
    >
      {/* ──────────────── TEJCO CORPORATE HEADER ──────────────── */}
      {settings.showCompanyHeader && (
        <div
          className="header-zone"
          style={{
            position: "relative",
            width: "100%",
            height: "105px",
            overflow: "hidden",
            flexShrink: 0,
            background: "#505052",
          }}
        >
          {/* White logo zone — diagonal clip */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "240px",
              height: "86px",
              background: "#ffffff",
              clipPath: "polygon(0 0, 82% 0, 100% 100%, 0 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: "10px",
            }}
          >
            <img
              src="/assets/images/tejco_sidebar_logo.png"
              alt="Tejco Logo"
              style={{
                height: "48px",
                width: "auto",
                objectFit: "contain",
                marginLeft: "-24px",
              }}
            />
            <div
              style={{
                fontSize: "7.5px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#505052",
                marginLeft: "-24px",
                marginTop: "3px",
                fontWeight: 600,
                fontFamily: "Verdana, sans-serif",
              }}
            >
              {TEJCO_COMPANY.tagline}
            </div>
          </div>

          {/* Red diagonal slash */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "195px",
              width: "58px",
              height: "86px",
              background: "#d9232a",
              clipPath: "polygon(38% 0, 100% 0, 62% 100%, 0 100%)",
            }}
          />

          {/* Company name & PO Title in dark grey area */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              left: "230px",
              height: "86px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingRight: "24px",
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                fontFamily: "'Segoe UI', Calibri, Arial, sans-serif",
              }}
            >
              {TEJCO_COMPANY.name}
            </span>
            <span
              style={{
                color: "#fca5a5",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginTop: "2px",
              }}
            >
              OFFICIAL PURCHASE ORDER
            </span>
          </div>

          {/* Red horizontal stripe */}
          <div
            style={{
              position: "absolute",
              top: "86px",
              left: 0,
              right: 0,
              height: "10px",
              background: "#d9232a",
            }}
          />

          {/* Light grey stripe below red */}
          <div
            style={{
              position: "absolute",
              top: "96px",
              left: 0,
              right: 0,
              height: "9px",
              background: "#e2e8f0",
            }}
          />
        </div>
      )}

      {/* ──────────────── DOCUMENT BODY ──────────────── */}
      <div style={{ padding: "16px 24px 20px 24px" }}>
        {/* Document Title & Meta Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            border: "1.5px solid #cbd5e1",
            borderRadius: "4px",
            overflow: "hidden",
            marginBottom: "14px",
            background: "#ffffff",
          }}
        >
          {/* Left: PO Number & Status */}
          <div
            style={{
              padding: "10px 14px",
              borderRight: "1.5px solid #cbd5e1",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#64748b",
                }}
              >
                Purchase Order No:
              </span>
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  fontFamily: "monospace",
                  color: "#0f172a",
                }}
              >
                {order.orderNumber}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px" }}>
              <span>
                <strong style={{ color: "#475569" }}>Status:</strong>{" "}
                <span
                  style={{
                    display: "inline-block",
                    padding: "1px 6px",
                    borderRadius: "3px",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  {order.orderStatus || "Pending"}
                </span>
              </span>
              <span>
                <strong style={{ color: "#475569" }}>Payment:</strong>{" "}
                <span style={{ color: "#0f172a", fontWeight: 600 }}>
                  {order.paymentStatus || "Pending"}
                </span>
              </span>
            </div>
          </div>

          {/* Right: Dates & Tejco GSTIN */}
          <div
            style={{
              padding: "10px 14px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
              fontSize: "11px",
              background: "#f8fafc",
            }}
          >
            <div>
              <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                PO Issue Date
              </div>
              <div style={{ fontWeight: 700, color: "#0f172a", marginTop: "1px" }}>
                {formattedOrderDate}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Expected Delivery
              </div>
              <div style={{ fontWeight: 700, color: "#0f172a", marginTop: "1px" }}>
                {formattedDeliveryDate}
              </div>
            </div>
            <div style={{ gridColumn: "span 2", borderTop: "1px dashed #cbd5e1", paddingTop: "4px", marginTop: "2px" }}>
              <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>TEJCO GSTIN: </span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                {TEJCO_COMPANY.gstin}
              </span>
            </div>
          </div>
        </div>

        {/* ──────────────── ADDRESSES SECTION (3-Grid / 2-Grid) ──────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          {/* Vendor / Supplier Box */}
          <div
            style={{
              border: "1.5px solid #cbd5e1",
              borderRadius: "4px",
              overflow: "hidden",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                background: "#0f172a",
                color: "#ffffff",
                padding: "5px 10px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Vendor / Supplier Details</span>
              {order.vendorId ? (
                <span style={{ fontFamily: "monospace", opacity: 0.8 }}>ID: #{order.vendorId}</span>
              ) : null}
            </div>
            <div style={{ padding: "10px", fontSize: "11px", lineHeight: "1.5" }}>
              <div style={{ fontWeight: 800, fontSize: "13px", color: "#0f172a", marginBottom: "3px" }}>
                {vendorDisplayName}
              </div>
              {(vendor?.gstin || (vendor as any)?.GSTIN) && (
                <div style={{ color: "#334155", marginBottom: "2px" }}>
                  <strong style={{ color: "#0f172a" }}>GSTIN:</strong>{" "}
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {vendor?.gstin || (vendor as any)?.GSTIN}
                  </span>
                </div>
              )}
              {vendor?.contactPerson && (
                <div style={{ color: "#334155" }}>
                  <strong>Contact Person:</strong> {vendor.contactPerson}
                </div>
              )}
              {vendor?.phone && (
                <div style={{ color: "#334155" }}>
                  <strong>Phone:</strong> {vendor.phone}
                </div>
              )}
              {vendor?.email && (
                <div style={{ color: "#334155" }}>
                  <strong>Email:</strong> {vendor.email}
                </div>
              )}
              {(vendor?.address || order.billingAddress) && (
                <div style={{ color: "#475569", marginTop: "3px", fontSize: "10.5px" }}>
                  <strong>Address:</strong> {vendor?.address || order.billingAddress}
                </div>
              )}
            </div>
          </div>

          {/* Ship To / Warehouse Box */}
          <div
            style={{
              border: "1.5px solid #cbd5e1",
              borderRadius: "4px",
              overflow: "hidden",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                background: "#0f172a",
                color: "#ffffff",
                padding: "5px 10px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Ship To / Delivery Destination</span>
              {warehouse?.id && (
                <span style={{ fontFamily: "monospace", opacity: 0.8 }}>ID: #{warehouse.id}</span>
              )}
            </div>
            <div style={{ padding: "10px", fontSize: "11px", lineHeight: "1.5" }}>
              <div style={{ fontWeight: 800, fontSize: "13px", color: "#0f172a", marginBottom: "3px" }}>
                {warehouse?.name || "Tejco Central Facility"}
              </div>
              <div style={{ color: "#475569", fontSize: "10.5px", marginBottom: "4px" }}>
                <strong>Delivery Address:</strong>{" "}
                {order.shippingAddress || (warehouse as any)?.address?.street || TEJCO_COMPANY.address}
              </div>
              {warehouse?.contactPerson && (
                <div style={{ color: "#334155" }}>
                  <strong>Site Contact:</strong> {warehouse.contactPerson}
                </div>
              )}
              {warehouse?.contactNumber && (
                <div style={{ color: "#334155" }}>
                  <strong>Contact Phone:</strong> {warehouse.contactNumber}
                </div>
              )}
              <div style={{ color: "#64748b", marginTop: "4px", fontSize: "10px", fontStyle: "italic" }}>
                * Receiving Hours: Mon - Sat (10:00 AM - 6:00 PM)
              </div>
            </div>
          </div>
        </div>

        {/* ──────────────── LINE ITEMS TABLE ──────────────── */}
        <div
          style={{
            border: "1.5px solid #0f172a",
            borderRadius: "4px",
            overflow: "hidden",
            marginBottom: "14px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                <th style={{ padding: "7px 8px", width: "32px", textAlign: "center", borderRight: "1px solid #334155" }}>
                  #
                </th>
                <th style={{ padding: "7px 10px", borderRight: "1px solid #334155" }}>
                  Product / Item Description
                </th>
                <th style={{ padding: "7px 8px", width: "100px", borderRight: "1px solid #334155" }}>
                  SKU / Code
                </th>
                <th style={{ padding: "7px 8px", width: "55px", textAlign: "center", borderRight: "1px solid #334155" }}>
                  Qty
                </th>
                <th style={{ padding: "7px 8px", width: "85px", textAlign: "right", borderRight: "1px solid #334155" }}>
                  Unit Rate ({currency === "INR" ? "₹" : currency})
                </th>
                <th style={{ padding: "7px 8px", width: "70px", textAlign: "right", borderRight: "1px solid #334155" }}>
                  Discount
                </th>
                <th style={{ padding: "7px 10px", width: "95px", textAlign: "right" }}>
                  Amount ({currency === "INR" ? "₹" : currency})
                </th>
              </tr>
            </thead>
            <tbody>
              {order.lineItems && order.lineItems.length > 0 ? (
                order.lineItems.map((item, idx) => {
                  const hasDiscount = Number(item.discountAmount || 0) > 0
                  return (
                    <tr
                      key={item.orderItemId || idx}
                      style={{
                        borderBottom: "1px solid #cbd5e1",
                        background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                      }}
                    >
                      <td
                        style={{
                          padding: "8px 6px",
                          textAlign: "center",
                          verticalAlign: "top",
                          fontWeight: 600,
                          color: "#64748b",
                          borderRight: "1px solid #e2e8f0",
                        }}
                      >
                        {idx + 1}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          verticalAlign: "top",
                          borderRight: "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "11.5px" }}>
                          {item.productName || `Product #${item.productId}`}
                        </div>
                        {item.variantName && item.variantName !== "Standard" && (
                          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "1px" }}>
                            Specification / Variant: <strong>{item.variantName}</strong>
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          verticalAlign: "top",
                          fontFamily: "monospace",
                          fontSize: "10.5px",
                          color: "#334155",
                          borderRight: "1px solid #e2e8f0",
                        }}
                      >
                        {item.sku || "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          verticalAlign: "top",
                          fontWeight: 700,
                          color: "#0f172a",
                          borderRight: "1px solid #e2e8f0",
                        }}
                      >
                        {item.quantity} <span style={{ fontSize: "9.5px", fontWeight: 400, color: "#64748b" }}>PCS</span>
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          textAlign: "right",
                          verticalAlign: "top",
                          fontWeight: 500,
                          borderRight: "1px solid #e2e8f0",
                        }}
                      >
                        {Number(item.unitPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          textAlign: "right",
                          verticalAlign: "top",
                          color: hasDiscount ? "#dc2626" : "#94a3b8",
                          fontSize: "10px",
                          borderRight: "1px solid #e2e8f0",
                        }}
                      >
                        {hasDiscount ? (
                          <div>
                            <div>-₹{Number(item.discountAmount).toLocaleString("en-IN")}</div>
                            {item.discountPercentage ? <div>({item.discountPercentage}%)</div> : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          textAlign: "right",
                          verticalAlign: "top",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {Number(item.totalPrice || item.quantity * item.unitPrice).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                    No procurement items specified.
                  </td>
                </tr>
              )}

              {/* Pad empty rows if fewer than 2 items for nice height on print */}
              {order.lineItems && order.lineItems.length < 2 && (
                <tr style={{ height: "30px", borderBottom: "1px solid #e2e8f0" }}>
                  <td colSpan={7}>&nbsp;</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ──────────────── TOTALS & AMOUNT IN WORDS ──────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "14px",
            marginBottom: "16px",
          }}
        >
          {/* Left: Amount in words & Buyer ID */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <div
              style={{
                border: "1.5px solid #cbd5e1",
                borderRadius: "4px",
                padding: "10px 12px",
                background: "#f8fafc",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#64748b",
                  letterSpacing: "0.06em",
                  marginBottom: "3px",
                }}
              >
                Total Purchase Order Amount (In Words):
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: "1.4",
                }}
              >
                {numberToWordsINR(calculatedTotal)}
              </div>
            </div>

            {/* Buyer Identification */}
            <div
              style={{
                fontSize: "10px",
                color: "#64748b",
                padding: "6px 8px",
                background: "#ffffff",
                border: "1px dashed #cbd5e1",
                borderRadius: "4px",
              }}
            >
              <strong>Buyer Entity:</strong> {TEJCO_COMPANY.name} | PAN: {TEJCO_COMPANY.pan} | GSTIN: {TEJCO_COMPANY.gstin}
            </div>
          </div>

          {/* Right: Detailed Cost Summary Table */}
          <div
            style={{
              border: "1.5px solid #0f172a",
              borderRadius: "4px",
              overflow: "hidden",
              background: "#ffffff",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "6px 10px", color: "#475569" }}>Taxable Subtotal</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                    {formatCurrency(calculatedSubtotal, currency)}
                  </td>
                </tr>

                {calculatedTax > 0 ? (
                  <>
                    <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                      <td style={{ padding: "5px 10px", color: "#64748b", fontSize: "10.5px" }}>
                        CGST (Central Tax)
                      </td>
                      <td style={{ padding: "5px 10px", textAlign: "right", color: "#334155", fontSize: "10.5px" }}>
                        {formatCurrency(halfTax, currency)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                      <td style={{ padding: "5px 10px", color: "#64748b", fontSize: "10.5px" }}>
                        SGST / UTGST (State Tax)
                      </td>
                      <td style={{ padding: "5px 10px", textAlign: "right", color: "#334155", fontSize: "10.5px" }}>
                        {formatCurrency(halfTax, currency)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "6px 10px", color: "#475569", fontWeight: 600 }}>Total GST Amount</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                        {formatCurrency(calculatedTax, currency)}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "6px 10px", color: "#64748b" }}>GST / Tax</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", color: "#64748b" }}>₹0.00</td>
                  </tr>
                )}

                {/* Grand Total Row */}
                <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 800, fontSize: "12px", letterSpacing: "0.04em" }}>
                    GRAND TOTAL
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      textAlign: "right",
                      fontWeight: 800,
                      fontSize: "14px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {formatCurrency(calculatedTotal, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ──────────────── NOTES & TERMS ──────────────── */}
        {(settings.showNotes && order.orderNotes) || settings.showTerms ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: order.orderNotes && settings.showNotes ? "1fr 1fr" : "1fr",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {settings.showNotes && order.orderNotes && (
              <div
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#475569",
                    marginBottom: "4px",
                    letterSpacing: "0.06em",
                  }}
                >
                  Order Notes & Instructions:
                </div>
                <div style={{ fontSize: "10px", color: "#334155", whiteSpace: "pre-line", lineHeight: "1.4" }}>
                  {order.orderNotes}
                </div>
              </div>
            )}

            {settings.showTerms && (
              <div
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#475569",
                    marginBottom: "4px",
                    letterSpacing: "0.06em",
                  }}
                >
                  Standard Procurement Terms:
                </div>
                <div
                  style={{
                    fontSize: "9.5px",
                    color: "#475569",
                    lineHeight: "1.4",
                    whiteSpace: "pre-line",
                  }}
                >
                  {order.termsAndConditions ||
                    "1. Goods received are subject to quality inspection & count verification.\n2. Invoice and Delivery Challan referencing this PO number must accompany the consignment.\n3. Defective, damaged or non-compliant materials will be returned at supplier's expense.\n4. Disputes subject to Mumbai jurisdiction only."}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* ──────────────── SIGNATURE BLOCKS ──────────────── */}
        {settings.showSignatures && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              border: "1.5px solid #0f172a",
              borderRadius: "4px",
              minHeight: "105px",
              marginBottom: "12px",
              background: "#ffffff",
            }}
          >
            {/* Left: Vendor Acknowledgment */}
            <div
              style={{
                padding: "10px 14px",
                borderRight: "1.5px solid #cbd5e1",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#334155" }}>
                SUPPLIER ACKNOWLEDGEMENT & ACCEPTANCE
              </div>
              <div style={{ fontSize: "9.5px", color: "#64748b" }}>
                Sign & Stamp with confirmed delivery date:
              </div>
              <div style={{ borderTop: "1px dashed #94a3b8", paddingTop: "4px", marginTop: "32px", display: "flex", justifyContent: "space-between", fontSize: "9.5px", color: "#64748b" }}>
                <span>Authorized Signatory & Stamp</span>
                <span>Date: ____________</span>
              </div>
            </div>

            {/* Right: Tejco Authorized Signatory */}
            <div
              style={{
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>
                {TEJCO_COMPANY.forLine}
              </div>
              <div style={{ fontSize: "9.5px", color: "#64748b" }}>
                Procurement & Supply Chain Division
              </div>
              <div style={{ borderTop: "1.5px solid #0f172a", paddingTop: "4px", marginTop: "32px", display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 700, color: "#0f172a" }}>
                <span style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  AUTHORIZED SIGNATORY
                </span>
                <span style={{ fontWeight: 500, color: "#64748b" }}>Tejco Global LLP</span>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────── FOOTER NOTICE ──────────────── */}
        <div
          style={{
            borderTop: "1px solid #e2e8f0",
            paddingTop: "6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "9px",
            color: "#94a3b8",
          }}
        >
          <span>This is a computer-generated Purchase Order issued by Tejco Global LLP.</span>
          <span>Printed on: {printTime}</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  )
}
