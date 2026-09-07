
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Save, X, LayoutGrid, User, Building2, Loader2 } from "lucide-react"

import { apiClient } from "@/lib/api-client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export default function AddDepartmentPage() {
  const navigate = useNavigate()
    const router = useNavigate()
    const [isLoading, setIsLoading] = React.useState(false)
    const [isFetchingData, setIsFetchingData] = React.useState(true)
    
    // Lists
    const [companies, setCompanies] = React.useState<any[]>([])
    const [branches, setBranches] = React.useState<any[]>([])

    // Form State
    const [name, setName] = React.useState("")
    const [code, setCode] = React.useState("")
    const [companyId, setCompanyId] = React.useState("")
    const [branchId, setBranchId] = React.useState("")
    const [hod, setHod] = React.useState("")
    const [status, setStatus] = React.useState("Active")

    React.useEffect(() => {
        async function fetchData() {
            try {
                const [catsRes, branchesRes] = await Promise.all([
                    apiClient.get<any[]>("/api/SystemMasters/companies"),
                    apiClient.get<any[]>("/api/SystemMasters/branches")
                ])
                setCompanies(catsRes || [])
                setBranches(branchesRes || [])
            } catch (err) {
                toast.error("Failed to load initial data")
            } finally {
                setIsFetchingData(false)
            }
        }
        fetchData()
    }, [])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const selectedBranch = branches.find(b => b.id.toString() === branchId)

        const payload = {
            id: 0,
            companyId: parseInt(companyId),
            branchId: parseInt(branchId),
            name,
            code,
            hod,
            branch: selectedBranch?.name || "",
            status,
        }

        try {
            await apiClient.post("/api/SystemMasters/departments", payload)
            toast.success("Department created successfully")
            navigate("/system/masters/departments")
        } catch (err: any) {
            toast.error(err.message || "Failed to create department")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Add Department</h1>
                        <p className="text-muted-foreground">Define a new organizational unit.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LayoutGrid className="h-5 w-5 text-amber-600" />
                                Unit Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Department Name <span className="text-destructive">*</span></Label>
                                    <Input 
                                        id="name" 
                                        placeholder="e.g. Quality Assurance" 
                                        required 
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Dept Code <span className="text-destructive">*</span></Label>
                                    <Input 
                                        id="code" 
                                        placeholder="e.g. QA, SALES, HR" 
                                        required 
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="company">Company <span className="text-destructive">*</span></Label>
                                    <Select 
                                        required 
                                        value={companyId} 
                                        onValueChange={(val) => {
                                            setCompanyId(val || "")
                                            setBranchId("") // Reset branch when company changes
                                        }}
                                        disabled={isFetchingData}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select company">
                                                {companies.find(c => (c.id || c.companyId)?.toString() === companyId)?.name || companies.find(c => (c.id || c.companyId)?.toString() === companyId)?.registeredName}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map(c => (
                                                <SelectItem key={c.id || c.companyId} value={(c.id || c.companyId).toString()}>
                                                    {c.name || c.registeredName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="branch">Branch <span className="text-destructive">*</span></Label>
                                    <Select 
                                        required 
                                        value={branchId} 
                                        onValueChange={(val) => setBranchId(val || "")}
                                        disabled={isFetchingData || !companyId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select branch">
                                                {branches.find(b => (b.id || b.branchId || b.BranchID)?.toString() === branchId)?.name}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches
                                                .filter(b => {
                                                    const bCompId = b.companyId || b.companyID || b.CompanyID;
                                                    return String(bCompId) === String(companyId);
                                                })
                                                .map(b => (
                                                <SelectItem key={b.id || b.branchId || b.BranchID} value={(b.id || b.branchId || b.BranchID).toString()}>
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="hod">Head of Dept (HOD)</Label>
                                    <Input 
                                        id="hod" 
                                        placeholder="Assign HOD" 
                                        value={hod}
                                        onChange={e => setHod(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={status} onValueChange={(val) => setStatus(val || "")}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-4">
                        <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading ? "Saving..." : "Create Department"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
