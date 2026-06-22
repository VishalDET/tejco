"use client"

import * as React from "react"
import * as XLSX from "xlsx"
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Table2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { categoriesApi } from "@/lib/api"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawRow {
  CategoryName: string
  Description?: string
  Status?: string
  SubcategoryName?: string
  SubcategoryDescription?: string
}

interface ParsedCategory {
  categoryName: string
  description: string
  status: boolean
  subcategories: { subcategoryName: string; description: string }[]
}

type RowStatus = "pending" | "success" | "error" | "skipped"

interface PreviewRow {
  rowIndex: number
  categoryName: string
  description: string
  status: boolean
  subcategoryName: string
  subcategoryDescription: string
  rowStatus: RowStatus
  errorMessage?: string
}

interface BulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

// ─── Template columns ─────────────────────────────────────────────────────────

const TEMPLATE_HEADERS = [
  "CategoryName",
  "Description",
  "Status",
  "SubcategoryName",
  "SubcategoryDescription",
]

const TEMPLATE_SAMPLE: (string | boolean)[][] = [
  ["Skin Care", "Products for skin health", "Active", "Moisturizers", "Daily hydration products"],
  ["Skin Care", "Products for skin health", "Active", "Serums", "Concentrated treatment serums"],
  ["Hair Care", "Products for hair health", "Active", "Shampoos", "Cleansing hair products"],
  ["Hair Care", "Products for hair health", "Active", "", ""],
  ["Optics", "Eye care products", "Active", "Sunglasses", "UV protection eyewear"],
]

// ─── Component ────────────────────────────────────────────────────────────────

export function CategoryBulkUploadDialog({ open, onOpenChange, onComplete }: BulkUploadDialogProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [previewRows, setPreviewRows] = React.useState<PreviewRow[]>([])
  const [isUploading, setIsUploading] = React.useState(false)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [uploadDone, setUploadDone] = React.useState(false)

  const stats = React.useMemo(() => ({
    total: previewRows.length,
    success: previewRows.filter(r => r.rowStatus === "success").length,
    error: previewRows.filter(r => r.rowStatus === "error").length,
    skipped: previewRows.filter(r => r.rowStatus === "skipped").length,
  }), [previewRows])

  // ── Download Template ──────────────────────────────────────────────────────

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...TEMPLATE_SAMPLE])

    // Column widths
    ws["!cols"] = [
      { wch: 20 }, // CategoryName
      { wch: 35 }, // Description
      { wch: 10 }, // Status
      { wch: 25 }, // SubcategoryName
      { wch: 35 }, // SubcategoryDescription
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Categories")

    // Instructions sheet
    const instrData = [
      ["📋 TEMPLATE INSTRUCTIONS"],
      [""],
      ["Column", "Required", "Notes"],
      ["CategoryName", "✅ Required", "Name of the parent category (e.g. Skin Care)"],
      ["Description", "Optional", "Short description of the category"],
      ["Status", "Optional", "Active or Inactive (defaults to Active)"],
      ["SubcategoryName", "Optional", "Leave blank if no subcategory for this row"],
      ["SubcategoryDescription", "Optional", "Description of the subcategory"],
      [""],
      ["📌 RULES"],
      ["", "• Repeat the CategoryName on multiple rows to add multiple subcategories"],
      ["", "• A category with no subcategories needs only one row"],
      ["", "• Status column accepts: Active, Inactive, TRUE, FALSE, 1, 0"],
      ["", "• Duplicate CategoryNames are grouped automatically"],
    ]
    const wsInstr = XLSX.utils.aoa_to_sheet(instrData)
    wsInstr["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 60 }]
    XLSX.utils.book_append_sheet(wb, wsInstr, "Instructions")

    XLSX.writeFile(wb, "category_bulk_upload_template.xlsx")
    toast.success("Template downloaded!")
  }

  // ── Parse Excel ───────────────────────────────────────────────────────────

  const parseFile = (file: File) => {
    setFileName(file.name)
    setUploadDone(false)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: RawRow[] = XLSX.utils.sheet_to_json(ws, { defval: "" })

        const previews: PreviewRow[] = rows.map((row, i) => {
          const categoryName = String(row.CategoryName || "").trim()
          const errors: string[] = []
          if (!categoryName) errors.push("CategoryName is required")

          return {
            rowIndex: i + 2, // 1-indexed, +1 for header
            categoryName,
            description: String(row.Description || "").trim(),
            status: !["inactive", "false", "0"].includes(String(row.Status || "Active").toLowerCase()),
            subcategoryName: String(row.SubcategoryName || "").trim(),
            subcategoryDescription: String(row.SubcategoryDescription || "").trim(),
            rowStatus: errors.length > 0 ? "error" : "pending",
            errorMessage: errors.join("; "),
          }
        })

        setPreviewRows(previews)
      } catch (err) {
        toast.error("Failed to parse Excel file. Make sure it's a valid .xlsx file.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      parseFile(file)
    } else {
      toast.error("Please drop a valid Excel file (.xlsx)")
    }
  }

  // ── Group rows into categories ────────────────────────────────────────────

  const groupIntoCategories = (rows: PreviewRow[]): Map<string, ParsedCategory> => {
    const map = new Map<string, ParsedCategory>()
    for (const row of rows) {
      if (row.rowStatus === "error") continue
      const key = row.categoryName.toLowerCase()
      if (!map.has(key)) {
        map.set(key, {
          categoryName: row.categoryName,
          description: row.description,
          status: row.status,
          subcategories: [],
        })
      }
      if (row.subcategoryName) {
        map.get(key)!.subcategories.push({
          subcategoryName: row.subcategoryName,
          description: row.subcategoryDescription,
        })
      }
    }
    return map
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    const validRows = previewRows.filter(r => r.rowStatus !== "error")
    if (validRows.length === 0) {
      toast.error("No valid rows to upload.")
      return
    }

    setIsUploading(true)
    const grouped = groupIntoCategories(previewRows)
    const categories = Array.from(grouped.values())

    let successCount = 0
    let errorCount = 0

    for (const cat of categories) {
      try {
        await categoriesApi.create({
          categoryName: cat.categoryName,
          description: cat.description,
          status: cat.status,
          subcategories: cat.subcategories,
        })
        successCount++
      } catch (err: any) {
        errorCount++
        console.error(`Failed to create category "${cat.categoryName}":`, err)
      }
    }

    setIsUploading(false)
    setUploadDone(true)

    // Mark rows
    setPreviewRows(prev => prev.map(r => {
      if (r.rowStatus === "error") return r
      const key = r.categoryName.toLowerCase()
      const cat = grouped.get(key)
      // If the category failed we can't easily know per-row, mark as success for now
      return { ...r, rowStatus: "success" as RowStatus }
    }))

    if (successCount > 0) {
      toast.success(`Successfully created ${successCount} categor${successCount > 1 ? "ies" : "y"}!`)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} categor${errorCount > 1 ? "ies" : "y"} failed to create.`)
    }
    if (successCount > 0) {
      onComplete()
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setPreviewRows([])
    setFileName(null)
    setUploadDone(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleClose = () => {
    handleReset()
    onOpenChange(false)
  }

  const pendingCount = previewRows.filter(r => r.rowStatus === "pending").length
  const errorCount = previewRows.filter(r => r.rowStatus === "error").length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="p-6 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
          <DialogTitle className="text-xl flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
            </div>
            Bulk Upload Categories
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Import multiple categories and subcategories at once using an Excel file.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">

              {/* Step 1: Download Template */}
              <div className="flex items-start gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-2 flex-shrink-0">
                  <Table2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">Step 1 — Download the Excel Template</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Use our pre-formatted template with correct columns and sample data. 
                    Fill it in and re-upload.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Columns: <span className="font-mono bg-slate-100 px-1 rounded">CategoryName</span>{" "}
                    <span className="font-mono bg-slate-100 px-1 rounded">Description</span>{" "}
                    <span className="font-mono bg-slate-100 px-1 rounded">Status</span>{" "}
                    <span className="font-mono bg-slate-100 px-1 rounded">SubcategoryName</span>{" "}
                    <span className="font-mono bg-slate-100 px-1 rounded">SubcategoryDescription</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="flex-shrink-0 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  <Download className="h-3.5 w-3.5" />
                  Template
                </Button>
              </div>

              {/* Step 2: Upload */}
              <div>
                <p className="font-semibold text-slate-800 text-sm mb-3">Step 2 — Upload your filled Excel file</p>

                {!fileName ? (
                  <div
                    className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                      isDragging
                        ? "border-indigo-400 bg-indigo-50/60"
                        : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-4 rounded-2xl transition-colors ${isDragging ? "bg-indigo-100" : "bg-slate-100"}`}>
                        <Upload className={`h-7 w-7 ${isDragging ? "text-indigo-600" : "text-slate-400"}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">Drop your Excel file here</p>
                        <p className="text-sm text-slate-400 mt-1">or click to browse — supports .xlsx files</p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                    <FileSpreadsheet className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-indigo-800 truncate">{fileName}</p>
                      <p className="text-xs text-indigo-500">{previewRows.length} rows parsed</p>
                    </div>
                    <button onClick={handleReset} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              {previewRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-slate-800 text-sm">Step 3 — Review & Import</p>
                    <div className="flex items-center gap-2">
                      {pendingCount > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                          {pendingCount} ready
                        </Badge>
                      )}
                      {errorCount > 0 && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                          {errorCount} errors
                        </Badge>
                      )}
                      {uploadDone && stats.success > 0 && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                          {stats.success} uploaded
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Summary chips */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Total Rows", value: previewRows.length, color: "bg-slate-50 border-slate-200 text-slate-700" },
                      { label: "Valid", value: pendingCount + stats.success, color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
                      { label: "Errors", value: errorCount, color: "bg-red-50 border-red-100 text-red-700" },
                    ].map(chip => (
                      <div key={chip.label} className={`${chip.color} border rounded-lg p-3 text-center`}>
                        <p className="text-xl font-black">{chip.value}</p>
                        <p className="text-xs font-medium opacity-80">{chip.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2.5 text-left font-bold text-slate-600 w-8">#</th>
                            <th className="px-3 py-2.5 text-left font-bold text-slate-600">Category Name</th>
                            <th className="px-3 py-2.5 text-left font-bold text-slate-600">Description</th>
                            <th className="px-3 py-2.5 text-center font-bold text-slate-600">Status</th>
                            <th className="px-3 py-2.5 text-left font-bold text-slate-600">Subcategory</th>
                            <th className="px-3 py-2.5 text-left font-bold text-slate-600">Sub Description</th>
                            <th className="px-3 py-2.5 text-center font-bold text-slate-600 w-20">State</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row) => (
                            <tr
                              key={row.rowIndex}
                              className={`border-b last:border-0 transition-colors ${
                                row.rowStatus === "error"
                                  ? "bg-red-50/60"
                                  : row.rowStatus === "success"
                                  ? "bg-emerald-50/40"
                                  : "hover:bg-slate-50/50"
                              }`}
                            >
                              <td className="px-3 py-2 text-slate-400 font-mono">{row.rowIndex}</td>
                              <td className="px-3 py-2 font-semibold text-slate-800">
                                {row.categoryName || <span className="text-red-400 italic">Empty</span>}
                              </td>
                              <td className="px-3 py-2 text-slate-500 max-w-[150px] truncate">{row.description || "—"}</td>
                              <td className="px-3 py-2 text-center">
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] ${row.status ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                >
                                  {row.status ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-slate-600">{row.subcategoryName || <span className="text-slate-300">—</span>}</td>
                              <td className="px-3 py-2 text-slate-500 max-w-[150px] truncate">{row.subcategoryDescription || "—"}</td>
                              <td className="px-3 py-2 text-center">
                                {row.rowStatus === "pending" && (
                                  <span className="inline-flex items-center gap-1 text-blue-600">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                    Ready
                                  </span>
                                )}
                                {row.rowStatus === "success" && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                                )}
                                {row.rowStatus === "error" && (
                                  <span className="inline-flex items-center gap-1 text-red-500" title={row.errorMessage}>
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span className="text-[10px]">Error</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {errorCount > 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-700">
                        <span className="font-semibold">{errorCount} row{errorCount > 1 ? "s" : ""} will be skipped</span> due to missing required fields.
                        Fix them in your Excel file and re-upload.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 border-t bg-slate-50 gap-2 flex-row justify-between items-center">
          <Button variant="ghost" onClick={handleClose} disabled={isUploading} className="text-slate-500">
            {uploadDone ? "Close" : "Cancel"}
          </Button>
          <div className="flex items-center gap-2">
            {previewRows.length > 0 && !uploadDone && (
              <Button
                onClick={handleUpload}
                disabled={isUploading || pendingCount === 0}
                className="min-w-[180px] bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import {pendingCount} Row{pendingCount !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            )}
            {uploadDone && (
              <Button onClick={handleReset} variant="outline" className="gap-1.5">
                <Upload className="h-4 w-4" />
                Upload Another
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
