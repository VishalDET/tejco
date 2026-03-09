"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Factory } from "lucide-react"

export default function BatchesPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Production Batches</h1>
                    <p className="text-muted-foreground">Monitor active and historical manufacturing batches.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Batch
                </Button>
            </div>

            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Factory className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardHeader>
                    <CardTitle>No Active Batches</CardTitle>
                    <CardDescription>
                        You don't have any production batches running at the moment.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline">Schedule new production</Button>
                </CardContent>
            </Card>
        </div>
    )
}
