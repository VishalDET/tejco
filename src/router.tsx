import React from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppLayout } from "@/layouts/AppLayout"

// Pages
import DashboardPage from "@/app/page"
import LoginPage from "@/app/login/page"

// Sales
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

// Supply Chain & Stakeholders
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
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "login", element: <LoginPage /> },

      // Sales
      { path: "sales/quotations", element: <QuotationsPage /> },
      { path: "sales/quotations/:id", element: <QuotationDetailsPage /> },
      { path: "sales/proforma-invoices", element: <ProformaInvoicesPage /> },
      { path: "sales/proforma-invoices/:id", element: <ProformaDetailsPage /> },
      { path: "sales/orders", element: <OrdersPage /> },
      { path: "sales/orders/:id", element: <OrderDetailsPage /> },
      { path: "sales/invoices", element: <InvoicesPage /> },
      { path: "sales/invoices/:id", element: <InvoiceDetailsPage /> },
      { path: "sales/challans", element: <ChallansPage /> },

      // Inventory
      { path: "inventory/products", element: <ProductsPage /> },
      { path: "inventory/products/add", element: <AddProductPage /> },
      { path: "inventory/products/:id", element: <ProductDetailsPage /> },
      { path: "inventory/products/view/:id", element: <ViewProductPage /> },
      { path: "inventory/raw-materials", element: <RawMaterialsPage /> },
      { path: "inventory/dispatch", element: <DispatchPage /> },
      { path: "inventory/dispatch/:id", element: <DispatchDetailsPage /> },
      { path: "inventory/order-outward", element: <OrderOutwardPage /> },
      { path: "inventory/order-outward/:id", element: <OrderOutwardScanPage /> },
      { path: "inventory/stock-transfer", element: <StockTransferPage /> },
      { path: "inventory/stock-inward", element: <StockInwardPage /> },
      { path: "inventory/stock-inward/add", element: <StockInwardFormPage /> },
      { path: "inventory/stock-inward/:id", element: <StockInwardDetailsPage /> },
      { path: "inventory/stock-inward/:id/edit", element: <StockInwardFormPage /> },

      // Supply Chain & Stakeholders
      { path: "supply-chain/vendors", element: <VendorsPage /> },
      { path: "supply-chain/vendors/:id", element: <VendorDetailsPage /> },
      { path: "supply-chain/warehouse", element: <WarehousePage /> },
      { path: "stakeholders/clients", element: <ClientsPage /> },
      { path: "stakeholders/clients/:id", element: <ClientDetailsPage /> },

      // System
      { path: "system/profile", element: <ProfilePage /> },
      { path: "system/settings", element: <SettingsPage /> },
      { path: "system/users", element: <UsersPage /> },
      { path: "system/users/add", element: <AddUserPage /> },
      { path: "system/users/:id/edit", element: <EditUserPage /> },

      // Masters
      {
        path: "system/masters",
        element: <MastersLayout />,
        children: [
          { index: true, element: <MastersDashboardPage /> },
          { path: "companies", element: <CompaniesPage /> },
          { path: "companies/add", element: <AddCompanyPage /> },
          { path: "companies/:id", element: <CompanyDetailsPage /> },
          { path: "companies/edit/:id", element: <EditCompanyPage /> },

          { path: "branches", element: <BranchesPage /> },
          { path: "branches/add", element: <AddBranchPage /> },
          { path: "branches/:id", element: <BranchDetailsPage /> },
          { path: "branches/edit/:id", element: <EditBranchPage /> },

          { path: "departments", element: <DepartmentsPage /> },
          { path: "departments/add", element: <AddDepartmentPage /> },
          { path: "departments/:id", element: <DepartmentDetailsPage /> },
          { path: "departments/edit/:id", element: <EditDepartmentPage /> },

          { path: "categories", element: <CategoriesPage /> },
          { path: "categories/add", element: <AddCategoryPage /> },
          { path: "categories/:id", element: <CategoryDetailsPage /> },
          { path: "categories/:id/edit", element: <EditCategoryPage /> },

          { path: "users", element: <MasterUsersPage /> },
          { path: "users/add", element: <AddMasterUserPage /> },
          { path: "users/:id/edit", element: <EditMasterUserPage /> },

          { path: "countries", element: <CountriesPage /> },
          { path: "countries/add", element: <AddCountryPage /> },
          { path: "countries/:id", element: <CountryDetailsPage /> },
          { path: "countries/edit/:id", element: <EditCountryPage /> },
        ],
      },

      // Modules
      { path: "marketing", element: <MarketingPage /> },
      { path: "marketing/templates", element: <MarketingTemplatesPage /> },
      { path: "intelligence", element: <IntelligencePage /> },
      { path: "intelligence/reports", element: <IntelligenceReportsPage /> },
      { path: "intelligence/analytics", element: <IntelligenceAnalyticsPage /> },
      { path: "manufacturing", element: <ManufacturingPage /> },
      { path: "manufacturing/orders", element: <ManufacturingOrdersPage /> },
      { path: "manufacturing/batches", element: <ManufacturingBatchesPage /> },
      { path: "stakeholders/sales-team", element: <SalesTeamPage /> },

      // Catch-all 404
      { path: "*", element: <div className="p-8 text-center"><h1 className="text-2xl font-bold">Page Not Found</h1><p className="text-muted-foreground mt-2">The requested page does not exist.</p></div> },
    ],
  },
])
