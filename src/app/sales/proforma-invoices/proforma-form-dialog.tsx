
import { useState, useEffect } from "react"
import { SalesDocumentItem, SalesDocumentStatus } from "../types"
import { ProformaInvoice, ProformaInvoiceItem } from "./types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Trash2, Receipt, Calculator } from "lucide-react"
import { ClientSelector } from "@/components/sales/client-selector"
import { ProductSelector } from "@/components/sales/product-selector"
import { proformaApi, usersApi, serializeAddress, countryMasterApi, clientsApi, productsApi } from "@/lib/api"
import { toast } from "sonner"
import { getGoogleDrivePreviewUrl } from "@/lib/utils"

interface ProformaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proforma: ProformaInvoice | null
  onSave: (data: Partial<ProformaInvoice>) => void
}

const GST_RATES = [0, 5, 12, 18, 28]

export function ProformaFormDialog({ open, onOpenChange, proforma, onSave }: ProformaFormDialogProps) {
  const [form, setForm] = useState<Partial<ProformaInvoice>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [currencies, setCurrencies] = useState<string[]>(["USD", "EUR", "GBP"])

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await countryMasterApi.getAll()
        const list = Array.isArray(res) ? res : ((res as any)?.data && Array.isArray((res as any).data) ? (res as any).data : [])
        const uniqueCurrencies = Array.from(
          new Set(
            list
              .map((c: any) => c.currencyType?.trim())
              .filter((c: any) => c && c.toUpperCase() !== "INR")
          )
        ) as string[]
        if (uniqueCurrencies.length > 0) {
          setCurrencies(uniqueCurrencies)
        }
      } catch (err) {
        console.error("Failed to fetch currencies from country master:", err)
      }
    }
    fetchCurrencies()
  }, [])

  const getCurrencySymbol = (currency?: string) => {
    if (!currency) return "\u20B9"
    switch (currency.toUpperCase()) {
      case "USD": return "$"
      case "EUR": return "\u20AC"
      case "GBP": return "\u00A3"
      case "INR": return "\u20B9"
      default: return currency
    }
  }

  // Fetch users for salesperson dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)
        const res = await usersApi.getAll() as any
        const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : [])
        setUsers(list)
      } catch (err) {
        console.error("Error fetching users:", err)
      } finally {
        setLoadingUsers(false)
      }
    }
    if (open) fetchUsers()
  }, [open])

  // Populate form when dialog opens
  useEffect(() => {
    if (proforma) {
      const sanitizedItems = (proforma.items || []).map((item: any) => {
        const rawVid = item.variantId !== undefined ? item.variantId : item.variant_id
        const parsedVid = rawVid !== null && rawVid !== undefined && !isNaN(Number(rawVid)) ? Number(rawVid) : null
        const finalVid = parsedVid !== null && parsedVid > 0 ? parsedVid : null
        return {
          ...item,
          variantId: finalVid,
        }
      })

      const rawCId = proforma.clientId ?? (proforma as any).client_id ?? (proforma as any).clientMasterId ?? (proforma as any).customerId
      const parsedCId = rawCId !== null && rawCId !== undefined && !isNaN(Number(rawCId)) && Number(rawCId) > 0 ? String(rawCId) : ""
      const resolvedClientName = proforma.clientName || (proforma as any).billingName || ""

      setForm({
        ...proforma,
        clientId: parsedCId || undefined,
        clientName: resolvedClientName,
        billingName: resolvedClientName,
        doctorName: proforma.doctorName || (proforma as any)?.doctorName || (proforma as any)?.doctor_name || "",
        items: sanitizedItems,
        date: proforma.date ? proforma.date.split("T")[0] : new Date().toISOString().split("T")[0],
        paymentType: (proforma as any).paymentType || "Domestic",
        currencyType: (proforma as any).currencyType || "INR",
        doctorSpeciality: Array.isArray((proforma as any).doctorSpeciality)
          ? (proforma as any).doctorSpeciality.join(", ")
          : ((proforma as any).doctorSpeciality || ""),
        clientGSTIN: (proforma as any).clientGSTIN || proforma.gstinNo || "",
        freight: Number((proforma as any).freight) || 0,
      })
    } else {
      const year = new Date().getFullYear()
      const random = Math.floor(1000 + Math.random() * 9000)
      setForm({
        number: `PI-${year}-${random}`,
        date: new Date().toISOString().split("T")[0],
        status: "Draft",
        items: [],
        subtotal: 0,
        taxAmount: 0,
        freight: 0,
        totalAmount: 0,
        validityDays: 7,
        deliveryTime: "10-15 Working Days",
        deliveryTerms: "10-15 Working Days",
        paymentTerms: "",
        salesPersonName: "",
        salesPersonCell: "",
        subject: "",
        paymentType: "Domestic",
        currencyType: "INR",
        doctorSpeciality: "",
        doctorName: "",
        clientGSTIN: "",
      })
    }
  }, [proforma, open])

  // Auto-resolve Client ID by searching clients API with client name / billing name
  useEffect(() => {
    let isMounted = true
    const resolveClientId = async () => {
      const targetName = (form.clientName || form.billingName || (proforma as any)?.billingName || (proforma as any)?.clientName || "").trim()
      const hasValidClientId = form.clientId && !isNaN(Number(form.clientId)) && Number(form.clientId) > 0

      if (targetName && !hasValidClientId) {
        try {
          const searchTerms = [
            targetName,
            targetName.split(/[-–—(]/)[0].trim(),
            targetName.split(/\s+/).slice(0, 3).join(" ").trim(),
          ].filter(Boolean)

          let matchedClient: any = null

          for (const term of searchTerms) {
            if (matchedClient) break
            if (!term || term.length < 2) continue
            const res = await clientsApi.getAll({
              search: term,
              searchBy: "ClientName",
              pageSize: 20,
            })
            const list = res.clients || []
            const lowerTarget = targetName.toLowerCase()
            matchedClient =
              list.find((c: any) => c.name?.trim().toLowerCase() === lowerTarget) ||
              list.find((c: any) => lowerTarget.includes(c.name?.trim().toLowerCase())) ||
              list.find((c: any) => c.name?.trim().toLowerCase().includes(lowerTarget)) ||
              (list.length === 1 ? list[0] : null)
          }

          if (isMounted && matchedClient && matchedClient.id && !isNaN(Number(matchedClient.id)) && Number(matchedClient.id) > 0) {
            setForm(prev => ({
              ...prev,
              clientId: String(matchedClient.id),
              clientName: prev.clientName || matchedClient.name,
              billingName: prev.billingName || matchedClient.name,
              clientMobileNo: prev.clientMobileNo || matchedClient.phone || "",
              billingAddress: prev.billingAddress || serializeAddress(matchedClient.billingAddress),
              shippingAddress: prev.shippingAddress || serializeAddress(matchedClient.shippingAddress),
              clientGSTIN: prev.clientGSTIN || matchedClient.gstin || "",
              doctorSpeciality: prev.doctorSpeciality || (Array.isArray(matchedClient.doctorSpeciality) ? matchedClient.doctorSpeciality.join(", ") : (matchedClient.doctorSpeciality || (matchedClient as any).speciality || "")),
              doctorName: prev.doctorName || (matchedClient as any).doctorName || matchedClient.contactPerson || (matchedClient.clientType === "Doctor" ? matchedClient.name : ""),
            }))
          }
        } catch (err) {
          console.error("Failed to resolve client ID by name:", err)
        }
      }
    }

    if (open) {
      resolveClientId()
    }

    return () => {
      isMounted = false
    }
  }, [form.clientName, form.billingName, form.clientId, open, proforma])

  // Auto-resolve missing variant IDs for items that have productId but variantId is missing / null / 0
  useEffect(() => {
    let isMounted = true
    const resolveMissingVariants = async () => {
      const items = form.items || []
      const itemsNeedingResolution = items.filter(
        item => item.productId && (!item.variantId || Number(item.variantId) <= 0)
      )

      if (itemsNeedingResolution.length === 0) return

      let hasChanges = false
      const updatedItems = await Promise.all(
        items.map(async item => {
          if (!item.productId || (item.variantId && Number(item.variantId) > 0)) {
            return item
          }

          try {
            const resp = await productsApi.getById(item.productId)
            const prodData = resp?.data || resp
            const variants = Array.isArray(prodData?.variants) ? prodData.variants : []

            if (variants.length > 0) {
              const match =
                variants.find((v: any) => v.variantName && item.name && v.variantName.toLowerCase().trim() === item.name.toLowerCase().trim()) ||
                variants.find((v: any) => v.skuSuffix && item.sku && item.sku.endsWith(v.skuSuffix)) ||
                (variants.length === 1 ? variants[0] : null)

              const rawVid = match ? (match.variantId ?? match.id) : null
              const parsedVid = rawVid !== null && rawVid !== undefined && !isNaN(Number(rawVid)) && Number(rawVid) > 0 ? Number(rawVid) : null

              if (parsedVid) {
                hasChanges = true
                return {
                  ...item,
                  variantId: parsedVid,
                  name: item.name || match.variantName || item.name,
                }
              }
            }
          } catch (e) {
            console.error(`Failed to resolve variant for product ${item.productId}:`, e)
          }

          return item
        })
      )

      if (isMounted && hasChanges) {
        setForm(prev => ({ ...prev, items: updatedItems }))
      }
    }

    if (open && (form.items || []).length > 0) {
      resolveMissingVariants()
    }

    return () => {
      isMounted = false
    }
  }, [open, form.items?.length])

  // Auto-match salesperson name to user list, or resolve mock/invalid salesPersonId
  useEffect(() => {
    if (users.length > 0 && form.salesPersonName) {
      const hasValidId = form.salesPersonId && users.some(u => String(u.userId) === String(form.salesPersonId))

      if (!hasValidId) {
        const match = users.find(u =>
          `${u.firstName} ${u.lastName}`.trim().toLowerCase() === form.salesPersonName?.trim().toLowerCase()
        )
        if (match) {
          setForm(prev => ({
            ...prev,
            salesPersonId: String(match.userId),
            salesPersonCell: match.mobile || match.phone || prev.salesPersonCell || ""
          }))
        } else {
          // Clear invalid/mock salesPersonId so user is forced to select a valid one
          setForm(prev => ({ ...prev, salesPersonId: undefined }))
        }
      }
    }
  }, [users, form.salesPersonName, form.salesPersonId])

  const calculateTotals = (items: (SalesDocumentItem | ProformaInvoiceItem)[]) => {
    const isForeign = form.paymentType === "Foreign"

    // Subtotal is sum of discounted base prices
    const subtotal = items.reduce((sum, item) => {
      const price = item.unitPrice || 0
      const gstRate = isForeign ? 0 : (item.gstRate || 0)
      const basePrice = gstRate > 0 ? price / (1 + gstRate / 100) : price
      const discAmt = (item as any).discountAmount || 0
      const discountedBase = Math.max(0, basePrice - discAmt)
      return sum + (discountedBase * item.quantity)
    }, 0)

    // Total GST calculated on the discounted base amount
    const taxAmount = isForeign ? 0 : items.reduce((sum, item) => {
      const price = item.unitPrice || 0
      const gstRate = item.gstRate || 0
      const basePrice = gstRate > 0 ? price / (1 + gstRate / 100) : price
      const discAmt = (item as any).discountAmount || 0
      const discountedBase = Math.max(0, basePrice - discAmt)
      return sum + (discountedBase * (gstRate / 100) * item.quantity)
    }, 0)

    // Grand total is subtotal + taxAmount + freight
    const totalAmount = subtotal + taxAmount + (form.freight || 0)

    return { subtotal, taxAmount, totalAmount }
  }

  const set = (field: keyof ProformaInvoice, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const onProductSelect = (product: any, variant: any) => {
    const rawVariantId = variant?.variantId ?? variant?.id
    const parsedVariantId = rawVariantId !== undefined && rawVariantId !== null && !isNaN(Number(rawVariantId)) ? Number(rawVariantId) : null
    const finalVariantId = parsedVariantId !== null && parsedVariantId > 0 ? parsedVariantId : null

    const sku = `${product.baseSKU || ""}${variant.skuSuffix || ""}` || variant.variantName || product.productName
    const exists = (form.items || []).some(item => {
      const itemVid = (item as any).variantId !== undefined ? (item as any).variantId : (item as any).variant_id
      const parsedItemVid = itemVid !== null && itemVid !== undefined && !isNaN(Number(itemVid)) && Number(itemVid) > 0 ? Number(itemVid) : null
      return item.sku === sku && (parsedItemVid ?? null) === finalVariantId
    })
    if (exists) {
      toast.error(`"${product.productName} - ${variant.variantName}" is already included in this proforma.`)
      return
    }

    const isForeign = form.paymentType === "Foreign"
    const price = isForeign ? (variant.usdAmount || variant.exportSellingPrice || 0) : variant.sellingPrice

    const newItem: SalesDocumentItem = {
      id: Math.random().toString(36).substring(2, 9).slice(0, 8),
      productId: product.productId.toString(),
      productName: product.productName,
      name: variant.variantName,
      sku: sku,
      quantity: 1,
      unitPrice: price,
      total: price,
      gstRate: isForeign ? 0 : (variant.gstPercentage ?? product.gstPercentage ?? 18),
      imageUrl: variant.variantImage || product.imageUrl || "",
    }
      ; (newItem as any).variantId = finalVariantId
      ; (newItem as any).discountPercentage = 0
      ; (newItem as any).discountAmount = 0
      ; (newItem as any).stock = variant.currentQuantity ?? 0
      ; (newItem as any).sellingPrice = variant.sellingPrice
      ; (newItem as any).usdAmount = variant.usdAmount || variant.exportSellingPrice || 0
      ; (newItem as any).gstRateOriginal = variant.gstPercentage ?? product.gstPercentage ?? 18

    if ((variant.currentQuantity ?? 0) < 1) {
      toast.warning(`Warning: "${product.productName} - ${variant.variantName}" is currently out of stock.`)
    }

    const newItems = [...(form.items || []), newItem]
    const totals = calculateTotals(newItems)
    setForm(prev => ({ ...prev, items: newItems, ...totals }))
  }

  const updateItem = (id: string, field: keyof SalesDocumentItem | "discountPercentage" | "discountAmount", value: any) => {
    const isForeign = form.paymentType === "Foreign"
    const newItems = (form.items || []).map(item => {
      if (item.id === id) {
        if (field === "quantity") {
          const qty = parseInt(value) || 0
          const stock = (item as any).stock
          if (stock !== undefined && qty > stock) {
            toast.error(`Requested quantity (${qty}) exceeds available stock (${stock}) for "${item.productName}".`)
          }
        }
        const updatedItem = { ...item, [field]: value } as any
        const qty = updatedItem.quantity || 0
        const price = updatedItem.unitPrice || 0
        const gstRate = isForeign ? 0 : (updatedItem.gstRate || 0)

        // 1. Minus GST from price to get base price:
        const basePrice = gstRate > 0 ? price / (1 + gstRate / 100) : price

        // 2. Apply discount on base price:
        if (field === "discountPercentage") {
          const discPct = Math.max(0, Math.min(100, parseFloat(value) || 0))
          updatedItem.discountPercentage = discPct
          const discAmt = parseFloat((basePrice * (discPct / 100)).toFixed(2))
          updatedItem.discountAmount = discAmt
        } else if (field === "discountAmount") {
          const discAmt = Math.max(0, parseFloat(value) || 0)
          updatedItem.discountAmount = discAmt
          const discPct = basePrice > 0 ? parseFloat(((discAmt / basePrice) * 100).toFixed(2)) : 0
          updatedItem.discountPercentage = discPct
        } else if (field === "unitPrice") {
          if (form.paymentType === "Foreign") {
            updatedItem.usdAmount = price
          } else {
            updatedItem.sellingPrice = price
          }
          const discPct = updatedItem.discountPercentage || 0
          updatedItem.discountAmount = parseFloat((basePrice * (discPct / 100)).toFixed(2))
        }

        // 3. Discounted base price after subtracting discount:
        const discAmt = updatedItem.discountAmount || 0
        const discountedBase = Math.max(0, basePrice - discAmt)

        // 4. Apply mentioned GST % on the discounted amount to get the final unit price & line total:
        const finalUnitPrice = gstRate > 0 ? discountedBase * (1 + gstRate / 100) : discountedBase
        updatedItem.total = parseFloat((finalUnitPrice * qty).toFixed(2))

        return updatedItem as SalesDocumentItem
      }
      return item
    })
    const totals = calculateTotals(newItems)
    setForm(prev => ({ ...prev, items: newItems, ...totals }))
  }

  const handlePaymentTypeChange = (newPaymentType: string) => {
    const newCurrency = newPaymentType === "Domestic" ? "INR" : "USD"
    setForm(prev => ({
      ...prev,
      paymentType: newPaymentType,
      currencyType: newCurrency,
      items: [],
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0
    }))
    toast.success("Payment type changed. Product selection cleared.")
  }

  const removeItem = (id: string) => {
    const newItems = (form.items || []).filter(item => item.id !== id)
    setForm(prev => ({ ...prev, items: newItems, ...calculateTotals(newItems) }))
  }

  const handleFreightChange = (value: string) => {
    const val = value === "" ? 0 : Math.max(0, parseFloat(value) || 0)
    setForm(prev => {
      const subtotal = prev.subtotal || 0
      const taxAmount = prev.taxAmount || 0
      return {
        ...prev,
        freight: val,
        totalAmount: parseFloat((subtotal + taxAmount + val).toFixed(2))
      }
    })
  }

  const isConversion = Boolean(
    form.sourceQuotationId ||
    (proforma as any)?.sourceQuotationId ||
    (proforma as any)?.linkedQuotationId ||
    form.linkedQuotationId
  )
  const hasProformaId = proforma?.proformaId !== undefined && proforma?.proformaId !== null && Number(proforma.proformaId) > 0
  const existingId = hasProformaId
    ? Number(proforma!.proformaId)
    : (!isConversion && proforma?.id && !isNaN(Number(proforma.id)) && Number(proforma.id) > 0 ? Number(proforma.id) : 0)
  const isEdit = existingId > 0

  const handleSave = async () => {
    if ((!form.clientId && !form.clientName && !form.billingName) || (form.items || []).length === 0) {
      toast.error("Please select a client and add at least one item.")
      return
    }
    if (!form.salesPersonId) {
      toast.error("Please select a valid Sales Person")
      return
    }
    setIsSaving(true)

    try {

      // 1. Resolve client ID if missing or 0
      let resolvedClientId = form.clientId && !isNaN(Number(form.clientId)) && Number(form.clientId) > 0
        ? Number(form.clientId)
        : 0

      const targetClientName = (form.clientName || form.billingName || (proforma as any)?.billingName || (proforma as any)?.clientName || "").trim()

      if (!resolvedClientId && targetClientName) {
        try {
          const searchTerms = [
            targetClientName,
            targetClientName.split(/[-–—(]/)[0].trim(),
            targetClientName.split(/\s+/).slice(0, 3).join(" ").trim(),
          ].filter(Boolean)

          for (const term of searchTerms) {
            if (resolvedClientId) break
            if (!term || term.length < 2) continue
            const clientRes = await clientsApi.getAll({
              search: term,
              searchBy: "ClientName",
              pageSize: 20,
            })
            const list = clientRes.clients || []
            const lowerTarget = targetClientName.toLowerCase()
            const match =
              list.find((c: any) => c.name?.trim().toLowerCase() === lowerTarget) ||
              list.find((c: any) => lowerTarget.includes(c.name?.trim().toLowerCase())) ||
              list.find((c: any) => c.name?.trim().toLowerCase().includes(lowerTarget)) ||
              (list.length === 1 ? list[0] : null)

            if (match && match.id && !isNaN(Number(match.id)) && Number(match.id) > 0) {
              resolvedClientId = Number(match.id)
              break
            }
          }
        } catch (e) {
          console.error("Failed to resolve client ID at save time:", e)
        }
      }

      if (!resolvedClientId || resolvedClientId <= 0) {
        toast.error("Please select a valid Client / Doctor.")
        setIsSaving(false)
        return
      }

      // 2. Prepare items, resolving missing variant IDs where possible
      const processedItems = await Promise.all(
        (form.items || []).map(async item => {
          const unitPrice = Number(item.unitPrice ?? (item as any).rate ?? 0)
          const qty = Number(item.quantity || 0)
          const discPct = Number((item as any).discountPercentage || 0)
          const discAmt = Number((item as any).discountAmount !== undefined ? (item as any).discountAmount : (unitPrice * discPct / 100))
          const itemTotal = Number(item.total !== undefined ? item.total : (unitPrice - discAmt) * qty)

          let rawVariantId = (item as any).variantId !== undefined ? (item as any).variantId : (item as any).variant_id
          let parsedVariantId = rawVariantId !== null && rawVariantId !== undefined && !isNaN(Number(rawVariantId)) ? Number(rawVariantId) : null

          // If variantId is missing or <= 0, try resolving it from the product
          if ((!parsedVariantId || parsedVariantId <= 0) && item.productId && !isNaN(Number(item.productId))) {
            try {
              const resp = await productsApi.getById(item.productId)
              const prodData = resp?.data || resp
              const variants = Array.isArray(prodData?.variants) ? prodData.variants : []
              if (variants.length > 0) {
                const match =
                  variants.find((v: any) => v.variantName && item.name && v.variantName.toLowerCase().trim() === item.name.toLowerCase().trim()) ||
                  variants.find((v: any) => v.skuSuffix && item.sku && item.sku.endsWith(v.skuSuffix)) ||
                  (variants.length === 1 ? variants[0] : null)
                if (match) {
                  const resolvedVid = match.variantId ?? match.id
                  if (resolvedVid && !isNaN(Number(resolvedVid)) && Number(resolvedVid) > 0) {
                    parsedVariantId = Number(resolvedVid)
                  }
                }
              }
            } catch (err) {
              console.warn(`Could not fetch product ${item.productId} for variant resolution:`, err)
            }
          }

          // In backend Swagger: variantId is a number (0 when no variant)
          const finalVariantId = (parsedVariantId !== null && parsedVariantId > 0) ? Number(parsedVariantId) : 0

          const itemId = (existingId > 0 && (item as any).proformaInvoiceItemId && !isNaN(Number((item as any).proformaInvoiceItemId)))
            ? Number((item as any).proformaInvoiceItemId)
            : 0

          return {
            proformaInvoiceItemId: itemId,
            proformaInvoiceId: existingId > 0 ? existingId : 0,
            productId: item.productId && !isNaN(Number(item.productId)) ? Number(item.productId) : 0,
            variantId: finalVariantId,
            productName: item.productName || item.name || "",
            imageUrl: (item as any).imageUrl || (item as any).image || "",
            quantity: qty,
            rate: unitPrice,
            discountPercentage: discPct,
            discountAmount: discAmt,
            total: itemTotal,
          }
        })
      )

      const resolvedBillingAddress = typeof form.billingAddress === "object"
        ? serializeAddress(form.billingAddress)
        : (typeof form.billingAddress === "string" ? form.billingAddress : "")

      const year = new Date().getFullYear()
      const random = Math.floor(1000 + Math.random() * 9000)

      const payload = {
        proformaInvoiceId: existingId > 0 ? existingId : 0,
        piNo: form.piNo || form.proformaNumber || form.number || `PI-${year}-${random}`,
        piDate: form.piDate
          ? (form.piDate.includes("T") ? form.piDate : new Date(form.piDate).toISOString())
          : (form.date ? (form.date.includes("T") ? form.date : new Date(form.date).toISOString()) : new Date().toISOString()),
        clientId: resolvedClientId,
        billingName: form.billingName || form.clientName || targetClientName || "",
        billingAddress: resolvedBillingAddress,
        freight: Number(form.freight) || 0,
        totalAmount: Number(form.totalAmount) || 0,
        deliveryTerms: form.deliveryTerms || form.deliveryTime || "10-15 Working Days",
        paymentTerms: form.paymentTerms || form.notes || form.subject || "",
        paymentType: form.paymentType || "Domestic",
        currencyType: form.currencyType || (form.paymentType === "Foreign" ? "USD" : "INR"),
        salesPersonId: form.salesPersonId && !isNaN(Number(form.salesPersonId)) ? Number(form.salesPersonId) : 0,
        salesPersonName: form.salesPersonName || "",
        salesPersonCell: form.salesPersonCell || "",
        status: form.status || "Draft",
        linkedQuotationId: form.linkedQuotationId && !isNaN(Number(form.linkedQuotationId))
          ? Number(form.linkedQuotationId)
          : (form.sourceQuotationId && !isNaN(Number(form.sourceQuotationId)) ? Number(form.sourceQuotationId) : 0),
        createdAt: (existingId > 0 && form.createdAt)
          ? (form.createdAt.includes("T") ? form.createdAt : new Date(form.createdAt).toISOString())
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctorSpeciality: (() => {
          const spec = form.doctorSpeciality || (proforma as any)?.doctorSpeciality
          if (Array.isArray(spec)) {
            return spec.map(s => String(s).trim()).filter(Boolean)
          }
          if (typeof spec === "string" && spec.trim()) {
            return spec.split(",").map(s => s.trim()).filter(Boolean)
          }
          return []
        })(),
        doctorName: form.doctorName || (proforma as any)?.doctorName || "",
        clientGSTIN: form.clientGSTIN || form.gstinNo || (proforma as any)?.clientGSTIN || (proforma as any)?.gstinNo || "",
        items: processedItems,
      }

      if (existingId > 0) {
        await proformaApi.update(String(existingId), payload)
        toast.success("Proforma invoice updated successfully")
      } else {
        await proformaApi.create(payload)
        toast.success("Proforma invoice created successfully")
      }

      onSave({
        ...form,
        clientId: String(resolvedClientId),
        billingName: payload.billingName,
        clientName: payload.billingName,
        items: processedItems as any,
      } as Partial<ProformaInvoice>)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to save proforma:", error)
      const errorMsg = error?.message || "Please try again."
      toast.error(`Failed to save proforma invoice: ${errorMsg}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b bg-muted/20">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {isConversion ? "Convert Quotation to Proforma Invoice" : (isEdit ? "Edit Proforma Invoice" : "Create Proforma Invoice")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="space-y-6 pb-6">
            {/* Header Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>PI Number</Label>
                <Input value={form.number || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date ? form.date.split("T")[0] : ""} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Validity (Days)</Label>
                <Input type="number" min={1} value={form.validityDays ?? 7} onChange={(e) => set("validityDays", parseInt(e.target.value) || 7)} />
              </div>
            </div>

            {/* Client + Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 min-w-0">
                <Label>Client / Doctor *</Label>
                <ClientSelector
                  selectedClientId={form.clientId ? String(form.clientId) : undefined}
                  selectedClientName={form.clientName || form.billingName}
                  onSelect={(c) => {
                    const cid = c.id && !isNaN(Number(c.id)) && Number(c.id) > 0 ? String(c.id) : ""
                    set("clientId", cid)
                    set("clientName", c.name)
                    set("billingName", c.name)
                    set("clientMobileNo", c.phone || "")
                    set("billingAddress", serializeAddress(c.billingAddress))
                    set("shippingAddress", serializeAddress(c.shippingAddress))
                    set("gstinNo", c.gstin || "")
                    set("clientGSTIN", c.gstin || "")
                    set("doctorSpeciality", Array.isArray((c as any).doctorSpeciality) ? (c as any).doctorSpeciality.join(", ") : ((c as any).doctorSpeciality || (c as any).speciality || (c as any).clientType || form.doctorSpeciality || ""))
                    set("doctorName", (c as any).doctorName || c.contactPerson || (c.clientType === "Doctor" ? c.name : form.doctorName || ""))
                  }}
                />
                {(form.clientName || form.billingName) && (
                  <p className="text-xs text-muted-foreground truncate">
                    Selected: <strong>{form.clientName || form.billingName}</strong>
                    {form.clientId && Number(form.clientId) > 0 ? ` (ID: ${form.clientId})` : ""}
                  </p>
                )}
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as SalesDocumentStatus)}>
                  <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Sent to Client">Sent to Client</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Converted To Sales Order">Converted To Sales Order</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Type + Currency Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select value={form.paymentType || "Domestic"} onValueChange={(v) => handlePaymentTypeChange(v as string)}>
                  <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Domestic">Domestic</SelectItem>
                    <SelectItem value="Foreign">Foreign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency Type</Label>
                <Select value={form.currencyType || "INR"} disabled>
                  <SelectTrigger className="border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (&#8377;)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sales Person */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Sales Person *</Label>
                <Select
                  value={form.salesPersonName || ""}
                  onValueChange={(val) => {
                    const selectedUser = users.find(u => `${u.firstName} ${u.lastName}`.trim() === val)
                    if (selectedUser) {
                      setForm(prev => ({
                        ...prev,
                        salesPersonName: val || "",
                        salesPersonCell: selectedUser.mobile || selectedUser.phone || "",
                        salesPersonId: String(selectedUser.userId)
                      }))
                    } else {
                      setForm(prev => ({
                        ...prev,
                        salesPersonName: val || "",
                        salesPersonId: undefined
                      }))
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder={loadingUsers ? "Loading..." : "Select sales person"} /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => {
                      const fullName = `${u.firstName} ${u.lastName}`.trim()
                      return (
                        <SelectItem key={u.userId} value={fullName}>
                          {fullName}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sales Person Cell</Label>
                <Input value={form.salesPersonCell || ""} onChange={(e) => set("salesPersonCell", e.target.value)} placeholder="+91-xxxxxxxxxx" />
              </div>
              <div className="space-y-2">
                <Label>Delivery Terms</Label>
                <Input value={form.deliveryTerms || form.deliveryTime || ""} onChange={(e) => set("deliveryTerms", e.target.value)} placeholder="e.g. 10-15 Working Days" />
              </div>
            </div>

            {/* Subject, Doctor Name, Doctor Speciality & Client GSTIN */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  value={form.subject || ""}
                  onChange={(e) => set("subject", e.target.value)}
                  placeholder="e.g. Proforma for Surgical Equipment"
                />
              </div>
              <div className="space-y-2">
                <Label>Doctor Name</Label>
                <Input
                  value={form.doctorName || ""}
                  onChange={(e) => set("doctorName", e.target.value)}
                  placeholder="e.g. Dr. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Doctor Speciality</Label>
                <Input
                  value={form.doctorSpeciality || ""}
                  onChange={(e) => set("doctorSpeciality", e.target.value)}
                  placeholder="e.g. Dermatologist, Trichologist"
                />
              </div>
              <div className="space-y-2">
                <Label>Client GSTIN</Label>
                <Input
                  value={form.clientGSTIN || form.gstinNo || ""}
                  onChange={(e) => {
                    set("clientGSTIN", e.target.value)
                    set("gstinNo", e.target.value)
                  }}
                  placeholder="GSTIN Number"
                />
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Line Items</h3>
                <ProductSelector onSelect={onProductSelect} paymentType={form.paymentType} />
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-[20%] font-bold">Product</TableHead>
                      <TableHead className="w-[11%] font-bold">Variant</TableHead>
                      <TableHead className="w-[6%] text-center font-bold">Qty</TableHead>
                      <TableHead className="w-[18%] text-right font-bold">Price</TableHead>
                      <TableHead className="w-[7%] text-center font-bold">Disc %</TableHead>
                      <TableHead className="w-[11%] text-right font-bold">Disc Amt</TableHead>
                      <TableHead className="w-[7%] text-center font-bold">GST %</TableHead>
                      <TableHead className="w-[16%] text-right font-bold">Total</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(form.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground italic">
                          No items added. Click "Add Product" to search the inventory.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (form.items || []).map((item) => {
                        const isOverStock = (item as any).stock !== undefined && item.quantity > (item as any).stock
                        return (
                          <TableRow
                            key={item.id}
                            className={isOverStock ? "bg-orange-50/80 hover:bg-orange-100/80 border-orange-200 transition-colors" : "hover:bg-slate-50/50"}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                {(item as any).imageUrl && (
                                  <div className="h-10 w-10 rounded border border-slate-100 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                                    <img src={getGoogleDrivePreviewUrl((item as any).imageUrl) || ""} alt={item.productName} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 truncate" title={item.productName}>{item.productName}</div>
                                  <div className="text-[11px] text-muted-foreground font-mono">{item.sku}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-700 font-medium">
                              {item.name || "—"}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number" min="1" value={item.quantity ?? ""}
                                onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                className="h-8 text-center border-0 bg-transparent hover:bg-slate-100/80 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary shadow-none font-medium px-1 no-spinner"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-end">
                                <div className="flex items-center justify-end gap-1 w-full">
                                  <span className="text-xs text-muted-foreground font-semibold">{getCurrencySymbol(form.currencyType)}</span>
                                  <Input
                                    type="number"
                                    value={item.unitPrice ?? ""}
                                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                    className="h-8 text-right border-0 bg-transparent hover:bg-slate-100/80 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary shadow-none font-semibold px-1 no-spinner w-full min-w-[90px]"
                                  />
                                </div>
                                {form.paymentType !== "Foreign" && (item.gstRate || 0) > 0 && (
                                  <div className="text-[10px] text-muted-foreground whitespace-nowrap pr-1">
                                    Base: {getCurrencySymbol(form.currencyType)}{((item.unitPrice || 0) / (1 + (item.gstRate || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number" min="0" max="100"
                                value={(item as any).discountPercentage !== undefined && (item as any).discountPercentage !== 0 ? (item as any).discountPercentage : ""}
                                onChange={(e) => updateItem(item.id, "discountPercentage", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                className="h-8 text-center border-0 bg-transparent hover:bg-slate-100/80 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary shadow-none font-medium px-1 no-spinner"
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-xs text-muted-foreground font-semibold">{getCurrencySymbol(form.currencyType)}</span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={(item as any).discountAmount !== undefined && (item as any).discountAmount !== 0 ? (item as any).discountAmount : ""}
                                  onChange={(e) => updateItem(item.id, "discountAmount", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                  className="h-8 text-right border-0 bg-transparent hover:bg-slate-100/80 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary shadow-none font-semibold px-1 no-spinner w-full min-w-[70px]"
                                  placeholder="0.00"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium text-slate-600 bg-slate-50/50">
                              {item.gstRate}%
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {getCurrencySymbol(form.currencyType)}{item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost" size="icon"
                                onClick={() => removeItem(item.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Footer: Addresses + Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Billing Address</Label>
                  <Textarea
                    placeholder="Full billing address..."
                    value={typeof form.billingAddress === "object" ? "" : (form.billingAddress as string || "")}
                    onChange={(e) => set("billingAddress", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Address</Label>
                  <Textarea
                    placeholder="Full shipping address..."
                    value={typeof form.shippingAddress === "object" ? "" : (form.shippingAddress as string || "")}
                    onChange={(e) => set("shippingAddress", e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                {form.paymentType === "Foreign" ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gross Total</span>
                      <span className="font-medium">{getCurrencySymbol(form.currencyType)}{form.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {form.items?.some(item => (item as any).discountAmount > 0) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Discount</span>
                        <span className="font-medium text-rose-600">- {getCurrencySymbol(form.currencyType)}{form.items?.reduce((sum, item) => sum + (((item as any).discountAmount || 0) * item.quantity), 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* 1. Base Amount (Price minus GST) */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gross Base Value (Excl. GST)</span>
                      <span className="font-medium">
                        {getCurrencySymbol(form.currencyType)}
                        {form.items?.reduce((sum, item) => {
                          const price = item.unitPrice || 0
                          const gstRate = item.gstRate || 0
                          const base = gstRate > 0 ? price / (1 + gstRate / 100) : price
                          return sum + (base * item.quantity)
                        }, 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* 2. Total Discount applied on Base Amount */}
                    {form.items?.some(item => (item as any).discountAmount > 0) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Discount (On Base Value)</span>
                        <span className="font-medium text-rose-600">
                          - {getCurrencySymbol(form.currencyType)}
                          {form.items?.reduce((sum, item) => sum + (((item as any).discountAmount || 0) * item.quantity), 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    {/* 3. Taxable Subtotal after Discount */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxable Subtotal</span>
                      <span className="font-medium">{getCurrencySymbol(form.currencyType)}{form.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    {/* 4. GST on Discounted Subtotal */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total GST</span>
                      <span className="font-medium text-emerald-600">{getCurrencySymbol(form.currencyType)}{form.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}

                {/* 5. Freight Charges */}
                <div className="flex items-center justify-between text-sm py-0.5">
                  <span className="text-muted-foreground font-medium">Freight Charges</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">{getCurrencySymbol(form.currencyType)}</span>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={form.freight !== undefined && form.freight !== 0 ? form.freight : ""}
                      onChange={(e) => handleFreightChange(e.target.value)}
                      className="h-8 w-28 text-right font-semibold border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <Separator />
                <div className="flex justify-between font-bold text-xl items-baseline">
                  <span>Grand Total</span>
                  <span className="text-primary tracking-tight font-extrabold text-2xl">{getCurrencySymbol(form.currencyType)}{form.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold opacity-60">
                  <Calculator className="h-3 w-3" />
                  Calculated automatically
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Label>Payment Terms / Notes</Label>
              <Textarea
                placeholder="Payment terms, validity period, or other instructions..."
                value={form.paymentTerms || form.notes || ""}
                onChange={(e) => set("paymentTerms", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-muted/10 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Discard Changes</Button>
          <Button
            onClick={handleSave}
            disabled={(!form.clientId && !form.clientName && !form.billingName) || (form.items || []).length === 0 || isSaving}
            className="min-w-40"
          >
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              isEdit ? "Update Proforma" : "Create Proforma"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
