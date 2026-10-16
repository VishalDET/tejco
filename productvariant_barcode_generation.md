Product Variant Barcode Generation API (`/api/Product/GenerateVariantBarcode`)

* **Endpoints:**
  * `POST /api/Product/GenerateVariantBarcode` (accepts JSON body)
  * `GET /api/Product/GenerateVariantBarcode` (accepts query parameters)
* **Description:** Generates standard 4-segment product variant barcodes following the ERP catalog scheme:
  * **c** (Root Category ID): Top-level category (`path[0]`), default `"0"`.
  * **s** (Subcategory ID): Deepest selected category level (`path[path.length - 1]`), zero-padded to 3 digits (e.g. 12 -> `"012"`).
  * **p** (Product Placeholder / ID): Existing `productId` (padded to 4 digits) or `tempProdId` state (default `"0000"`).
  * **v** (Variant Index): 1-based variant index (`index + 1`), zero-padded to 2 digits (e.g. 1st variant -> `"01"`, 2nd -> `"02"`).

### 6.1 POST Example (JSON Body)

#### Request:
```http
POST /api/Product/GenerateVariantBarcode HTTP/1.1
Content-Type: application/json
Authorization: Bearer <TOKEN>
```
```json
{
  "categoryPath": [2, 7],
  "tempProdId": "0000",
  "index": 0,
  "variantCount": 2
}
```

#### Response (200 OK):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Variant barcode generated successfully",
  "data": {
    "barcode": "2007000001",
    "barcodes": [
      "2007000001",
      "2007000002"
    ],
    "segments": {
      "rootCategoryId": "2",
      "subcategoryId": "007",
      "productId": "0000",
      "variantIndex": "01"
    }
  },
  "totalCount": null,
  "error": null
}
```

### 6.2 GET Example (Query Parameters)

#### Request:
```http
GET /api/Product/GenerateVariantBarcode?rootCategoryId=2&subcategoryId=7&productId=1&variantIndex=1 HTTP/1.1
Authorization: Bearer <TOKEN>
```

#### Response (200 OK):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Variant barcode generated successfully",
  "data": {
    "barcode": "2007000101",
    "barcodes": [
      "2007000101"
    ],
    "segments": {
      "rootCategoryId": "2",
      "subcategoryId": "007",
      "productId": "0001",
      "variantIndex": "01"
    }
  },
  "totalCount": null,
  "error": null
}
```
