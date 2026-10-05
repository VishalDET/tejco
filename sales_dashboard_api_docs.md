# Sales Dashboard API Documentation

This document outlines all endpoints available under the `SalesDashboard` controller, designed specifically for the "Dashboard Only" role. 

**Base URL**: `GET /api/SalesDashboard/`  
**Authorization**: Bearer Token required. User must have `SalesDashboard.View` permission.
**Common Response Format**: All endpoints return data wrapped in a standard structure:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "...",
  "data": { ... },
  "totalCount": 0,
  "error": null
}
```
*(The examples below only show the structure of the `data` payload for brevity).*

---

## 1. Sales KPI Cards (Present)
Returns real-time snapshot of business health for the current month/year.

**Endpoint:** `KPIs`  
**Method:** `GET`  
**Query Parameters:** None

**Response Data Example:**
```json
{
  "revenueThisMonth": 1250000.50,
  "revenueThisYear": 14500000.00,
  "activeOrders": 45,
  "quotationsSentThisMonth": 12,
  "proformaThisMonth": 8,
  "conversionRatePct": 65.5,
  "avgOrderValue": 45000.00,
  "creditNotesCount": 3,
  "creditNotesRefundAmount": 15000.00
}
```

---

## 2. Historical Sales Trend (Past)
Returns month-by-month revenue performance.

**Endpoint:** `HistoricalTrend`  
**Method:** `GET`  
**Query Parameters:**
- `lookbackMonths` (int, optional): How many past months to fetch. **Default: `12`**. (Min 1, Max 60).

**Example Request:** `/api/SalesDashboard/HistoricalTrend?lookbackMonths=6`

**Response Data Example:**
```json
[
  {
    "year": 2026,
    "month": 4,
    "monthName": "Apr 2026",
    "totalOrders": 120,
    "totalRevenue": 4500000.00,
    "avgOrderValue": 37500.00
  },
  {
    "year": 2026,
    "month": 5,
    "monthName": "May 2026",
    "totalOrders": 135,
    "totalRevenue": 5100000.00,
    "avgOrderValue": 37777.78
  }
]
```

---

## 3. Pipeline Funnel (Present)
Returns how many documents are at each stage right now across Quotations, Proforma Invoices, and Sales Orders.

**Endpoint:** `PipelineFunnel`  
**Method:** `GET`  
**Query Parameters:** None

**Response Data Example:**
```json
[
  {
    "documentType": "Quotation",
    "stage": "Draft",
    "documentCount": 5,
    "totalValue": 150000.00
  },
  {
    "documentType": "Sales Order",
    "stage": "Processing",
    "documentCount": 12,
    "totalValue": 480000.00
  }
]
```

---

## 4. Future Sales Forecast (Future)
Projects future sales using a Weighted Moving Average (WMA) based on recent historical data.

**Endpoint:** `Forecast`  
**Method:** `GET`  
**Query Parameters:**
- `lookbackMonths` (int, optional): How many past months to use as input. **Default: `6`**. (Min 3, Max 24).
- `forecastMonths` (int, optional): How many future months to project. **Default: `3`**. (Min 1, Max 12).

**Example Request:** `/api/SalesDashboard/Forecast?lookbackMonths=6&forecastMonths=3`

**Response Data Example:**
```json
{
  "lookbackMonths": 6,
  "forecastMonths": 3,
  "historicalData": [
     // Contains actual data for the past 'lookbackMonths' (Same structure as HistoricalTrend)
  ],
  "forecast": [
    {
      "forecastMonth": "Nov 2026",
      "year": 2026,
      "month": 11,
      "estimatedRevenue": 5250000.00,
      "lowerBound": 4462500.00,
      "upperBound": 6037500.00,
      "confidenceLabel": "High"
    }
  ]
}
```
*Note: The frontend can combine `historicalData` and `forecast` to draw a continuous line chart showing the past leading into the predicted future.*

---

## 5. Top Performers (Past + Present)
Returns top sales persons, clients, or products. All three endpoints use the same filter structure.

**Endpoints:** 
- `TopSalesPersons`
- `TopClients`
- `TopProducts`

**Method:** `GET`  
**Query Parameters (Shared):**
- `startDate` (string/date, optional): Defaults to exactly 12 months ago. Example: `2026-01-01`
- `endDate` (string/date, optional): Defaults to today. Example: `2026-12-31`
- `limit` (int, optional): Number of results to return. **Default: `10`**.

**Example Request:** `/api/SalesDashboard/TopProducts?limit=5`

**Response Data Examples:**

**TopSalesPersons:**
```json
[
  {
    "salesPersonId": 14,
    "salesPersonName": "John Doe",
    "totalOrders": 45,
    "totalRevenue": 1500000.00,
    "avgOrderValue": 33333.33,
    "totalQuantitySold": 120
  }
]
```

**TopClients:**
```json
[
  {
    "clientId": 102,
    "clientName": "Acme Corp",
    "totalOrders": 12,
    "totalRevenue": 850000.00,
    "avgOrderValue": 70833.33,
    "lastOrderDate": "2026-09-15T00:00:00"
  }
]
```

**TopProducts:**
```json
[
  {
    "productId": 205,
    "productName": "Industrial Widget X",
    "categoryName": "Machinery",
    "totalQuantity": 500,
    "totalRevenue": 1250000.00,
    "avgUnitPrice": 2500.00
  }
]
```

---

## 6. Sales vs Target (Past + Present)
Compares actual revenue against monthly targets defined in the system.

**Endpoint:** `VsTarget`  
**Method:** `GET`  
**Query Parameters:**
- `startDate` (string/date, optional): Defaults to 12 months ago.
- `endDate` (string/date, optional): Defaults to today.
- `salesPersonId` (int, optional): If provided, gets targets/actuals for a specific salesperson. If null, gets company-wide targets/actuals.

**Example Request:** `/api/SalesDashboard/VsTarget`

**Response Data Example:**
```json
[
  {
    "year": 2026,
    "month": 9,
    "monthName": "Sep 2026",
    "actualRevenue": 4800000.00,
    "targetAmount": 5000000.00,
    "achievementPct": 96.00,
    "gap": 200000.00
  },
  {
    "year": 2026,
    "month": 10,
    "monthName": "Oct 2026",
    "actualRevenue": 5200000.00,
    "targetAmount": 5000000.00,
    "achievementPct": 104.00,
    "gap": -200000.00 
  }
]
```

---

## 7. Sales Records Table (Past + Present)
Paginated and filterable list of all detailed sales records (line items flattened). Useful for a data-grid view below the charts.

**Endpoint:** `SalesRecords`  
**Method:** `GET`  
**Query Parameters:**
- `startDate` (string/date, optional): Example: `2026-01-01`
- `endDate` (string/date, optional): Example: `2026-12-31`
- `productId` (int, optional)
- `categoryId` (int, optional)
- `salesPersonId` (int, optional)
- `clientId` (int, optional)
- `status` (string, optional): Order status.
- `pageNumber` (int, optional): **Default: `1`**.
- `pageSize` (int, optional): **Default: `20`**.

**Example Request:** `/api/SalesDashboard/SalesRecords?pageNumber=1&pageSize=50&status=Processing`

**Response Data Example:**
*(Note: Total records count is returned in the root `totalCount` property for pagination).*
```json
[
  {
    "orderId": 45,
    "orderNumber": "SO-2026-0045",
    "orderDate": "2026-10-01T10:30:00",
    "clientId": 102,
    "clientName": "Acme Corp",
    "salesPersonId": 14,
    "salesPersonName": "John Doe",
    "productId": 205,
    "productName": "Industrial Widget X",
    "categoryId": 5,
    "categoryName": "Machinery",
    "quantity": 10,
    "unitPrice": 2500.00,
    "totalPrice": 25000.00,
    "orderStatus": "Processing"
  }
]
```
