"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Receipt } from "lucide-react"

export default function InvoicesPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                    <p className="text-muted-foreground">Manage sales invoices and track payment statuses.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Invoice
                </Button>
            </div>

            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Receipt className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardHeader>
                    <CardTitle>Invoice List Empty</CardTitle>
                    <CardDescription>
                        Ready to bill your clients? Create your first invoice here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline">Import from Orders</Button>
                </CardContent>
            </Card>
        </div>
    )
}
