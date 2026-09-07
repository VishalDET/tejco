
import * as React from "react"
import * as XLSX from "xlsx"
import { 
    Upload, 
    Download, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    Check,
    AlertCircle
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { usersApi } from "@/lib/api"

interface ImportUsersDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    companies: any[]
    branches: any[]
    departments: any[]
    onImportSuccess: () => void
}

type ParsedUser = {
    rowNumber: number
    firstName: string
    lastName: string
    gender: string
    employeeId: string
    email: string
    phone: string
    companyName: string
    branchName: string
    departmentName: string
    role: string
    handlerId: string
    password: string
    status: string
    
    // Mapped IDs & validation status
    companyId: number
    branchId: number
    departmentId: number
    errors: string[]
    warnings: string[]
    isValid: boolean
    importStatus?: "idle" | "importing" | "success" | "failed"
    importError?: string
}

export function ImportUsersDialog({
    open,
    onOpenChange,
    companies,
    branches,
    departments,
    onImportSuccess
}: ImportUsersDialogProps) {
    const [file, setFile] = React.useState<File | null>(null)
    const [parsedData, setParsedData] = React.useState<ParsedUser[]>([])
    const [isProcessingFile, setIsProcessingFile] = React.useState(false)
    
    const [isImporting, setIsImporting] = React.useState(false)
    const [importProgress, setImportProgress] = React.useState(0)
    const [importSummary, setImportSummary] = React.useState<{
        success: number
        failed: number
        total: number
    } | null>(null)

    // Reset state on open/close
    React.useEffect(() => {
        if (!open) {
            setFile(null)
            setParsedData([])
            setIsProcessingFile(false)
            setIsImporting(false)
            setImportProgress(0)
            setImportSummary(null)
        }
    }, [open])

    // Generate and Download Excel Template
    const handleDownloadTemplate = () => {
        try {
            const wb = XLSX.utils.book_new()

            // 1. Template Sheet headers and sample row
            const headers = [
                "First Name", 
                "Last Name", 
                "Gender", 
                "Employee ID", 
                "Email", 
                "Phone", 
                "Company", 
                "Branch", 
                "Department", 
                "Role", 
                "Handler ID", 
                "Password", 
                "Status"
            ]
            const sampleRow = [
                "Rahul", 
                "Sharma", 
                "male", 
                "EMP-101", 
                "rahul.sharma@tejco.com", 
                "+919876543210", 
                companies[0]?.name || companies[0]?.registeredName || "Tejco Technologies", 
                branches[0]?.name || "Mumbai Office", 
                departments[0]?.name || "Sales", 
                "Sales", 
                "", 
                "Rahul@123", 
                "Active"
            ]

            const wsTemplate = XLSX.utils.aoa_to_sheet([headers, sampleRow])
            XLSX.utils.book_append_sheet(wb, wsTemplate, "Template Instructions")

            // 2. Reference Lists for dropdowns/validation
            const companiesRef = companies.map(c => ({
                "Company ID": c.id || c.companyId,
                "Company Name": c.name || c.registeredName
            }))

            const branchesRef = branches.map(b => {
                const parentComp = companies.find(c => String(c.id || c.companyId) === String(b.companyId || b.companyID || b.CompanyID || b.CompanyId || b.company?.id || b.company?.companyId))
                return {
                    "Branch ID": b.id || b.branchId || b.BranchID,
                    "Branch Name": b.name,
                    "Belongs to Company": parentComp?.name || parentComp?.registeredName || `ID: ${b.companyId}`
                }
            })

            const departmentsRef = departments.map(d => {
                const parentBranch = branches.find(b => String(b.id || b.branchId || b.BranchID) === String(d.branchId || d.branchID || d.BranchID || d.BranchId || d.branch?.id || d.branch?.branchId))
                return {
                    "Department ID": d.id || d.departmentId || d.DepartmentID,
                    "Department Name": d.name,
                    "Belongs to Branch": parentBranch?.name || `ID: ${d.branchId}`
                }
            })

            const rolesRef = [
                { "System Role": "Administrator", "Description": "Full system configuration & admin rights" },
                { "System Role": "Manager", "Description": "Managerial access" },
                { "System Role": "Sales", "Description": "Sales operations access" },
                { "System Role": "Warehouse", "Description": "Warehouse/Inventory management access" },
                { "System Role": "User", "Description": "Standard system user" },
            ]

            const gendersRef = [
                { "Gender Option": "male" },
                { "Gender Option": "female" },
                { "Gender Option": "other" },
                { "Gender Option": "prefer-not-to-say" },
            ]

            // Convert lists to worksheets
            const wsCompanies = XLSX.utils.json_to_sheet(companiesRef)
            const wsBranches = XLSX.utils.json_to_sheet(branchesRef)
            const wsDepts = XLSX.utils.json_to_sheet(departmentsRef)
            const wsRoles = XLSX.utils.json_to_sheet(rolesRef)
            const wsGenders = XLSX.utils.json_to_sheet(gendersRef)

            XLSX.utils.book_append_sheet(wb, wsCompanies, "Ref - Companies")
            XLSX.utils.book_append_sheet(wb, wsBranches, "Ref - Branches")
            XLSX.utils.book_append_sheet(wb, wsDepts, "Ref - Departments")
            XLSX.utils.book_append_sheet(wb, wsRoles, "Ref - Roles")
            XLSX.utils.book_append_sheet(wb, wsGenders, "Ref - Genders")

            XLSX.writeFile(wb, "Tejco_Employee_Import_Template.xlsx")
            toast.success("Template download started!")
        } catch (error) {
            console.error("Template generation error:", error)
            toast.error("Failed to generate Excel template.")
        }
    }

    // Handle uploaded file reading & parsing
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        setIsProcessingFile(true)
        setParsedData([])

        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const dataBytes = evt.target?.result
                const workbook = XLSX.read(dataBytes, { type: "binary" })
                
                // Read from the first sheet
                const firstSheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[firstSheetName]
                
                // Parse as JSON array of arrays or objects
                const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
                
                if (jsonRows.length === 0) {
                    toast.error("The uploaded file is empty.")
                    setIsProcessingFile(false)
                    return
                }

                // Process & validate rows
                const processed = jsonRows.map((row, index) => {
                    const rowNum = index + 2 // header is row 1
                    
                    // Normalize spreadsheet headers (handling lowercase/spaces)
                    const getVal = (keys: string[]) => {
                        for (const k of keys) {
                            if (row[k] !== undefined) return String(row[k]).trim()
                            // Try exact case-insensitive matches
                            const foundKey = Object.keys(row).find(x => x.toLowerCase().replace(/[^a-z0-9]/g, "") === k.toLowerCase().replace(/[^a-z0-9]/g, ""))
                            if (foundKey) return String(row[foundKey]).trim()
                        }
                        return ""
                    }

                    const firstName = getVal(["First Name", "FirstName"])
                    const lastName = getVal(["Last Name", "LastName"])
                    const gender = getVal(["Gender"]).toLowerCase()
                    const employeeId = getVal(["Employee ID", "EmployeeID", "Emp ID"])
                    const email = getVal(["Email", "Email Address"])
                    const phone = getVal(["Phone", "Phone Number", "Contact"])
                    const companyVal = getVal(["Company"])
                    const branchVal = getVal(["Branch"])
                    const deptVal = getVal(["Department"])
                    const role = getVal(["Role"]) || "User"
                    const handlerId = getVal(["Handler ID", "HandlerID", "Handler"])
                    const password = getVal(["Password"])
                    const status = getVal(["Status"]) || "Active"

                    const errors: string[] = []
                    const warnings: string[] = []

                    // Required Fields validation
                    if (!firstName) errors.push("First Name is required")
                    if (!lastName) errors.push("Last Name is required")
                    if (!employeeId) errors.push("Employee ID is required")
                    if (!email) {
                        errors.push("Email is required")
                    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        errors.push("Invalid email format")
                    }
                    if (!phone) errors.push("Phone number is required")
                    if (!password) errors.push("Initial password is required")

                    // Status and Role checks
                    if (!["active", "inactive", "pending"].includes(status.toLowerCase())) {
                        warnings.push(`Status '${status}' is unrecognized. Defaulting to 'Active'.`)
                    }
                    const validRoles = ["Administrator", "Manager", "Sales", "Warehouse", "User"]
                    const roleMatched = validRoles.find(r => r.toLowerCase() === role.toLowerCase())
                    const finalRole = roleMatched || "User"
                    if (!roleMatched) {
                        warnings.push(`Role '${role}' is unrecognized. Defaulting to 'User'.`)
                    }

                    // Master Entity Mapping
                    // 1. Company
                    let compId = 0
                    if (!companyVal) {
                        errors.push("Company name or ID is required")
                    } else {
                        const matchedComp = companies.find(c => 
                            String(c.id || c.companyId) === companyVal ||
                            String(c.name || c.registeredName).toLowerCase() === companyVal.toLowerCase()
                        )
                        if (matchedComp) {
                            compId = matchedComp.id || matchedComp.companyId
                        } else {
                            errors.push(`Company '${companyVal}' not found in masters`)
                        }
                    }

                    // 2. Branch (must belong to Company)
                    let brId = 0
                    if (!branchVal) {
                        errors.push("Branch name or ID is required")
                    } else if (compId > 0) {
                        const matchedBranch = branches.find(b => {
                            const bCompId = b.companyId || b.companyID || b.CompanyID || b.CompanyId || b.company?.id || b.company?.companyId
                            const compMatches = String(bCompId) === String(compId)
                            const nameMatches = String(b.name).toLowerCase() === branchVal.toLowerCase() || String(b.id || b.branchId || b.BranchID) === branchVal
                            return compMatches && nameMatches
                        })
                        if (matchedBranch) {
                            brId = matchedBranch.id || matchedBranch.branchId || matchedBranch.BranchID
                        } else {
                            errors.push(`Branch '${branchVal}' not found under company '${companyVal}'`)
                        }
                    } else {
                        errors.push("Cannot resolve branch without a valid company")
                    }

                    // 3. Department (must belong to Branch)
                    let depId = 0
                    if (!deptVal) {
                        errors.push("Department name or ID is required")
                    } else if (brId > 0) {
                        const matchedDept = departments.find(d => {
                            const dBrId = d.branchId || d.branchID || d.BranchID || d.BranchId || d.branch?.id || d.branch?.branchId
                            const branchMatches = String(dBrId) === String(brId)
                            const nameMatches = String(d.name).toLowerCase() === deptVal.toLowerCase() || String(d.id || d.departmentId || d.DepartmentID) === deptVal
                            return branchMatches && nameMatches
                        })
                        if (matchedDept) {
                            depId = matchedDept.id || matchedDept.departmentId || matchedDept.DepartmentID
                        } else {
                            errors.push(`Department '${deptVal}' not found under branch '${branchVal}'`)
                        }
                    } else {
                        errors.push("Cannot resolve department without a valid branch")
                    }

                    return {
                        rowNumber: rowNum,
                        firstName,
                        lastName,
                        gender,
                        employeeId,
                        email,
                        phone,
                        companyName: companyVal,
                        branchName: branchVal,
                        departmentName: deptVal,
                        role: finalRole,
                        handlerId,
                        password,
                        status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
                        companyId: compId,
                        branchId: brId,
                        departmentId: depId,
                        errors,
                        warnings,
                        isValid: errors.length === 0,
                        importStatus: "idle" as const
                    }
                })

                setParsedData(processed)
            } catch (err) {
                console.error(err)
                toast.error("Error reading excel file. Ensure it is a valid .xlsx or .csv sheet.")
            } finally {
                setIsProcessingFile(false)
            }
        }

        reader.readAsBinaryString(selectedFile)
    }

    // Perform final import push
    const handleStartImport = async () => {
        const validRows = parsedData.filter(d => d.isValid)
        if (validRows.length === 0) {
            toast.error("No valid rows to import.")
            return
        }

        setIsImporting(true)
        setImportProgress(0)
        setImportSummary(null)

        let successCount = 0
        let failedCount = 0

        // Import sequentially or with limited concurrency to avoid API hammering and preserve order
        for (let i = 0; i < parsedData.length; i++) {
            const row = parsedData[i]
            if (!row.isValid) {
                continue
            }

            // Mark row as importing
            setParsedData(prev => prev.map((item, idx) => 
                idx === i ? { ...item, importStatus: "importing" } : item
            ))

            const payload = {
                userId: 0,
                firstName: row.firstName,
                lastName: row.lastName,
                gender: row.gender,
                employeeId: row.employeeId,
                email: row.email,
                phone: row.phone,
                companyId: row.companyId,
                branchId: row.branchId,
                departmentId: row.departmentId,
                role: row.role,
                handlerId: parseInt(row.handlerId) || 0,
                status: row.status,
                lastLogin: null,
                imageUrl: "",
                passwordHash: row.password,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }

            try {
                await usersApi.create(payload)
                successCount++
                setParsedData(prev => prev.map((item, idx) => 
                    idx === i ? { ...item, importStatus: "success" } : item
                ))
            } catch (err: any) {
                failedCount++
                setParsedData(prev => prev.map((item, idx) => 
                    idx === i ? { ...item, importStatus: "failed", importError: err.message || "API request failed" } : item
                ))
            }

            // Update Progress Percentage
            const progressPercent = Math.round(((i + 1) / parsedData.length) * 100)
            setImportProgress(progressPercent)
        }

        setIsImporting(false)
        setImportSummary({
            success: successCount,
            failed: failedCount,
            total: validRows.length
        })

        if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} users!`)
            onImportSuccess()
        }
        if (failedCount > 0) {
            toast.error(`Failed to import ${failedCount} users. See details below.`)
        }
    }

    const hasErrors = parsedData.some(d => !d.isValid)
    const validCount = parsedData.filter(d => d.isValid).length
    const totalCount = parsedData.length

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!isImporting) onOpenChange(val)
        }}>
            <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="pb-2 border-b">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Upload className="h-6 w-6 text-indigo-600" />
                        Import Employees & Users
                    </DialogTitle>
                    <DialogDescription>
                        Upload a spreadsheet file (.xlsx, .xls or .csv) to bulk import staff profiles. Download our master-linked template to ensure matching field values.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    {/* Top action grid: Download Template & File Upload */}
                    {!importSummary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border border-dashed border-indigo-200 rounded-xl p-5 flex flex-col justify-between bg-indigo-50/20">
                                <div>
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Download className="h-4 w-4 text-indigo-600" />
                                        1. Get Excel Template
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Downloads a spreadsheet preloaded with live validation sheets listing valid Companies, Branches, Departments, and Roles.
                                    </p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    className="mt-4 w-full md:w-auto self-start border-indigo-200 hover:bg-indigo-50 text-indigo-600"
                                    onClick={handleDownloadTemplate}
                                >
                                    Download Template
                                </Button>
                            </div>

                            <div className="border border-dashed border-slate-200 rounded-xl p-5 flex flex-col justify-center items-center bg-slate-50/30 relative">
                                <input 
                                    type="file" 
                                    accept=".xlsx,.xls,.csv" 
                                    onChange={handleFileUpload} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={isProcessingFile || isImporting}
                                />
                                <div className="text-center pointer-events-none space-y-2">
                                    {isProcessingFile ? (
                                        <>
                                            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                                            <p className="text-sm font-medium">Processing sheet data...</p>
                                        </>
                                    ) : file ? (
                                        <>
                                            <Check className="h-8 w-8 text-emerald-500 mx-auto" />
                                            <p className="text-sm font-medium text-slate-800">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">Click or drag to replace file</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                                            <p className="text-sm font-medium">Upload File</p>
                                            <p className="text-xs text-muted-foreground">Drag & drop or browse .xlsx / .csv</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress tracking */}
                    {isImporting && (
                        <div className="space-y-2 p-4 bg-indigo-50/30 border rounded-lg">
                            <div className="flex justify-between text-sm font-semibold">
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                    Importing rows to database...
                                </span>
                                <span>{importProgress}%</span>
                            </div>
                            <Progress value={importProgress} className="h-2 bg-slate-100" />
                        </div>
                    )}

                    {/* Import result summary */}
                    {importSummary && (
                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                            <h3 className="font-bold text-slate-800 text-base">Import Results</h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-3 bg-white rounded-lg border shadow-sm">
                                    <span className="block text-2xl font-bold text-slate-800">{importSummary.total}</span>
                                    <span className="text-[11px] text-muted-foreground uppercase font-medium">Total Queue</span>
                                </div>
                                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 shadow-sm">
                                    <span className="block text-2xl font-bold text-emerald-600">{importSummary.success}</span>
                                    <span className="text-[11px] text-emerald-600 uppercase font-medium">Success</span>
                                </div>
                                <div className="p-3 bg-red-50/50 rounded-lg border border-red-100 shadow-sm">
                                    <span className="block text-2xl font-bold text-red-600">{importSummary.failed}</span>
                                    <span className="text-[11px] text-red-600 uppercase font-medium">Failed</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Data Preview Section */}
                    {parsedData.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 text-sm">Data Preview & Validation</h3>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-muted-foreground">Total Rows: <strong>{totalCount}</strong></span>
                                    <span className="text-emerald-600">Valid: <strong>{validCount}</strong></span>
                                    {hasErrors && <span className="text-red-500 font-semibold">Errors: {totalCount - validCount}</span>}
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden max-h-[350px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-muted/70 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="w-[60px] text-center">Row</TableHead>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Email / Phone</TableHead>
                                            <TableHead>Org Hierarchy</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="w-[150px]">Validation Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.map((row, idx) => (
                                            <TableRow key={idx} className={row.isValid ? "" : "bg-red-50/20"}>
                                                <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                                    {row.rowNumber}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-slate-800">
                                                        {row.firstName} {row.lastName}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground font-mono">
                                                        {row.employeeId || "—"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs">{row.email || "—"}</div>
                                                    <div className="text-[10px] text-muted-foreground">{row.phone || "—"}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs font-semibold text-slate-700">{row.companyName}</div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {row.branchName} &rarr; {row.departmentName}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal">
                                                        {row.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {row.importStatus === "success" && (
                                                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Imported
                                                        </span>
                                                    )}
                                                    {row.importStatus === "failed" && (
                                                        <div className="space-y-1">
                                                            <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                                                                <XCircle className="h-3.5 w-3.5" />
                                                                Failed
                                                            </span>
                                                            <span className="block text-[9px] text-red-500 leading-tight">
                                                                {row.importError}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {row.importStatus === "importing" && (
                                                        <span className="flex items-center gap-1 text-xs text-indigo-600 animate-pulse font-semibold">
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            Saving...
                                                        </span>
                                                    )}
                                                    {row.importStatus === "idle" && (
                                                        <div className="space-y-1">
                                                            {row.isValid ? (
                                                                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    Ready
                                                                </span>
                                                            ) : (
                                                                <div className="space-y-0.5">
                                                                    {row.errors.map((err, eIdx) => (
                                                                        <span key={eIdx} className="flex items-start gap-1 text-[10px] text-red-600 leading-tight">
                                                                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                                                            {err}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {row.warnings.map((warn, wIdx) => (
                                                                <span key={wIdx} className="flex items-start gap-1 text-[10px] text-amber-600 leading-tight">
                                                                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                                                                    {warn}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 border-t gap-2 md:gap-0">
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        disabled={isImporting}
                    >
                        {importSummary ? "Close" : "Cancel"}
                    </Button>
                    {!importSummary && (
                        <Button 
                            onClick={handleStartImport}
                            disabled={isImporting || parsedData.length === 0 || validCount === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                `Import ${validCount} Valid Employees`
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
