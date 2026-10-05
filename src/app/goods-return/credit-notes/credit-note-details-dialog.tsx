import * as React from "react"
import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FileText,
  Calendar,
  Building,
  Hash,
  Package,
  Printer,
  X,
  CreditCard,
  UserCheck,
  AlertCircle,
  Eye,
} from "lucide-react"
import { PrintLayout, executePrint } from "@/components/common/print"
import type { CreditNote } from "./types"

interface CreditNoteDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditNote: CreditNote | null
  onPrint?: (creditNote: CreditNote) => void
}

const formatDateWithDots = (dateStr?: string) => {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}.${month}.${year}`
  } catch (e) {
    return dateStr
  }
}

export function CreditNoteDetailsDialog({
  open,
  onOpenChange,
  creditNote,
  onPrint,
}: CreditNoteDetailsDialogProps) {
  if (!creditNote) return null

  const items =
    creditNote.items && creditNote.items.length > 0
      ? creditNote.items
      : creditNote.selectedProducts || []

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Approved</Badge>
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none">Pending</Badge>
      case "processed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">Processed</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Rejected</Badge>
      default:
        return <Badge variant="outline">{status || "Pending"}</Badge>
    }
  }

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    executePrint(printRef.current, {
      documentTitle: `Credit Note - ${creditNote.creditNoteNumber}`,
      pageOrientation: "portrait",
    })
  }

  const formattedDate = formatDateWithDots(creditNote.createdAt)

  const totalCalculated = items.reduce(
    (acc, it) =>
      acc + (it.totalPrice ?? (Number(it.quantity || 0) * Number(it.unitPrice || 0))),
    0
  )
  const finalTotalAmount = Number(creditNote.totalCreditAmount || totalCalculated || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[90vw] max-h-[92vh] flex flex-col p-0 overflow-hidden print:max-w-none print:w-full print:h-auto print:border-none print:shadow-none print:m-0 print:p-0">
        {/* Screen Dialog Header (Hidden in Print) */}
        <DialogHeader className="p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50 flex flex-row items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {creditNote.creditNoteNumber}
                </DialogTitle>
                {getStatusBadge(creditNote.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Goods Return &amp; Credit Adjustment Voucher
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 shadow-sm bg-white"
            >
              <Printer className="h-4 w-4 text-amber-600" />
              Print Voucher
            </Button>
          </div>
        </DialogHeader>        {/* Dialog Body / Printable Layout */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <PrintLayout
              containerRef={printRef}
              documentTitle="CREDIT NOTE"
              documentSubtitle={`VOUCHER: ${creditNote.creditNoteNumber}`}
              footerProps={{
                documentNumber: creditNote.creditNoteNumber,
                showBankDetails: false,
                showComputerGeneratedDisclaimer: true,
                terms: [
                  "This credit note is valid against future purchases or invoice balance adjustments.",
                  "Goods returned have been received and inspected at warehouse facilities.",
                  "Please refer to Credit Note number in all corresponding accounting statements.",
                ],
                customSignatures: (
                  <div className="pt-6 border-t border-slate-300 mt-4 text-xs font-sans">
                    <div className="grid grid-cols-2 gap-8 items-end">
                      <div className="text-center">
                        <div className="h-10 border-b border-slate-300 w-48 mx-auto mb-1" />
                        <span className="text-[11px] text-slate-600 font-medium">
                          Verified By (Warehouse / Store In-Charge)
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="h-10 border-b border-slate-300 w-48 mx-auto mb-1" />
                        <span className="text-[11px] text-slate-600 font-medium">
                          Authorized Signatory (TEJCO GLOBAL LLP)
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              }}
            >
              <div className="p-2 space-y-5">
                {/* Document Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>CREDIT NOTE</span>
                      <span className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-base">
                        {creditNote.creditNoteNumber}
                      </span>
                    </h2>
                  </div>

                  <div className="text-right sm:text-right">
                    <div className="text-xs text-slate-500">Date Issued:</div>
                    <div className="font-bold text-slate-900 text-sm">{formattedDate}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Status: <span className="font-semibold text-slate-700">{creditNote.status}</span>
                    </div>
                  </div>
                </div>

                {/* Two-Column Information Box (From / Client Details & Linked Order) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                  {/* Client / Clinic Details */}
                  <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-4">
                    <div className="font-bold uppercase tracking-wider text-slate-600 text-[11px] flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-slate-500" />
                      Credit Issued To (Client):
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {creditNote.clientName || `Client #${creditNote.clientId}`}
                    </div>
                    <div className="text-slate-600">Client ID: #{creditNote.clientId}</div>
                    <div className="text-slate-500 text-[11px] italic">
                      The total amount below has been credited towards the account of this client.
                    </div>
                  </div>

                  {/* Sales Order Reference & Details */}
                  <div className="space-y-1.5 sm:pl-2">
                    <div className="font-bold uppercase tracking-wider text-slate-600 text-[11px] flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-slate-500" />
                      Reference &amp; Link Details:
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Sales Order Ref:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {creditNote.orderNumber || (creditNote.orderId ? `SO-${creditNote.orderId}` : "Direct Return")}
                      </span>
                    </div>
                    {creditNote.orderId ? (
                      <div className="flex justify-between items-center text-slate-600 text-[11px]">
                        <span>Original Order ID:</span>
                        <span>#{creditNote.orderId}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between items-center text-slate-600 text-[11px]">
                      <span>Credit Note ID:</span>
                      <span>#{creditNote.creditNoteId}</span>
                    </div>
                  </div>
                </div>

                {/* ══════════════ RETURNED PRODUCTS TABLE ══════════════ */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-slate-500" />
                      Goods Returned &amp; Credit Breakdown
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      {items.length} item{items.length === 1 ? "" : "s"} listed
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3 text-left w-[8%] border-r border-slate-200">Sr.</th>
                          <th className="py-2.5 px-3 text-left w-[40%] border-r border-slate-200">Product Description / SKU</th>
                          <th className="py-2.5 px-3 text-left w-[24%] border-r border-slate-200">Reason For Return</th>
                          <th className="py-2.5 px-3 text-center w-[8%] border-r border-slate-200">Qty</th>
                          <th className="py-2.5 px-3 text-right w-[10%] border-r border-slate-200">Rate (₹)</th>
                          <th className="py-2.5 px-3 text-right w-[10%]">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                              No individual line item details recorded on this voucher.
                            </td>
                          </tr>
                        ) : (
                          items.map((item, idx) => {
                            const lineTotal =
                              item.totalPrice ??
                              (Number(item.quantity || 0) * Number(item.unitPrice || 0))
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-100">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 border-r border-slate-100">
                                  <div className="font-bold text-slate-900 text-xs">
                                    {item.productName || `Product #${item.productId}`}
                                  </div>
                                  {item.variantName && (
                                    <div className="text-[11px] text-slate-600">
                                      Variant: {item.variantName}
                                    </div>
                                  )}
                                  {item.sku && (
                                    <div className="text-[10px] font-mono text-slate-400">
                                      SKU: {item.sku}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-slate-700">
                                  <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                                    {item.returnReason || "Customer Return"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-slate-900 border-r border-slate-100">
                                  {item.quantity}
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-700 border-r border-slate-100">
                                  {Number(item.unitPrice || 0).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                  {Number(lineTotal).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ══════════════ FINANCIAL SUMMARY & WORDS ══════════════ */}
                <div className="flex justify-end pt-2">
                  <div className="w-full sm:w-80 border border-amber-200 bg-amber-50/40 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span>Total Quantity Returned:</span>
                      <span className="font-bold text-slate-800">
                        {items.reduce((s, it) => s + (Number(it.quantity) || 0), 0) || 1} units
                      </span>
                    </div>
                    <div className="h-px bg-amber-200/60" />
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="font-bold text-sm text-slate-800">
                        Total Credit Amount:
                      </span>
                      <span className="text-xl font-extrabold text-amber-700 font-mono">
                        ₹{finalTotalAmount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </PrintLayout>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
