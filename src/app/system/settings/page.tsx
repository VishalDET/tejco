"use client"

import * as React from "react"
import { Save, User, Shield, Bell, Globe, Database, Smartphone, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Configure your ERP system preferences and integrations.</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[600px] lg:grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="billing">Tax & Billing</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 mt-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Organization Profile</CardTitle>
                            <CardDescription>Update your company details and branding.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company-name">Company Name</Label>
                                    <Input id="company-name" defaultValue="Tejco Healthcare Pvt Ltd" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax-id">Tax ID / GSTIN</Label>
                                    <Input id="tax-id" defaultValue="27AAAAA0000A1Z5" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Support Email</Label>
                                    <Input id="email" type="email" defaultValue="support@tejco.healthcare" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Default Currency</Label>
                                    <Select defaultValue="usd">
                                        <SelectTrigger id="currency">
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="usd">USD ($)</SelectItem>
                                            <SelectItem value="inr">INR (₹)</SelectItem>
                                            <SelectItem value="eur">EUR (€)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <div className="flex justify-end">
                                <Button className="gap-2"><Save className="h-4 w-4" /> Save Changes</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Regional Settings</CardTitle>
                            <CardDescription>Timezone and locale preferences.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Timezone</Label>
                                    <Select defaultValue="ist">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ist">India (GMT+5:30)</SelectItem>
                                            <SelectItem value="utc">UTC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="integrations" className="space-y-6 mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            { name: "WhatsApp Business", desc: "Send automated invoices and order updates.", icon: Smartphone, status: "Connected", action: "Configure" },
                            { name: "Tally Integration", desc: "Sync financial data with Tally Prime.", icon: Database, status: "Disconnected", action: "Connect" },
                            { name: "Stripe Payments", desc: "Accept online payments from clients.", icon: Zap, status: "Connected", action: "Manage" },
                        ].map((service, i) => (
                            <Card key={i} className="shadow-sm">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <service.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold">{service.name}</CardTitle>
                                        <Badge variant={service.status === "Connected" ? "secondary" : "outline"} className={service.status === "Connected" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : ""}>
                                            {service.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-muted-foreground mb-4">{service.desc}</p>
                                    <Button variant="outline" size="sm" className="w-full">{service.action}</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
