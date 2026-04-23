"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Search, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"

interface ProductVariant {
  variantId: number
  productId: number
  variantName: string
  skuSuffix: string
  purchasePrice: number
  sellingPrice: number
  currentQuantity: number
}

interface Product {
  productId: number
  productName: string
  baseSKU: string
  variants: ProductVariant[]
}

interface ProductSelectorProps {
  onSelect: (product: Product, variant: ProductVariant) => void
}

export function ProductSelector({ onSelect }: ProductSelectorProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && products.length === 0) {
      setIsLoading(true)
      apiClient.get<any>("/api/Product/GetAll")
        .then((resp) => {
          if (resp.success && Array.isArray(resp.data)) {
            setProducts(resp.data)
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [open, products.length])

  const flattenedResults: { product: Product, variant: ProductVariant }[] = []
  products.forEach(p => {
    p.variants.forEach(v => {
      const fullName = `${p.productName} ${v.variantName}`.toLowerCase()
      const search = searchQuery.toLowerCase()
      if (fullName.includes(search) || p.baseSKU.toLowerCase().includes(search) || (p.baseSKU + v.skuSuffix).toLowerCase().includes(search)) {
        flattenedResults.push({ product: p, variant: v })
      }
    })
  })

  const handleSelect = (item: { product: Product, variant: ProductVariant }) => {
    onSelect(item.product, item.variant)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          Add Product
        </Button>
      } />
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            Find Product / Variant
          </DialogTitle>
        </DialogHeader>
        <div className="p-2">
          <Input
            placeholder="Search by name, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-1">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading products...</div>
            ) : flattenedResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No products found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {flattenedResults.map((item, idx) => (
                  <button
                    key={`${item.product.productId}-${item.variant.variantId}-${idx}`}
                    onClick={() => handleSelect(item)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <div className="flex flex-col">
                      <div className="font-medium text-primary">{item.product.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.variant.variantName} | SKU: {item.product.baseSKU}{item.variant.skuSuffix}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="font-semibold">₹{item.variant.sellingPrice.toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">Stock: {item.variant.currentQuantity}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
