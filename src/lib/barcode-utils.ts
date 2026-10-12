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
    id: "thermal_50x25",
    name: "Thermal Roll (50mm × 25mm)",
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
