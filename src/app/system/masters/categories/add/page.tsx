
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Save, X, Plus, Trash2, Layers, Tags } from "lucide-react"

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
    onUpdate: (id: string, field: keyof Omit<SubcategoryRow, "id" | "subcategories">, value: string) => void
}

function SubcategoryItem({ sub, level, index, onAdd, onRemove, onUpdate }: SubcategoryItemProps) {
    const maxLevels = 4 // Cat (0) -> Sub (1) -> Sub (2) -> Sub (3) -> Sub (4)

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
                        placeholder="Optional details"
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddCategoryPage() {
  const navigate = useNavigate()
    const router = useNavigate()
    const [isLoading, setIsLoading] = React.useState(false)

    // Category fields
    const [categoryName, setCategoryName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [status, setStatus] = React.useState(true)

    // Subcategory rows
    const [subcategories, setSubcategories] = React.useState<SubcategoryRow[]>([
        { id: `root-${Date.now()}`, subcategoryName: "", description: "", subcategories: [] },
    ])

    const addSubcategory = (parentId?: string) => {
        const newSub = { id: `sub-${Date.now()}`, subcategoryName: "", description: "", subcategories: [] }
        
        if (!parentId) {
            setSubcategories(prev => [...prev, newSub])
            return
        }

        const addToNested = (list: SubcategoryRow[]): SubcategoryRow[] => {
            return list.map(sub => {
                if (sub.id === parentId) {
                    return { ...sub, subcategories: [...sub.subcategories, newSub] }
                }
                return { ...sub, subcategories: addToNested(sub.subcategories) }
            })
        }
        setSubcategories(prev => addToNested(prev))
    }

    const removeSubcategory = (id: string) => {
        const removeFromNested = (list: SubcategoryRow[]): SubcategoryRow[] => {
            return list
                .filter(sub => sub.id !== id)
                .map(sub => ({ ...sub, subcategories: removeFromNested(sub.subcategories) }))
        }
        setSubcategories(prev => removeFromNested(prev))
    }

    const updateSubcategory = (id: string, field: keyof Omit<SubcategoryRow, "id" | "subcategories">, value: string) => {
        const updateInNested = (list: SubcategoryRow[]): SubcategoryRow[] => {
            return list.map(sub => {
                if (sub.id === id) {
                    return { ...sub, [field]: value }
                }
                return { ...sub, subcategories: updateInNested(sub.subcategories) }
            })
        }
        setSubcategories(prev => updateInNested(prev))
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const mapSubcategories = (list: SubcategoryRow[]): any => {
            return list.map(s => ({
                subcategoryId: 0,
                categoryId: 0,
                parentSubcategoryId: 0,
                subcategoryName: s.subcategoryName,
                description: s.description,
                subcategories: mapSubcategories(s.subcategories)
            }))
        }

        const payload = {
            categoryId: 0,
            categoryName,
            description,
            status,
            subcategories: mapSubcategories(subcategories),
        }

        try {
            await categoriesApi.create(payload)
            toast.success("Category created successfully!")
            navigate("/system/masters/categories")
        } catch (err: any) {
            toast.error(`Failed to create category: ${err.message || "Something went wrong"}`)
        } finally {
            setIsLoading(false)
        }
    }

    // ─── UI ───────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" type="button" onClick={() => navigate(-1)}>
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
                            <Button type="button" variant="outline" size="sm" onClick={() => addSubcategory()}>
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
                        <Button variant="outline" type="button" onClick={() => navigate(-1)}>
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
