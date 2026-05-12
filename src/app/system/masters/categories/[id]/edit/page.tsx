"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, X, Plus, Trash2, Layers, Tags, Loader2 } from "lucide-react"

import { categoriesApi } from "@/lib/api"
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
    id: string          // local key only
    dbId: number        // backend ID
    subcategoryName: string
    description: string
    subcategories: SubcategoryRow[]
}

// ─── Recursive Component ──────────────────────────────────────────────────────

type SubcategoryItemProps = {
    sub: SubcategoryRow
    level: number
    index: number
    onAdd: (parentId: string) => void
    onRemove: (id: string) => void
    onUpdate: (id: string, field: keyof Omit<SubcategoryRow, "id" | "dbId" | "subcategories">, value: string) => void
}

function SubcategoryItem({ sub, level, index, onAdd, onRemove, onUpdate }: SubcategoryItemProps) {
    const maxLevels = 4

    return (
        <div className={`relative grid gap-3 p-4 border rounded-lg bg-muted/20 mt-2 ${level > 1 ? "ml-6 border-l-4 border-l-primary/30" : ""}`}>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded uppercase tracking-widest">
                        Level {level}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Sub-Classification #{index + 1}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {level < maxLevels && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5"
                            onClick={() => onAdd(sub.id)}
                        >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Nested
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => onRemove(sub.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">Name</Label>
                    <Input
                        placeholder="e.g., Surgical Blades"
                        required
                        value={sub.subcategoryName}
                        onChange={e => onUpdate(sub.id, "subcategoryName", e.target.value)}
                        className="h-9"
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">Description</Label>
                    <Input
                        placeholder="Short description..."
                        value={sub.description}
                        onChange={e => onUpdate(sub.id, "description", e.target.value)}
                        className="h-9"
                    />
                </div>
            </div>

            {sub.subcategories.length > 0 && (
                <div className="mt-2 space-y-2">
                    {sub.subcategories.map((child, childIdx) => (
                        <SubcategoryItem
                            key={child.id}
                            sub={child}
                            level={level + 1}
                            index={childIdx}
                            onAdd={onAdd}
                            onRemove={onRemove}
                            onUpdate={onUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function EditCategoryPage() {
    const router = useRouter()
    const { id } = useParams()
    
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)

    const [categoryName, setCategoryName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [status, setStatus] = React.useState(true)
    const [subcategories, setSubcategories] = React.useState<SubcategoryRow[]>([])

    React.useEffect(() => {
        const fetchCategory = async () => {
            try {
                const res = await categoriesApi.getById(id as string)
                const data = res.data || res
                
                setCategoryName(data.categoryName || "")
                setDescription(data.description || "")
                setStatus(data.status ?? true)
                
                // Map subcategories recursively
                const mapIncomingSubs = (subs: any[]): SubcategoryRow[] => {
                    return (subs || []).map(s => ({
                        id: Math.random().toString(36).substr(2, 9),
                        dbId: s.subcategoryId,
                        subcategoryName: s.subcategoryName,
                        description: s.description || "",
                        subcategories: mapIncomingSubs(s.subcategories)
                    }))
                }
                
                setSubcategories(mapIncomingSubs(data.subcategories))
            } catch (err: any) {
                toast.error(`Failed to load category: ${err.message}`)
                router.push("/system/masters/categories")
            } finally {
                setIsLoading(false)
            }
        }
        fetchCategory()
    }, [id, router])

    // ─── Helpers ───────────────────────────────────────────────────────────────

    const addSubcategory = (parentId?: string) => {
        const newSub: SubcategoryRow = {
            id: Math.random().toString(36).substr(2, 9),
            dbId: 0,
            subcategoryName: "",
            description: "",
            subcategories: []
        }

        if (!parentId) {
            setSubcategories(prev => [...prev, newSub])
        } else {
            const addToNested = (list: SubcategoryRow[]): SubcategoryRow[] => {
                return list.map(item => {
                    if (item.id === parentId) {
                        return { ...item, subcategories: [...item.subcategories, newSub] }
                    }
                    if (item.subcategories.length > 0) {
                        return { ...item, subcategories: addToNested(item.subcategories) }
                    }
                    return item
                })
            }
            setSubcategories(prev => addToNested(prev))
        }
    }

    const removeSubcategory = (id: string) => {
        const removeFromNested = (list: SubcategoryRow[]): SubcategoryRow[] => {
            return list
                .filter(item => item.id !== id)
                .map(item => ({
                    ...item,
                    subcategories: removeFromNested(item.subcategories)
                }))
        }
        setSubcategories(prev => removeFromNested(prev))
    }

    const updateSubcategory = (id: string, field: keyof Omit<SubcategoryRow, "id" | "dbId" | "subcategories">, value: string) => {
        const updateNested = (list: SubcategoryRow[]): SubcategoryRow[] => {
            return list.map(item => {
                if (item.id === id) {
                    return { ...item, [field]: value }
                }
                if (item.subcategories.length > 0) {
                    return { ...item, subcategories: updateNested(item.subcategories) }
                }
                return item
            })
        }
        setSubcategories(prev => updateNested(prev))
    }

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsSaving(true)

        const mapSubcategoriesForPayload = (list: SubcategoryRow[], parentSubId: number = 0): any => {
            return list.map(s => ({
                subcategoryId: s.dbId,
                categoryId: Number(id),
                parentSubcategoryId: parentSubId,
                subcategoryName: s.subcategoryName,
                description: s.description,
                subcategories: mapSubcategoriesForPayload(s.subcategories, s.dbId)
            }))
        }

        const payload = {
            categoryId: Number(id),
            categoryName,
            description,
            status,
            subcategories: mapSubcategoriesForPayload(subcategories),
        }

        try {
            await categoriesApi.update(id as string, payload)
            toast.success("Category updated successfully!")
            router.push("/system/masters/categories")
        } catch (err: any) {
            toast.error(`Failed to update category: ${err.message || "Something went wrong"}`)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" type="button" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
                    <p className="text-muted-foreground">
                        Update classification details and manage nested sub-categories.
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
                                    Manage nested hierarchies for this category.
                                </CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addSubcategory()}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Subcategory
                            </Button>
                        </CardHeader>
                        <CardContent className="grid gap-4 pt-4">
                            {subcategories.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No subcategories defined.
                                </p>
                            ) : (
                                subcategories.map((sub, index) => (
                                    <SubcategoryItem 
                                        key={sub.id} 
                                        sub={sub} 
                                        level={1} 
                                        index={index}
                                        onAdd={addSubcategory}
                                        onRemove={removeSubcategory}
                                        onUpdate={updateSubcategory}
                                    />
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-4">
                        <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSaving}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="px-8 font-semibold">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? "Updating..." : "Update Category"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
