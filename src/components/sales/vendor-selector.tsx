import { useState, useEffect, useRef } from "react"
import { Check, ChevronsUpDown, Search, Building2, Loader2, Plus, Tag, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { vendorsApi } from "@/lib/api"
import { Vendor } from "@/app/supply-chain/vendors/types"
import { VendorFormDialog } from "@/app/supply-chain/vendors/vendor-form-dialog"
import { cn } from "@/lib/utils"

export interface VendorSelectorProps {
  selectedVendorId?: string | number
  selectedVendorName?: string
  onSelect: (vendor: Vendor) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function VendorSelector({
  selectedVendorId,
  selectedVendorName,
  onSelect,
  placeholder = "Select Vendor / Supplier...",
  disabled = false,
  className,
}: VendorSelectorProps) {
  const [open, setOpen] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [fetchedSelectedVendor, setFetchedSelectedVendor] = useState<Vendor | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const selectedVendor =
    vendors.find(
      (v) =>
        (selectedVendorId && (String(v.id) === String(selectedVendorId) || String(v.vendorId) === String(selectedVendorId))) ||
        (selectedVendorName && (v.vendorName || v.name)?.toLowerCase().trim() === selectedVendorName.toLowerCase().trim())
    ) || fetchedSelectedVendor

  // Fetch vendor details if ID is passed externally but not yet in state
  useEffect(() => {
    if (selectedVendorId && !selectedVendor && String(selectedVendorId) !== "0") {
      vendorsApi
        .getById(String(selectedVendorId))
        .then((v) => {
          if (v && (v.name || v.vendorName)) setFetchedSelectedVendor(v)
        })
        .catch(() => {})
    }
  }, [selectedVendorId, selectedVendor])

  const fetchVendors = async (query: string, page = 1, append = false) => {
    if (page === 1) setIsLoading(true)
    else setIsLoadingMore(true)

    try {
      const res = await vendorsApi.getPaged({
        pageNumber: page,
        pageSize: 20,
        searchTerm: query ? query.trim() : undefined,
      })
      if (append) {
        setVendors((prev) => [...prev, ...res.vendors])
      } else {
        setVendors(res.vendors)
      }
      setTotalCount(res.totalCount)
      setPageNumber(page)
    } catch (err) {
      console.error("Failed to fetch vendors in VendorSelector:", err)
      if (!append) setVendors([])
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Live debounced search when dialog opens or search query changes
  useEffect(() => {
    if (!open) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchVendors(searchQuery, 1, false)
    }, 250)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [open, searchQuery])

  const handleSelect = (vendor: Vendor) => {
    onSelect(vendor)
    setFetchedSelectedVendor(vendor)
    setOpen(false)
  }

  const handleLoadMore = () => {
    if (isLoading || isLoadingMore) return
    if (vendors.length < totalCount) {
      fetchVendors(searchQuery, pageNumber + 1, true)
    }
  }

  const displayName = selectedVendor
    ? (selectedVendor.vendorName || selectedVendor.name)
    : (selectedVendorName || placeholder)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full flex items-center justify-between font-normal text-left min-w-0 max-w-full overflow-hidden h-9 px-3",
              !selectedVendor && !selectedVendorName && "text-muted-foreground",
              className
            )}
          >
            <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 pr-2">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{displayName}</span>
              {selectedVendor?.vendorPrefix && (
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono px-1 py-0 h-4 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0"
                >
                  {selectedVendor.vendorPrefix}
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <DialogTitle className="text-sm font-semibold">Find Vendor / Supplier</DialogTitle>
            {totalCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 font-mono">
                {totalCount} total
              </Badge>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10 mr-6 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              setIsCreateOpen(true)
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New Vendor
          </Button>
        </DialogHeader>

        <div className="p-3 border-b bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendor by name, GSTIN, mobile, prefix..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="h-80">
          <div className="p-1.5 space-y-1">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs">Searching vendors...</span>
              </div>
            ) : vendors.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2 px-4">
                <span className="text-xs">
                  {searchQuery ? `No vendors found matching "${searchQuery}".` : "No vendors available."}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 gap-1 text-primary text-xs h-8 cursor-pointer"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add "{searchQuery || "New Vendor"}"
                </Button>
              </div>
            ) : (
              <>
                {vendors.map((vendor) => {
                  const vId = vendor.vendorId || vendor.id
                  const isSelected =
                    (selectedVendorId && (String(vId) === String(selectedVendorId) || String(vendor.id) === String(selectedVendorId))) ||
                    (selectedVendorName && (vendor.vendorName || vendor.name)?.toLowerCase().trim() === selectedVendorName.toLowerCase().trim())

                  return (
                    <button
                      key={vendor.id || vendor.vendorId}
                      type="button"
                      onClick={() => handleSelect(vendor)}
                      className={cn(
                        "flex items-start justify-between w-full p-2.5 text-xs rounded-md transition-colors text-left border border-transparent cursor-pointer",
                        isSelected
                          ? "bg-primary/10 border-primary/30 text-foreground font-medium"
                          : "hover:bg-muted/60 text-foreground"
                      )}
                    >
                      <div className="min-w-0 flex-1 pr-2 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground text-xs truncate">
                            {vendor.vendorName || vendor.name}
                          </span>
                          {vendor.vendorPrefix && (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-mono px-1 py-0 h-4 border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                            >
                              {vendor.vendorPrefix}
                            </Badge>
                          )}
                          {vendor.status && (
                            <Badge
                              variant={vendor.status === "Active" ? "outline" : "secondary"}
                              className={cn(
                                "text-[9px] px-1 py-0 h-4",
                                vendor.status === "Active" && "text-emerald-700 dark:text-emerald-400 border-emerald-500/40"
                              )}
                            >
                              {vendor.status}
                            </Badge>
                          )}
                        </div>

                        <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {(vendor.contactPersonName || vendor.contactPerson) && (
                            <span>👤 {vendor.contactPersonName || vendor.contactPerson}</span>
                          )}
                          {(vendor.mobileNumber || vendor.phone) && (
                            <span className="font-mono flex items-center gap-0.5">
                              <Phone className="h-2.5 w-2.5 inline" /> {vendor.mobileNumber || vendor.phone}
                            </span>
                          )}
                          {vendor.gstin && (
                            <span className="font-mono flex items-center gap-0.5">
                              <Tag className="h-2.5 w-2.5 inline" /> GST: {vendor.gstin}
                            </span>
                          )}
                        </div>

                        {vendor.address && (
                          <div className="text-[10px] text-muted-foreground/80 line-clamp-1 flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{vendor.address.replace(/\n+/g, " ")}</span>
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 ml-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  )
                })}

                {vendors.length < totalCount && (
                  <div className="pt-2 pb-1 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="text-xs h-7 font-mono text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                          Loading more...
                        </>
                      ) : (
                        `Load more (${vendors.length} of ${totalCount})`
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>

      {isCreateOpen && (
        <VendorFormDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          vendor={searchQuery ? ({ name: searchQuery, vendorName: searchQuery } as any) : null}
          onSave={(newVendor) => {
            handleSelect(newVendor as Vendor)
            fetchVendors(newVendor.vendorName || newVendor.name || "", 1, false)
          }}
        />
      )}
    </Dialog>
  )
}
