"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, X, Globe, DollarSign, Wallet, Loader2, AlertCircle } from "lucide-react"

import { countryMasterApi, CountryMaster } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function EditCountryPage() {
    const router = useRouter()
    const params = useParams()
    const countryId = params.id ? String(params.id) : ""

    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Form State
    const [countryName, setCountryName] = React.useState("")
    const [currencyType, setCurrencyType] = React.useState("")
    const [paymentType, setPaymentType] = React.useState("")
    const [createdAt, setCreatedAt] = React.useState("")

    React.useEffect(() => {
        async function fetchCountry() {
            if (!countryId) return
            try {
                setIsLoading(true)
                const data = await countryMasterApi.getById(countryId)
                if (data) {
                    setCountryName(data.countryName || "")
                    setCurrencyType(data.currencyType || "")
                    setPaymentType(data.paymentType || "")
                    setCreatedAt(data.createdAt || "")
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to load country details"
                setError(message)
                toast.error(message)
            } finally {
                setIsLoading(false)
            }
        }
        fetchCountry()
    }, [countryId])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!countryName || !currencyType || !paymentType) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSaving(true)

        const payload: CountryMaster = {
            countryId: parseInt(countryId),
            countryName,
            currencyType,
            paymentType,
            createdAt,
            updatedAt: new Date().toISOString(),
        }

        try {
            await countryMasterApi.update(countryId, payload)
            toast.success("Country updated successfully")
            router.push("/system/masters/countries")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast.error(`Failed to update country: ${message}`)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading details...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto items-center mt-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-bold">Failed to Load Country</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button variant="outline" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" type="button" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Country</h1>
                        <p className="text-muted-foreground">Update configuration settings for {countryName}.</p>
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
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
