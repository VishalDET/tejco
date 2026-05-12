"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    MoreHorizontal,
    Plus,
    Search,
    Shield,
    Clock,
    Filter,
    Download,
    Loader2,
    AlertCircle,
} from "lucide-react"

import { apiClient, usersApi, systemMastersApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// ─── API Types ────────────────────────────────────────────────────────────────

type ApiUser = {
    userId: number
    firstName: string
    lastName: string
    gender: string
    employeeId: string
    email: string
    phone: string
    companyId: number
    branchId: number
    departmentId: number
    role: string
    handlerId: number
    status: string
    lastLogin: string | null
    imageUrl: string | null
    passwordHash: string | null
    createdAt: string
    updatedAt: string | null
}

const data: User[] = [
    {
        id: "USR-001",
        name: "Admin User",
        email: "admin@tejco.com",
        role: "Administrator",
        status: "Active",
        lastLogin: "2026-03-09 10:45 AM",
        image: "/avatars/01.png",
    },
    {
        id: "USR-002",
        name: "Dr. Vishal Kumar",
        email: "vishal.k@tejco.com",
        role: "Manager",
        status: "Active",
        lastLogin: "2026-03-09 09:12 AM",
        image: "/avatars/02.png",
    },
    {
        id: "USR-003",
        name: "Sales Coordinator",
        email: "sales@tejco.com",
        role: "Sales",
        status: "Inactive",
        lastLogin: "2026-03-07 04:30 PM",
    },
    {
        id: "USR-004",
        name: "Inventory Manager",
        email: "inventory@tejco.com",
        role: "Warehouse",
        status: "Active",
        lastLogin: "2026-03-09 11:05 AM",
    },
]

export type User = {
    id: string
    name: string
    email: string
    role: string
    status: "Active" | "Inactive" | "Pending"
    lastLogin: string
    image?: string
    companyName?: string
    departmentName?: string
}

function mapApiUser(u: ApiUser, companies: any[], departments: any[]): User {
    const company = companies.find(c => (c.id || c.companyId) === u.companyId)
    const department = departments.find(d => (d.id || d.departmentId) === u.departmentId)

    return {
        id: String(u.userId),
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        role: u.role,
        status: (u.status as User["status"]) || "Active",
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never",
        image: u.imageUrl || undefined,
        companyName: company?.name || company?.registeredName || `ID: ${u.companyId}`,
        departmentName: department?.name || `ID: ${u.departmentId}`,
    }
}

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => {
            const user = row.original
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "companyName",
        header: "Company",
        cell: ({ row }) => <span className="text-sm">{row.getValue("companyName")}</span>,
    },
    {
        accessorKey: "departmentName",
        header: "Department",
        cell: ({ row }) => <Badge variant="outline" className="font-normal">{row.getValue("departmentName")}</Badge>,
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
            const role = row.getValue("role") as string
            return (
                <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{role}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge
                    variant={status === "Active" ? "default" : "secondary"}
                    className={status === "Active" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                >
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "lastLogin",
        header: "Last Login",
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs">{row.getValue("lastLogin")}</span>
                </div>
            )
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row, table }) => {
            const user = row.original
            const meta = table.options.meta as { onDelete: (id: string) => void }
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
                            Copy user ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.location.href = `/system/masters/users/${row.original.id}/edit`}>
                             Edit user details
                         </DropdownMenuItem>
 
                        <DropdownMenuItem>Edit permissions</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => meta.onDelete(user.id)}
                        >
                            Delete user
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

export default function UsersPage() {
    const router = useRouter()
    const [data, setData] = React.useState<User[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const [isDeleting, setIsDeleting] = React.useState(false)
    const [userToDelete, setUserToDelete] = React.useState<string | null>(null)

    React.useEffect(() => {
        async function loadData() {
            try {
                const [usersRaw, companies, departments] = await Promise.all([
                    usersApi.getAll(),
                    systemMastersApi.getCompanies(),
                    systemMastersApi.getDepartments()
                ])
                setData(usersRaw.map(u => mapApiUser(u, companies, departments)))
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const handleDelete = async () => {
        if (!userToDelete) return
        setIsDeleting(true)
        try {
            await usersApi.remove(userToDelete)
            setData(prev => prev.filter(u => u.id !== userToDelete))
            toast.success("User deleted successfully")
            setUserToDelete(null)
        } catch (err: any) {
            toast.error(`Failed to delete user: ${err.message}`)
        } finally {
            setIsDeleting(false)
        }
    }

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        meta: {
            onDelete: (id: string) => setUserToDelete(id),
        }
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users & Employees</h1>
                    <p className="text-muted-foreground">Manage system users and employee records within the organization.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button render={<Link href="/system/masters/users/add" />} nativeButton={false}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User / Employee
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to load users</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Staff Directory</CardTitle>
                    <CardDescription>A list of all users and employees with system access.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Loading users…</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between py-4 gap-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                                        onChange={(event) =>
                                            table.getColumn("name")?.setFilterValue(event.target.value)
                                        }
                                        className="pl-8"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            render={
                                                <Button variant="outline" size="sm" className="hidden lg:flex">
                                                    <Filter className="mr-2 h-4 w-4" />
                                                    View
                                                </Button>
                                            }
                                        />
                                        <DropdownMenuContent align="end" className="w-[150px]">
                                            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {table
                                                .getAllColumns()
                                                .filter((column) => column.getCanHide())
                                                .map((column) => {
                                                    return (
                                                        <DropdownMenuCheckboxItem
                                                            key={column.id}
                                                            className="capitalize"
                                                            checked={column.getIsVisible()}
                                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                                        >
                                                            {column.id}
                                                        </DropdownMenuCheckboxItem>
                                                    )
                                                })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => {
                                                    return (
                                                        <TableHead key={header.id}>
                                                            {header.isPlaceholder
                                                                ? null
                                                                : flexRender(
                                                                    header.column.columnDef.header,
                                                                    header.getContext()
                                                                )}
                                                        </TableHead>
                                                    )
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableHeader>
                                    <TableBody>
                                        {table.getRowModel().rows?.length ? (
                                            table.getRowModel().rows.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    data-state={row.getIsSelected() && "selected"}
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                                    No users found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex items-center justify-end space-x-2 py-4">
                                <div className="flex-1 text-sm text-muted-foreground">
                                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                    {table.getFilteredRowModel().rows.length} row(s) selected.
                                </div>
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!userToDelete} onOpenChange={() => !isDeleting && setUserToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the user account
                            and remove their data from our servers.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserToDelete(null)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
