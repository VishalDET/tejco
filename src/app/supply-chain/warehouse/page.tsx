"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Boxes, Search, MoreHorizontal, FileEdit, Trash2, MapPin, Phone, User, Loader2, AlertCircle, Info, LayoutGrid } from "lucide-react"
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
      (w.address && (
          w.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.address.pincode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.address.street.toLowerCase().includes(searchQuery.toLowerCase())
      )) ||
      (w.contactPerson && w.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Boxes className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Warehouse Master</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
               <Info className="h-3.5 w-3.5" /> Manage logistics hubs, storage infrastructure, and bin IDs.
            </p>
          </div>
        </div>
        <Button onClick={handleAddClick} disabled={isLoading} className="shadow-sm shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="py-5 bg-slate-50/50 border-b">
          <div className="flex items-center justify-between">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by name, city, or pincode..."
                className="pl-10 h-10 border-slate-200 focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {isLoading && warehouses.length > 0 && (
              <div className="flex items-center text-xs font-bold text-primary uppercase tracking-widest animate-pulse">
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Syncing Records...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-destructive/5 border-t border-dashed border-destructive/20">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <h3 className="font-bold text-destructive">System Alert: Database Sync Failed</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchWarehouses} className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white">
                Attempt Re-sync
              </Button>
            </div>
          ) : isLoading && warehouses.length === 0 ? (
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Warehouse Details</TableHead>
                  <TableHead className="font-bold text-slate-700">Location (City & Pincode)</TableHead>
                  <TableHead className="font-bold text-slate-700">Infrastructure</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-[180px]" /><Skeleton className="h-3 w-[100px] mt-2 text-slate-100" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[140px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : warehouses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center border-t border-dashed bg-slate-50/30">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl shadow-slate-200/50 mb-6">
                <Boxes className="h-10 w-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No Warehouses Registered</h3>
              <p className="mb-8 text-sm text-slate-500 max-w-sm font-medium">
                You haven't defined any storage facilities yet. Initialize your first hub to start mapping inventory bins.
              </p>
              <Button onClick={handleAddClick} size="lg" className="px-8 shadow-lg shadow-primary/20">Create First Hub</Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 pl-6">Warehouse Details</TableHead>
                  <TableHead className="font-bold text-slate-700">Address Info</TableHead>
                  <TableHead className="font-bold text-slate-700">Contact</TableHead>
                  <TableHead className="font-bold text-slate-700">Capacity</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                  <TableHead className="w-[50px] pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-400 bg-slate-50/10">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-5 w-5 opacity-20" />
                        <span className="font-medium text-sm italic">No records matching "{searchQuery}"</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWarehouses.map((warehouse) => (
                    <TableRow key={warehouse.id} className="hover:bg-slate-50/40 transition-colors group">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <Boxes className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                           </div>
                           <div className="flex flex-col">
                             <span className="font-bold text-slate-900 leading-tight">{warehouse.name}</span>
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {warehouse.id}</span>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 max-w-[220px]">
                           <div className="text-sm font-bold text-slate-700 truncate">{warehouse.address.city}, {warehouse.address.state}</div>
                           <div className="text-[11px] text-slate-400 font-medium truncate italic">{warehouse.address.street} - {warehouse.address.pincode}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <User className="h-3 w-3 text-slate-300" />
                            {warehouse.contactPerson || "No Manager"}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                            <Phone className="h-3 w-3 text-slate-300" />
                            {warehouse.contactNumber || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant="outline" className="text-[10px] font-black border-slate-200 bg-white">
                            {warehouse.racks?.reduce((sum, r) => sum + (r.shelves?.length || 0), 0) || 0} BINS
                          </Badge>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter ml-1">
                            {warehouse.racks?.length || 0} RACKS DEFINED
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          className={`rounded-md font-bold text-[10px] uppercase tracking-wider py-1 px-2.5 border-none shadow-sm ${
                            warehouse.status === "Active" 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {warehouse.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                                <span className="sr-only">Open actions</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-52 p-2">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 px-2">Administration</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditClick(warehouse)} className="gap-2 rounded-md font-bold text-slate-700">
                              <FileEdit className="h-4 w-4 text-primary" /> Edit Parameters
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 rounded-md font-bold text-slate-700">
                              <LayoutGrid className="h-4 w-4 text-primary" /> Map Bins
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem
                              className="gap-2 rounded-md font-bold text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => handleDeleteClick(warehouse.id)}
                            >
                              <Trash2 className="h-4 w-4" /> Decommission Hub
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
