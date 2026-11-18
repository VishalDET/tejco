import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { FileCheck, IndianRupee, Loader2, Truck } from "lucide-react"
import { accountsApi, type InvoicingQueueItem, type GenerateInvoicePayload } from "@/lib/api"

interface GenerateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: InvoicingQueueItem | null
  onSuccess: () => void
}

export function GenerateInvoiceDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: GenerateInvoiceDialogProps) {
  const [invoiceNumber, setInvoiceNumber] = React.useState("")
  const [invoiceDate, setInvoiceDate] = React.useState("")
  const [freight, setFreight] = React.useState<number>(0)
  const [roundOff, setRoundOff] = React.useState<number>(0)
  const [remarks, setRemarks] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (order && open) {
      const year = new Date().getFullYear()
      const rand = Math.floor(1000 + Math.random() * 9000)
      setInvoiceNumber(order.invoiceNumber || `INV-${year}-${rand}`)
      // Format as YYYY-MM-DDThh:mm for datetime-local input
      const now = new Date()
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setInvoiceDate(localIso)
      setFreight(Number(order.freight) || 0)
      setRoundOff(0)
      setRemarks("")
    }
  }, [order, open])

  if (!order) return null

  const subtotal = Number(order.subtotal) || 0
  const gstAmount = Number(order.gstAmount) || 0
  const effectiveFreight = Number(freight) || 0
  const effectiveRoundOff = Number(roundOff) || 0
  const computedTotal = subtotal + gstAmount + effectiveFreight + effectiveRoundOff

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceNumber.trim()) {
      toast.error("Please enter a valid Tax Invoice Number.")
      return
    }
    if (!invoiceDate) {
      toast.error("Please specify the Invoice Date.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: GenerateInvoicePayload = {
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate: new Date(invoiceDate).toISOString(),
        freight: effectiveFreight,
        roundOff: effectiveRoundOff,
        remarks: remarks.trim() || undefined,
      }

      const res = await accountsApi.generateInvoice(order.orderId, payload)
      toast.success(
        res.message ||
        `Tax Invoice "${invoiceNumber}" generated successfully for Order #${order.orderNumber}. Order is ready for dispatch.`
      )
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error("Failed to generate tax invoice:", err)
      const errorMsg =
        err?.info?.message ||
        err?.message ||
        "Failed to generate invoice. Please verify order state."
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max md:min-w-[600px] max-sm:w-md-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Generate Tax Invoice</DialogTitle>
              <DialogDescription>
                Generate an official GST Tax Invoice for Order{" "}
                <span className="font-mono font-semibold text-foreground">
                  {order.orderNumber}
                </span>{" "}
                to move it to dispatch.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Workflow Notice */}
          <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Truck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span>Once the invoice is generated, this order will be queued for dispatch.</span>
          </div>

          {/* Order Summary Pill */}
          <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1 border">
            <div className="flex justify-between text-muted-foreground">
              <span>Client:</span>
              <span className="font-semibold text-foreground">{order.clientName}</span>
            </div>
            {order.outwardOrderId && (
              <div className="flex justify-between text-muted-foreground">
                <span>Outward Order / Dispatch:</span>
                <span className="font-mono font-medium text-foreground">
                  #{order.outwardOrderId} ({order.outwardStatus || "Completed"})
                </span>
              </div>
            )}
            {order.dispatchedDate && (
              <div className="flex justify-between text-muted-foreground">
                <span>Dispatched Date:</span>
                <span className="font-medium text-foreground">
                  {new Date(order.dispatchedDate).toLocaleDateString("en-GB")}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="invoiceNumber" className="text-xs font-semibold">
                Invoice Number *
              </Label>
              <Input
                id="invoiceNumber"
                placeholder="e.g. INV-2026-0412"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoiceDate" className="text-xs font-semibold">
                Invoice Date & Time *
              </Label>
              <Input
                id="invoiceDate"
                type="datetime-local"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="freight" className="text-xs font-semibold">
                Freight Charges (₹)
              </Label>
              <Input
                id="freight"
                type="number"
                step="any"
                value={freight}
                onChange={(e) => setFreight(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roundOff" className="text-xs font-semibold">
                Round-off (₹)
              </Label>
              <Input
                id="roundOff"
                type="number"
                step="any"
                value={roundOff}
                onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks" className="text-xs font-semibold">
              Tax Invoice Remarks / E-Way Bill Details
            </Label>
            <Textarea
              id="remarks"
              placeholder="e.g. Tax invoice filed with 18% IGST. E-Way bill #EWB9928371."
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {/* Real-time Financial Breakdown */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3.5 border text-xs space-y-1.5">
            <div className="flex justify-between text-muted-foreground">
              <span>Taxable Subtotal:</span>
              <span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST Amount:</span>
              <span>₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            {effectiveFreight > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Freight:</span>
                <span>₹{effectiveFreight.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {effectiveRoundOff !== 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Round-off:</span>
                <span>₹{effectiveRoundOff.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-1.5 border-t flex justify-between font-bold text-sm text-foreground">
              <span>Grand Total:</span>
              <span className="text-emerald-700 dark:text-emerald-400">
                ₹{computedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <IndianRupee className="h-4 w-4" /> Generate Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

