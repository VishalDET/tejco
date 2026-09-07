import * as React from "react"
import { BarChart3, FileText, PackageCheck, ShoppingBag, Download, RefreshCw, Calendar, AlertCircle, Inbox } from "lucide-react"
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportType = "sales" | "orders-outward" | "inventory-inward"

interface ReportConfig {
    id: ReportType
    label: string
    description: string
    icon: React.ElementType
    color: string
    bgColor: string
    borderColor: string
}

const REPORTS: ReportConfig[] = [
    {
        id: "sales",
        label: "Sales Report",
        description: "Revenue, invoices & client-wise sales breakdown",
        icon: ShoppingBag,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        borderColor: "border-emerald-200 dark:border-emerald-800",
    },
    {
        id: "orders-outward",
        label: "Orders Outward",
        description: "Dispatched orders, picking status & delivery details",
        icon: PackageCheck,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
        id: "inventory-inward",
        label: "Inventory Inward",
        description: "Stock receipts, vendor deliveries & inward quantities",
        icon: BarChart3,
        color: "text-violet-600",
        bgColor: "bg-violet-50 dark:bg-violet-950/30",
        borderColor: "border-violet-200 dark:border-violet-800",
    },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toIsoDate(date: Date): string {
    return date.toISOString().split("T")[0]
}

/** Derive column headers from the first row of data */
function deriveColumns(rows: any[]): string[] {
    if (!rows || rows.length === 0) return []
    return Object.keys(rows[0])
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

/** Export rows to CSV and trigger download */
function exportCsv(rows: any[], columns: string[], filename: string) {
    const header = columns.map((c) => `"${humanize(c)}"`).join(",")
    const body = rows
        .map((row) => columns.map((col) => `"${String(row[col] ?? "").replace(/"/g, '""')}"`).join(","))
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

    const [selectedReport, setSelectedReport] = React.useState<ReportType>("sales")
    const [startDate, setStartDate] = React.useState<string>(toIsoDate(firstOfMonth))
    const [endDate, setEndDate] = React.useState<string>(toIsoDate(today))

    const [rows, setRows] = React.useState<any[] | null>(null)
    const [columns, setColumns] = React.useState<string[]>([])
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [lastGenerated, setLastGenerated] = React.useState<string | null>(null)

    const selectedConfig = REPORTS.find((r) => r.id === selectedReport)!

    async function generateReport() {
        setLoading(true)
        setError(null)
        setRows(null)

        const filter: ReportFilterDto = { startDate, endDate }

        try {
            let raw: any

            if (selectedReport === "sales") {
                raw = await reportsApi.getSales(filter)
            } else if (selectedReport === "orders-outward") {
                raw = await reportsApi.getOrdersOutward(filter)
            } else {
                raw = await reportsApi.getInventoryInward(filter)
            }

            // Normalise to array
            const data: any[] = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.data)
                    ? raw.data
                    : raw
                        ? [raw]
                        : []

            setRows(data)
            setColumns(deriveColumns(data))
            setLastGenerated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }))
        } catch (err: any) {
            setError(err?.message ?? "Failed to generate report. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    function handleExport() {
        if (!rows || rows.length === 0) return
        const filename = `${selectedReport}-${startDate}-to-${endDate}.csv`
        exportCsv(rows, columns, filename)
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground mt-1">
                        Generate business intelligence reports for any date range.
                    </p>
                </div>
                {rows && rows.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                )}
            </div>

            {/* Report type selector */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {REPORTS.map((r) => (
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

            {/* Filter bar */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Date Range Filter
                    </CardTitle>
                    <CardDescription>Select a date range and generate the {selectedConfig.label}.</CardDescription>
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
                            className={`gap-2 ${selectedConfig.color.replace("text-", "")}`}
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
                    <CardHeader className="pb-0 pt-4 px-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between pb-3">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-semibold">{selectedConfig.label}</CardTitle>
                                <Badge variant="secondary" className="text-xs font-mono">
                                    {rows.length.toLocaleString()} rows
                                </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                                {startDate} → {endDate}
                            </span>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                    {columns.map((col) => (
                                        <TableHead
                                            key={col}
                                            className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 px-4"
                                        >
                                            {humanize(col)}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row, i) => (
                                    <TableRow
                                        key={i}
                                        className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                                    >
                                        {columns.map((col) => (
                                            <TableCell
                                                key={col}
                                                className="py-2.5 px-4 text-sm whitespace-nowrap"
                                            >
                                                {formatCell(row[col])}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
                </Card>
            )}
        </div>
    )
}
