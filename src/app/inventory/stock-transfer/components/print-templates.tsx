import * as React from "react"
import { StockTransfer } from "../types"
import { PrintLayout } from "@/components/common/print"
import { DEFAULT_TEJCO_COMPANY } from "@/components/common/print/company-config"

interface PrintTemplateProps {
  transfer: StockTransfer
  containerRef?: React.RefObject<HTMLDivElement | null>
}

const formatDateWithDots = (dateStr?: string) => {
  if (!dateStr) return "N/A"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}.${month}.${year}`
  } catch {
    return dateStr
  }
}

export function DeliveryChallan({ transfer, containerRef }: PrintTemplateProps) {
  const totalQuantity = (transfer.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  )

  return (
    <PrintLayout
      containerRef={containerRef}
      documentTitle="DELIVERY CHALLAN"
      documentSubtitle={`REF: ${transfer.transferId}`}
      pageOrientation="portrait"
      footerProps={{
        documentNumber: transfer.transferId,
        showBankDetails: false,
        showComputerGeneratedDisclaimer: true,
        terms: [
          "Goods covered by this Delivery Challan are for internal branch / warehouse stock movement only and not for commercial sale.",
          "The receiving warehouse in-charge must verify item description, batch, and physical quantity upon receipt.",
          "Any transit discrepancy, physical breakage, or shortage must be endorsed on this document immediately.",
        ],
        customSignatures: (
          <div className="pt-6 border-t border-slate-300 mt-4 text-xs font-sans">
            <div className="grid grid-cols-2 gap-8 items-end">
              <div className="text-center">
                <div className="h-10 border-b border-slate-300 w-48 mx-auto mb-1" />
                <span className="text-[11px] text-slate-600 font-medium">
                  Receiver's Signature (Name &amp; Date)
                </span>
              </div>
              <div className="text-center">
                <div className="h-10 border-b border-slate-300 w-48 mx-auto mb-1" />
                <span className="text-[11px] text-slate-700 font-semibold">
                  Authorized Signatory (FOR {DEFAULT_TEJCO_COMPANY.legalName || DEFAULT_TEJCO_COMPANY.name})
                </span>
              </div>
            </div>
          </div>
        ),
      }}
    >
      {/* ── Metadata & Routing Box ── */}
      <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
        <div className="grid grid-cols-2 divide-x divide-slate-300 bg-white">
          {/* Left Column: Dispatch & Deliver Details */}
          <div className="p-3 space-y-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                Dispatch From (Source Location):
              </div>
              <div className="font-bold text-sm text-slate-900">
                {transfer.sourceWarehouseName || `Warehouse #${transfer.sourceWarehouseId}`}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Storage / Bay: <span className="font-semibold text-slate-800">{transfer.sourceStorageId || "General Storage"}</span>
              </div>
              <div className="text-[10px] text-slate-400 italic mt-0.5">
                Authorized dispatch origin facility
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                Deliver To (Destination Location):
              </div>
              <div className="font-bold text-sm text-slate-900">
                {transfer.destinationWarehouseName || `Warehouse #${transfer.destinationWarehouseId}`}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Storage / Bay: <span className="font-semibold text-slate-800">{transfer.destinationStorageId || "General Storage"}</span>
              </div>
              <div className="text-[10px] text-slate-400 italic mt-0.5">
                Designated receiving warehouse
              </div>
            </div>
          </div>

          {/* Right Column: Challan & Movement Metadata */}
          <div className="p-3 space-y-2 bg-slate-50/60">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Challan No:</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {transfer.transferId}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Challan Date:</span>
              <span className="font-bold text-slate-900">
                {formatDateWithDots(transfer.date)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Movement Status:</span>
              <span className="font-semibold text-slate-900 uppercase">
                {transfer.status}
              </span>
            </div>
            {transfer.reason && (
              <div className="pt-1.5 border-t border-slate-200">
                <span className="text-slate-500 font-medium text-[10px] uppercase block">
                  Transfer Reason:
                </span>
                <span className="text-slate-800 font-medium italic text-[11px]">
                  {transfer.reason}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes banner if present */}
      {transfer.notes && (
        <div className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
          <span className="font-bold uppercase text-[10px] text-slate-500 mr-2">Additional Instructions:</span>
          {transfer.notes}
        </div>
      )}

      {/* ── Products Tabular Format ── */}
      <div className="border border-slate-200 rounded-md overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-800 font-semibold border-b border-slate-200">
              <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200">Sr.</th>
              <th className="py-2.5 px-3 text-left border-r border-slate-200">Description of Goods</th>
              <th className="py-2.5 px-3 text-left w-36 border-r border-slate-200">SKU / Variant</th>
              <th className="py-2.5 px-3 text-right w-24 border-r border-slate-200">Quantity</th>
              <th className="py-2.5 px-3 text-center w-20">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transfer.items.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-100 font-medium">
                  {index + 1}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-100 font-medium text-slate-900">
                  <div className="font-bold text-xs">{item.productName}</div>
                  {(item.variantName || item.size) && (
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {item.variantName || item.size}
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-[11px] text-slate-600">
                  {item.sku || "—"}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-100 text-right font-bold text-slate-900">
                  {item.quantity}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                  {item.unit || "pcs"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200">
            <tr>
              <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[11px] text-slate-700 border-r border-slate-200">
                Total Quantity:
              </td>
              <td className="py-2.5 px-3 text-right text-slate-900 text-sm font-bold border-r border-slate-200">
                {totalQuantity}
              </td>
              <td className="py-2.5 px-3 text-center text-[11px] text-slate-500">
                Items
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </PrintLayout>
  )
}

export function GatePass({ transfer, containerRef }: PrintTemplateProps) {
  const totalQuantity = (transfer.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  )

  return (
    <PrintLayout
      containerRef={containerRef}
      documentTitle="SECURITY GATE PASS"
      documentSubtitle="MATERIAL OUTWARD PERMIT"
      pageOrientation="portrait"
      footerProps={{
        documentNumber: transfer.transferId,
        showBankDetails: false,
        showComputerGeneratedDisclaimer: true,
        terms: [
          "Security gate pass is mandatory for all vehicles carrying material leaving warehouse premises.",
          "Security personnel must inspect physical goods against the line items listed on this pass.",
          "Vehicle details, driver identity, and time of departure must be verified before outward authorization.",
        ],
        customSignatures: (
          <div className="pt-6 border-t border-slate-300 mt-4 text-xs font-sans">
            <div className="grid grid-cols-2 gap-8 items-end">
              <div className="text-center">
                <div className="h-10 border-b border-slate-300 w-48 mx-auto mb-1" />
                <span className="text-[11px] text-slate-600 font-medium">
                  Store In-Charge Signature
                </span>
              </div>
              <div className="text-center">
                <div className="h-10 border-b border-slate-300 w-48 mx-auto mb-1" />
                <span className="text-[11px] text-slate-700 font-semibold">
                  Security Personnel Signature &amp; Stamp
                </span>
              </div>
            </div>
          </div>
        ),
      }}
    >
      {/* ── Movement Particulars ── */}
      <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
        <div className="grid grid-cols-2 divide-x divide-slate-300 bg-white">
          <div className="p-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Transfer Routing
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Outward From:</span>
              <span className="font-bold text-sm text-slate-900">
                {transfer.sourceWarehouseName || `Warehouse #${transfer.sourceWarehouseId}`}
              </span>
            </div>
            <div className="pt-1 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase block">Consigned To:</span>
              <span className="font-bold text-sm text-slate-900">
                {transfer.destinationWarehouseName || `Warehouse #${transfer.destinationWarehouseId}`}
              </span>
            </div>
          </div>

          <div className="p-3 space-y-2 bg-slate-50/60">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Transfer Ref:</span>
              <span className="font-mono font-bold text-slate-900">{transfer.transferId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Issue Date:</span>
              <span className="font-bold text-slate-900">
                {formatDateWithDots(transfer.date)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Purpose:</span>
              <span className="font-medium text-slate-800 italic">{transfer.reason || "Internal Stock Movement"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Total Packages/Units:</span>
              <span className="font-bold text-slate-900">{totalQuantity} units ({transfer.items.length} items)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Transport / Vehicle Details Form Box ── */}
      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 text-xs space-y-3">
        <div className="font-bold text-[10px] uppercase tracking-wider text-slate-700">
          Transport &amp; Carrier Verification:
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="border-b border-slate-300 pb-1">
            <span className="text-[10px] uppercase text-slate-500 block">Vehicle Number:</span>
            <span className="h-5 block"></span>
          </div>
          <div className="border-b border-slate-300 pb-1">
            <span className="text-[10px] uppercase text-slate-500 block">Driver Name:</span>
            <span className="h-5 block"></span>
          </div>
          <div className="border-b border-slate-300 pb-1">
            <span className="text-[10px] uppercase text-slate-500 block">Driver Contact No:</span>
            <span className="h-5 block"></span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="border-b border-slate-300 pb-1">
            <span className="text-[10px] uppercase text-slate-500 block">Time of Outward Dispatch:</span>
            <span className="h-5 block"></span>
          </div>
          <div className="border-b border-slate-300 pb-1">
            <span className="text-[10px] uppercase text-slate-500 block">Gate Pass Pass-Through Check:</span>
            <span className="h-5 block text-slate-400 italic text-[10px]">Verified [ &nbsp; ] Ok</span>
          </div>
        </div>
      </div>

      {/* ── Products List Summary ── */}
      <div className="border border-slate-200 rounded-md overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-800 font-semibold border-b border-slate-200">
              <th className="py-2 px-3 text-center w-12 border-r border-slate-200">#</th>
              <th className="py-2 px-3 text-left border-r border-slate-200">Item Name</th>
              <th className="py-2 px-3 text-left w-36 border-r border-slate-200">SKU</th>
              <th className="py-2 px-3 text-right w-24 border-r border-slate-200">Quantity</th>
              <th className="py-2 px-3 text-center w-20">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transfer.items.map((item, index) => (
              <tr key={item.id || index}>
                <td className="py-2 px-3 text-center text-slate-500 border-r border-slate-100 font-medium">
                  {index + 1}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 font-medium text-slate-900">
                  <div>{item.productName}</div>
                  {(item.variantName || item.size) && (
                    <div className="text-[10px] text-slate-400">{item.variantName || item.size}</div>
                  )}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 font-mono text-[11px] text-slate-600">
                  {item.sku || "—"}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-slate-900">
                  {item.quantity}
                </td>
                <td className="py-2 px-3 text-center text-slate-600 font-medium">
                  {item.unit || "pcs"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200">
            <tr>
              <td colSpan={3} className="py-2 px-3 text-right uppercase text-[11px] text-slate-700 border-r border-slate-200">
                Total Units Dispatched:
              </td>
              <td className="py-2 px-3 text-right text-slate-900 text-sm font-bold border-r border-slate-200">
                {totalQuantity}
              </td>
              <td className="py-2 px-3 text-center text-[11px] text-slate-500">
                Total
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </PrintLayout>
  )
}
