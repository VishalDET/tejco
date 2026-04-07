import { notFound } from "next/navigation"
import { MOCK_VENDORS } from "../data"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Building2, Mail, MapPin, Phone, ReceiptText, ArrowLeft } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function VendorDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const vendor = MOCK_VENDORS.find((v) => v.id === params.id)

  if (!vendor) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/supply-chain/vendors">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{vendor.name}</h1>
            <Badge variant={vendor.status === "Active" ? "default" : "secondary"} className="text-sm">
              {vendor.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">Comprehensive overview, product catalog, and transaction history.</p>
        </div>
      </div>

      <Card className="flex flex-col h-full shadow-sm">
        <Tabs defaultValue="overview" className="flex-1 flex flex-col pt-2">
          <div className="px-6 border-b">
            <TabsList className="w-full justify-start rounded-none bg-transparent p-0">
              <TabsTrigger
                value="overview"
                className="relative h-full rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="relative h-full rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Products Supplied
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="relative h-full rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Purchase History
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="relative h-full rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Payment Ledger
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 px-6 py-6 w-full">
            <TabsContent value="overview" className="mt-0 space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-base font-semibold border-b pb-2">Contact Information</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">Contact Person</p>
                        <p className="text-sm text-muted-foreground">{vendor.contactPerson || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">Email Address</p>
                        <a href={`mailto:${vendor.email}`} className="text-sm text-blue-600 hover:underline">
                          {vendor.email || "N/A"}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">Phone Number</p>
                        <a href={`tel:${vendor.phone}`} className="text-sm text-blue-600 hover:underline">
                          {vendor.phone || "N/A"}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-semibold border-b pb-2">Business Details</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50">
                        <ReceiptText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">GSTIN</p>
                        <p className="text-sm font-mono tracking-wide text-muted-foreground">{vendor.gstin || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 shrink-0">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">Registered Address</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{vendor.address || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="products" className="mt-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                          No products found for this vendor.
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendor.products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{product.price.toFixed(2)} <span className="text-muted-foreground text-xs font-normal">/ {product.unit}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.purchaseHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                          No purchase history found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendor.purchaseHistory.map((history) => (
                        <TableRow key={history.id}>
                          <TableCell className="font-medium">{history.poNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{history.date}</TableCell>
                          <TableCell className="text-right font-medium">₹{history.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={history.status === "Completed" ? "outline" : "secondary"}>
                              {history.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                          No payments recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendor.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-muted-foreground">{payment.date}</TableCell>
                          <TableCell className="font-medium">{payment.reference}</TableCell>
                          <TableCell className="text-muted-foreground">{payment.method}</TableCell>
                          <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">₹{payment.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  )
}
