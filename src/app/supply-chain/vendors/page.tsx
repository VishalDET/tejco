import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, MoreHorizontal, FileEdit, Trash2, Eye } from "lucide-react"
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
import { vendorsApi } from "@/lib/api"
import { VendorFormDialog } from "./vendor-form-dialog"
import { useNavigate } from "react-router-dom"

export default function VendorsPage() {
  const navigate = useNavigate()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const loadVendors = async () => {
    setIsLoading(true)
    try {
      const data = await vendorsApi.getAll()
      setVendors(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load vendors:", err)
      setVendors([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadVendors()
  }, [])

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
    navigate(`/supply-chain/vendors/${vendor.id}`)
  }

  const handleDeleteClick = async (vendorId: string) => {
    if (confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      try {
        await vendorsApi.remove(vendorId)
        loadVendors()
      } catch (err) {
        console.error("Failed to delete vendor:", err)
      }
    }
  }

  const handleSaveVendor = async (vendorToSave: Vendor) => {
    try {
      if (vendorToSave.id && vendorToSave.id !== "0") {
        await vendorsApi.update(vendorToSave.id, vendorToSave)
      } else {
        await vendorsApi.create(vendorToSave)
      }
      loadVendors()
    } catch (err) {
      console.error("Failed to save vendor:", err)
    }
  }

  const filteredVendors = vendors.filter(
    (v) =>
      (v.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.contactPerson || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.gstin || "").toLowerCase().includes(searchQuery.toLowerCase())
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
                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <h3 className="mt-4 text-lg font-semibold">No Vendors Found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                No vendors match your search criteria or none have been added yet.
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
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.contactPerson || "-"}</TableCell>
                    <TableCell>{vendor.email || "-"}</TableCell>
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
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetailsClick(vendor)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClick(vendor)}>
                            <FileEdit className="mr-2 h-4 w-4" /> Edit Vendor
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(vendor.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Vendor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VendorFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        vendor={selectedVendor}
        onSave={handleSaveVendor}
      />
    </div>
  )
}
