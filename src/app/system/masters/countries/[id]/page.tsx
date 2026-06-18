"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Edit, Globe, DollarSign, Wallet, Calendar, Loader2, AlertCircle } from "lucide-react"

import { countryMasterApi, CountryMaster } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function CountryDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const countryId = params.id ? String(params.id) : ""

    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [country, setCountry] = React.useState<CountryMaster | null>(null)

    React.useEffect(() => {
        async function fetchCountry() {
            if (!countryId) return
            try {
                setIsLoading(true)
                const data = await countryMasterApi.getById(countryId)
                setCountry(data)
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading details...</span>
            </div>
        )
    }

    if (error || !country) {
        return (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto items-center mt-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-bold">Failed to Load Country</h2>
                <p className="text-muted-foreground">{error || "Country details not found"}</p>
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
                        <h1 className="text-3xl font-bold tracking-tight">{country.countryName}</h1>
                        <p className="text-muted-foreground">Country master configuration details.</p>
                    </div>
                </div>
                <Button onClick={() => router.push(`/system/masters/countries/edit/${country.countryId}`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Country
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5 text-sky-600" />
                        Configuration Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-2 gap-6 border-b pb-6">
                        <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Country Name</span>
                            <span className="text-lg font-medium">{country.countryName}</span>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Country ID</span>
                            <span className="text-lg font-medium">{country.countryId}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 border-b pb-6">
                        <div className="flex items-start gap-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Currency Type</span>
                                <span className="text-base font-medium">{country.currencyType}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Wallet className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Preferred Payment Mode</span>
                                <span className="text-base font-medium">{country.paymentType}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Created At: {country.createdAt ? new Date(country.createdAt).toLocaleString() : "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Last Updated: {country.updatedAt ? new Date(country.updatedAt).toLocaleString() : "N/A"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
