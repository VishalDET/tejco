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
import { usersApi } from "@/lib/api"

export type User = {
    id: string
    name: string
    email: string
    role: string
    status: "Active" | "Inactive" | "Pending"
    lastLogin: string
    image?: string
}

const INITIAL_USERS: User[] = [
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

    const [userData, setUserData] = React.useState<User[]>(INITIAL_USERS)
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    React.useEffect(() => {
        let isMounted = true
        usersApi
            .getAll()
            .then((res: any) => {
                if (!isMounted) return
                const list = Array.isArray(res) ? res : res?.data || []
                if (list.length > 0) {
                    setUserData(
                        list.map((u: any) => ({
                            id: String(u.userId || u.id || "USR-" + Math.floor(Math.random() * 900 + 100)),
                            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.name || "User",
                            email: u.email || "",
                            role: u.role || (u.roleId === 1 ? "Administrator" : "Staff"),
                            status: (u.status as any) || "Active",
                            lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never",
                            image: u.imageUrl || undefined,
                        }))
                    )
                }
            })
            .catch(() => {
                // Keep initial fallback users
            })
        return () => {
            isMounted = false
        }
    }, [])

    const columns: ColumnDef<User>[] = [
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
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => {
                const role = row.getValue("role") as string
                return (
                    <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="font-medium text-xs">{role}</span>
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
                        className={status === "Active" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}
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
                                    {table.getRowModel().rows?.length ? (
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
