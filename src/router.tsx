import React from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppLayout } from "@/layouts/AppLayout"
import { AuthProvider } from "@/hooks/use-auth"

// Pages
import DashboardPage from "@/app/page"
import LoginPage from "@/app/login/page"

import { ProtectedRoute } from "@/components/auth/protected-route"

// Sales
import SalesDashboardPage from "@/app/sales/dashboard/page"
import QuotationsPage from "@/app/sales/quotations/page"
import QuotationDetailsPage from "@/app/sales/quotations/[id]/page"
import ProformaInvoicesPage from "@/app/sales/proforma-invoices/page"
import ProformaDetailsPage from "@/app/sales/proforma-invoices/[id]/page"
import OrdersPage from "@/app/sales/orders/page"
import OrderDetailsPage from "@/app/sales/orders/[id]/page"
import InvoicesPage from "@/app/sales/invoices/page"
import InvoiceDetailsPage from "@/app/sales/invoices/[id]/page"
import ChallansPage from "@/app/sales/challans/page"

// Inventory
import ProductsPage from "@/app/inventory/products/page"
import ProductDetailsPage from "@/app/inventory/products/[id]/page"
import AddProductPage from "@/app/inventory/products/add/page"
import ViewProductPage from "@/app/inventory/products/view/[id]/page"
import RawMaterialsPage from "@/app/inventory/raw-materials/page"
import DispatchPage from "@/app/inventory/dispatch/page"
import DispatchDetailsPage from "@/app/inventory/dispatch/[id]/page"
import OrderOutwardPage from "@/app/inventory/order-outward/page"
import OrderOutwardScanPage from "@/app/inventory/order-outward/[id]/page"
import StockTransferPage from "@/app/inventory/stock-transfer/page"
import StockInwardPage from "@/app/inventory/stock-inward/page"
import StockInwardFormPage from "@/app/inventory/stock-inward/add/page"
import StockInwardDetailsPage from "@/app/inventory/stock-inward/[id]/page"

// Purchases & Vendors
import PurchaseOrdersPage from "@/app/purchase/page"
import CreatePurchaseOrderPage from "@/app/purchase/create/page"
import PurchaseOrderDetailsPage from "@/app/purchase/[id]/page"
import EditPurchaseOrderPage from "@/app/purchase/[id]/edit/page"
import PurchaseOrderPrintPage from "@/app/purchase/[id]/print/page"
import VendorsPage from "@/app/supply-chain/vendors/page"
import VendorDetailsPage from "@/app/supply-chain/vendors/[id]/page"
import WarehousePage from "@/app/supply-chain/warehouse/page"
import ClientsPage from "@/app/stakeholders/clients/page"
import ClientDetailsPage from "@/app/stakeholders/clients/[id]/page"

// System
import ProfilePage from "@/app/system/profile/page"
import SettingsPage from "@/app/system/settings/page"
import UsersPage from "@/app/system/users/page"
import AddUserPage from "@/app/system/users/add/page"
import EditUserPage from "@/app/system/users/[id]/edit/page"
import RolesPage from "@/app/system/roles/page"

// Masters
import MastersLayout from "@/app/system/masters/layout"
import MastersDashboardPage from "@/app/system/masters/page"

import CompaniesPage from "@/app/system/masters/companies/page"
import AddCompanyPage from "@/app/system/masters/companies/add/page"
import CompanyDetailsPage from "@/app/system/masters/companies/[id]/page"
import EditCompanyPage from "@/app/system/masters/companies/edit/[id]/page"

import BranchesPage from "@/app/system/masters/branches/page"
import AddBranchPage from "@/app/system/masters/branches/add/page"
import BranchDetailsPage from "@/app/system/masters/branches/[id]/page"
import EditBranchPage from "@/app/system/masters/branches/edit/[id]/page"

import DepartmentsPage from "@/app/system/masters/departments/page"
import AddDepartmentPage from "@/app/system/masters/departments/add/page"
import DepartmentDetailsPage from "@/app/system/masters/departments/[id]/page"
import EditDepartmentPage from "@/app/system/masters/departments/edit/[id]/page"

import CategoriesPage from "@/app/system/masters/categories/page"
import AddCategoryPage from "@/app/system/masters/categories/add/page"
import CategoryDetailsPage from "@/app/system/masters/categories/[id]/page"
import EditCategoryPage from "@/app/system/masters/categories/[id]/edit/page"

import MasterUsersPage from "@/app/system/masters/users/page"
import AddMasterUserPage from "@/app/system/masters/users/add/page"
import EditMasterUserPage from "@/app/system/masters/users/[id]/edit/page"

import CountriesPage from "@/app/system/masters/countries/page"
import AddCountryPage from "@/app/system/masters/countries/add/page"
import CountryDetailsPage from "@/app/system/masters/countries/[id]/page"
import EditCountryPage from "@/app/system/masters/countries/edit/[id]/page"

// Other Modules
import MarketingPage from "@/app/marketing/page"
import MarketingTemplatesPage from "@/app/marketing/templates/page"
import IntelligencePage from "@/app/intelligence/page"
import IntelligenceReportsPage from "@/app/intelligence/reports/page"
import IntelligenceAnalyticsPage from "@/app/intelligence/analytics/page"
import ManufacturingPage from "@/app/manufacturing/page"
import ManufacturingOrdersPage from "@/app/manufacturing/orders/page"
import ManufacturingBatchesPage from "@/app/manufacturing/batches/page"
import SalesTeamPage from "@/app/stakeholders/sales-team/page"

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "login", element: <LoginPage /> },

      // Sales
      { path: "sales", element: <Navigate to="/sales/dashboard" replace /> },
      { path: "sales/dashboard", element: <ProtectedRoute permission="SalesOrders.View"><SalesDashboardPage /></ProtectedRoute> },
      { path: "sales/quotations", element: <ProtectedRoute permission="Quotations.View"><QuotationsPage /></ProtectedRoute> },
      { path: "sales/quotations/:id", element: <ProtectedRoute permission="Quotations.View"><QuotationDetailsPage /></ProtectedRoute> },
      { path: "sales/proforma-invoices", element: <ProtectedRoute permission="ProformaInvoices.View"><ProformaInvoicesPage /></ProtectedRoute> },
      { path: "sales/proforma-invoices/:id", element: <ProtectedRoute permission="ProformaInvoices.View"><ProformaDetailsPage /></ProtectedRoute> },
      { path: "sales/orders", element: <ProtectedRoute permission="SalesOrders.View"><OrdersPage /></ProtectedRoute> },
      { path: "sales/orders/:id", element: <ProtectedRoute permission="SalesOrders.View"><OrderDetailsPage /></ProtectedRoute> },
      { path: "sales/invoices", element: <ProtectedRoute permission={["Invoices.View", "SalesOrders.View", "ProformaInvoices.View"]}><InvoicesPage /></ProtectedRoute> },
      { path: "sales/invoices/:id", element: <ProtectedRoute permission={["Invoices.View", "SalesOrders.View", "ProformaInvoices.View"]}><InvoiceDetailsPage /></ProtectedRoute> },
      { path: "sales/challans", element: <ChallansPage /> },

      // Inventory
      { path: "inventory/products", element: <ProtectedRoute permission={["Products.View", "Products.MaskedView", "Products.FullView"]}><ProductsPage /></ProtectedRoute> },
      { path: "inventory/products/add", element: <ProtectedRoute permission="Products.Create"><AddProductPage /></ProtectedRoute> },
      { path: "inventory/products/:id", element: <ProtectedRoute permission={["Products.View", "Products.MaskedView", "Products.FullView"]}><ProductDetailsPage /></ProtectedRoute> },
      { path: "inventory/products/view/:id", element: <ProtectedRoute permission={["Products.View", "Products.MaskedView", "Products.FullView"]}><ViewProductPage /></ProtectedRoute> },
      { path: "inventory/raw-materials", element: <RawMaterialsPage /> },
      { path: "inventory/dispatch", element: <ProtectedRoute permission={["Dispatch.View", "Inventory.Dispatch", "Inventory.View"]}><DispatchPage /></ProtectedRoute> },
      { path: "inventory/dispatch/:id", element: <ProtectedRoute permission={["Dispatch.View", "Inventory.Dispatch", "Inventory.View"]}><DispatchDetailsPage /></ProtectedRoute> },
      { path: "inventory/order-outward", element: <ProtectedRoute permission={["OrderOutward.View", "Inventory.Dispatch", "Inventory.View"]}><OrderOutwardPage /></ProtectedRoute> },
      { path: "inventory/order-outward/:id", element: <ProtectedRoute permission={["OrderOutward.View", "Inventory.Dispatch", "Inventory.View"]}><OrderOutwardScanPage /></ProtectedRoute> },
      { path: "inventory/stock-transfer", element: <ProtectedRoute permission={["Inventory.Transfer", "Inventory.View", "Warehouses.View"]}><StockTransferPage /></ProtectedRoute> },
      { path: "inventory/stock-inward", element: <ProtectedRoute permission={["StockInward.View", "Inventory.StockInward", "Inventory.View"]}><StockInwardPage /></ProtectedRoute> },
      { path: "inventory/stock-inward/add", element: <ProtectedRoute permission={["StockInward.Create", "StockInward.View", "Inventory.StockInward"]}><StockInwardFormPage /></ProtectedRoute> },
      { path: "inventory/stock-inward/:id", element: <ProtectedRoute permission={["StockInward.View", "Inventory.StockInward", "Inventory.View"]}><StockInwardDetailsPage /></ProtectedRoute> },
      { path: "inventory/stock-inward/:id/edit", element: <ProtectedRoute permission={["StockInward.Edit", "StockInward.View", "Inventory.StockInward"]}><StockInwardFormPage /></ProtectedRoute> },

      // Purchases
      { path: "purchase", element: <ProtectedRoute permission={["PurchaseOrders.View", "Purchases.View"]}><PurchaseOrdersPage /></ProtectedRoute> },
      { path: "purchase/create", element: <ProtectedRoute permission={["PurchaseOrders.Create", "Purchases.Create"]}><CreatePurchaseOrderPage /></ProtectedRoute> },
      { path: "purchase/:id", element: <ProtectedRoute permission={["PurchaseOrders.View", "Purchases.View"]}><PurchaseOrderDetailsPage /></ProtectedRoute> },
      { path: "purchase/:id/edit", element: <ProtectedRoute permission={["PurchaseOrders.Edit", "PurchaseOrders.View", "Purchases.View"]}><EditPurchaseOrderPage /></ProtectedRoute> },
      { path: "purchase/:id/print", element: <ProtectedRoute permission={["PurchaseOrders.View", "Purchases.View"]}><PurchaseOrderPrintPage /></ProtectedRoute> },

      // Supply Chain & Stakeholders
      { path: "supply-chain/vendors", element: <ProtectedRoute permission="Vendors.View"><VendorsPage /></ProtectedRoute> },
      { path: "supply-chain/vendors/:id", element: <ProtectedRoute permission="Vendors.View"><VendorDetailsPage /></ProtectedRoute> },
      { path: "supply-chain/warehouse", element: <ProtectedRoute permission="Warehouses.View"><WarehousePage /></ProtectedRoute> },
      { path: "stakeholders/clients", element: <ProtectedRoute permission="Clients.View"><ClientsPage /></ProtectedRoute> },
      { path: "stakeholders/clients/:id", element: <ProtectedRoute permission="Clients.View"><ClientDetailsPage /></ProtectedRoute> },

      // System
      { path: "system/profile", element: <ProfilePage /> },
      { path: "system/settings", element: <SettingsPage /> },
      { path: "system/users", element: <ProtectedRoute permission={["Users.View", "System.Users.View"]}><UsersPage /></ProtectedRoute> },
      { path: "system/users/add", element: <ProtectedRoute permission={["Users.Create", "Users.View", "System.Users.View"]}><AddUserPage /></ProtectedRoute> },
      { path: "system/users/:id/edit", element: <ProtectedRoute permission={["Users.Edit", "Users.View", "System.Users.View"]}><EditUserPage /></ProtectedRoute> },
      { path: "system/roles", element: <ProtectedRoute permission={["Roles.View", "System.Roles.View"]}><RolesPage /></ProtectedRoute> },

      // Masters
      {
        path: "system/masters",
        element: <MastersLayout />,
        children: [
          { index: true, element: <ProtectedRoute permission={["Masters.View", "System.Masters.View"]}><MastersDashboardPage /></ProtectedRoute> },
          { path: "companies", element: <ProtectedRoute permission={["Masters.View", "System.Masters.View"]}><CompaniesPage /></ProtectedRoute> },
          { path: "companies/add", element: <ProtectedRoute permission={["Masters.Create", "Masters.View", "System.Masters.View"]}><AddCompanyPage /></ProtectedRoute> },
          { path: "companies/:id", element: <ProtectedRoute permission={["Masters.View", "System.Masters.View"]}><CompanyDetailsPage /></ProtectedRoute> },
          { path: "companies/edit/:id", element: <ProtectedRoute permission={["Masters.Edit", "Masters.View", "System.Masters.View"]}><EditCompanyPage /></ProtectedRoute> },

          { path: "branches", element: <ProtectedRoute permission={["Masters.View", "System.Masters.View"]}><BranchesPage /></ProtectedRoute> },
          { path: "branches/add", element: <ProtectedRoute permission={["Masters.Create", "Masters.View", "System.Masters.View"]}><AddBranchPage /></ProtectedRoute> },
          { path: "branches/:id", element: <ProtectedRoute permission={["Masters.View", "System.Masters.View"]}><BranchDetailsPage /></ProtectedRoute> },
          { path: "branches/edit/:id", element: <ProtectedRoute permission={["Masters.Edit", "Masters.View", "System.Masters.View"]}><EditBranchPage /></ProtectedRoute> },

          { path: "departments", element: <ProtectedRoute permission={["Masters.View", "System.Masters.View"]}><DepartmentsPage /></ProtectedRoute> },
          { path: "departments/add", element: <ProtectedRoute permission={["Masters.Create", "Masters.View", "System.Masters.View"]}><AddDepartmentPage /></ProtectedRoute> },
          { path: "departments/:id", element: <ProtectedRoute permission={["Masters.View", "System.Masters.View"]}><DepartmentDetailsPage /></ProtectedRoute> },
          { path: "departments/edit/:id", element: <ProtectedRoute permission={["Masters.Edit", "Masters.View", "System.Masters.View"]}><EditDepartmentPage /></ProtectedRoute> },

          { path: "categories", element: <ProtectedRoute permission={["Categories.View", "Masters.View", "System.Masters.View"]}><CategoriesPage /></ProtectedRoute> },
          { path: "categories/add", element: <ProtectedRoute permission={["Categories.Create", "Categories.View", "Masters.View"]}><AddCategoryPage /></ProtectedRoute> },
          { path: "categories/:id", element: <ProtectedRoute permission={["Categories.View", "Masters.View"]}><CategoryDetailsPage /></ProtectedRoute> },
          { path: "categories/:id/edit", element: <ProtectedRoute permission={["Categories.Edit", "Categories.View", "Masters.View"]}><EditCategoryPage /></ProtectedRoute> },

          { path: "users", element: <ProtectedRoute permission={["Users.View", "System.Users.View"]}><MasterUsersPage /></ProtectedRoute> },
          { path: "users/add", element: <ProtectedRoute permission={["Users.Create", "Users.View", "System.Users.View"]}><AddMasterUserPage /></ProtectedRoute> },
          { path: "users/:id/edit", element: <ProtectedRoute permission={["Users.Edit", "Users.View", "System.Users.View"]}><EditMasterUserPage /></ProtectedRoute> },

          { path: "countries", element: <ProtectedRoute permission={["Masters.View", "System.Masters.View"]}><CountriesPage /></ProtectedRoute> },
          { path: "countries/add", element: <ProtectedRoute permission={["Masters.Create", "Masters.View", "System.Masters.View"]}><AddCountryPage /></ProtectedRoute> },
          { path: "countries/:id", element: <ProtectedRoute permission={["Masters.View", "System.Masters.View"]}><CountryDetailsPage /></ProtectedRoute> },
          { path: "countries/edit/:id", element: <ProtectedRoute permission={["Masters.Edit", "Masters.View", "System.Masters.View"]}><EditCountryPage /></ProtectedRoute> },
        ],
      },

      // Modules
      { path: "marketing", element: <MarketingPage /> },
      { path: "marketing/templates", element: <MarketingTemplatesPage /> },
      { path: "intelligence", element: <ProtectedRoute permission="Reports.View"><IntelligencePage /></ProtectedRoute> },
      { path: "intelligence/reports", element: <ProtectedRoute permission="Reports.View"><IntelligenceReportsPage /></ProtectedRoute> },
      { path: "intelligence/analytics", element: <ProtectedRoute permission="Reports.View"><IntelligenceAnalyticsPage /></ProtectedRoute> },
      { path: "manufacturing", element: <ManufacturingPage /> },
      { path: "manufacturing/orders", element: <ManufacturingOrdersPage /> },
      { path: "manufacturing/batches", element: <ManufacturingBatchesPage /> },
      { path: "stakeholders/sales-team", element: <SalesTeamPage /> },

      // Catch-all 404
      { path: "*", element: <div className="p-8 text-center"><h1 className="text-2xl font-bold">Page Not Found</h1><p className="text-muted-foreground mt-2">The requested page does not exist.</p></div> },
    ],
  },
])
