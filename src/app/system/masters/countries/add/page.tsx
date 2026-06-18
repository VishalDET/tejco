"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X, Globe, DollarSign, Wallet, Loader2 } from "lucide-react"

import { countryMasterApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function AddCountryPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)

    // Form State
    const [countryName, setCountryName] = React.useState("")
    const [currencyType, setCurrencyType] = React.useState("")
    const [paymentType, setPaymentType] = React.useState("")

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!countryName || !currencyType || !paymentType) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsLoading(true)

        const payload = {
            countryId: 0,
            countryName,
            currencyType,
            paymentType,
        }

        try {
            await countryMasterApi.create(payload)
            toast.success("Country created successfully")
            router.push("/system/masters/countries")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast.error(`Failed to create country: ${message}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" type="button" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Add Country</h1>
                        <p className="text-muted-foreground">Add a new country configuration to the system master data.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-sky-600" />
                                Country Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="countryName">Country Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="countryName"
                                    placeholder="e.g. India, United States"
                                    required
                                    value={countryName}
                                    onChange={e => setCountryName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="currencyType" className="flex items-center gap-1">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        Currency Type <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="currencyType"
                                        placeholder="e.g. INR, USD, EUR"
                                        required
                                        value={currencyType}
                                        onChange={e => setCurrencyType(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="paymentType" className="flex items-center gap-1">
                                        <Wallet className="h-3.5 w-3.5" />
                                        Payment Type <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="paymentType"
                                        placeholder="e.g. UPI, NetBanking, PayPal"
                                        required
                                        value={paymentType}
                                        onChange={e => setPaymentType(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-4">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {isLoading ? "Saving..." : "Create Country"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
