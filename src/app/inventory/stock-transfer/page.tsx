"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeftRight } from "lucide-react"

export default function StockTransferPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Transfer</h1>
                    <p className="text-muted-foreground">Manage and track inventory movement between warehouses.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Transfer
                </Button>
            </div>

            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <ArrowLeftRight className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardHeader>
                    <CardTitle>No Transfer Records</CardTitle>
                    <CardDescription>
                        Start by creating your first stock transfer request.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline">Learn more about transfers</Button>
                </CardContent>
            </Card>
        </div>
    )
}
