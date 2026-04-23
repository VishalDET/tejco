import * as React from "react"
import { StockTransfer } from "../types"
import { cn } from "@/lib/utils"

interface PrintTemplateProps {
  transfer: StockTransfer
}

export function DeliveryChallan({ transfer }: PrintTemplateProps) {
  return (
    <div className="p-8 bg-white text-black min-h-[297mm] w-[210mm] border shadow-sm mx-auto print:shadow-none print:border-none">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-blue-900">TEJCO</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Medical Systems Pvt. Ltd.</p>
          <div className="mt-4 text-xs space-y-1">
            <p>A-12, Industrial Estate, Phase II</p>
            <p>Pune, Maharashtra - 411013</p>
            <p>GSTIN: 27AAAAA0000A1Z5</p>
            <p>Contact: +91 20 1234 5678 | info@tejco.com</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold uppercase border-b border-black pb-1 mb-4">Delivery Challan</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="font-bold">Challan No:</span>
            <span>{transfer.transferId}</span>
            <span className="font-bold">Date:</span>
            <span>{new Date(transfer.date).toLocaleDateString("en-GB")}</span>
            <span className="font-bold">Status:</span>
            <span className="uppercase">{transfer.status}</span>
          </div>
        </div>
      </div>

      {/* Routing Info */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b pb-1">Dispatch From (Source)</h3>
          <div className="text-sm">
            <p className="font-bold text-lg">{transfer.sourceWarehouseId}</p>
            <p className="text-slate-600">Storage: {transfer.sourceStorageId}</p>
            <p className="mt-2 italic text-xs text-slate-400">Authorized warehouse location</p>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b pb-1">Deliver To (Destination)</h3>
          <div className="text-sm">
            <p className="font-bold text-lg">{transfer.destinationWarehouseId}</p>
            <p className="text-slate-600">Storage: {transfer.destinationStorageId}</p>
            <p className="mt-2 italic text-xs text-slate-400">Intended final destination</p>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="mb-8 p-3 bg-slate-50 border border-slate-200 rounded text-sm italic text-slate-600">
        <span className="font-bold uppercase not-italic mr-2">Reason for Transfer:</span>
        {transfer.reason}
      </div>

      {/* Items Table */}
      <table className="w-full text-left border-collapse border border-black mb-10">
        <thead>
          <tr className="bg-slate-100 uppercase text-[10px] font-bold">
            <th className="border border-black p-3 w-12 text-center">Sr.</th>
            <th className="border border-black p-3">Description of Goods</th>
            <th className="border border-black p-3 w-32">SKU / Batches</th>
            <th className="border border-black p-3 w-20 text-center">Qty</th>
            <th className="border border-black p-3 w-20">Unit</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {transfer.items.map((item, index) => (
            <tr key={item.id}>
              <td className="border border-black p-3 text-center">{index + 1}</td>
              <td className="border border-black p-3">
                <p className="font-bold">{item.productName}</p>
                <p className="text-[10px] text-slate-500 italic">Medical Grade Standard</p>
              </td>
              <td className="border border-black p-3 font-mono text-xs">{item.sku}</td>
              <td className="border border-black p-3 text-center font-bold">{item.quantity}</td>
              <td className="border border-black p-3">{item.unit}</td>
            </tr>
          ))}
          {/* Fill remaining space to maintain height */}
          {Array.from({ length: Math.max(0, 10 - transfer.items.length) }).map((_, i) => (
            <tr key={`empty-${i}`}>
                <td className="border border-black p-3">&nbsp;</td>
                <td className="border border-black p-3">&nbsp;</td>
                <td className="border border-black p-3">&nbsp;</td>
                <td className="border border-black p-3">&nbsp;</td>
                <td className="border border-black p-3">&nbsp;</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
            <tr className="bg-slate-50 font-bold">
                <td colSpan={3} className="border border-black p-3 text-right text-xs uppercase">Total Quantity:</td>
                <td className="border border-black p-3 text-center">{transfer.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td className="border border-black p-3">&nbsp;</td>
            </tr>
        </tfoot>
      </table>

      {/* Footer / Signatures */}
      <div className="mt-auto pt-20 grid grid-cols-2 gap-20">
        <div className="text-center">
          <div className="border-t border-black pt-2">
            <p className="font-bold uppercase text-xs">Receiver's Signature</p>
            <p className="text-[10px] text-slate-400 mt-1">(Name & Date)</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-black pt-2">
            <p className="font-bold uppercase text-xs">For TEJCO Medical Systems Pvt. Ltd.</p>
            <p className="text-[10px] text-slate-400 mt-1">(Authorized Signatory)</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-[10px] text-slate-400 text-center border-t border-slate-100 pt-4">
        Computer generated document. No signature required if electronically verified.
      </div>
    </div>
  )
}

export function GatePass({ transfer }: PrintTemplateProps) {
  return (
    <div className="p-6 bg-white text-black w-[148mm] h-[210mm] border shadow-sm mx-auto print:shadow-none print:border-none flex flex-col font-sans">
      <div className="border-2 border-black p-4 flex-grow flex flex-col">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-black italic tracking-tighter">TEJCO</h1>
            <h2 className="text-xl font-bold uppercase tracking-widest mt-1">SECURITY GATE PASS</h2>
            <p className="text-[10px] font-bold text-slate-500">(Material Outward)</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-y-4 text-xs mb-8">
            <div className="space-y-1">
                <p className="font-bold uppercase text-slate-400 text-[8px]">Ref Transaction No.</p>
                <p className="font-bold text-sm tracking-tight">{transfer.transferId}</p>
            </div>
            <div className="space-y-1">
                <p className="font-bold uppercase text-slate-400 text-[8px]">Date & Time</p>
                <p className="font-medium">{new Date(transfer.date).toLocaleDateString("en-GB")} | _________</p>
            </div>
            <div className="space-y-1">
                <p className="font-bold uppercase text-slate-400 text-[8px]">From Warehouse</p>
                <p className="font-medium uppercase">{transfer.sourceWarehouseId}</p>
            </div>
            <div className="space-y-1">
                <p className="font-bold uppercase text-slate-400 text-[8px]">Going To</p>
                <p className="font-medium uppercase">{transfer.destinationWarehouseId}</p>
            </div>
          </div>

          {/* Summary Table */}
          <div className="mb-8 font-bold border-t border-b border-black py-4">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase">Total Line Items:</span>
                <span className="text-sm bg-black text-white px-2 py-0.5">{transfer.items.length}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-xs uppercase">Total Physical Units:</span>
                <span className="text-sm bg-black text-white px-2 py-0.5">{transfer.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
             </div>
          </div>

          {/* Vehicle Info */}
          <div className="space-y-4 mb-auto">
            <div className="grid grid-cols-1 gap-4">
                <div className="border-b border-slate-300 pb-1 flex justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Vehicle No:</span>
                    <span className="w-40 border-b border-slate-200"></span>
                </div>
                <div className="border-b border-slate-300 pb-1 flex justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Driver Name:</span>
                    <span className="w-40 border-b border-slate-200"></span>
                </div>
                <div className="border-b border-slate-300 pb-1 flex justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Mobile No:</span>
                    <span className="w-40 border-b border-slate-200"></span>
                </div>
            </div>
          </div>

          {/* Verification section */}
          <div className="mt-12 grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
             <div className="text-center space-y-4">
                <div className="h-10 border-b border-slate-300"></div>
                <p className="text-[9px] uppercase font-bold">Store In-Charge</p>
             </div>
             <div className="text-center space-y-4">
                <div className="h-10 border-b border-slate-300"></div>
                <p className="text-[9px] uppercase font-bold">Security Signature</p>
             </div>
          </div>

          <div className="mt-6 text-[8px] text-slate-300 text-center uppercase tracking-widest">
            Transfer ID: {transfer.id} | Generated at {new Date().toLocaleTimeString()}
          </div>
      </div>
    </div>
  )
}
