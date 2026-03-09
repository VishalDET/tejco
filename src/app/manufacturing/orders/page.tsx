"use client"

import * as React from "react"
import { Play, CheckCircle2, AlertCircle, Settings2, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const activeBatches = [
    {
        id: "MFG-B001",
        product: "Surgical Blade #10",
        quantity: 5000,
        progress: 75,
        status: "In Production",
        startTime: "2026-03-10 09:00 AM",
    },
    {
        id: "MFG-B002",
        product: "Medical Gauze",
        quantity: 2000,
        progress: 30,
        status: "Quality Check",
        startTime: "2026-03-10 11:30 AM",
    },
]

export default function ManufacturingPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manufacturing</h1>
                    <p className="text-muted-foreground">Monitor production lines and material consumption.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline"><Settings2 className="mr-2 h-4 w-4" /> Config</Button>
                    <Button><Play className="mr-2 h-4 w-4" /> New Batch</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Active Batches", value: "8", icon: Play, color: "text-blue-500" },
                    { label: "Completed (Today)", value: "24", icon: CheckCircle2, color: "text-emerald-500" },
                    { label: "Material Alerts", value: "2", icon: AlertCircle, color: "text-red-500" },
                    { label: "Efficiency", value: "94%", icon: Settings2, color: "text-indigo-500" },
                ].map((stat, i) => (
                    <Card key={i} className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Active Production Lines</CardTitle>
                        <CardDescription>Real-time status of ongoing manufacturing orders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Batch ID</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead className="w-[300px]">Progress</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeBatches.map((batch) => (
                                    <TableRow key={batch.id}>
                                        <TableCell className="font-medium">{batch.id}</TableCell>
                                        <TableCell>{batch.product}</TableCell>
                                        <TableCell>{batch.quantity.toLocaleString()} units</TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span>{batch.progress}%</span>
                                                    <span className="text-muted-foreground">{batch.startTime}</span>
                                                </div>
                                                <Progress value={batch.progress} className="h-2" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={batch.status === "In Production" ? "default" : "secondary"} className={batch.status === "In Production" ? "bg-blue-500" : ""}>
                                                {batch.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="gap-2">Details <ArrowRight className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Material Consumption (Predicted)</CardTitle>
                        <CardDescription>Estimated requirements for next 24 hours.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { name: "Surgical Titanium", used: 12, total: 45, unit: "kg" },
                            { name: "Medical Silicone", used: 35, total: 80, unit: "L" },
                            { name: "Sterile Packaging", used: 18, total: 12, unit: "Rolls" },
                        ].map((mat, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{mat.name}</span>
                                    <span className={mat.used > mat.total ? "text-red-500 font-bold" : "text-muted-foreground"}>
                                        {mat.used} / {mat.total} {mat.unit}
                                    </span>
                                </div>
                                <Progress value={(mat.used / mat.total) * 100} className={`h-1.5 ${mat.used > mat.total ? "bg-red-500/20" : ""}`} />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="shadow-sm bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle>Smart Planner</CardTitle>
                        <CardDescription className="text-primary-foreground/70">Optimization suggestions based on current stock.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                            <p className="text-sm">Low stock of <strong>Sterile Packaging</strong> will halt line #4 in <strong>2.5 hours</strong>. Expedite stock transfer from Warehouse B?</p>
                            <Button variant="secondary" size="sm" className="mt-4 w-full">Expedite Transfer</Button>
                        </div>
                        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                            <p className="text-sm">Batch #MFG-B001 is running 15% faster than expected. Recommend scheduling next setup for 02:45 PM.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
