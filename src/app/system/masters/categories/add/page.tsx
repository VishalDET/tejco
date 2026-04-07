"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X, Plus, Trash2, Layers, Tags } from "lucide-react"

import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type SubcategoryRow = {
    id: number          // local key only (not sent to API)
    subcategoryName: string
    description: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddCategoryPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)

    // Category fields
    const [categoryName, setCategoryName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [status, setStatus] = React.useState(true)

    // Subcategory rows
    const [subcategories, setSubcategories] = React.useState<SubcategoryRow[]>([
        { id: Date.now(), subcategoryName: "", description: "" },
    ])

    const addSubcategory = () => {
        setSubcategories(prev => [
            ...prev,
            { id: Date.now(), subcategoryName: "", description: "" },
        ])
    }

    const removeSubcategory = (id: number) => {
        setSubcategories(prev => prev.filter(s => s.id !== id))
    }

    const updateSubcategory = (id: number, field: keyof Omit<SubcategoryRow, "id">, value: string) => {
        setSubcategories(prev =>
            prev.map(s => s.id === id ? { ...s, [field]: value } : s)
        )
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const payload = {
            categoryId: 0,
            categoryName,
            description,
            status,
            subcategories: subcategories.map(s => ({
                subcategoryId: 0,
                categoryId: 0,
                subcategoryName: s.subcategoryName,
                description: s.description,
            })),
        }

        try {
            await apiClient.post("/api/Category/Create", payload)
            toast.success("Category created successfully!")
            router.push("/system/masters/categories")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast.error(`Failed to create category: ${message}`)
        } finally {
            setIsLoading(false)
        }
    }

    // ─── UI ───────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" type="button" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Category</h1>
                    <p className="text-muted-foreground">
                        Create a new product category and define its sub-classifications.
                    </p>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div className="grid gap-6">
                    {/* Category details card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-primary" />
                                Category Details
                            </CardTitle>
                            <CardDescription>
                                Main classification for your products or services.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="categoryName">Category Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="categoryName"
                                    placeholder="e.g., Surgical Instruments"
                                    required
                                    value={categoryName}
                                    onChange={e => setCategoryName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Briefly describe what this category covers..."
                                    rows={3}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={status ? "true" : "false"}
                                    onValueChange={val => setStatus(val === "true")}
                                >
                                    <SelectTrigger id="status" className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subcategories card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="grid gap-1">
                                <CardTitle className="flex items-center gap-2">
                                    <Tags className="h-5 w-5 text-violet-600" />
                                    Subcategories
                                </CardTitle>
                                <CardDescription>
                                    Define specific types or groups within this category.
                                </CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addSubcategory}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Subcategory
                            </Button>
                        </CardHeader>
                        <CardContent className="grid gap-4 pt-4">
                            {subcategories.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No subcategories added yet. Click &quot;Add Subcategory&quot; to begin.
                                </p>
                            ) : (
                                subcategories.map((sub, index) => (
                                    <div
                                        key={sub.id}
                                        className="relative grid gap-4 p-4 border rounded-lg bg-muted/30"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                Subcategory #{index + 1}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                onClick={() => removeSubcategory(sub.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Subcategory Name <span className="text-destructive">*</span></Label>
                                                <Input
                                                    placeholder="e.g., Forceps"
                                                    required
                                                    value={sub.subcategoryName}
                                                    onChange={e => updateSubcategory(sub.id, "subcategoryName", e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Description</Label>
                                                <Input
                                                    placeholder="Short description"
                                                    value={sub.description}
                                                    onChange={e => updateSubcategory(sub.id, "description", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-4">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="px-8 font-semibold">
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading ? "Saving..." : "Save Category"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
