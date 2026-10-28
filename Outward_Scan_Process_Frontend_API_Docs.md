# Outward Order Barcode Scan API - Frontend Integration Guide

## 1. Overview

During the warehouse picking and packing process for an **Outward Order (Sales Order dispatch)**, warehouse operators scan barcodes using hand scanners or mobile cameras.

When a barcode is submitted to this endpoint:
1. The backend automatically identifies the matching line item in the outward order.
2. The backend returns the **`lotNumber`** (and `lotId`) assigned to that item.
3. If an item did not have a lot pre-assigned, the backend automatically assigns the active FIFO lot for that variant.
4. The backend increments the line item's `scannedQty` (up to `orderedQty`) and records the scan event in `OutwardScanHistory`.
5. The response provides immediate completion flags (`isItemComplete`, `isOrderComplete`) so the UI can update progress bars and play audio cues without requiring a separate refresh call.

---

## 2. Supported Barcode Formats

The endpoint accepts any of the following values in the `barcode` field:

| Format Type | Example | Description |
| :--- | :--- | :--- |
| **Variant Barcode** | `7018014201` | Product variant barcode generated during creation/inward. |
| **Lot Barcode** | `SMPO2026101653897018014201` | Full composite barcode printed on the lot/box label (`LotNumber + VariantBarcode`). |
| **Lot Number** | `SMPO202610165389` | Vendor invoice-based lot number. |
| **SKU** | `SNH-001` | Product SKU code. |

---

## 3. Endpoint Specification

- **Method**: `POST`
- **URL**: `/api/OrderOutward/{outwardOrderId}/Scan`
- **Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  Authorization: Bearer <token>
  ```

---

## 4. Request Details

### URL Parameter
- `outwardOrderId` *(integer, required)*: The unique ID of the Outward Order (e.g. `5`).

### Request Payload
```json
{
  "barcode": "7018014201"
}
```

### TypeScript Interface
```typescript
export interface OutwardScanRequest {
  barcode: string;
}
```

---

## 5. Response Details

### Response Model (`OutwardScanResultDto`)

| Field | Type | Description |
| :--- | :--- | :--- |
| **`lotNumber`** | `string` | **The corresponding lot number for the scanned item** (e.g. `"SMPO202610165389"`). |
| **`lotId`** | `number \| null` | Database ID of the assigned lot. |
| **`barcode`** | `string` | The barcode value that was scanned. |
| **`outwardOrderItemId`** | `number` | ID of the matched row in `OutwardOrderItems`. |
| **`productId`** | `number` | ID of the parent product. |
| **`variantId`** | `number` | ID of the matched product variant. |
| **`productName`** | `string` | Name of the product. |
| **`variantName`** | `string` | Name/attributes of the variant (e.g. `"Standard 14cm"`). |
| **`sku`** | `string` | Product SKU. |
| **`orderedQty`** | `number` | Total quantity required for this item in the order. |
| **`scannedQty`** | `number` | Updated quantity successfully scanned so far. |
| **`locationCode`** | `string \| null` | Storage location bin/rack (e.g. `"WH1-A-01"`). |
| **`isItemComplete`** | `boolean` | `true` if `scannedQty >= orderedQty` for this item. |
| **`isOrderComplete`** | `boolean` | `true` if all items in this outward order are fully scanned. |

---

### Example Responses

#### Case 1: First Scan Successful (Item partially scanned)
**Status**: `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Scan event recorded successfully",
  "data": {
    "lotNumber": "SMPO202610165389",
    "lotId": 14,
    "barcode": "7018014201",
    "outwardOrderItemId": 105,
    "productId": 142,
    "variantId": 18,
    "productName": "Surgical Needle Holder",
    "variantName": "Standard 14cm",
    "sku": "SNH-001",
    "orderedQty": 2,
    "scannedQty": 1,
    "locationCode": "WH1-A-01",
    "isItemComplete": false,
    "isOrderComplete": false
  },
  "totalCount": null,
  "error": null
}
```

#### Case 2: Second Scan (Item complete, Order still in progress)
**Status**: `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Scan event recorded successfully",
  "data": {
    "lotNumber": "SMPO202610165389",
    "lotId": 14,
    "barcode": "7018014201",
    "outwardOrderItemId": 105,
    "productId": 142,
    "variantId": 18,
    "productName": "Surgical Needle Holder",
    "variantName": "Standard 14cm",
    "sku": "SNH-001",
    "orderedQty": 2,
    "scannedQty": 2,
    "locationCode": "WH1-A-01",
    "isItemComplete": true,
    "isOrderComplete": false
  },
  "totalCount": null,
  "error": null
}
```

#### Case 3: Final Scan (All items fulfilled - Order complete)
**Status**: `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Scan event recorded successfully",
  "data": {
    "lotNumber": "SMPO202610165389",
    "lotId": 14,
    "barcode": "7018014201",
    "outwardOrderItemId": 105,
    "productId": 142,
    "variantId": 18,
    "productName": "Surgical Needle Holder",
    "variantName": "Standard 14cm",
    "sku": "SNH-001",
    "orderedQty": 2,
    "scannedQty": 2,
    "locationCode": "WH1-A-01",
    "isItemComplete": true,
    "isOrderComplete": true
  },
  "totalCount": null,
  "error": null
}
```

---

## 6. Error Responses

#### 1. Missing or Empty Barcode (`400 Bad Request`)
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Barcode is required.",
  "data": null,
  "totalCount": null,
  "error": null
}
```

#### 2. Barcode Does Not Belong to Order (`400 Bad Request`)
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Barcode 'INVALID-BARCODE-999' does not match any item in outward order #5.",
  "data": null,
  "totalCount": null,
  "error": null
}
```

#### 3. Outward Order Not Found (`404 Not Found`)
```json
{
  "statusCode": 404,
  "success": false,
  "message": "Outward order not found.",
  "data": null,
  "totalCount": null,
  "error": null
}
```

---

## 7. Frontend Integration Checklist & Recommendations

```typescript
// Example frontend handler in React / Vue / Angular:
async function handleBarcodeScanned(outwardOrderId: number, scannedBarcode: string) {
  try {
    const res = await api.post(`/api/OrderOutward/${outwardOrderId}/Scan`, {
      barcode: scannedBarcode.trim()
    });

    if (res.data.success) {
      const scanResult = res.data.data;
      
      // 1. Display lot number on the UI card / row:
      displayLotBadge(scanResult.outwardOrderItemId, scanResult.lotNumber);

      // 2. Update line item progress (scannedQty / orderedQty):
      updateItemProgress(scanResult.outwardOrderItemId, scanResult.scannedQty, scanResult.orderedQty);

      // 3. Play audio feedback:
      if (scanResult.isOrderComplete) {
        playSound('order-complete.mp3');
        showModal('Outward Order Ready for Dispatch!');
      } else if (scanResult.isItemComplete) {
        playSound('item-complete.mp3');
      } else {
        playSound('beep-success.mp3');
      }
    }
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'Failed to process barcode.';
    playSound('beep-error.mp3');
    showNotification(errorMsg, 'error');
  }
}
```

### UI Highlights:
- **Show Lot Number Badge**: Display `scanResult.lotNumber` prominently next to the scanned item row so warehouse operators can visually verify it against physical packaging.
- **Progress Counter**: Show `scannedQty / orderedQty` with an animated progress bar.
- **Auto Focus**: After each scan, keep the barcode input field focused so the operator can scan rapidly without touching the mouse/keyboard.
