"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, X, Plus, Trash2, Layers, Tags, Loader2 } from "lucide-react"

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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type Subcategory = {
    subcategoryId: number
    categoryId: number
    subcategoryName: string
    description: string
}

type Category = {
    categoryId: number
    categoryName: string
    description: string
    status: boolean
    subcategories: Subcategory[]
}

type SubcategoryRow = {
    id: number | string // local key only
    subcategoryId: number
    subcategoryName: string
    description: string
}

type ApiResponse<T> = {
    statusCode: number
    success: boolean
    message: string
    data: T
}

export default function EditCategoryPage() {
    const router = useRouter()
    const params = useParams()
    const categoryId = parseInt(params.id as string)

    const [isFetching, setIsFetching] = React.useState(true)
    const [isLoading, setIsLoading] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

    // Form state
    const [categoryName, setCategoryName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [status, setStatus] = React.useState(true)
    const [subcategories, setSubcategories] = React.useState<SubcategoryRow[]>([])

    // ─── Fetch Data ───────────────────────────────────────────────────────────

    React.useEffect(() => {
        async function fetchCategory() {
            if (!categoryId) return
            try {
                const response = await apiClient.get<ApiResponse<Category>>(`/api/Category/GetById/${categoryId}`)
                const data = response.data
                setCategoryName(data.categoryName)
                setDescription(data.description)
                setStatus(data.status)
                setSubcategories(data.subcategories.map((s: Subcategory) => ({
                    id: s.subcategoryId,
                    subcategoryId: s.subcategoryId,
                    subcategoryName: s.subcategoryName,
                    description: s.description,
                })))
            } catch (err: unknown) {
                toast.error("Failed to load category details")
                router.push("/system/masters/categories")
            } finally {
                setIsFetching(false)
            }
        }
        fetchCategory()
    }, [categoryId, router])

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const addSubcategory = () => {
        setSubcategories(prev => [
            ...prev,
            { id: `new-${Date.now()}`, subcategoryId: 0, subcategoryName: "", description: "" }
        ])
    }

    const removeSubcategory = (id: number | string) => {
        setSubcategories(prev => prev.filter(s => s.id !== id))
    }

    const handleSubcategoryChange = (id: number | string, field: keyof Omit<SubcategoryRow, "id" | "subcategoryId">, value: string) => {
        setSubcategories(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ))
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const payload: Category = {
            categoryId,
            categoryName,
            description,
            status,
            subcategories: subcategories.map((s: SubcategoryRow) => ({
                subcategoryId: s.subcategoryId,
                categoryId,
                subcategoryName: s.subcategoryName,
                description: s.description,
            })),
        }

        try {
            await apiClient.put(`/api/Category/Update/${categoryId}`, payload)
            toast.success(`Category updated successfully`)
            router.push("/system/masters/categories")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast.error(`Failed to update category: ${message}`)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleConfirmDelete() {
        setIsDeleting(true)
        try {
            await apiClient.delete(`/api/Category/Delete/${categoryId}`)
            toast.success("Category deleted successfully")
            setIsDeleteDialogOpen(false)
            router.push("/system/masters/categories")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast.error(`Failed to delete category: ${message}`)
        } finally {
            setIsDeleting(false)
        }
    }

    if (isFetching) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" type="button" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
                        <p className="text-muted-foreground">Modify Category #{params.id} and its sub-classifications.</p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    type="button"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isDeleting || isLoading}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Category
                </Button>
            </div>

            <form onSubmit={onSubmit}>
                <div className="grid gap-6">
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
                                <Label htmlFor="name">Category Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    required
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Briefly describe what this category covers..."
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
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
                                                    onChange={(e) => handleSubcategoryChange(sub.id, "subcategoryName", e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Description</Label>
                                                <Input
                                                    placeholder="Short description"
                                                    value={sub.description}
                                                    onChange={(e) => handleSubcategoryChange(sub.id, "description", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-4">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="px-8 font-semibold">
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {isLoading ? "Saving..." : "Update Category"}
                        </Button>
                    </div>
                </div>
            </form>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the category <strong>&quot;{categoryName}&quot;</strong>?
                            This action cannot be undone and will remove all associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            {isDeleting ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
