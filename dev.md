Design a modern, clean, and professional SaaS-style web application UI for an Inventory, Manufacturing, Warehouse, and Sales Management System.

The design should look like a modern ERP dashboard similar to Zoho, Odoo, or ERPNext, with a minimal, corporate, and data-focused interface.

Use modern UI/UX principles, clear hierarchy, reusable components, and responsive layouts.

🎨 Design Style

Create a modern admin dashboard style UI with:

Clean and minimal layout

Corporate business feel

Soft shadows and rounded cards

Data-heavy interface optimized for productivity

Clear typography and spacing

Light mode (primary) with optional dark mode

Color System

Primary: #1E3A8A (Indigo Blue)
Secondary: #0EA5E9 (Sky Blue)
Accent: #22C55E (Green for success states)
Warning: #F59E0B
Error: #EF4444
Background: #F8FAFC

Use subtle gradients and soft borders.

🧭 Layout Structure

The application should have:

1. Left Sidebar Navigation

Collapsible sidebar with icons + labels.

Menu items:

Dashboard
Products
Raw Materials
Vendors
Warehouse
Manufacturing
Stock Transfer
Orders
Doctors / Clients
Sales Team
Challans
Invoices
Reports
Settings

Use modern icons (Heroicons / Feather icons).

2. Top Navigation Bar

Contains:

Global search

Notifications

Create button (Quick actions)

User profile dropdown

Company switcher (optional)

📊 Main Dashboard Page

Design a data-driven dashboard containing:

KPI Cards

Total Stock Value

Today's Orders

Pending Dispatch

Low Stock Items

Monthly Sales

Charts

Sales Trend (line chart)

Product Category Sales (bar chart)

Warehouse Stock Distribution (pie chart)

Activity Panel

Recent activities:

Stock added

Orders created

Manufacturing completed

📦 Product & Inventory Screens
Product List Page

Table view showing:

Product name

SKU

Category

Variants count

Price

Stock

Status

Features:

Search

Filters

Bulk actions

Add Product button

Product Detail Page

Sections:

Product info
Variants table
Stock availability by warehouse
Barcode preview
Edit product button

Variant table columns:

Size
Bevel
Barcode
Price
Stock

🏭 Raw Material UI

Raw Material List:

Columns:

Material name
Unit
Stock
Minimum stock
Vendor

Add raw material form with:

Name
Unit
Supplier
Reorder level

🏬 Warehouse UI

Warehouse List:

Warehouse name
Location
Total stock
Manager

Warehouse Detail Page:

Stock inside warehouse
Stock movement logs
Transfer buttons

🔁 Stock Transfer UI

Transfer creation page:

From warehouse
To warehouse
Products table

Table columns:

Product
Variant
Quantity
Barcode

Transfer status:

Requested
Approved
In Transit
Received

⚙️ Manufacturing UI

Manufacturing dashboard showing:

Active production orders
Completed batches
Material consumption

Manufacturing order screen:

Select product
Select quantity
Auto-calculate required raw materials

Material consumption table:

Material
Required qty
Available qty

🧑‍⚕️ Doctors / Clients UI

Doctor list page:

Doctor name
Clinic name
City
Phone
Outstanding balance

Doctor profile page:

Contact info
Order history
Invoices
Sales assigned

🛒 Order Processing UI

Order creation screen:

Select doctor
Add products

Product table:

Product
Variant
Price
Quantity
Total

Order statuses:

Draft
Pending approval
Approved
Packed
Dispatched
Delivered

Warehouse section should show:

Pick list for packing

📄 Challan UI

Challan generation screen:

Auto-filled from order

Includes:

Doctor details
Product list
Dispatch details

Buttons:

Print challan
Download PDF
Convert to invoice

💰 Invoice UI

Invoice page layout:

Invoice number
Doctor details
Product breakdown

Totals section:

Subtotal
GST
Discount
Final amount

Buttons:

Download invoice
Send via WhatsApp
Mark as paid

📈 Reports UI

Reports dashboard with filters:

Date range
Warehouse
Product
Sales person

Reports:

Stock report
Sales report
Manufacturing report
Low stock report
Doctor sales report

Include:

Download CSV
Export Excel

👥 Sales Team UI

Salesperson list:

Name
Region
Orders count
Sales value

Salesperson profile:

Orders created
Revenue generated

🔐 Settings UI

Settings sections:

User management
Roles & permissions
Tax settings
Barcode settings
WhatsApp integration
System preferences

📱 Responsive Behavior

Design should support:

Desktop (primary)
Tablet
Mobile-friendly tables

🧩 Components Needed

Design reusable components:

Buttons
Data tables
Filters
Forms
Modals
Charts
Status badges
Tabs
Breadcrumb navigation