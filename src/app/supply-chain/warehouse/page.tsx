"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Boxes } from "lucide-react"

export default function WarehousePage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Warehouse</h1>
                    <p className="text-muted-foreground">Monitor warehouse locations and storage capacity.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Warehouse
                </Button>
            </div>

            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Boxes className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardHeader>
                    <CardTitle>Main Warehouse Not Configured</CardTitle>
                    <CardDescription>
                        Set up your primary storage locations to start tracking inventory.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline">Set up Warehouse</Button>
                </CardContent>
            </Card>
        </div>
    )
}
