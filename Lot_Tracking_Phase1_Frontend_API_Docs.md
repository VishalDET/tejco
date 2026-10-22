# Tejco ERP – Phase 1 Frontend API Documentation
## Vendor Prefix, Mandatory Expiry Dates, Dynamic Lot Generation & Product Lots Breakdown

**Document Version:** 1.0  
**Date:** 22/10/2026  
**Status:** Implemented & Verified  

---

## 1. Lot Number Generation Endpoints

### `POST /api/Inventory/GenerateLotNumber`
Generate or preview a dynamic lot number on-demand (e.g., when filling Inward or PO forms).

#### Formula:
`{VendorPrefix}-{InvoiceNumber}-{ProductId}[-{VariantId}]-{DateCode}[-{Sequence}]`
*(Note: 'P' and 'V' letter tags have been removed in favor of clean numeric identifiers separated by hyphens)*

#### Request Headers:
`Content-Type: application/json`  
`Authorization: Bearer <JWT_TOKEN>`

#### Request Body:
```json
{
  "vendorId": 3,
  "vendorPrefix": "VK",
  "invoiceNumber": "INV-1042",
  "productId": 144,
  "variantId": 352,
  "date": "2026-10-22",
  "sequence": 1
}
```
*Note: If `vendorPrefix` is not supplied in the request body, passing `vendorId` will automatically look up the vendor's prefix in the database. If neither is found, it defaults to `"GEN"`.*

#### Success Response (200 OK):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Lot number generated successfully",
  "data": {
    "lotNumber": "VK-INV1042-144-352-261022",
    "lotBarcode": "VK-INV1042-144-352-261022",
    "segments": {
      "vendorPrefix": "VK",
      "invoiceNumber": "INV1042",
      "productId": 144,
      "variantId": 352,
      "productVariantCode": "144-352",
      "dateCode": "261022",
      "sequence": 1
    }
  }
}
```

---

### `GET /api/Inventory/GenerateLotNumber`
Same logic available via HTTP GET query string for instant UI auto-fill or preview.

#### Request URL:
`GET /api/Inventory/GenerateLotNumber?vendorPrefix=VK&invoiceNumber=INV-1042&productId=144&variantId=352&date=2026-10-22&sequence=1`

---

## 2. Product Details with Active Lots Breakdown

### `GET /api/Product/GetById/{id}`
Returns product header, all variants, and each variant's **active lots breakdown** (lots with `Status = 'Active'` and `CurrentQuantity > 0`).

#### Request URL:
`GET /api/Product/GetById/1`

#### Success Response (200 OK):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "productId": 1,
    "productName": "Hair Chair",
    "baseSKU": "HC-001",
    "hasVariants": true,
    "status": true,
    "lots": [],
    "variants": [
      {
        "variantId": 352,
        "productId": 1,
        "variantName": "Hair Chair - Black Leather",
        "skuSuffix": "BLK",
        "currentQuantity": 15,
        "reservedQuantity": 2,
        "availableStock": 13,
        "warehouseId": 1,
        "rackLocation": "A1-R2",
        "lots": [
          {
            "lotId": 45,
            "lotNumber": "VK-INV1042-1-352-261022",
            "productId": 1,
            "variantId": 352,
            "warehouseId": 1,
            "warehouseName": "Main Warehouse",
            "rackLocation": "A1-R2",
            "initialQuantity": 10,
            "currentQuantity": 10,
            "reservedQuantity": 0,
            "availableQuantity": 10,
            "expiryDate": "2027-10-22T00:00:00",
            "inwardDate": "2026-10-22T14:30:00",
            "status": "Active"
          },
          {
            "lotId": 38,
            "lotNumber": "TJC-INV0988-1-352-260915",
            "productId": 1,
            "variantId": 352,
            "warehouseId": 1,
            "warehouseName": "Main Warehouse",
            "rackLocation": "A1-R2",
            "initialQuantity": 10,
            "currentQuantity": 5,
            "reservedQuantity": 2,
            "availableQuantity": 3,
            "expiryDate": "2027-09-15T00:00:00",
            "inwardDate": "2026-09-15T10:15:00",
            "status": "Active"
          }
        ]
      }
    ]
  }
}
```

---

## 3. Mandatory `ExpiryDate` Validation

### Inward Order Creation (`POST /api/StockInward/Create`)
`ExpiryDate` is **mandatory** for every item in `items`. Missing or default dates will return a 400 validation error.

```json
{
  "orderNumber": "INW-2026-0042",
  "vendorId": 3,
  "vendorName": "V.K. Instruments",
  "warehouseId": 1,
  "orderDate": "2026-10-22T00:00:00.000Z",
  "invoiceNumber": "INV-1042",
  "items": [
    {
      "productId": 1,
      "variantId": 352,
      "productName": "Hair Chair",
      "variantName": "Black Leather",
      "sku": "HC-001-BLK",
      "expectedQty": 10,
      "receivedQty": 10,
      "locationCode": "A1-R2",
      "purchasePrice": 4500.00,
      "expiryDate": "2027-10-22"
    }
  ]
}
```

### Purchase Order Creation (`POST /api/PurchaseOrder/Add`)
`ExpiryDate` is **mandatory** for every line item in `lineItems`.

```json
{
  "orderNumber": "PO-2026-0089",
  "orderDate": "2026-10-22T00:00:00.000Z",
  "vendorId": 3,
  "orderStatus": "Draft",
  "paymentStatus": "Unpaid",
  "lineItems": [
    {
      "productId": 1,
      "variantId": 352,
      "sku": "HC-001-BLK",
      "quantity": 10,
      "unitPrice": 4500.00,
      "expiryDate": "2027-10-22"
    }
  ]
}
```

---

## 4. Vendor Prefix in Vendor Form (`POST /api/Vendor/Add` & `PUT /api/Vendor/Update`)

```json
{
  "vendorName": "V.K. Instruments",
  "address": "Goregaon East, Mumbai",
  "gstin": "27AAACV1234F1Z5",
  "email": "contact@vkinstruments.com",
  "mobileNumber": "9876543210",
  "contactPersonName": "Vijay Kumar",
  "vendorPrefix": "VK"
}
```
