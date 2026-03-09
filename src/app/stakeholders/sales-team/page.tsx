"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users2 } from "lucide-react"

export default function SalesTeamPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Team</h1>
                    <p className="text-muted-foreground">Manage sales representatives and territory assignments.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Representative
                </Button>
            </div>

            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Users2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardHeader>
                    <CardTitle>Team Roster Empty</CardTitle>
                    <CardDescription>
                        Start building your sales team to track performance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline">Assign Territories</Button>
                </CardContent>
            </Card>
        </div>
    )
}
