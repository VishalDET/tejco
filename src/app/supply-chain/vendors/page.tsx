"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Warehouse } from "lucide-react"

export default function VendorsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
                    <p className="text-muted-foreground">Manage your raw material suppliers and vendors.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vendor
                </Button>
            </div>

            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Warehouse className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardHeader>
                    <CardTitle>No Vendors Found</CardTitle>
                    <CardDescription>
                        You haven't added any vendors to your supply chain yet.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline">Import Vendors from CSV</Button>
                </CardContent>
            </Card>
        </div>
    )
}
