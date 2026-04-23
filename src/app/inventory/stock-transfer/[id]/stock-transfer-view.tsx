"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Printer, 
  FileDown, 
  Edit, 
  Boxes, 
  Warehouse, 
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Calendar,
  Info,
  MapPin,
  ClipboardList
} from "lucide-react"
import { StockTransfer, TransferStatus } from "../types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeliveryChallan, GatePass } from "../components/print-templates"

interface StockTransferViewProps {
  transfer: StockTransfer
}

export function StockTransferView({ transfer }: StockTransferViewProps) {
  const router = useRouter()
  const [isMounted, setIsMounted] = React.useState(false)
  const [activePrint, setActivePrint] = React.useState<"challan" | "gatepass" | null>(null)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const handlePrint = (type: "challan" | "gatepass") => {
    setActivePrint(type)
    // Small delay to ensure the content is rendered before printing
    setTimeout(() => {
      window.print()
      setActivePrint(null)
    }, 100)
  }

  const getStatusIcon = (status: TransferStatus) => {
    switch (status) {
      case "Draft": return <Clock className="h-5 w-5 text-slate-500" />
      case "Pending": return <Clock className="h-5 w-5 text-amber-500" />
      case "In Transit": return <Truck className="h-5 w-5 text-blue-500" />
      case "Completed": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "Cancelled": return <AlertCircle className="h-5 w-5 text-destructive" />
      default: return <Info className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case "Draft": return <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-none">Draft</Badge>
      case "Pending": return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none">Pending Approval</Badge>
      case "In Transit": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">In Transit</Badge>
      case "Completed": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">Completed</Badge>
      case "Cancelled": return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{transfer.transferId}</h1>
              {getStatusBadge(transfer.status)}
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" /> 
                Transfer initiated on {isMounted ? new Date(transfer.date).toLocaleDateString("en-GB") : transfer.date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => handlePrint("challan")}>
            <Printer className="h-4 w-4" /> Print Challan
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handlePrint("gatepass")}>
            <Truck className="h-4 w-4" /> Print Gate Pass
          </Button>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" /> Export PDF
          </Button>
          <Button className="gap-2">
            <Edit className="h-4 w-4" /> Edit Transfer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Routing Visualization */}
          <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-white to-slate-50/30">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <h3 className="font-bold text-xs uppercase tracking-wider">Transfer Routing</h3>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between relative px-8">
                    {/* Connector Line */}
                    <div className="absolute top-[26px] left-[15%] right-[15%] h-[2px] bg-dashed border-b-2 border-slate-200 border-dashed z-0" />
                    
                    <div className="relative z-10 flex flex-col items-center gap-3 group">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-amber-100 group-hover:border-amber-300 transition-colors">
                            <Warehouse className="h-8 w-8 text-amber-600" />
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">SOURCE</div>
                            <div className="font-bold text-sm">{transfer.sourceWarehouseId}</div>
                            <div className="text-[10px] text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">{transfer.sourceStorageId}</div>
                        </div>
                    </div>

                    <div className="relative z-10 bg-white p-2 rounded-full shadow-sm border border-slate-100 rotate-0">
                        <ArrowRight className="h-5 w-5 text-slate-400" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-3 group">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-blue-100 group-hover:border-blue-300 transition-colors">
                            <Warehouse className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">DESTINATION</div>
                            <div className="font-bold text-sm">{transfer.destinationWarehouseId}</div>
                            <div className="text-[10px] text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">{transfer.destinationStorageId}</div>
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transfered Products</CardTitle>
                <CardDescription>Detailed list of items in this stock movement.</CardDescription>
              </div>
              <div className="bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
                <span className="text-xs text-muted-foreground uppercase font-bold mr-2">Total Quantity:</span>
                <span className="font-bold text-primary">{transfer.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfer.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-xs font-mono">{item.sku}</TableCell>
                      <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                      <TableCell className="text-slate-500 text-xs">{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notes */}
          {transfer.notes && (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-slate-400" />
                        Additional Notes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600 italic leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                        "{transfer.notes}"
                    </p>
                </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Status Tracker */}
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="bg-slate-50/50 pb-4">
              <CardTitle className="text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Live Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 relative">
              <div className="space-y-8">
                <div className="flex gap-4 group">
                    <div className="relative flex flex-col items-center">
                        <div className="z-10 bg-emerald-100 p-1.5 rounded-full border-2 border-white shadow-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="absolute top-7 w-[2px] h-10 bg-emerald-500" />
                    </div>
                    <div>
                        <div className="text-sm font-bold">Transfer Initiated</div>
                        <div className="text-[10px] text-muted-foreground">{isMounted ? new Date(transfer.createdAt).toLocaleString() : ""}</div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                        <div className={`z-10 ${transfer.status === 'In Transit' || transfer.status === 'Completed' ? 'bg-blue-100 p-1.5 rounded-full border-2 border-white shadow-sm' : 'bg-slate-100 p-1.5 rounded-full border-2 border-white shadow-sm'}`}>
                            <Truck className={`h-4 w-4 ${transfer.status === 'In Transit' || transfer.status === 'Completed' ? 'text-blue-600' : 'text-slate-400'}`} />
                        </div>
                        <div className={`absolute top-7 w-[2px] h-10 ${transfer.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    </div>
                    <div>
                        <div className={`text-sm font-bold ${transfer.status === 'In Transit' || transfer.status === 'Completed' ? '' : 'text-slate-400'}`}>In Transit</div>
                        <div className="text-[10px] text-muted-foreground">{transfer.status === 'In Transit' || transfer.status === 'Completed' ? 'Moving towards Pune Hub' : '--'}</div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                        <div className={`z-10 ${transfer.status === 'Completed' ? 'bg-emerald-100 p-1.5 rounded-full border-2 border-white shadow-sm' : 'bg-slate-100 p-1.5 rounded-full border-2 border-white shadow-sm'}`}>
                            <Boxes className={`h-4 w-4 ${transfer.status === 'Completed' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>
                    </div>
                    <div>
                        <div className={`text-sm font-bold ${transfer.status === 'Completed' ? '' : 'text-slate-400'}`}>Received & Validated</div>
                        <div className="text-[10px] text-muted-foreground">{transfer.status === 'Completed' ? (isMounted ? new Date(transfer.updatedAt).toLocaleString() : "") : '--'}</div>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transfer Reason</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <div className="text-sm font-medium text-amber-900">{transfer.reason}</div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-bold text-muted-foreground uppercase">Created By</label>
                   <div className="text-sm font-medium">Warehouse Admin</div>
                </div>
                <div>
                   <label className="text-[10px] font-bold text-muted-foreground uppercase">Auth ID</label>
                   <div className="text-sm font-medium">TEJ-0442</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden Print Container */}
      <div className="hidden print:block fixed inset-0 z-[9999] bg-white">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          }
        `}} />
        <div id="print-area">
          {activePrint === "challan" && <DeliveryChallan transfer={transfer} />}
          {activePrint === "gatepass" && <GatePass transfer={transfer} />}
        </div>
      </div>
    </div>
  )
}
