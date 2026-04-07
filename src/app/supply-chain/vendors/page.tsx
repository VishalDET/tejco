"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Warehouse, Search, MoreHorizontal, FileEdit, Trash2, Eye } from "lucide-react"
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
import { Vendor } from "./types"
import { MOCK_VENDORS } from "./data"
import { VendorFormDialog } from "./vendor-form-dialog"
import { useRouter } from "next/navigation"

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Simulate API fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setVendors(MOCK_VENDORS)
      setIsLoading(false)
    }, 1200)

    return () => clearTimeout(timer)
  }, [])

  const router = useRouter()
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)

  const handleAddClick = () => {
    setSelectedVendor(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsFormOpen(true)
  }

  const handleViewDetailsClick = (vendor: Vendor) => {
    router.push(`/supply-chain/vendors/${vendor.id}`)
  }

  const handleDeleteClick = (vendorId: string) => {
    if (confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      setVendors((prev) => prev.filter((v) => v.id !== vendorId))
    }
  }

  const handleSaveVendor = (vendorToSave: Vendor) => {
    setVendors((prev) => {
      const exists = prev.find((v) => v.id === vendorToSave.id)
      if (exists) {
        return prev.map((v) => (v.id === vendorToSave.id ? vendorToSave : v))
      }
      return [vendorToSave, ...prev]
    })
  }

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.gstin.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vendors
          </h1>
          <p className="text-muted-foreground">Manage your raw material suppliers and vendors.</p>
        </div>
        <Button onClick={handleAddClick} disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vendors..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[130px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[60px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border-t border-dashed">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Warehouse className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No Vendors Found</h3>
              <p className="mb-4 text-sm text-muted-foreground text-balance">
                You haven't added any vendors to your supply chain yet. Let's add your first one!
              </p>
              <Button onClick={handleAddClick}>Add Vendor</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No vendors match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.contactPerson}</TableCell>
                      <TableCell>{vendor.email}</TableCell>
                      <TableCell>{vendor.gstin || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={vendor.status === "Active" ? "default" : "secondary"}>
                          {vendor.status}
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
                            <DropdownMenuItem onClick={() => handleViewDetailsClick(vendor)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClick(vendor)}>
                              <FileEdit className="mr-2 h-4 w-4" /> Edit Vendor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                              onClick={() => handleDeleteClick(vendor.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Vendor
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

      {/* Add/Edit Form Dialog */}
      <VendorFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        vendor={selectedVendor}
        onSave={handleSaveVendor}
      />

    </div>
  )
}

