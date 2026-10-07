import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
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
    UserPlus,
    Mail,
    Shield,
    Clock,
    Filter,
    Download,
    Users,
    KeyRound,
    Phone,
    Building,
    Loader2,
} from "lucide-react"

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
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RolesManagement } from "@/components/system/roles-management"
import { usersApi, rolesApi, systemMastersApi } from "@/lib/api"

export type User = {
    id: string
    userId: number
    name: string
    firstName: string
    lastName: string
    employeeId: string
    email: string
    phone: string
    roleId: number
    role: string
    departmentId?: number
    departmentName?: string
    branchId?: number
    branchName?: string
    companyId?: number
    companyName?: string
    gender?: string
    status: "Active" | "Inactive" | "Pending" | string
    lastLogin: string
    createdAt?: string
    image?: string
}
export default function UsersPage() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get("tab") || "users"

    const handleTabChange = (val: string) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            if (val === "users") {
                next.delete("tab")
            } else {
                next.set("tab", val)
            }
            return next
        })
    }

    const [userData, setUserData] = React.useState<User[]>([])
    const [isLoadingUsers, setIsLoadingUsers] = React.useState<boolean>(true)
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    React.useEffect(() => {
        let isMounted = true
        setIsLoadingUsers(true)

        Promise.all([
            usersApi.getAll().catch(() => []),
            rolesApi.getAll().catch(() => []),
            systemMastersApi.getDepartments().catch(() => []),
            systemMastersApi.getBranches().catch(() => []),
            systemMastersApi.getCompanies().catch(() => []),
        ])
            .then(([usersRes, rolesRes, deptsRes, branchesRes, compsRes]: any[]) => {
                if (!isMounted) return

                const rawUsers = Array.isArray(usersRes) ? usersRes : usersRes?.data || []
                const rolesList = Array.isArray(rolesRes) ? rolesRes : rolesRes?.data || []
                const deptsList = Array.isArray(deptsRes) ? deptsRes : deptsRes?.data || []
                const branchesList = Array.isArray(branchesRes) ? branchesRes : branchesRes?.data || []
                const compsList = Array.isArray(compsRes) ? compsRes : compsRes?.data || []

                // Create fast lookup maps
                const roleMap = new Map<number, string>()
                rolesList.forEach((r: any) => {
                    const id = Number(r.roleId ?? r.id ?? 0)
                    const name = r.roleName ?? r.name
                    if (id && name) roleMap.set(id, name)
                })

                const deptMap = new Map<number, string>()
                deptsList.forEach((d: any) => {
                    const id = Number(d.departmentId ?? d.DepartmentID ?? d.id ?? 0)
                    const name = String(d.departmentName ?? d.DepartmentName ?? d.name ?? "").trim()
                    if (id && name) deptMap.set(id, name)
                })

                const branchMap = new Map<number, string>()
                branchesList.forEach((b: any) => {
                    const id = Number(b.branchId ?? b.BranchID ?? b.id ?? 0)
                    const name = String(b.branchName ?? b.BranchName ?? b.name ?? "").trim()
                    if (id && name) branchMap.set(id, name)
                })

                const compMap = new Map<number, string>()
                compsList.forEach((c: any) => {
                    const id = Number(c.companyId ?? c.id ?? 0)
                    const name = c.companyName ?? c.registeredName ?? c.name
                    if (id && name) compMap.set(id, name)
                })

                if (rawUsers.length > 0) {
                    setUserData(
                        rawUsers.map((u: any) => {
                            const uRoleId = Number(u.roleId || 0)
                            const uDeptId = Number(u.departmentId || 0)
                            const uBranchId = Number(u.branchId || 0)
                            const uCompId = Number(u.companyId || 0)

                            const roleTitle =
                                u.role ||
                                roleMap.get(uRoleId) ||
                                (uRoleId === 1 ? "Admin" : uRoleId === 2 ? "Sales Manager" : uRoleId === 3 ? "Sales Person" : "Staff")

                            const deptTitle = deptMap.get(uDeptId)
                            const branchTitle = branchMap.get(uBranchId)
                            const compTitle = compMap.get(uCompId)

                            const fullName =
                                `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                                u.name ||
                                (u.employeeId ? `User (${u.employeeId})` : "User")

                            return {
                                id: String(u.userId || u.id || "USR-" + Math.floor(Math.random() * 900 + 100)),
                                userId: Number(u.userId || u.id || 0),
                                name: fullName,
                                firstName: u.firstName || "",
                                lastName: u.lastName || "",
                                employeeId: u.employeeId || "",
                                email: u.email || "",
                                phone: u.phone || "",
                                roleId: uRoleId,
                                role: roleTitle,
                                departmentId: uDeptId,
                                departmentName: deptTitle,
                                branchId: uBranchId,
                                branchName: branchTitle,
                                companyId: uCompId,
                                companyName: compTitle,
                                gender: u.gender || "",
                                status: (u.status as any) || "Active",
                                lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString("en-IN") : "Never",
                                createdAt: u.createdAt || "",
                                image: u.imageUrl || undefined,
                            }
                        })
                    )
                } else {
                    setUserData([])
                }
            })
            .catch(() => {
                // If API fails and mounted, fallback empty
                if (isMounted) setUserData([])
            })
            .finally(() => {
                if (isMounted) setIsLoadingUsers(false)
            })

        return () => {
            isMounted = false
        }
    }, [])

    const columns: ColumnDef<User>[] = [
        {
            accessorKey: "employeeId",
            header: "Emp ID",
            cell: ({ row }) => {
                const empId = row.original.employeeId
                return (
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {empId || "—"}
                    </span>
                )
            },
        },
        {
            accessorKey: "name",
            header: "User",
            cell: ({ row }) => {
                const user = row.original
                const initials = (
                    (user.firstName?.[0] || "") + (user.lastName?.[0] || "")
                ).toUpperCase() || user.name.substring(0, 2).toUpperCase()

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-xs text-slate-800">{user.name}</span>
                            {user.gender && (
                                <span className="text-[10px] text-muted-foreground capitalize">{user.gender}</span>
                            )}
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "email",
            header: "Contact Details",
            cell: ({ row }) => {
                const user = row.original
                return (
                    <div className="flex flex-col gap-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700">
                            <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[180px]">{user.email || "—"}</span>
                        </div>
                        {user.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span>{user.phone}</span>
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => {
                const role = row.getValue("role") as string
                const roleId = row.original.roleId
                return (
                    <div className="flex items-center gap-1.5">
                        <Shield className={`h-3.5 w-3.5 ${roleId === 1 ? "text-purple-600" : roleId === 2 ? "text-blue-600" : "text-emerald-600"}`} />
                        <Badge variant="outline" className={`text-xs font-semibold px-2 py-0 h-5 ${
                            roleId === 1
                                ? "border-purple-200 bg-purple-50 text-purple-700"
                                : roleId === 2
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}>
                            {role}
                        </Badge>
                    </div>
                )
            },
        },
        {
            id: "organization",
            header: "Dept & Branch",
            cell: ({ row }) => {
                const user = row.original
                const dept = user.departmentName
                const branch = user.branchName
                return (
                    <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-medium text-slate-700">{dept || (user.departmentId ? `Dept #${user.departmentId}` : "—")}</span>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Building className="h-3 w-3 shrink-0" />
                            <span>{branch || (user.branchId ? `Branch #${user.branchId}` : "—")}</span>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = (row.getValue("status") as string) || "Active"
                const isActive = status.toLowerCase() === "active"
                return (
                    <Badge
                        variant={isActive ? "default" : "secondary"}
                        className={isActive ? "bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-[11px] px-2 py-0 h-5" : "text-[11px] px-2 py-0 h-5"}
                    >
                        {status}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "createdAt",
            header: "Created / Active",
            cell: ({ row }) => {
                const created = row.original.createdAt
                const createdDateStr = created
                    ? new Date(created).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                      })
                    : "—"
                return (
                    <div className="flex flex-col text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span>{createdDateStr}</span>
                        </div>
                    </div>
                )
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
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
                            <DropdownMenuItem onClick={() => navigate(`/system/users/${row.original.id}/edit`)}>
                                Edit user details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTabChange("roles")}>
                                <KeyRound className="mr-2 h-4 w-4 text-indigo-600" />
                                Manage Role Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Deactivate user</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const table = useReactTable({
        data: userData,
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
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Access Management</h1>
                    <p className="text-muted-foreground">
                        Manage system user accounts, configure security roles, and assign granular permissions.
                    </p>
                </div>
                {activeTab === "users" && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button size="sm" render={<Link to="/system/users/add" />} nativeButton={false}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="bg-muted/60 p-1 border">
                    <TabsTrigger value="users" className="gap-2 text-xs font-semibold px-4">
                        <Users className="h-4 w-4" /> User Accounts
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="gap-2 text-xs font-semibold px-4">
                        <Shield className="h-4 w-4 text-indigo-600" /> Roles & Permissions
                    </TabsTrigger>
                </TabsList>

                {/* USERS TAB CONTENT */}
                <TabsContent value="users" className="mt-4">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg">System Users</CardTitle>
                            <CardDescription>
                                A list of all users with authenticated access to the Tejco ERP system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-4 border-b flex items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                                        onChange={(event) =>
                                            table.getColumn("name")?.setFilterValue(event.target.value)
                                        }
                                        className="pl-8 text-xs h-9"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            render={
                                                <Button variant="outline" size="sm" className="text-xs h-9">
                                                    <Filter className="mr-2 h-3.5 w-3.5" />
                                                    View Columns
                                                </Button>
                                            }
                                        />
                                        <DropdownMenuContent align="end" className="w-[160px]">
                                            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {table
                                                .getAllColumns()
                                                .filter((column) => column.getCanHide())
                                                .map((column) => {
                                                    return (
                                                        <DropdownMenuCheckboxItem
                                                            key={column.id}
                                                            className="capitalize text-xs"
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

                            <Table>
                                <TableHeader className="bg-muted/40">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                return (
                                                    <TableHead key={header.id} className="text-xs">
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
                                    {isLoadingUsers ? (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-44 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                                                    <p className="text-xs text-muted-foreground font-medium">Fetching system users...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                                className="hover:bg-muted/30"
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id} className="py-3 text-xs">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-32 text-center text-xs text-muted-foreground">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            <div className="flex items-center justify-between px-6 py-4 border-t text-xs">
                                <div className="text-muted-foreground">
                                    {table.getFilteredRowModel().rows.length} total user(s)
                                </div>
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        className="h-8 text-xs"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                        className="h-8 text-xs"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ROLES & PERMISSIONS TAB CONTENT */}
                <TabsContent value="roles" className="mt-4">
                    <RolesManagement />
                </TabsContent>
            </Tabs>
        </div>
    )
}
