"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"

export default function ChallansPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Delivery Challans</h1>
                    <p className="text-muted-foreground">Manage and track product deliveries to clients.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Challan
                </Button>
            </div>

            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardHeader>
                    <CardTitle>No Challans Generated</CardTitle>
                    <CardDescription>
                        Delivery challans will appear here once you start dispatching orders.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline">View Dispatched Orders</Button>
                </CardContent>
            </Card>
        </div>
    )
}
