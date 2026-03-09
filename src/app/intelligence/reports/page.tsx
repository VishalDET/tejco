"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BarChart3, FileText } from "lucide-react"

export default function ReportsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">Generate and export business intelligence reports.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Report
                </Button>
            </div>

            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardHeader>
                    <CardTitle>No Scheduled Reports</CardTitle>
                    <CardDescription>
                        Configure reports to be generated automatically or on-demand.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline">View Report Templates</Button>
                </CardContent>
            </Card>
        </div>
    )
}
