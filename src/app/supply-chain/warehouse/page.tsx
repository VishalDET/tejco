"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Boxes, Search, MoreHorizontal, FileEdit, Trash2, MapPin, Phone, User, Loader2, AlertCircle } from "lucide-react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Warehouse } from "./types"
import { WarehouseFormDialog } from "./warehouse-form-dialog"
import { warehousesApi } from "@/lib/api"

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)

  const fetchWarehouses = async () => {
    try {
      setIsLoading(true)
      const data = await warehousesApi.getAll()
      setWarehouses(data)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching warehouses:", err)
      setError(err.message || "Failed to load warehouses")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const handleAddClick = () => {
    setSelectedWarehouse(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse)
    setIsFormOpen(true)
  }

  const handleDeleteClick = async (warehouseId: string) => {
    if (confirm("Are you sure you want to delete this warehouse? This action cannot be undone.")) {
      try {
        await warehousesApi.remove(warehouseId)
        setWarehouses((prev) => prev.filter((w) => w.id !== warehouseId))
      } catch (err) {
        alert("Failed to delete warehouse")
      }
    }
  }

  const handleSaveWarehouse = async (warehouseData: Partial<Warehouse>) => {
    try {
      if (selectedWarehouse) {
        await warehousesApi.update(selectedWarehouse.id, warehouseData)
      } else {
        await warehousesApi.create(warehouseData)
      }
      fetchWarehouses()
    } catch (err) {
      console.error("Error saving warehouse:", err)
      throw err
    }
  }

  const filteredWarehouses = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.address && w.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.contactPerson && w.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouse</h1>
          <p className="text-muted-foreground">Monitor warehouse locations and storage capacity.</p>
        </div>
        <Button onClick={handleAddClick} disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search warehouses..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {isLoading && warehouses.length > 0 && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-destructive/5 border-t border-dashed border-destructive/20">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <h3 className="font-semibold text-destructive">Failed to load warehouses</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchWarehouses}>
                Try Again
              </Button>
            </div>
          ) : isLoading && warehouses.length === 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[60px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : warehouses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border-t border-dashed text-balance">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Boxes className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-balance">No Warehouses Configured</h3>
              <p className="mb-4 text-sm text-muted-foreground text-balance">
                Set up your primary storage locations to start tracking inventory.
              </p>
              <Button onClick={handleAddClick}>Add Your First Warehouse</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No warehouses match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWarehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                           <Boxes className="h-4 w-4 text-muted-foreground" />
                           {warehouse.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {warehouse.contactPerson || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {warehouse.contactNumber || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{warehouse.address || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={warehouse.status === "Active" ? "default" : "secondary"}>
                          {warehouse.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditClick(warehouse)}>
                              <FileEdit className="mr-2 h-4 w-4" /> Edit Warehouse
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                              onClick={() => handleDeleteClick(warehouse.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Warehouse
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <WarehouseFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        warehouse={selectedWarehouse}
        onSave={handleSaveWarehouse}
      />
    </div>
  )
}
