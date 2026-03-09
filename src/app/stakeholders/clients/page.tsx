"use client"

import * as React from "react"
import { Search, Plus, MapPin, Phone, Wallet, MoreHorizontal, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const clients = [
    {
        name: "Dr. Aris Varma",
        clinic: "Varma Dental Care",
        city: "Mumbai",
        phone: "+91 98765 43210",
        balance: 4500.00,
        status: "Regular",
        initials: "AV",
    },
    {
        name: "Dr. Shreya Shah",
        clinic: "City Eye Center",
        city: "Pune",
        phone: "+91 91234 56789",
        balance: 0.00,
        status: "Premium",
        initials: "SS",
    },
    {
        name: "Dr. Kabir Singh",
        clinic: "Singh Ortho Care",
        city: "Delhi",
        phone: "+91 99887 76655",
        balance: 12850.50,
        status: "Regular",
        initials: "KS",
    },
    {
        name: "Apollo Hospitals",
        clinic: "Procurement Dept",
        city: "Hyderabad",
        phone: "+91 40 1234 5678",
        balance: 0.00,
        status: "Enterprise",
        initials: "AH",
    },
]

export default function ClientsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Doctors & Clients</h1>
                    <p className="text-muted-foreground">Manage relationships and outstanding balances with your clients.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Client
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search name, clinic or city..." className="pl-8" />
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-9 px-3 gap-2">
                        <UserCheck className="h-4 w-4" /> 154 Active
                    </Badge>
                    <Badge variant="outline" className="h-9 px-3 gap-2 text-red-500 border-red-200">
                        <Wallet className="h-4 w-4" /> 12 Pending Payments
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {clients.map((client, i) => (
                    <Card key={i} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <Avatar className="h-12 w-12 border-2 border-primary/10">
                                <AvatarFallback className="bg-primary/5 text-primary font-bold">{client.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-base font-bold">{client.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1 mt-0.5">
                                    {client.status === "Enterprise" ? (
                                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-[10px] h-4">Corporate</Badge>
                                    ) : client.status === "Premium" ? (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] h-4">VIP</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] h-4">Client</Badge>
                                    )}
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 pt-2">
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate">{client.clinic}, {client.city}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span>{client.phone}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Outstanding</span>
                                        <span className={`text-lg font-bold ${client.balance > 0 ? "text-red-500" : "text-emerald-500"}`}>
                                            ${client.balance.toLocaleString()}
                                        </span>
                                    </div>
                                    <Button variant="outline" size="sm" className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20">
                                        View Ledger
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
