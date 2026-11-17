import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Warehouse,
  Receipt,
  FileText,
  User,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { returnApi, creditNoteApi, type ReturnRequestDto } from "@/lib/api"
import type { ReturnRequest } from "./types"
import { CreditNoteDetailsDialog } from "./credit-notes/credit-note-details-dialog"
import type { CreditNote } from "./credit-notes/types"

interface ReturnDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnRequest: ReturnRequest | null
  onSuccess: () => void
  onEdit?: (req: ReturnRequest) => void
}

export function ReturnDetailsDialog({
  open,
  onOpenChange,
  returnRequest,
  onSuccess,
  onEdit,
}: ReturnDetailsDialogProps) {
  const { hasPermission } = useAuth()
  const canApprove =
    hasPermission("Returns.Approve") ||
    hasPermission("GoodsReturn.Edit") ||
    hasPermission("SalesOrders.Approve")

  // Action states
  const [isApproving, setIsApproving] = React.useState(false)
  const [isRejecting, setIsRejecting] = React.useState(false)
  const [showApproveConfirm, setShowApproveConfirm] = React.useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = React.useState(false)
  const [actionRemarks, setActionRemarks] = React.useState("")

  // Linked Credit Note dialog state
  const [linkedCreditNote, setLinkedCreditNote] = React.useState<CreditNote | null>(null)
  const [creditNoteDialogOpen, setCreditNoteDialogOpen] = React.useState(false)
  const [loadingCreditNote, setLoadingCreditNote] = React.useState(false)

  if (!returnRequest) return null

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved
          </Badge>
        )
      case "submitted":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-none gap-1">
            <Clock className="h-3.5 w-3.5" /> Submitted
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3.5 w-3.5" /> Draft
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-none gap-1">
            <XCircle className="h-3.5 w-3.5" /> Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status || "Draft"}</Badge>
    }
  }

  const getConditionBadge = (cond?: string) => {
    switch (cond?.toLowerCase()) {
      case "restockable":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
            Restockable
          </Badge>
        )
      case "quarantine":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
            Quarantine
          </Badge>
        )
      case "scrap":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
            Scrap
          </Badge>
        )
      default:
        return <Badge variant="outline" className="text-[10px]">{cond || "Restockable"}</Badge>
    }
  }

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const res = await returnApi.approve(returnRequest.returnId, {
        remarks:
          actionRemarks.trim() ||
          "Approved after QC inspection. Restocked to shelf. Credit note triggered for accounts adjustment.",
      })
      toast.success(
        res.message ||
          `Return request #${returnRequest.returnNumber} approved successfully. Linked Credit Note generated automatically.`
      )
      setShowApproveConfirm(false)
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error("Failed to approve return:", err)
      toast.error(
        err?.info?.message || err?.message || "Failed to approve return request."
      )
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!actionRemarks.trim()) {
      toast.error("Please provide remarks explaining why the return is being rejected.")
      return
    }

    setIsRejecting(true)
    try {
      const res = await returnApi.reject(returnRequest.returnId, {
        remarks: actionRemarks.trim(),
      })
      toast.success(res.message || `Return request #${returnRequest.returnNumber} rejected.`)
      setShowRejectConfirm(false)
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error("Failed to reject return:", err)
      toast.error(
        err?.info?.message || err?.message || "Failed to reject return request."
      )
    } finally {
      setIsRejecting(false)
    }
  }

  const handleViewCreditNote = async () => {
    setLoadingCreditNote(true)
    try {
      let cnData: any = null
      if (returnRequest.creditNoteId) {
        const res = await creditNoteApi.getById(returnRequest.creditNoteId)
        cnData = res?.data || res
      } else {
        const res = await creditNoteApi.getByReturn(returnRequest.returnId)
        cnData = res?.data || res
      }

      if (cnData) {
        setLinkedCreditNote(cnData)
        setCreditNoteDialogOpen(true)
      } else {
        toast.info("Credit note record is currently processing.")
      }
    } catch (err) {
      console.error("Failed to fetch linked credit note:", err)
      toast.error("Could not fetch linked credit note details.")
    } finally {
      setLoadingCreditNote(false)
    }
  }

  const isApproved = returnRequest.status?.toLowerCase() === "approved"
  const isPending =
    returnRequest.status?.toLowerCase() === "submitted" ||
    returnRequest.status?.toLowerCase() === "draft"

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl md:max-w-6xl lg:max-w-7xl w-[95vw] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="font-mono text-lg">
                    {returnRequest.returnNumber}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Return Date:{" "}
                    {returnRequest.returnDate
                      ? new Date(returnRequest.returnDate).toLocaleDateString("en-GB")
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(returnRequest.status)}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Linked Credit Note Banner if Approved */}
            {isApproved && (returnRequest.creditNoteNumber || returnRequest.creditNoteId) && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-lg">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-900 dark:text-emerald-100 block">
                      Linked Credit Note Generated
                    </span>
                    <span className="font-mono text-xs text-emerald-800 dark:text-emerald-300">
                      {returnRequest.creditNoteNumber || `CR-ID #${returnRequest.creditNoteId}`}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleViewCreditNote}
                  disabled={loadingCreditNote}
                  className="h-8 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-200 gap-1.5"
                >
                  {loadingCreditNote ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5" />
                  )}
                  View Credit Note
                </Button>
              </div>
            )}

            {/* Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-muted/40 rounded-lg border">
                <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                  Sales Order
                </span>
                <span className="font-mono font-semibold text-foreground text-sm mt-0.5 block">
                  {returnRequest.orderNumber}
                </span>
                <span className="text-muted-foreground text-[10px]">
                  Order ID: {returnRequest.orderId}
                </span>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border">
                <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                  Client / Doctor
                </span>
                <span className="font-semibold text-foreground text-sm mt-0.5 block truncate">
                  {returnRequest.clientName}
                </span>
                <span className="text-muted-foreground text-[10px]">
                  Client ID: {returnRequest.clientId}
                </span>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border">
                <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                  Intake Warehouse
                </span>
                <span className="font-semibold text-foreground text-sm mt-0.5 block truncate">
                  {returnRequest.warehouseName || `Warehouse #${returnRequest.warehouseId}`}
                </span>
                <span className="font-mono text-muted-foreground text-[10px]">
                  Bin: {returnRequest.locationCode || "—"}
                </span>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border">
                <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                  Total Return
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5 block">
                  ₹{Number(returnRequest.totalReturnAmount || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span className="text-muted-foreground text-[10px]">
                  {returnRequest.items?.length || returnRequest.itemsCount || 0} line items
                </span>
              </div>
            </div>

            {/* QC & Reason details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
              <div>
                <span className="text-muted-foreground text-[11px] block">Return Reason:</span>
                <span className="font-medium text-foreground">
                  {returnRequest.reasonText || `Reason #${returnRequest.reasonId}`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px] block">QC Checked By:</span>
                <span className="font-medium text-foreground">
                  {returnRequest.checkedBy || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px] block">Dock Received By:</span>
                <span className="font-medium text-foreground">
                  {returnRequest.receivedBy || "—"}
                </span>
              </div>
              {returnRequest.remarks && (
                <div className="sm:col-span-3 pt-2 border-t mt-1">
                  <span className="text-muted-foreground text-[11px] block">Remarks / Notes:</span>
                  <span className="text-foreground">{returnRequest.remarks}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Returned Line Items
              </span>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs">Product & Variant</TableHead>
                      <TableHead className="text-xs font-mono">Lot Number</TableHead>
                      <TableHead className="w-24 text-right text-xs">Return Qty</TableHead>
                      <TableHead className="w-28 text-right text-xs">Unit Rate (₹)</TableHead>
                      <TableHead className="w-28 text-center text-xs">QC Condition</TableHead>
                      <TableHead className="w-28 text-right text-xs">Total (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(returnRequest.items || []).map((it, idx) => (
                      <TableRow key={it.returnItemId || idx}>
                        <TableCell className="font-medium text-xs">
                          <div>{it.productName || "Product"}</div>
                          {it.variantName && (
                            <div className="text-[11px] text-muted-foreground">
                              {it.variantName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {it.lotNumber || "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs">
                          {it.returnQuantity}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          ₹{Number(it.unitPrice || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          {getConditionBadge(it.itemCondition)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs">
                          ₹{Number(it.totalPrice || it.returnQuantity * it.unitPrice || 0).toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 }
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Approval / Rejection Confirmation Prompt */}
            {showApproveConfirm && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-3 mt-4">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100 font-bold">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Approve Return Intake & Restock
                </div>
                <p className="text-emerald-800 dark:text-emerald-200 text-xs leading-relaxed">
                  Approving this return request will automatically restock items marked as{" "}
                  <strong>&quot;Restockable&quot;</strong> into warehouse inventory and generate a linked{" "}
                  <strong>Credit Note</strong> in Pending state for Accounts.
                </p>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                    Approval Remarks
                  </Label>
                  <Textarea
                    placeholder="e.g. Approved after physical inspection. Restocked to shelf."
                    rows={2}
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    className="bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowApproveConfirm(false)}
                    disabled={isApproving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    onClick={handleApprove}
                    disabled={isApproving}
                  >
                    {isApproving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Confirm Approval
                  </Button>
                </div>
              </div>
            )}

            {showRejectConfirm && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl space-y-3 mt-4">
                <div className="flex items-center gap-2 text-rose-900 dark:text-rose-100 font-bold">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  Reject Return Request
                </div>
                <p className="text-rose-800 dark:text-rose-200 text-xs">
                  Please provide the rejection reason as per company policy (e.g. seals broken, warranty expired).
                </p>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-rose-900 dark:text-rose-100">
                    Rejection Reason *
                  </Label>
                  <Textarea
                    placeholder="e.g. Product seals broken and serial mismatch. Return rejected."
                    rows={2}
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    className="bg-white dark:bg-slate-900 text-xs"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowRejectConfirm(false)}
                    disabled={isRejecting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isRejecting}
                    className="gap-1.5"
                  >
                    {isRejecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>

            {/* Edit button for draft/submitted */}
            {isPending && onEdit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onEdit(returnRequest)
                }}
              >
                Edit Intake
              </Button>
            )}

            {/* Approval & Rejection buttons for authorized managers */}
            {isPending && canApprove && !showApproveConfirm && !showRejectConfirm && (
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40 gap-1"
                  onClick={() => {
                    setActionRemarks("")
                    setShowRejectConfirm(true)
                  }}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>

                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  onClick={() => {
                    setActionRemarks("")
                    setShowApproveConfirm(true)
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve & Restock
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Linked Credit Note Dialog */}
      <CreditNoteDetailsDialog
        open={creditNoteDialogOpen}
        onOpenChange={setCreditNoteDialogOpen}
        creditNote={linkedCreditNote}
      />
    </>
  )
}

