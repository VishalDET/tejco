import * as React from "react"
import {
    BarChart3,
    FileText,
    PackageCheck,
    ShoppingBag,
    Download,
    RefreshCw,
    Calendar,
    AlertCircle,
    Inbox,
    ClipboardList,
    Truck,
    Users,
    ArrowDownToLine,
    Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { reportsApi, type ReportFilterDto } from "@/lib/api"
import { executePrint } from "@/components/common/print/print-layout"
import { TEJCO_REPORT_LOGO } from "./tejco-logo"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportType =
    | "sales"
    | "orders-outward"
    | "inventory-inward"
    | "inward-material-rejection"
    | "outward-register"
    | "inward-register"
    | "customer-list"

interface ColumnDef {
    key: string
    label: string
    /** Minimum column width in pixels or CSS units */
    minWidth?: string
    /** Maximum column width in pixels or CSS units */
    maxWidth?: string
    /** If true the column wraps text nicely instead of nowrap */
    wrap?: boolean
    /** Text alignment */
    align?: "left" | "center" | "right"
}

interface ReportConfig {
    id: ReportType
    label: string
    docNo: string
    description: string
    icon: React.ElementType
    color: string
    bgColor: string
    borderColor: string
    /** Hardcoded columns matching the PDF exactly. If undefined, auto-derive from data. */
    columns?: ColumnDef[]
}

// ---------------------------------------------------------------------------
// Column definitions — exact match to PDF documents with robust wrapping
// ---------------------------------------------------------------------------

const IMRR_COLUMNS: ColumnDef[] = [
    { key: "srNo", label: "Sr. No.", minWidth: "70px", align: "center" },
    { key: "date", label: "Date", minWidth: "110px" },
    { key: "inwardMaterialName", label: "Name of the Inward Meterial", wrap: true, minWidth: "200px", maxWidth: "300px" },
    { key: "supplierName", label: "Supplier Name", wrap: true, minWidth: "160px", maxWidth: "240px" },
    { key: "poNo", label: "P.O. No.", minWidth: "110px" },
    { key: "poDate", label: "P.O. Date", minWidth: "110px" },
    { key: "inwardMaterialQty", label: "Inward Material Quantity", minWidth: "120px", align: "right" },
    { key: "conditionOnReceipt", label: "Condition of Product when received", wrap: true, minWidth: "180px", maxWidth: "260px" },
    { key: "acceptedQty", label: "Accepted Quantity", minWidth: "110px", align: "right" },
    { key: "rejectedQty", label: "Rejected Quantity", minWidth: "110px", align: "right" },
    { key: "warehouse", label: "Warehouse", wrap: true, minWidth: "140px", maxWidth: "200px" },
    { key: "checkedBy", label: "Checked By", minWidth: "130px" },
    { key: "verifiedBy", label: "Verified By", minWidth: "130px" },
    { key: "reasonForRejection", label: "Reason for Rejection", wrap: true, minWidth: "220px", maxWidth: "340px" },
]

const OUTWARD_REGISTER_COLUMNS: ColumnDef[] = [
    { key: "customerName", label: "Customer Name", wrap: true, minWidth: "180px", maxWidth: "260px" },
    { key: "lotNo", label: "Lot No.", minWidth: "120px" },
    { key: "productName", label: "Product Name", wrap: true, minWidth: "200px", maxWidth: "300px" },
    { key: "quantity", label: "Quantity", minWidth: "100px", align: "right" },
    { key: "orderGivenBy", label: "Order Given By", wrap: true, minWidth: "140px", maxWidth: "200px" },
    { key: "deliveryTo", label: "Delivery To", wrap: true, minWidth: "180px", maxWidth: "280px" },
    { key: "warehouse", label: "Warehouse", wrap: true, minWidth: "140px", maxWidth: "200px" },
    { key: "vehicleContainerNo", label: "Vehicle / Container Number", minWidth: "150px" },
    { key: "driverNameMobile", label: "Driver's Name & Mobile No.", wrap: true, minWidth: "170px", maxWidth: "250px" },
    { key: "outTime", label: "Out Time", minWidth: "110px" },
    { key: "grnNo", label: "GRN No.", minWidth: "120px" },
    { key: "supervisorSignature", label: "Supervisor's Signature", minWidth: "140px" },
]

const INWARD_REGISTER_COLUMNS: ColumnDef[] = [
    { key: "date", label: "Date", minWidth: "110px" },
    { key: "supplierName", label: "Supplier Name", wrap: true, minWidth: "180px", maxWidth: "260px" },
    { key: "location", label: "Location", wrap: true, minWidth: "140px", maxWidth: "220px" },
    { key: "grnNo", label: "GRN No.", minWidth: "120px" },
    { key: "lotNo", label: "Lot No.", minWidth: "120px" },
    { key: "productName", label: "Product Name", wrap: true, minWidth: "200px", maxWidth: "300px" },
    { key: "testCertificateReceived", label: "Test Certificate Received [YES/NO]", wrap: true, minWidth: "150px", maxWidth: "200px", align: "center" },
    { key: "qty", label: "QTY", minWidth: "90px", align: "right" },
    { key: "inKg", label: "IN/KG", minWidth: "80px", align: "center" },
    { key: "warehouse", label: "Warehouse", wrap: true, minWidth: "140px", maxWidth: "200px" },
    { key: "vehicleContainerNo", label: "Vehicle / Container Number", minWidth: "150px" },
    { key: "driverName", label: "Driver's Name", minWidth: "130px" },
    { key: "inTime", label: "In Time", minWidth: "110px" },
    { key: "supervisorSignature", label: "Supervisor's Signature", minWidth: "140px" },
]

const CUSTOMER_LIST_COLUMNS: ColumnDef[] = [
    { key: "srNo", label: "Sr. No.", minWidth: "70px", align: "center" },
    { key: "customerName", label: "Name of Customer", wrap: true, minWidth: "190px", maxWidth: "270px" },
    { key: "address", label: "Address", wrap: true, minWidth: "260px", maxWidth: "420px" },
    { key: "products", label: "Products", wrap: true, minWidth: "160px", maxWidth: "260px" },
    { key: "contactPerson", label: "Contact Person", wrap: true, minWidth: "150px", maxWidth: "220px" },
    { key: "contactNumber", label: "Contact Number", minWidth: "140px" },
]

// ---------------------------------------------------------------------------
// Report registry
// ---------------------------------------------------------------------------

const REPORTS: ReportConfig[] = [
    // --- PDF reports (exact match) ---
    // {
    //     id: "inward-material-rejection",
    //     label: "Inward Material Rejection Record",
    //     docNo: "TGLLP/QC/F/IMRR/04",
    //     description: "QC rejection log — accepted & rejected inward quantities with reasons",
    //     icon: ClipboardList,
    //     color: "text-rose-600",
    //     bgColor: "bg-rose-50 dark:bg-rose-950/30",
    //     borderColor: "border-rose-200 dark:border-rose-800",
    //     columns: IMRR_COLUMNS,
    // },
    {
        id: "outward-register",
        label: "Outward Register",
        docNo: "TGLLP/STR/F/OR/02",
        description: "",
        icon: Truck,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800",
        columns: OUTWARD_REGISTER_COLUMNS,
    },
    {
        id: "inward-register",
        label: "Inward Register",
        docNo: "TGLLP/STR/F/IR/01",
        description: "",
        icon: ArrowDownToLine,
        color: "text-violet-600",
        bgColor: "bg-violet-50 dark:bg-violet-950/30",
        borderColor: "border-violet-200 dark:border-violet-800",
        columns: INWARD_REGISTER_COLUMNS,
    },
    {
        id: "customer-list",
        label: "List of Customers",
        docNo: "TGLLP/MRK/F/CL/01",
        description: "",
        icon: Users,
        color: "text-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-950/30",
        borderColor: "border-amber-200 dark:border-amber-800",
        columns: CUSTOMER_LIST_COLUMNS,
    },
    // --- existing reports ---
    {
        id: "sales",
        label: "Sales Report",
        docNo: "",
        description: "",
        icon: ShoppingBag,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        borderColor: "border-emerald-200 dark:border-emerald-800",
    },
    // {
    //     id: "orders-outward",
    //     label: "Orders Outward",
    //     docNo: "",
    //     description: "Dispatched orders, picking status & delivery details",
    //     icon: PackageCheck,
    //     color: "text-sky-600",
    //     bgColor: "bg-sky-50 dark:bg-sky-950/30",
    //     borderColor: "border-sky-200 dark:border-sky-800",
    // },
    // {
    //     id: "inventory-inward",
    //     label: "Inventory Inward",
    //     docNo: "",
    //     description: "Stock receipts, vendor deliveries & inward quantities",
    //     icon: BarChart3,
    //     color: "text-indigo-600",
    //     bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    //     borderColor: "border-indigo-200 dark:border-indigo-800",
    // },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toIsoDate(date: Date): string {
    return date.toISOString().split("T")[0]
}

/** Derive column headers from the first row of data */
function deriveColumns(rows: any[]): ColumnDef[] {
    if (!rows || rows.length === 0) return []
    return Object.keys(rows[0]).map((k) => ({
        key: k,
        label: humanize(k),
        wrap: true,
        minWidth: "140px",
        maxWidth: "280px",
    }))
}

/** Format a raw cell value for display */
function formatCell(value: unknown): string {
    if (value === null || value === undefined) return "—"
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (typeof value === "number") return value.toLocaleString("en-IN")
    // ISO date detection
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) {
        try {
            return new Date(value).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
            })
        } catch { /* fallthrough */ }
    }
    return String(value)
}

/** Make a column header readable */
function humanize(key: string): string {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim()
}

/** Map raw API response rows to report-specific column keys */
function mapToReportColumns(reportType: ReportType, items: any[]): any[] {
    if (!items || items.length === 0) return []

    switch (reportType) {
        case "outward-register": {
            const flattened: any[] = []
            for (const row of items) {
                const subItems = Array.isArray(row.items) && row.items.length > 0 ? row.items : [row]
                for (const item of subItems) {
                    flattened.push({
                        customerName: row.clientName || row.customerName || item.clientName || "—",
                        lotNo: item.lotNumber || item.lotNo || row.lotNumber || "—",
                        productName: item.productName || item.variantName || row.productName || "—",
                        quantity: item.scannedQty ?? item.orderedQty ?? item.quantity ?? row.quantity ?? 0,
                        orderGivenBy: row.pickerName || row.orderNumber || "—",
                        deliveryTo: row.shippingAddress || row.clientName || "—",
                        warehouse: row.warehouseName || row.warehouse || "—",
                        vehicleContainerNo: row.vehicleNumber || row.vehicleContainerNo || "—",
                        driverNameMobile: row.driverName ? `${row.driverName} ${row.driverPhone || ""}`.trim() : "—",
                        outTime: row.orderDate || row.createdAt || "—",
                        grnNo: row.orderNumber || row.grnNo || "—",
                        supervisorSignature: "—",
                    })
                }
            }
            return flattened
        }
        case "inward-register": {
            const flattened: any[] = []
            for (const row of items) {
                const subItems = Array.isArray(row.items) && row.items.length > 0 ? row.items : [row]
                for (const item of subItems) {
                    flattened.push({
                        date: row.orderDate || row.createdAt || "—",
                        supplierName: row.vendorName || row.supplierName || "—",
                        location: item.locationCode || row.warehouseName || "—",
                        grnNo: row.orderNumber || row.grnNo || "—",
                        lotNo: item.lotNumber || item.lotNo || "—",
                        productName: item.productName || item.variantName || "—",
                        testCertificateReceived: item.testCertificate ?? "YES",
                        qty: item.receivedQty ?? item.expectedQty ?? item.qty ?? 0,
                        inKg: item.unit || "NOS",
                        warehouse: row.warehouseName || row.warehouse || "—",
                        vehicleContainerNo: row.vehicleNumber || "—",
                        driverName: row.receiverName || row.driverName || "—",
                        inTime: row.orderDate || row.createdAt || "—",
                        supervisorSignature: "—",
                    })
                }
            }
            return flattened
        }
        case "inward-material-rejection": {
            const flattened: any[] = []
            let sr = 1
            for (const row of items) {
                const subItems = Array.isArray(row.items) && row.items.length > 0 ? row.items : [row]
                for (const item of subItems) {
                    const expected = item.expectedQty ?? item.quantity ?? 0
                    const received = item.receivedQty ?? expected
                    const rejected = Math.max(0, expected - received)
                    flattened.push({
                        srNo: sr++,
                        date: row.orderDate || row.createdAt || "—",
                        inwardMaterialName: item.productName || item.variantName || "—",
                        supplierName: row.vendorName || row.supplierName || "—",
                        poNo: row.purchaseOrderId ? `PO-${row.purchaseOrderId}` : (row.orderNumber || "—"),
                        poDate: row.orderDate || "—",
                        inwardMaterialQty: expected,
                        conditionOnReceipt: rejected > 0 ? "Damaged / Rejected" : "Accepted",
                        acceptedQty: received,
                        rejectedQty: rejected,
                        warehouse: row.warehouseName || row.warehouse || "—",
                        checkedBy: row.receiverName || "—",
                        verifiedBy: "—",
                        reasonForRejection: rejected > 0 ? "Damaged in transit / QC check failure" : "—",
                    })
                }
            }
            return flattened
        }
        case "customer-list": {
            let sr = 1
            const formatAddress = (addr: any) => {
                if (!addr) return "—"
                if (typeof addr === "string") return addr
                if (typeof addr === "object") {
                    const parts = [addr.street1, addr.street2, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean)
                    return parts.length > 0 ? parts.join(", ") : "—"
                }
                return String(addr)
            }
            return items.map((row) => ({
                srNo: sr++,
                customerName: row.name || row.clientName || row.company || "—",
                address: formatAddress(row.shippingAddress || row.billingAddress || row.address),
                products: Array.isArray(row.doctorSpeciality) && row.doctorSpeciality.length > 0
                    ? row.doctorSpeciality.join(", ")
                    : (row.clientType || row.productName || row.products || "—"),
                contactPerson: row.contactPerson || row.contacts?.[0]?.name || row.pickerName || "—",
                contactNumber: row.phone || row.contacts?.[0]?.phone || row.mobile || row.contactNumber || "—",
            }))
        }
        default:
            return items
    }
}

/** Export rows to CSV and trigger download */
function exportCsv(rows: any[], columns: ColumnDef[], filename: string) {
    const header = columns.map((c) => `"${c.label}"`).join(",")
    const body = rows
        .map((row) => columns.map((col) => `"${String(row[col.key] ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\n")
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ReportTypeCard({
    config,
    isSelected,
    onSelect,
}: {
    config: ReportConfig
    isSelected: boolean
    onSelect: () => void
}) {
    const Icon = config.icon
    return (
        <button
            onClick={onSelect}
            className={`
                group relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left
                transition-all duration-200 hover:shadow-md
                ${isSelected
                    ? `${config.bgColor} ${config.borderColor} shadow-sm`
                    : "border-slate-200 dark:border-slate-800 bg-card hover:border-slate-300 dark:hover:border-slate-700"
                }
            `}
        >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bgColor}`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
                <p className={`text-sm font-semibold ${isSelected ? config.color : "text-foreground"}`}>
                    {config.label}
                </p>
                {config.docNo && (
                    <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">{config.docNo}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{config.description}</p>
            </div>
            {isSelected && (
                <span className={`absolute right-3 top-3 flex h-2 w-2 rounded-full ${config.color.replace("text-", "bg-")}`} />
            )}
        </button>
    )
}

function SkeletonTable() {
    return (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
            <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 flex gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-3.5 rounded bg-slate-200 dark:bg-slate-700" style={{ width: `${60 + i * 20}px` }} />
                ))}
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 flex gap-6">
                    {Array.from({ length: 5 }).map((_, j) => (
                        <div key={j} className="h-3 rounded bg-slate-100 dark:bg-slate-800" style={{ width: `${50 + j * 18}px` }} />
                    ))}
                </div>
            ))}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ReportsPage() {
    const today = new Date()
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const [selectedReport, setSelectedReport] = React.useState<ReportType>("outward-register")
    const [startDate, setStartDate] = React.useState<string>(toIsoDate(firstOfMonth))
    const [endDate, setEndDate] = React.useState<string>(toIsoDate(today))

    const [rows, setRows] = React.useState<any[] | null>(null)
    const [columns, setColumns] = React.useState<ColumnDef[]>([])
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [lastGenerated, setLastGenerated] = React.useState<string | null>(null)

    const selectedConfig = REPORTS.find((r) => r.id === selectedReport) ?? REPORTS[0]

    async function generateReport() {
        setLoading(true)
        setError(null)
        setRows(null)

        const startIso = startDate ? new Date(`${startDate}T00:00:00.000Z`).toISOString() : undefined
        const endIso = endDate ? new Date(`${endDate}T23:59:59.999Z`).toISOString() : undefined

        const filter: ReportFilterDto = {
            startDate: startIso,
            endDate: endIso,
            clientId: 0,
            clientName: "",
            categoryId: 0,
        }

        try {
            let raw: any

            switch (selectedReport) {
                case "customer-list":
                    raw = await reportsApi.getCustomerList({
                        pageNumber: 1,
                        pageSize: 1000,
                        sortBy: "ClientId",
                        sortDir: "DESC",
                    })
                    break
                case "sales":
                    raw = await reportsApi.getSales(filter)
                    break
                case "orders-outward":
                case "outward-register":
                    raw = await reportsApi.getOrdersOutward(filter)
                    break
                case "inventory-inward":
                case "inward-register":
                case "inward-material-rejection":
                    raw = await reportsApi.getInventoryInward(filter)
                    break
                default:
                    raw = []
            }

            // Normalise to array
            const rawData: any[] = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.data)
                    ? raw.data
                    : raw
                        ? [raw]
                        : []

            const data = mapToReportColumns(selectedReport, rawData)

            setRows(data)
            // Use hardcoded columns if defined, else derive from data
            setColumns(selectedConfig.columns ?? deriveColumns(data))
            setLastGenerated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }))
        } catch (err: any) {
            setError(err?.message ?? "Failed to generate report. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const printContainerRef = React.useRef<HTMLDivElement>(null)

    function handlePrint() {
        if (!printContainerRef.current) {
            window.print()
            return
        }
        executePrint(printContainerRef.current, {
            documentTitle: selectedConfig.docNo
                ? `${selectedConfig.label} - ${selectedConfig.docNo}`
                : selectedConfig.label,
            pageOrientation: selectedReport === "customer-list" ? "portrait" : "landscape",
            delayMs: 350,
        })
    }

    function handleExport() {
        if (!rows || rows.length === 0) return
        const filename = `${selectedReport}-${startDate}-to-${endDate}.csv`
        exportCsv(rows, columns, filename)
    }

    // Split reports into PDF group and existing group for display
    const pdfReports = REPORTS.filter((r) => r.docNo)
    const existingReports = REPORTS.filter((r) => !r.docNo)

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between print:hidden">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground mt-1">
                        Generate business intelligence reports for any date range.
                    </p>
                </div>
                {rows && rows.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                )}
            </div>

            {/* Report type selector — PDF reports */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Quality &amp; Store Documents
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {pdfReports.map((r) => (
                        <ReportTypeCard
                            key={r.id}
                            config={r}
                            isSelected={selectedReport === r.id}
                            onSelect={() => {
                                setSelectedReport(r.id)
                                setRows(null)
                                setError(null)
                                setColumns(r.columns ?? [])
                            }}
                        />
                    ))}
                    {existingReports.map((r) => (
                        <ReportTypeCard
                            key={r.id}
                            config={r}
                            isSelected={selectedReport === r.id}
                            onSelect={() => {
                                setSelectedReport(r.id)
                                setRows(null)
                                setError(null)
                                setColumns([])
                            }}
                        />
                    ))}

                </div>
            </div>

            {/* Report type selector — existing reports */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Business Reports
                </p>

            </div>

            {/* Filter bar */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Date Range Filter
                    </CardTitle>
                    <CardDescription>
                        {selectedConfig.docNo && (
                            <span className="font-mono text-xs mr-2 text-muted-foreground/70">[{selectedConfig.docNo}]</span>
                        )}
                        Select a date range and generate the {selectedConfig.label}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                max={endDate}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                max={toIsoDate(today)}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <Button
                            onClick={generateReport}
                            disabled={loading || !startDate || !endDate}
                            className="gap-2"
                        >
                            {loading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileText className="h-4 w-4" />
                            )}
                            {loading ? "Generating…" : "Generate Report"}
                        </Button>

                        {lastGenerated && !loading && (
                            <p className="text-xs text-muted-foreground self-end pb-1.5">
                                Last generated at {lastGenerated}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {loading && <SkeletonTable />}

            {!loading && error && (
                <Card className="border-destructive/40 bg-destructive/5">
                    <CardContent className="flex items-center gap-3 py-5">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-destructive">Report generation failed</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto" onClick={generateReport}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && rows !== null && rows.length === 0 && (
                <Card className="flex flex-col items-center justify-center py-16 border-dashed">
                    <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">No data found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Try adjusting the date range or check back later.
                    </p>
                </Card>
            )}

            {!loading && !error && rows && rows.length > 0 && (
                <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-0 pt-4 px-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
                        <div className="flex items-center justify-between pb-3">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-semibold">{selectedConfig.label}</CardTitle>
                                {selectedConfig.docNo && (
                                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                                        {selectedConfig.docNo}
                                    </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs font-mono">
                                    {rows.length.toLocaleString()} rows
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                                    {startDate} → {endDate}
                                </span>
                                <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 gap-1.5 text-xs">
                                    <Printer className="h-3.5 w-3.5" />
                                    Print
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1.5 text-xs">
                                    <Download className="h-3.5 w-3.5" />
                                    CSV
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Printable Report Wrapper */}
                    <div ref={printContainerRef} className="p-4 bg-background">
                        {/* PDF Letterhead Table (Matches Tejco Global LLP document format) */}
                        <div className="border border-slate-300 dark:border-slate-700 mb-4 text-xs bg-slate-50/60 dark:bg-slate-900/40 rounded-sm">
                            <div className="grid grid-cols-12 divide-x divide-slate-300 dark:divide-slate-700">
                                <div className="col-span-3 p-2.5 flex flex-col justify-center items-center text-center">
                                    <img
                                        src={TEJCO_REPORT_LOGO}
                                        alt="TEJCO Logo"
                                        className="h-12 w-auto max-w-[130px] object-contain"
                                    />
                                </div>
                                <div className="col-span-5 p-2.5 space-y-1">
                                    <p className="font-bold text-slate-900 dark:text-slate-100">Tejco Global LLP</p>
                                    <div className="grid grid-cols-2 text-[11px] gap-x-2 text-slate-600 dark:text-slate-400">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Document Name:</span>
                                        <span>{selectedConfig.label}</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Document No.:</span>
                                        <span className="font-mono">{selectedConfig.docNo || "TGLLP/GEN/01"}</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Issue No. / Date:</span>
                                        <span>01 / 01.07.2026</span>
                                    </div>
                                </div>
                                <div className="col-span-4 p-2.5 space-y-1">
                                    <div className="grid grid-cols-2 text-[11px] gap-x-2 text-slate-600 dark:text-slate-400">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Page No.:</span>
                                        <span>01</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Revision No.:</span>
                                        <span>00</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Revision Date:</span>
                                        <span>NA</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Period:</span>
                                        <span className="font-mono">{startDate} to {endDate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Formal Document Title */}
                        <div className="text-center my-3">
                            <h2 className="text-base font-bold tracking-wide uppercase text-slate-900 dark:text-slate-100">
                                {selectedConfig.label}
                            </h2>
                        </div>

                        {/* Data Table */}
                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded">
                            <Table className="w-full border-collapse">
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                        {columns.map((col) => (
                                            <TableHead
                                                key={col.key}
                                                style={{
                                                    minWidth: col.minWidth ?? (col.wrap ? "150px" : "110px"),
                                                    maxWidth: col.maxWidth,
                                                }}
                                                className={`text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 px-4 border-b border-slate-200 dark:border-slate-800 ${col.align === "right"
                                                    ? "text-right"
                                                    : col.align === "center"
                                                        ? "text-center"
                                                        : "text-left"
                                                    } ${col.wrap ? "whitespace-normal break-words" : "whitespace-nowrap"}`}
                                            >
                                                {col.label}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row, i) => (
                                        <TableRow
                                            key={i}
                                            className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors border-b border-slate-100 dark:border-slate-800"
                                        >
                                            {columns.map((col) => (
                                                <TableCell
                                                    key={col.key}
                                                    style={{
                                                        minWidth: col.minWidth ?? (col.wrap ? "150px" : "110px"),
                                                        maxWidth: col.maxWidth,
                                                    }}
                                                    className={`py-2.5 px-4 text-sm align-top ${col.align === "right"
                                                        ? "text-right"
                                                        : col.align === "center"
                                                            ? "text-center"
                                                            : "text-left"
                                                        } ${col.wrap ? "whitespace-normal break-words leading-relaxed" : "whitespace-nowrap"}`}
                                                >
                                                    {formatCell(row[col.key])}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Last Updated On note for Customer List */}
                        {selectedReport === "customer-list" && (
                            <p className="text-xs text-muted-foreground mt-3 font-medium">
                                Last Updated On: <span className="font-mono">{new Date().toLocaleDateString("en-IN")}</span>
                            </p>
                        )}

                        {/* Sign-off footer matching PDF physical format */}
                        <div className="border border-slate-300 dark:border-slate-700 mt-4 text-xs grid grid-cols-3 divide-x divide-slate-300 dark:divide-slate-700 rounded-sm">
                            <div className="p-3">
                                <p className="font-semibold text-foreground mb-1">Prepared By</p>
                                <div className="h-8" />
                            </div>
                            <div className="p-3">
                                <p className="font-semibold text-foreground mb-1">Reviewed By</p>
                                <div className="h-8" />
                            </div>
                            <div className="p-3">
                                <p className="font-semibold text-foreground mb-1">Approved By</p>
                                <div className="h-8" />
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Idle prompt */}
            {!loading && !error && rows === null && (
                <Card className="flex flex-col items-center justify-center py-16 border-dashed text-center">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-full mb-4 ${selectedConfig.bgColor}`}>
                        <selectedConfig.icon className={`h-8 w-8 ${selectedConfig.color}`} />
                    </div>
                    <p className="text-sm font-medium">Ready to generate</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Select a date range above and click <strong>Generate Report</strong> to pull data from the server.
                    </p>
                    {selectedConfig.docNo && (
                        <p className="text-[10px] font-mono text-muted-foreground/60 mt-2">
                            Document: {selectedConfig.docNo}
                        </p>
                    )}
                </Card>
            )}
        </div>
    )
}
