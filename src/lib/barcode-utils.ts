/**
 * Authentic Code 128 (Subset B) Barcode Encoding and SVG Generation
 * Standard ISO/IEC 15417 compliant barcode generator.
 * Works with all physical optical/laser handheld scanners and phone cameras.
 */

// Code 128 bar and space widths (0 to 106)
// Each 6-character string represents widths of alternating Bar, Space, Bar, Space, Bar, Space summing to 11.
// Symbol 106 is the Stop code which has 7 elements summing to 13 modules.
const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (104=Start B, 106=Stop)
]

const START_B = 104
const STOP_CODE = 106
const QUIET_ZONE_MODULES = 10

export interface BarcodeModule {
  x: number
  width: number
}

export interface EncodedBarcode {
  bars: BarcodeModule[]
  totalWidth: number
  text: string
}

/**
 * Encodes ASCII string into Code 128 (Subset B) modules.
 */
export function encodeCode128B(rawText: string): EncodedBarcode {
  // Sanitize text to valid ASCII printable chars (32 to 126)
  const text = (rawText || "00000000")
    .replace(/[^\x20-\x7E]/g, "-")
    .trim() || "00000000"

  const symbols: number[] = [START_B]
  let checksumTotal = START_B

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    const symbolVal = charCode - 32
    symbols.push(symbolVal)
    checksumTotal += symbolVal * (i + 1)
  }

  const checksumVal = checksumTotal % 103
  symbols.push(checksumVal)
  symbols.push(STOP_CODE)

  // Convert symbol indices into alternating bar/space modules
  const bars: BarcodeModule[] = []
  let currentX = QUIET_ZONE_MODULES

  for (const sym of symbols) {
    const pattern = CODE128_PATTERNS[sym] || "212222"
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10)
      if (j % 2 === 0) {
        // Bar (black)
        bars.push({ x: currentX, width })
      }
      currentX += width
    }
  }

  const totalWidth = currentX + QUIET_ZONE_MODULES

  return {
    bars,
    totalWidth,
    text
  }
}

/**
 * Generate standard SVG markup for Code 128 barcode
 */
export function generateCode128SvgMarkup(
  text: string,
  options?: {
    height?: number
    showText?: boolean
    textMargin?: number
    fontSize?: number
  }
): string {
  const height = options?.height ?? 50
  const showText = options?.showText ?? true
  const fontSize = options?.fontSize ?? 11
  const textMargin = options?.textMargin ?? 4

  const encoded = encodeCode128B(text)
  const totalSvgHeight = showText ? height + fontSize + textMargin : height

  const rects = encoded.bars
    .map(b => `<rect x="${b.x}" y="0" width="${b.width}" height="${height}" fill="#000" />`)
    .join("")

  const textElement = showText
    ? `<text x="${encoded.totalWidth / 2}" y="${height + fontSize}" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="${fontSize}" font-weight="600" text-anchor="middle" fill="#111" letter-spacing="1">${encoded.text}</text>`
    : ""

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${encoded.totalWidth} ${totalSvgHeight}" width="100%" height="100%" preserveAspectRatio="none">${rects}${textElement}</svg>`
}

/**
 * Label paper presets supported by standard thermal roll & sheet printers
 */
export interface LabelPreset {
  id: string
  name: string
  type: "roll" | "sheet"
  widthMm: number
  heightMm: number
  columns: number
  rows?: number
  labelsPerPage: number
  description: string
  pageWidthMm?: number
  pageHeightMm?: number
  gapMm?: number
}

export const LABEL_PRESETS: LabelPreset[] = [
  {
    id: "thermal_40x15",
    name: "Thermal Roll 4cm × 1.5cm (40mm × 15mm)",
    type: "roll",
    widthMm: 40,
    heightMm: 15,
    columns: 1,
    labelsPerPage: 1,
    description: "Standard 4cm × 1.5cm (40mm × 15mm) compact item barcode sticker"
  },
  {
    id: "thermal_50x25",
    name: "Thermal Roll 5cm × 2.5cm (50mm × 25mm)",
    type: "roll",
    widthMm: 50,
    heightMm: 25,
    columns: 1,
    labelsPerPage: 1,
    description: "Standard 2\" × 1\" retail barcode sticker roll (Zebra, TSC, Citizen)"
  },
  {
    id: "thermal_50x38",
    name: "Thermal Roll (50mm × 38mm)",
    type: "roll",
    widthMm: 50,
    heightMm: 38,
    columns: 1,
    labelsPerPage: 1,
    description: "Large 2\" × 1.5\" sticker with product & pricing details"
  },
  {
    id: "thermal_38x25",
    name: "Thermal Roll (38mm × 25mm)",
    type: "roll",
    widthMm: 38,
    heightMm: 25,
    columns: 1,
    labelsPerPage: 1,
    description: "Compact 1.5\" × 1\" barcode label"
  },
  {
    id: "thermal_100x50",
    name: "Thermal Roll (100mm × 50mm)",
    type: "roll",
    widthMm: 100,
    heightMm: 50,
    columns: 1,
    labelsPerPage: 1,
    description: "Large 4\" × 2\" warehouse shipping & box label (Zebra, TSC, Godex)"
  },
  {
    id: "a4_24",
    name: "A4 Sheet - 24 Labels (3 × 8)",
    type: "sheet",
    widthMm: 70,
    heightMm: 37,
    columns: 3,
    rows: 8,
    labelsPerPage: 24,
    pageWidthMm: 210,
    pageHeightMm: 297,
    gapMm: 2,
    description: "Avery/standard self-adhesive A4 label sheet (3 across, 8 down)"
  },
  {
    id: "a4_40",
    name: "A4 Sheet - 40 Labels (4 × 10)",
    type: "sheet",
    widthMm: 48.5,
    heightMm: 25.4,
    columns: 4,
    rows: 10,
    labelsPerPage: 40,
    pageWidthMm: 210,
    pageHeightMm: 297,
    gapMm: 1.5,
    description: "Standard 48.5mm × 25.4mm barcode grid sheet"
  },
  {
    id: "a4_65",
    name: "A4 Sheet - 65 Labels (5 × 13)",
    type: "sheet",
    widthMm: 38,
    heightMm: 21.2,
    columns: 5,
    rows: 13,
    labelsPerPage: 65,
    pageWidthMm: 210,
    pageHeightMm: 297,
    gapMm: 1,
    description: "Compact mini label sheet (38mm × 21.2mm)"
  }
]

/**
 * Synchronous client-side fallback matching the standard ERP catalog scheme:
 * Format: c + sss + pppp + vv (10 characters total)
 * - c: Root Category ID (categoryPath[0] or "0")
 * - sss: Deepest subcategory ID zero-padded to 3 digits (e.g. 7 -> "007")
 * - pppp: Product ID or temporary placeholder zero-padded to 4 digits (e.g. 1 -> "0001", "0000")
 * - vv: 1-based variant index zero-padded to 2 digits (e.g. 1st -> "01", 2nd -> "02")
 */
export function formatLocalVariantBarcode(
  categoryPath: number[] = [],
  productIdOrTemp: string | number = "0000",
  index: number = 0
): string {
  const c = categoryPath[0] ? String(categoryPath[0]) : "0"
  const s = categoryPath.length > 0 && categoryPath[categoryPath.length - 1]
    ? String(categoryPath[categoryPath.length - 1]).padStart(3, "0")
    : "000"
  const p = String(productIdOrTemp || "0000").padStart(4, "0")
  const v = (index + 1).toString().padStart(2, "0")
  return `${c}${s}${p}${v}`
}

/**
 * Parses a standard 10-digit catalog variant barcode into its 4 architectural segments.
 */
export function parseVariantBarcodeSegments(barcode: string) {
  if (!barcode || barcode.length < 10) {
    return {
      rootCategoryId: "",
      subcategoryId: "",
      productId: "",
      variantIndex: ""
    }
  }
  const len = barcode.length
  const vv = barcode.slice(len - 2)
  const pppp = barcode.slice(len - 6, len - 2)
  const sss = barcode.slice(len - 9, len - 6)
  const c = barcode.slice(0, len - 9)
  return {
    rootCategoryId: c,
    subcategoryId: sss,
    productId: pppp,
    variantIndex: vv
  }
}

export interface Phase1LotParams {
  vendorPrefix?: string
  invoiceNumber?: string
  productId?: number | string
  variantId?: number | string
  date?: string
  sequence?: number
}

/**
 * Phase 1 Dynamic Lot Number Generator:
 * Formula: {VendorPrefix}-{InvoiceNumber}-{ProductId}[-{VariantId}]-{DateCode}[-{Sequence}]
 * Example: VK-INV1042-144-352-261022
 */
export function generatePhase1LotNumber(params: Phase1LotParams): string {
  const prefix = (params.vendorPrefix || "GEN")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase() || "GEN"

  const cleanInv = (params.invoiceNumber || "INV")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase() || "INV"

  const pId = params.productId ? String(params.productId) : "0"
  const vId = params.variantId && Number(params.variantId) > 0 ? String(params.variantId) : ""

  const dateObj = params.date ? new Date(params.date) : new Date()
  const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj
  const yy = String(validDate.getFullYear()).slice(-2)
  const mm = String(validDate.getMonth() + 1).padStart(2, "0")
  const dd = String(validDate.getDate()).padStart(2, "0")
  const dateCode = `${yy}${mm}${dd}`

  const seqStr = params.sequence !== undefined && params.sequence > 1 ? `-${String(params.sequence).padStart(2, "0")}` : ""

  if (vId) {
    return `${prefix}-${cleanInv}-${pId}-${vId}-${dateCode}${seqStr}`
  }
  return `${prefix}-${cleanInv}-${pId}-${dateCode}${seqStr}`
}

/**
 * Legacy Phase 0 lot generator, now defaults to Phase 1 format
 */
export function generateInvoiceLotNumber(
  invoiceNumber: string = "",
  skuOrVariant: string = "",
  index: number = 0
): string {
  return generatePhase1LotNumber({
    vendorPrefix: "GEN",
    invoiceNumber: invoiceNumber,
    productId: skuOrVariant,
    sequence: index + 1
  })
}

/**
 * Calculates a default ISO date (YYYY-MM-DD) given an offset in years from now.
 */
export function getDefaultExpiryDate(yearsToAdd: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + yearsToAdd)
  return d.toISOString().slice(0, 10)
}

/**
 * Evaluates the shelf life status of an expiry date.
 */
export function getExpiryStatus(expiryDate?: string): {
  status: "valid" | "expiring-soon" | "expired" | "none"
  label: string
  monthsRemaining?: number
} {
  if (!expiryDate) return { status: "none", label: "No Expiry" }
  const exp = new Date(expiryDate)
  if (isNaN(exp.getTime())) return { status: "none", label: "Invalid Date" }

  const now = new Date()
  const diffTime = exp.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const monthsRemaining = Math.round(diffDays / 30.4)

  if (diffDays < 0) {
    return { status: "expired", label: "Expired", monthsRemaining }
  } else if (monthsRemaining <= 6) {
    return {
      status: "expiring-soon",
      label: `Expiring Soon (${monthsRemaining}m)`,
      monthsRemaining,
    }
  } else {
    return {
      status: "valid",
      label: `${monthsRemaining}m valid`,
      monthsRemaining,
    }
  }
}

/**
 * ============================================================================
 * THERMAL PRINTER RAW (.PRN) SCRIPT GENERATORS (ZPL II & TSPL)
 * For industrial thermal label printers (Zebra, TSC, TVS, Godex, Xprinter)
 * ============================================================================
 */

export type ThermalPrinterLanguage = "zpl" | "tspl"
export type ThermalPrinterDpi = 203 | 300

export interface ThermalPrintItem {
  barcode: string
  lotNumber: string
  productName: string
  variantName?: string
  sku?: string
  expiryDate?: string
  warehouse?: string
  rack?: string
  quantity: number
}

export interface ThermalPrintOptions {
  language: ThermalPrinterLanguage
  dpi: ThermalPrinterDpi
  widthMm: number
  heightMm: number
  companyName?: string
  includeCompany?: boolean
  includeProductName?: boolean
  includeVariantName?: boolean
  includeSku?: boolean
  includeLotNumber?: boolean
  includeExpiry?: boolean
  includeLocation?: boolean
  includeHumanBarcode?: boolean
  items: ThermalPrintItem[]
}

/**
 * Generates raw ZPL II (.prn) command stream for Zebra and ZPL-compatible printers.
 */
export function generateLotZpl(options: ThermalPrintOptions): string {
  const {
    dpi = 203,
    widthMm,
    heightMm,
    companyName = "TEJCO GLOBAL LLP",
    includeCompany = true,
    includeProductName = true,
    includeVariantName = true,
    includeSku = true,
    includeLotNumber = true,
    includeExpiry = true,
    includeLocation = true,
    includeHumanBarcode = true,
    items = []
  } = options

  // Dots per mm: 203 DPI = 8.0 dots/mm, 300 DPI = 11.81 dots/mm
  const dpmm = dpi === 300 ? 11.81 : 8.0
  const widthDots = Math.round(widthMm * dpmm)
  const heightDots = Math.round(heightMm * dpmm)
  const marginDots = Math.round(2 * dpmm)
  const printableWidth = Math.max(10, widthDots - marginDots * 2)

  // Scaling factor for fonts and barcodes relative to 203 DPI baseline
  const s = dpi === 300 ? 1.48 : 1.0

  const zplBlocks: string[] = []

  for (const item of items) {
    if (!item.quantity || item.quantity <= 0) continue

    const barcodeVal = (item.barcode || item.lotNumber || "000000").replace(/[\^~]/g, "").trim()
    const lotNum = (item.lotNumber || "").replace(/[\^~]/g, "").trim()
    const prodName = (item.productName || "").replace(/[\^~]/g, "").trim().slice(0, 36)
    const varName = (item.variantName || "").replace(/[\^~]/g, "").trim().slice(0, 36)
    const skuStr = (item.sku || "").replace(/[\^~]/g, "").trim().slice(0, 24)
    const expStr = (item.expiryDate || "").replace(/[\^~]/g, "").trim()
    const whStr = (item.warehouse || "").replace(/[\^~]/g, "").trim().slice(0, 20)
    const rackStr = (item.rack ? `Rack: ${item.rack}` : "").replace(/[\^~]/g, "").trim().slice(0, 16)

    // Calculate module width for Code 128
    // Code 128 symbol: ~11 modules per char + 35 modules overhead
    const maxModules = (barcodeVal.length + 4) * 11 + 2
    const moduleWidth = Math.max(1, Math.min(3, Math.floor((printableWidth - 20) / maxModules)))
    const barcodeWidth = maxModules * moduleWidth
    const barcodeX = Math.max(marginDots, Math.round((widthDots - barcodeWidth) / 2))

    const isTiny = heightMm <= 18
    const isSmall = heightMm <= 26 && !isTiny
    const isLarge = heightMm >= 45

    let curY = Math.round((isTiny ? 0.8 : 1.5) * dpmm)

    const lines: string[] = [
      "^XA",
      `^PW${widthDots}`,
      `^LL${heightDots}`,
      "^LH0,0",
      "^CI28" // Enable UTF-8 interpretation
    ]

    // 1. Company Name Header
    if (includeCompany && companyName) {
      const hFont = Math.round((isTiny ? 12 : isSmall ? 16 : 20) * s)
      const wFont = Math.round((isTiny ? 10 : isSmall ? 14 : 17) * s)
      const compClean = companyName.replace(/[\^~]/g, "").trim().toUpperCase()
      lines.push(`^FO0,${curY}^FB${widthDots},1,0,C,0^A0N,${hFont},${wFont}^FD${compClean}^FS`)
      curY += hFont + Math.round((isTiny ? 1 : 2) * s)
    }

    // 2. Product Title
    if (includeProductName && prodName) {
      const hFont = Math.round((isTiny ? 13 : isSmall ? 18 : 22) * s)
      const wFont = Math.round((isTiny ? 11 : isSmall ? 15 : 18) * s)
      lines.push(`^FO0,${curY}^FB${widthDots},1,0,C,0^A0N,${hFont},${wFont}^FD${prodName}^FS`)
      curY += hFont + Math.round((isTiny ? 1 : 1.5) * s)
    }

    // 3. Variant / Spec
    if (includeVariantName && varName) {
      const hFont = Math.round((isTiny ? 11 : isSmall ? 15 : 18) * s)
      const wFont = Math.round((isTiny ? 9 : isSmall ? 13 : 15) * s)
      lines.push(`^FO0,${curY}^FB${widthDots},1,0,C,0^A0N,${hFont},${wFont}^FD${varName}^FS`)
      curY += hFont + Math.round((isTiny ? 1 : 2) * s)
    }

    // 4. Barcode Code 128
    const barcodeHeight = Math.round(
      (isTiny ? (includeProductName || includeCompany ? 28 : 46) : isSmall ? 38 : isLarge ? 68 : 50) * s
    )
    lines.push(`^BY${moduleWidth},3,${barcodeHeight}`)
    lines.push(`^FO${barcodeX},${curY}^BCN,${barcodeHeight},N,N,N^FD>:${barcodeVal}^FS`)
    curY += barcodeHeight + Math.round((isTiny ? 1.5 : 2) * s)

    // 5. Human-readable Barcode Value
    if (includeHumanBarcode) {
      const hFont = Math.round((isTiny ? 12 : isSmall ? 16 : 18) * s)
      const wFont = Math.round((isTiny ? 10 : isSmall ? 14 : 16) * s)
      lines.push(`^FO0,${curY}^FB${widthDots},1,0,C,0^A0N,${hFont},${wFont}^FD${barcodeVal}^FS`)
      curY += hFont + Math.round((isTiny ? 1.5 : 2.5) * s)
    }

    // 6. Meta Row 1: Lot Number and Expiry Date
    const metaHFont = Math.round((isTiny ? 11 : isSmall ? 15 : 18) * s)
    const metaWFont = Math.round((isTiny ? 9 : isSmall ? 13 : 15) * s)

    if (includeLotNumber || includeExpiry || includeSku) {
      const leftText = includeLotNumber ? `LOT: ${lotNum}` : (includeSku ? `SKU: ${skuStr}` : "")
      const rightText = includeExpiry && expStr ? `EXP: ${expStr}` : ""

      if (leftText) {
        lines.push(`^FO${marginDots},${curY}^A0N,${metaHFont},${metaWFont}^FD${leftText}^FS`)
      }
      if (rightText) {
        lines.push(`^FO${marginDots},${curY}^FB${printableWidth},1,0,R,0^A0N,${metaHFont},${metaWFont}^FD${rightText}^FS`)
      }
      curY += metaHFont + Math.round((isTiny ? 1 : 2) * s)
    }

    // 7. Meta Row 2: Warehouse and Rack
    if (includeLocation && (whStr || rackStr)) {
      const locHFont = Math.round((isTiny ? 10 : isSmall ? 13 : 16) * s)
      const locWFont = Math.round((isTiny ? 8 : isSmall ? 11 : 13) * s)
      if (whStr) {
        lines.push(`^FO${marginDots},${curY}^A0N,${locHFont},${locWFont}^FD${whStr}^FS`)
      }
      if (rackStr) {
        lines.push(`^FO${marginDots},${curY}^FB${printableWidth},1,0,R,0^A0N,${locHFont},${locWFont}^FD${rackStr}^FS`)
      }
    }

    // Quantity repetition and close label
    lines.push(`^PQ${item.quantity},0,1,Y`)
    lines.push("^XZ")

    zplBlocks.push(lines.join("\n"))
  }

  return zplBlocks.join("\n\n")
}

/**
 * Generates raw TSPL/TSPL2 (.prn) command stream for TSC, TVS, Xprinter and compatible printers.
 */
export function generateLotTspl(options: ThermalPrintOptions): string {
  const {
    dpi = 203,
    widthMm,
    heightMm,
    companyName = "TEJCO GLOBAL LLP",
    includeCompany = true,
    includeProductName = true,
    includeVariantName = true,
    includeSku = true,
    includeLotNumber = true,
    includeExpiry = true,
    includeLocation = true,
    includeHumanBarcode = true,
    items = []
  } = options

  const dpmm = dpi === 300 ? 11.81 : 8.0
  const widthDots = Math.round(widthMm * dpmm)
  const heightDots = Math.round(heightMm * dpmm)
  const marginDots = Math.round(2 * dpmm)
  const printableWidth = Math.max(10, widthDots - marginDots * 2)

  const s = dpi === 300 ? 1.48 : 1.0
  const isTiny = heightMm <= 18
  const isSmall = heightMm <= 26 && !isTiny
  const isLarge = heightMm >= 45

  const tsplBlocks: string[] = []

  const escapeTspl = (str: string) =>
    (str || "").replace(/"/g, "'").replace(/[\r\n]/g, " ").trim()

  for (const item of items) {
    if (!item.quantity || item.quantity <= 0) continue

    const barcodeVal = escapeTspl(item.barcode || item.lotNumber || "000000")
    const lotNum = escapeTspl(item.lotNumber)
    const prodName = escapeTspl(item.productName).slice(0, 36)
    const varName = escapeTspl(item.variantName || "").slice(0, 36)
    const skuStr = escapeTspl(item.sku || "").slice(0, 24)
    const expStr = escapeTspl(item.expiryDate || "")
    const whStr = escapeTspl(item.warehouse || "").slice(0, 20)
    const rackStr = escapeTspl(item.rack ? `Rack: ${item.rack}` : "").slice(0, 16)

    const maxModules = (barcodeVal.length + 4) * 11 + 2
    const moduleWidth = Math.max(1, Math.min(3, Math.floor((printableWidth - 20) / maxModules)))
    const barcodeWidth = maxModules * moduleWidth
    const barcodeX = Math.max(marginDots, Math.round((widthDots - barcodeWidth) / 2))

    const lines: string[] = [
      `SIZE ${widthMm} mm, ${heightMm} mm`,
      `GAP 2 mm, 0 mm`,
      `DIRECTION 1,0`,
      `REFERENCE 0,0`,
      `OFFSET 0 mm`,
      `CLS`
    ]

    let curY = Math.round((isTiny ? 0.8 : 1.5) * dpmm)

    // 1. Company Header
    if (includeCompany && companyName) {
      const compClean = escapeTspl(companyName).toUpperCase()
      const fontName = "1"
      const charWidth = 8 * (dpi === 300 ? 1.5 : 1)
      const textW = Math.round(compClean.length * charWidth)
      const textX = Math.max(marginDots, Math.round((widthDots - textW) / 2))
      lines.push(`TEXT ${textX},${curY},"${fontName}",0,1,1,"${compClean}"`)
      curY += Math.round((isTiny ? 12 : isSmall ? 16 : 24) * s)
    }

    // 2. Product Name
    if (includeProductName && prodName) {
      const fontName = isTiny ? "1" : isSmall ? "2" : "3"
      const charWidth = (isTiny ? 8 : isSmall ? 12 : 16) * (dpi === 300 ? 1.5 : 1)
      const textW = Math.round(prodName.length * charWidth)
      const textX = Math.max(marginDots, Math.round((widthDots - textW) / 2))
      lines.push(`TEXT ${textX},${curY},"${fontName}",0,1,1,"${prodName}"`)
      curY += Math.round((isTiny ? 13 : isSmall ? 22 : 28) * s)
    }

    // 3. Variant Name
    if (includeVariantName && varName) {
      const fontName = isTiny ? "1" : "2"
      const charWidth = (isTiny ? 8 : 12) * (dpi === 300 ? 1.5 : 1)
      const textW = Math.round(varName.length * charWidth)
      const textX = Math.max(marginDots, Math.round((widthDots - textW) / 2))
      lines.push(`TEXT ${textX},${curY},"${fontName}",0,1,1,"${varName}"`)
      curY += Math.round((isTiny ? 12 : 22) * s)
    }

    // 4. Barcode Code 128
    const barcodeHeight = Math.round(
      (isTiny ? (includeProductName || includeCompany ? 28 : 46) : isSmall ? 36 : isLarge ? 65 : 48) * s
    )
    lines.push(`BARCODE ${barcodeX},${curY},"128",${barcodeHeight},0,0,${moduleWidth},${moduleWidth},"${barcodeVal}"`)
    curY += barcodeHeight + Math.round((isTiny ? 1.5 : 2) * s)

    // 5. Human readable barcode text
    if (includeHumanBarcode) {
      const fontName = isTiny ? "1" : "2"
      const charWidth = (isTiny ? 8 : 12) * (dpi === 300 ? 1.5 : 1)
      const textW = Math.round(barcodeVal.length * charWidth)
      const textX = Math.max(marginDots, Math.round((widthDots - textW) / 2))
      lines.push(`TEXT ${textX},${curY},"${fontName}",0,1,1,"${barcodeVal}"`)
      curY += Math.round((isTiny ? 13 : 22) * s)
    }

    // 6. Meta Row 1: LOT and EXP
    if (includeLotNumber || includeExpiry || includeSku) {
      const leftText = includeLotNumber ? `LOT: ${lotNum}` : (includeSku ? `SKU: ${skuStr}` : "")
      const rightText = includeExpiry && expStr ? `EXP: ${expStr}` : ""

      if (leftText) {
        lines.push(`TEXT ${marginDots},${curY},"1",0,1,1,"${leftText}"`)
      }
      if (rightText) {
        const charW = 8 * (dpi === 300 ? 1.5 : 1)
        const rightW = Math.round(rightText.length * charW)
        const rightX = Math.max(marginDots, widthDots - marginDots - rightW)
        lines.push(`TEXT ${rightX},${curY},"1",0,1,1,"${rightText}"`)
      }
      curY += Math.round((isTiny ? 12 : 22) * s)
    }

    // 7. Meta Row 2: Warehouse and Rack
    if (includeLocation && (whStr || rackStr)) {
      if (whStr) {
        lines.push(`TEXT ${marginDots},${curY},"1",0,1,1,"${whStr}"`)
      }
      if (rackStr) {
        const charW = 8 * (dpi === 300 ? 1.5 : 1)
        const rightW = Math.round(rackStr.length * charW)
        const rightX = Math.max(marginDots, widthDots - marginDots - rightW)
        lines.push(`TEXT ${rightX},${curY},"1",0,1,1,"${rackStr}"`)
      }
    }

    // Print command: PRINT {quantity}, 1
    lines.push(`PRINT ${item.quantity},1`)

    tsplBlocks.push(lines.join("\n"))
  }

  return tsplBlocks.join("\n\n")
}

/**
 * Generates raw PRN script for thermal printing based on selected language.
 */
export function generateLotPrn(options: ThermalPrintOptions): string {
  if (options.language === "tspl") {
    return generateLotTspl(options)
  }
  return generateLotZpl(options)
}

