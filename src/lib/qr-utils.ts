/**
 * Standard ISO/IEC 18004 Compliant QR Code Generator
 * Pure TypeScript, zero external dependencies.
 * Generates scanner-readable QR Codes (matrix, SVG, and lossless PNG Canvas Data URL).
 * Supports Versions 1 to 40, Error Correction Levels L, M, Q, H, UTF-8 byte encoding.
 * Implements the standard ISO/IEC 18004 QR Code Model (Kazuhiko Arase / Nayuki engine).
 */

export type QrEccLevel = "L" | "M" | "Q" | "H"

export interface QrCodeResult {
  modules: boolean[][]
  size: number
  version: number
}

export interface QrSvgOptions {
  size?: number
  quietZone?: number
  foregroundColor?: string
  backgroundColor?: string
  eccLevel?: QrEccLevel
}

export interface QrDataUrlOptions {
  moduleSize?: number
  quietZone?: number
  foregroundColor?: string
  backgroundColor?: string
  eccLevel?: QrEccLevel
}

// ISO/IEC 18004 Error Correction Level Indicators: L=1 (01b), M=0 (00b), Q=3 (11b), H=2 (10b)
const QR_ECC_LEVEL_VALUES: Record<QrEccLevel, number> = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
}

// Galois Field GF(256) Arithmetic with primitive polynomial 0x11D (x^8 + x^4 + x^3 + x^2 + 1)
const QRMath = {
  EXP_TABLE: new Array<number>(256),
  LOG_TABLE: new Array<number>(256),

  glog(n: number): number {
    if (n < 1) throw new Error("glog(" + n + ")")
    return QRMath.LOG_TABLE[n]
  },

  gexp(n: number): number {
    while (n < 0) n += 255
    while (n >= 255) n -= 255
    return QRMath.EXP_TABLE[n]
  },

  gmult(a: number, b: number): number {
    if (a === 0 || b === 0) return 0
    return QRMath.gexp(QRMath.glog(a) + QRMath.glog(b))
  },
}

for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i
for (let i = 8; i < 256; i++) {
  QRMath.EXP_TABLE[i] =
    QRMath.EXP_TABLE[i - 4] ^
    QRMath.EXP_TABLE[i - 5] ^
    QRMath.EXP_TABLE[i - 6] ^
    QRMath.EXP_TABLE[i - 8]
}
for (let i = 0; i < 255; i++) {
  QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i
}

class QRPolynomial {
  num: number[]

  constructor(num: number[], shift = 0) {
    let offset = 0
    while (offset < num.length && num[offset] === 0) {
      offset++
    }
    this.num = new Array(num.length - offset + shift)
    for (let i = 0; i < num.length - offset; i++) {
      this.num[i] = num[i + offset]
    }
    for (let i = num.length - offset; i < this.num.length; i++) {
      this.num[i] = 0
    }
  }

  get(index: number): number {
    return this.num[index]
  }

  getLength(): number {
    return this.num.length
  }

  multiply(e: QRPolynomial): QRPolynomial {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0)
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gmult(this.get(i), e.get(j))
      }
    }
    return new QRPolynomial(num, 0)
  }

  mod(e: QRPolynomial): QRPolynomial {
    let cur: QRPolynomial = this
    while (cur.getLength() >= e.getLength()) {
      const ratio = QRMath.glog(cur.get(0)) - QRMath.glog(e.get(0))
      const num = new Array(cur.getLength())
      for (let i = 0; i < cur.getLength(); i++) {
        num[i] = cur.get(i)
      }
      for (let i = 0; i < e.getLength(); i++) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio)
      }
      cur = new QRPolynomial(num, 0)
    }
    return cur
  }
}

class QRRSBlock {
  totalCount: number
  dataCount: number

  constructor(totalCount: number, dataCount: number) {
    this.totalCount = totalCount
    this.dataCount = dataCount
  }

  static RS_BLOCK_TABLE: number[][] = [
    // 1
    [1, 26, 19],
    [1, 26, 16],
    [1, 26, 13],
    [1, 26, 9],
    // 2
    [1, 44, 34],
    [1, 44, 28],
    [1, 44, 22],
    [1, 44, 16],
    // 3
    [1, 70, 55],
    [1, 70, 44],
    [2, 35, 17],
    [2, 35, 13],
    // 4
    [1, 100, 80],
    [2, 50, 32],
    [2, 50, 24],
    [4, 25, 9],
    // 5
    [1, 134, 108],
    [2, 67, 43],
    [2, 33, 15, 2, 34, 16],
    [2, 33, 11, 2, 34, 12],
    // 6
    [2, 86, 68],
    [4, 43, 27],
    [4, 43, 19],
    [4, 43, 15],
    // 7
    [2, 98, 78],
    [4, 49, 31],
    [2, 32, 14, 4, 33, 15],
    [4, 39, 13, 1, 40, 14],
    // 8
    [2, 121, 97],
    [2, 60, 38, 2, 61, 39],
    [4, 40, 18, 2, 41, 19],
    [4, 40, 14, 2, 41, 15],
    // 9
    [2, 146, 116],
    [3, 58, 36, 2, 59, 37],
    [4, 36, 16, 4, 37, 17],
    [4, 36, 12, 4, 37, 13],
    // 10
    [2, 86, 68, 2, 87, 69],
    [4, 69, 43, 1, 70, 44],
    [6, 43, 19, 2, 44, 20],
    [6, 43, 15, 2, 44, 16],
    // 11
    [4, 101, 81],
    [1, 80, 50, 4, 81, 51],
    [4, 50, 22, 4, 51, 23],
    [3, 36, 12, 8, 37, 13],
    // 12
    [2, 116, 92, 2, 117, 93],
    [6, 58, 36, 2, 59, 37],
    [4, 46, 20, 6, 47, 21],
    [7, 42, 14, 4, 43, 15],
    // 13
    [4, 133, 107],
    [8, 59, 37, 1, 60, 38],
    [8, 44, 20, 4, 45, 21],
    [12, 33, 11, 4, 34, 12],
    // 14
    [3, 145, 115, 1, 146, 116],
    [4, 64, 40, 5, 65, 41],
    [11, 36, 16, 5, 37, 17],
    [11, 36, 12, 5, 37, 13],
    // 15
    [5, 109, 87, 1, 110, 88],
    [5, 65, 41, 5, 66, 42],
    [5, 54, 24, 7, 55, 25],
    [11, 36, 12, 7, 37, 13],
    // 16
    [5, 122, 98, 1, 123, 99],
    [7, 73, 45, 3, 74, 46],
    [15, 43, 19, 2, 44, 20],
    [3, 45, 15, 13, 46, 16],
    // 17
    [1, 135, 107, 5, 136, 108],
    [10, 74, 46, 1, 75, 47],
    [1, 50, 22, 15, 51, 23],
    [2, 42, 14, 17, 43, 15],
    // 18
    [5, 150, 120, 1, 151, 121],
    [9, 69, 43, 4, 70, 44],
    [17, 50, 22, 1, 51, 23],
    [2, 42, 14, 19, 43, 15],
    // 19
    [3, 141, 113, 4, 142, 114],
    [3, 70, 44, 11, 71, 45],
    [17, 47, 21, 4, 48, 22],
    [9, 39, 13, 16, 40, 14],
    // 20
    [3, 135, 107, 5, 136, 108],
    [3, 67, 41, 13, 68, 42],
    [15, 54, 24, 5, 55, 25],
    [15, 43, 15, 10, 44, 16],
    // 21
    [4, 144, 116, 4, 145, 117],
    [17, 68, 42],
    [17, 50, 22, 6, 51, 23],
    [19, 46, 16, 6, 47, 17],
    // 22
    [2, 139, 111, 7, 140, 112],
    [17, 74, 46],
    [7, 54, 24, 16, 55, 25],
    [34, 37, 13],
    // 23
    [4, 151, 121, 5, 152, 122],
    [4, 75, 47, 14, 76, 48],
    [11, 54, 24, 14, 55, 25],
    [16, 45, 15, 14, 46, 16],
    // 24
    [6, 147, 117, 4, 148, 118],
    [6, 73, 45, 14, 74, 46],
    [11, 54, 24, 16, 55, 25],
    [30, 46, 16, 2, 47, 17],
    // 25
    [8, 132, 106, 4, 133, 107],
    [8, 75, 47, 13, 76, 48],
    [7, 54, 24, 22, 55, 25],
    [22, 45, 15, 13, 46, 16],
    // 26
    [10, 142, 114, 2, 143, 115],
    [19, 74, 46, 4, 75, 47],
    [28, 50, 22, 6, 51, 23],
    [33, 46, 16, 4, 47, 17],
    // 27
    [8, 152, 122, 4, 153, 123],
    [22, 73, 45, 3, 74, 46],
    [8, 53, 23, 26, 54, 24],
    [12, 45, 15, 28, 46, 16],
    // 28
    [3, 147, 117, 10, 148, 118],
    [3, 73, 45, 23, 74, 46],
    [4, 54, 24, 31, 55, 25],
    [11, 45, 15, 31, 46, 16],
    // 29
    [7, 146, 116, 7, 147, 117],
    [21, 73, 45, 7, 74, 46],
    [1, 53, 23, 37, 54, 24],
    [19, 45, 15, 26, 46, 16],
    // 30
    [5, 145, 115, 10, 146, 116],
    [19, 75, 47, 10, 76, 48],
    [15, 54, 24, 25, 55, 25],
    [23, 45, 15, 25, 46, 16],
    // 31
    [13, 145, 115, 3, 146, 116],
    [2, 74, 46, 29, 75, 47],
    [42, 54, 24, 1, 55, 25],
    [23, 45, 15, 28, 46, 16],
    // 32
    [17, 145, 115],
    [10, 74, 46, 23, 75, 47],
    [10, 54, 24, 35, 55, 25],
    [19, 45, 15, 35, 46, 16],
    // 33
    [17, 145, 115, 1, 146, 116],
    [14, 74, 46, 21, 75, 47],
    [29, 54, 24, 19, 55, 25],
    [11, 45, 15, 46, 46, 16],
    // 34
    [13, 145, 115, 6, 146, 116],
    [14, 74, 46, 23, 75, 47],
    [44, 54, 24, 7, 55, 25],
    [59, 46, 16, 1, 47, 17],
    // 35
    [12, 151, 121, 7, 152, 122],
    [12, 75, 47, 26, 76, 48],
    [39, 54, 24, 14, 55, 25],
    [22, 45, 15, 41, 46, 16],
    // 36
    [6, 151, 121, 14, 152, 122],
    [6, 75, 47, 34, 76, 48],
    [46, 54, 24, 10, 55, 25],
    [2, 45, 15, 64, 46, 16],
    // 37
    [17, 152, 122, 4, 153, 123],
    [29, 74, 46, 14, 75, 47],
    [49, 54, 24, 10, 55, 25],
    [24, 45, 15, 46, 46, 16],
    // 38
    [4, 152, 122, 18, 153, 123],
    [13, 74, 46, 32, 75, 47],
    [48, 54, 24, 14, 55, 25],
    [42, 45, 15, 32, 46, 16],
    // 39
    [20, 147, 117, 4, 148, 118],
    [40, 75, 47, 7, 76, 48],
    [43, 54, 24, 22, 55, 25],
    [10, 45, 15, 67, 46, 16],
    // 40
    [19, 148, 118, 6, 149, 119],
    [18, 75, 47, 31, 76, 48],
    [34, 54, 24, 34, 55, 25],
    [20, 45, 15, 61, 46, 16],
  ]

  static getRSBlocks(typeNumber: number, errorCorrectLevel: number): QRRSBlock[] {
    const tableOffset = (typeNumber - 1) * 4
    let eccOffset = 1 // default M
    if (errorCorrectLevel === QR_ECC_LEVEL_VALUES.L) eccOffset = 0
    else if (errorCorrectLevel === QR_ECC_LEVEL_VALUES.M) eccOffset = 1
    else if (errorCorrectLevel === QR_ECC_LEVEL_VALUES.Q) eccOffset = 2
    else if (errorCorrectLevel === QR_ECC_LEVEL_VALUES.H) eccOffset = 3

    const rsBlock = QRRSBlock.RS_BLOCK_TABLE[tableOffset + eccOffset]
    if (!rsBlock) {
      throw new Error(`Invalid RS Block index @ typeNumber: ${typeNumber}, errorCorrectLevel: ${errorCorrectLevel}`)
    }

    const length = rsBlock.length / 3
    const list: QRRSBlock[] = []
    for (let i = 0; i < length; i++) {
      const count = rsBlock[i * 3 + 0]
      const totalCount = rsBlock[i * 3 + 1]
      const dataCount = rsBlock[i * 3 + 2]
      for (let j = 0; j < count; j++) {
        list.push(new QRRSBlock(totalCount, dataCount))
      }
    }
    return list
  }
}

class QRBitBuffer {
  buffer: number[] = []
  length = 0

  get(index: number): boolean {
    const bufIndex = Math.floor(index / 8)
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1
  }

  put(num: number, length: number) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1)
    }
  }

  putBit(bit: boolean) {
    const bufIndex = Math.floor(this.length / 8)
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0)
    }
    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> (this.length % 8)
    }
    this.length++
  }
}

const QRUtil = {
  PATTERN_POSITION_TABLE: [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170],
  ],

  G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
  G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),
  G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),

  getBCHDigit(data: number): number {
    let digit = 0
    while (data !== 0) {
      digit++
      data >>>= 1
    }
    return digit
  },

  getBCHTypeInfo(data: number): number {
    let d = data << 10
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
      d ^= QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15))
    }
    return ((data << 10) | d) ^ QRUtil.G15_MASK
  },

  getBCHTypeNumber(data: number): number {
    let d = data << 12
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
      d ^= QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18))
    }
    return (data << 12) | d
  },

  getPatternPosition(typeNumber: number): number[] {
    return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || []
  },

  getMask(maskPattern: number, i: number, j: number): boolean {
    switch (maskPattern) {
      case 0: return (i + j) % 2 === 0
      case 1: return i % 2 === 0
      case 2: return j % 3 === 0
      case 3: return (i + j) % 3 === 0
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0
      case 5: return ((i * j) % 2) + ((i * j) % 3) === 0
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0
      case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0
      default: throw new Error("mask:" + maskPattern)
    }
  },

  getErrorCorrectPolynomial(errorCorrectLength: number): QRPolynomial {
    let a = new QRPolynomial([1], 0)
    for (let i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0))
    }
    return a
  },

  getLengthInBits(mode: number, type: number): number {
    if (1 <= type && type < 10) {
      return mode === 4 ? 8 : 8
    } else {
      return mode === 4 ? 16 : 16
    }
  },

  getLostPoint(qrCode: QRCodeEngine): number {
    const moduleCount = qrCode.moduleCount
    let lostPoint = 0

    // CONDITION 1: 5 or more consecutive modules of same color in rows and columns
    for (let row = 0; row < moduleCount; row++) {
      let runColor = qrCode.modules[row][0]
      let runLen = 1
      for (let col = 1; col < moduleCount; col++) {
        if (qrCode.modules[row][col] === runColor) {
          runLen++
        } else {
          if (runLen >= 5) lostPoint += 3 + (runLen - 5)
          runColor = qrCode.modules[row][col]
          runLen = 1
        }
      }
      if (runLen >= 5) lostPoint += 3 + (runLen - 5)
    }

    for (let col = 0; col < moduleCount; col++) {
      let runColor = qrCode.modules[0][col]
      let runLen = 1
      for (let row = 1; row < moduleCount; row++) {
        if (qrCode.modules[row][col] === runColor) {
          runLen++
        } else {
          if (runLen >= 5) lostPoint += 3 + (runLen - 5)
          runColor = qrCode.modules[row][col]
          runLen = 1
        }
      }
      if (runLen >= 5) lostPoint += 3 + (runLen - 5)
    }

    // CONDITION 2: 2x2 blocks of same color
    for (let row = 0; row < moduleCount - 1; row++) {
      for (let col = 0; col < moduleCount - 1; col++) {
        let count = 0
        if (qrCode.modules[row][col]) count++
        if (qrCode.modules[row + 1][col]) count++
        if (qrCode.modules[row][col + 1]) count++
        if (qrCode.modules[row + 1][col + 1]) count++
        if (count === 0 || count === 4) lostPoint += 3
      }
    }

    // CONDITION 3: 1:1:3:1:1 pattern (finder-like patterns)
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount - 6; col++) {
        if (
          qrCode.modules[row][col] &&
          !qrCode.modules[row][col + 1] &&
          qrCode.modules[row][col + 2] &&
          qrCode.modules[row][col + 3] &&
          qrCode.modules[row][col + 4] &&
          !qrCode.modules[row][col + 5] &&
          qrCode.modules[row][col + 6]
        ) {
          lostPoint += 40
        }
      }
    }

    for (let col = 0; col < moduleCount; col++) {
      for (let row = 0; row < moduleCount - 6; row++) {
        if (
          qrCode.modules[row][col] &&
          !qrCode.modules[row + 1][col] &&
          qrCode.modules[row + 2][col] &&
          qrCode.modules[row + 3][col] &&
          qrCode.modules[row + 4][col] &&
          !qrCode.modules[row + 5][col] &&
          qrCode.modules[row + 6][col]
        ) {
          lostPoint += 40
        }
      }
    }

    // CONDITION 4: Dark/light module balance
    let darkCount = 0
    for (let col = 0; col < moduleCount; col++) {
      for (let row = 0; row < moduleCount; row++) {
        if (qrCode.modules[row][col]) darkCount++
      }
    }
    const ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5
    lostPoint += Math.floor(ratio) * 10

    return lostPoint
  },
}

class QRCodeEngine {
  typeNumber: number
  errorCorrectLevel: number
  modules: (boolean | null)[][] = []
  moduleCount = 0
  dataList: Uint8Array[] = []

  constructor(typeNumber: number, errorCorrectLevel: number) {
    this.typeNumber = typeNumber
    this.errorCorrectLevel = errorCorrectLevel
  }

  addData(data: string) {
    const bytes = typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(data)
      : Buffer.from(data, "utf-8")
    this.dataList.push(bytes)
  }

  make() {
    if (this.typeNumber < 1) {
      let typeNumber = 1
      for (typeNumber = 1; typeNumber <= 40; typeNumber++) {
        const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel)
        let totalDataCount = 0
        for (let i = 0; i < rsBlocks.length; i++) {
          totalDataCount += rsBlocks[i].dataCount
        }
        let totalBits = 0
        for (let i = 0; i < this.dataList.length; i++) {
          totalBits += 4 + QRUtil.getLengthInBits(4, typeNumber) + this.dataList[i].length * 8
        }
        if (totalBits <= totalDataCount * 8) {
          break
        }
      }
      this.typeNumber = Math.min(typeNumber, 40)
    }

    let minLostPoint = Infinity
    let bestPattern = 0

    // Evaluate all 8 standard mask patterns and pick the lowest penalty
    for (let i = 0; i < 8; i++) {
      this.makeImpl(true, i)
      const lostPoint = QRUtil.getLostPoint(this)
      if (lostPoint < minLostPoint) {
        minLostPoint = lostPoint
        bestPattern = i
      }
    }

    // Final matrix layout with the chosen optimal mask
    this.makeImpl(false, bestPattern)
  }

  makeImpl(test: boolean, maskPattern: number) {
    this.moduleCount = this.typeNumber * 4 + 17
    this.modules = Array.from({ length: this.moduleCount }, () =>
      new Array<boolean | null>(this.moduleCount).fill(null)
    )

    this.setupPositionProbePattern(0, 0)
    this.setupPositionProbePattern(this.moduleCount - 7, 0)
    this.setupPositionProbePattern(0, this.moduleCount - 7)
    this.setupPositionAdjustPattern()
    this.setupTimingPattern()
    this.setupTypeInfo(test, maskPattern)

    if (this.typeNumber >= 7) {
      this.setupTypeNumber(test)
    }

    const data = this.createData(this.typeNumber, this.errorCorrectLevel, this.dataList)
    this.mapData(data, maskPattern)
  }

  setupPositionProbePattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      if (row + r < 0 || this.moduleCount <= row + r) continue
      for (let c = -1; c <= 7; c++) {
        if (col + c < 0 || this.moduleCount <= col + c) continue
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this.modules[row + r][col + c] = true
        } else {
          this.modules[row + r][col + c] = false
        }
      }
    }
  }

  setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] !== null) continue
      this.modules[r][6] = r % 2 === 0
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] !== null) continue
      this.modules[6][c] = c % 2 === 0
    }
  }

  setupPositionAdjustPattern() {
    const pos = QRUtil.getPatternPosition(this.typeNumber)
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i]
        const col = pos[j]
        if (this.modules[row][col] !== null) continue
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (
              r === -2 ||
              r === 2 ||
              c === -2 ||
              c === 2 ||
              (r === 0 && c === 0)
            ) {
              this.modules[row + r][col + c] = true
            } else {
              this.modules[row + r][col + c] = false
            }
          }
        }
      }
    }
  }

  setupTypeInfo(test: boolean, maskPattern: number) {
    const data = (this.errorCorrectLevel << 3) | maskPattern
    const bits = QRUtil.getBCHTypeInfo(data)

    // Vertical format info
    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1
      if (i < 6) {
        this.modules[i][8] = mod
      } else if (i < 8) {
        this.modules[i + 1][8] = mod
      } else {
        this.modules[this.moduleCount - 15 + i][8] = mod
      }
    }

    // Horizontal format info
    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1
      if (i < 8) {
        this.modules[8][this.moduleCount - i - 1] = mod
      } else if (i < 9) {
        this.modules[8][15 - i - 1 + 1] = mod
      } else {
        this.modules[8][15 - i - 1] = mod
      }
    }

    // Fixed dark module at (moduleCount - 8, 8)
    this.modules[this.moduleCount - 8][8] = !test
  }

  setupTypeNumber(test: boolean) {
    const bits = QRUtil.getBCHTypeNumber(this.typeNumber)
    for (let i = 0; i < 18; i++) {
      const mod = !test && ((bits >> i) & 1) === 1
      this.modules[Math.floor(i / 3)][(i % 3) + this.moduleCount - 8 - 3] = mod
    }
    for (let i = 0; i < 18; i++) {
      const mod = !test && ((bits >> i) & 1) === 1
      this.modules[(i % 3) + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod
    }
  }

  createData(typeNumber: number, errorCorrectLevel: number, dataList: Uint8Array[]): number[] {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel)
    const buffer = new QRBitBuffer()

    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i]
      buffer.put(4, 4) // 8-bit byte mode = 0100
      buffer.put(data.length, QRUtil.getLengthInBits(4, typeNumber))
      for (let j = 0; j < data.length; j++) {
        buffer.put(data[j], 8)
      }
    }

    let totalDataCount = 0
    for (let i = 0; i < rsBlocks.length; i++) {
      totalDataCount += rsBlocks[i].dataCount
    }

    // Terminator (up to 4 zeroes)
    if (buffer.length + 4 <= totalDataCount * 8) {
      buffer.put(0, 4)
    } else if (buffer.length < totalDataCount * 8) {
      buffer.put(0, totalDataCount * 8 - buffer.length)
    }

    // Pad to byte boundary
    while (buffer.length % 8 !== 0) {
      buffer.putBit(false)
    }

    // Pad codewords (0xEC, 0x11)
    while (buffer.length < totalDataCount * 8) {
      buffer.put(0xec, 8)
      if (buffer.length < totalDataCount * 8) {
        buffer.put(0x11, 8)
      }
    }

    // Reed-Solomon computation for each block
    let offset = 0
    let maxDcCount = 0
    let maxEcCount = 0
    const dcdata: number[][] = new Array(rsBlocks.length)
    const ecdata: number[][] = new Array(rsBlocks.length)

    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount
      const ecCount = rsBlocks[r].totalCount - dcCount
      maxDcCount = Math.max(maxDcCount, dcCount)
      maxEcCount = Math.max(maxEcCount, ecCount)

      dcdata[r] = new Array(dcCount)
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xff & buffer.buffer[i + offset]
      }
      offset += dcCount

      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount)
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1)
      const modPoly = rawPoly.mod(rsPoly)

      ecdata[r] = new Array(rsPoly.getLength() - 1)
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length
        ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0
      }
    }

    let totalCodeCount = 0
    for (let i = 0; i < rsBlocks.length; i++) {
      totalCodeCount += rsBlocks[i].totalCount
    }

    const data = new Array<number>(totalCodeCount)
    let index = 0

    // Interleave data codewords
    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) {
          data[index++] = dcdata[r][i]
        }
      }
    }

    // Interleave error correction codewords
    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) {
          data[index++] = ecdata[r][i]
        }
      }
    }

    return data
  }

  mapData(data: number[], maskPattern: number) {
    let inc = -1
    let row = this.moduleCount - 1
    let bitIndex = 7
    let byteIndex = 0

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            let dark = false
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1
            }
            const mask = QRUtil.getMask(maskPattern, row, col - c)
            if (mask) {
              dark = !dark
            }
            this.modules[row][col - c] = dark
            bitIndex--
            if (bitIndex === -1) {
              byteIndex++
              bitIndex = 7
            }
          }
        }
        row += inc
        if (row < 0 || this.moduleCount <= row) {
          row -= inc
          inc = -inc
          break
        }
      }
    }
  }
}

/**
 * Encodes text into a boolean module matrix according to ISO/IEC 18004.
 */
export function generateQrMatrix(rawText: string, eccLevel: QrEccLevel = "M"): QrCodeResult {
  const text = (rawText || "000000").trim() || "000000"
  const eccVal = QR_ECC_LEVEL_VALUES[eccLevel] ?? QR_ECC_LEVEL_VALUES.M

  const qr = new QRCodeEngine(0, eccVal)
  qr.addData(text)
  qr.make()

  const modules: boolean[][] = []
  for (let r = 0; r < qr.moduleCount; r++) {
    const row: boolean[] = []
    for (let c = 0; c < qr.moduleCount; c++) {
      row.push(!!qr.modules[r][c])
    }
    modules.push(row)
  }

  return {
    modules,
    size: qr.moduleCount,
    version: qr.typeNumber,
  }
}

/**
 * Builds an optimized SVG path string representing all dark modules in the QR code.
 * Adjacent modules on the same row are merged into single horizontal rect runs.
 */
export function generateQrPath(qr: QrCodeResult, quietZone = 2): string {
  let d = ""
  for (let r = 0; r < qr.size; r++) {
    let c = 0
    while (c < qr.size) {
      if (qr.modules[r][c]) {
        let runLen = 1
        while (c + runLen < qr.size && qr.modules[r][c + runLen]) {
          runLen++
        }
        d += `M${c + quietZone},${r + quietZone}h${runLen}v1h-${runLen}z`
        c += runLen
      } else {
        c++
      }
    }
  }
  return d
}

/**
 * Generates pure vector SVG markup for the QR Code.
 */
export function generateQrSvgMarkup(
  text: string,
  options?: QrSvgOptions
): string {
  const ecc = options?.eccLevel ?? "M"
  const quietZone = Math.max(0, options?.quietZone ?? 2)
  const fg = options?.foregroundColor ?? "#000000"
  const bg = options?.backgroundColor ?? "#ffffff"
  const qr = generateQrMatrix(text || "000000", ecc)
  const totalDim = qr.size + quietZone * 2
  const targetSize = options?.size ?? 120
  const pathD = generateQrPath(qr, quietZone)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" width="${targetSize}" height="${targetSize}" shape-rendering="crispEdges">
  <rect width="${totalDim}" height="${totalDim}" fill="${bg}" />
  <path d="${pathD}" fill="${fg}" shape-rendering="crispEdges" />
</svg>`
}

/**
 * Generates a lossless PNG Data URL directly on an HTML Canvas.
 * Produces crisp, pixel-perfect QR codes for instant physical camera/scanner recognition.
 */
export function generateQrDataUrl(
  text: string,
  options?: QrDataUrlOptions
): string {
  const ecc = options?.eccLevel ?? "M"
  const quietZone = Math.max(0, Math.round(options?.quietZone ?? 2))
  const moduleSize = Math.max(1, Math.round(options?.moduleSize ?? 5))
  const fg = options?.foregroundColor ?? "#000000"
  const bg = options?.backgroundColor ?? "#ffffff"

  if (typeof document === "undefined") {
    const svg = generateQrSvgMarkup(text, {
      quietZone,
      foregroundColor: fg,
      backgroundColor: bg,
      eccLevel: ecc,
    })
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  const qr = generateQrMatrix(text || "000000", ecc)
  const totalModules = qr.size + quietZone * 2
  const pixelSize = totalModules * moduleSize

  const canvas = document.createElement("canvas")
  canvas.width = pixelSize
  canvas.height = pixelSize
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""

  // Solid white quiet zone and background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, pixelSize, pixelSize)

  // Solid modules with crisp integer sizing
  ctx.fillStyle = fg
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.modules[r][c]) {
        ctx.fillRect(
          (c + quietZone) * moduleSize,
          (r + quietZone) * moduleSize,
          moduleSize,
          moduleSize
        )
      }
    }
  }

  return canvas.toDataURL("image/png")
}
