import { MarketingCampaign, WhatsAppTemplate, AudienceSegment } from "./types"

export const MOCK_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "tpl-001",
    name: "diwali_festival_offer",
    category: "Offer",
    status: "Approved",
    content: "Hi {{1}}, celebrate this Diwali with Tejco! Get an exclusive {{2}}% off on your next purchase using code {{3}}. Valid till 15th Nov. Shop now!",
    variables: ["customer_name", "discount_percentage", "promo_code"],
    language: "en_US",
  },
  {
    id: "tpl-002",
    name: "order_dispatch_update",
    category: "Update",
    status: "Approved",
    content: "Dear {{1}}, your order #{{2}} has been dispatched via {{3}} and will reach you shortly. Track it here: {{4}}",
    variables: ["customer_name", "order_id", "courier_name", "tracking_link"],
    language: "en_US",
  },
  {
    id: "tpl-003",
    name: "pending_payment_reminder",
    category: "Alert",
    status: "Approved",
    content: "Hello {{1}}, this is a friendly reminder that invoice #{{2}} for amount ₹{{3}} is due on {{4}}. Please arrange payment at the earliest to avoid late fees.",
    variables: ["customer_name", "invoice_number", "amount", "due_date"],
    language: "en_IN",
  },
  {
    id: "tpl-004",
    name: "new_product_launch",
    category: "Offer",
    status: "Pending",
    content: "Exciting news {{1}}! We just launched our new premium range of {{2}}. Check out the catalog here: {{3}}",
    variables: ["customer_name", "product_category", "catalog_link"],
    language: "en_US",
  }
]

export const MOCK_AUDIENCES: AudienceSegment[] = [
  {
    id: "aud-001",
    name: "All Active Customers",
    customerCount: 15420,
    description: "Customers who have made at least one purchase in the last 12 months.",
  },
  {
    id: "aud-002",
    name: "VIP / High Value Buyers",
    customerCount: 1250,
    description: "Customers with lifetime value over ₹5,00,000.",
  },
  {
    id: "aud-003",
    name: "Inactive Customers",
    customerCount: 4800,
    description: "Customers who have not purchased anything in over a year.",
  },
  {
    id: "aud-004",
    name: "Recent Signups",
    customerCount: 350,
    description: "Users who created an account in the last 30 days but haven't purchased.",
  }
]

export const MOCK_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: "cmp-101",
    name: "Diwali Electronics Mega Sale",
    templateId: "tpl-001",
    audienceId: "aud-001",
    status: "Completed",
    createdAt: "2026-10-01T10:00:00Z",
    sentAt: "2026-10-05T09:30:00Z",
    metrics: {
      totalTargeted: 15420,
      sent: 15400,
      delivered: 15150,
      read: 12300,
      failed: 20,
    }
  },
  {
    id: "cmp-102",
    name: "VIP Exclusive Preview",
    templateId: "tpl-004",
    audienceId: "aud-002",
    status: "Sending",
    createdAt: "2026-03-22T14:15:00Z",
    sentAt: "2026-03-23T10:00:00Z",
    metrics: {
      totalTargeted: 1250,
      sent: 800,
      delivered: 790,
      read: 450,
      failed: 0,
    }
  },
  {
    id: "cmp-103",
    name: "Re-engagement Push",
    templateId: "tpl-001",
    audienceId: "aud-003",
    status: "Draft",
    createdAt: "2026-03-23T11:00:00Z",
    metrics: {
      totalTargeted: 4800,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    }
  }
]

export const MOCK_CAMPAIGN_RECIPIENTS: import('./types').CampaignRecipient[] = [
  {
    id: "rec-001",
    campaignId: "cmp-101",
    customerName: "Rahul Sharma",
    phoneNumber: "+91 98765 43210",
    status: "Read",
    timestamp: "2026-10-05T09:35:12Z"
  },
  {
    id: "rec-002",
    campaignId: "cmp-101",
    customerName: "Priya Patel",
    phoneNumber: "+91 87654 32109",
    status: "Delivered",
    timestamp: "2026-10-05T09:31:05Z"
  },
  {
    id: "rec-003",
    campaignId: "cmp-101",
    customerName: "Amit Kumar",
    phoneNumber: "+91 76543 21098",
    status: "Read",
    timestamp: "2026-10-05T10:15:40Z"
  },
  {
    id: "rec-004",
    campaignId: "cmp-101",
    customerName: "Neha Gupta",
    phoneNumber: "+91 65432 10987",
    status: "Failed",
    timestamp: "2026-10-05T09:30:15Z",
    errorMessage: "Invalid contact number/Not on WhatsApp"
  },
  {
    id: "rec-005",
    campaignId: "cmp-102",
    customerName: "Vikram Singh",
    phoneNumber: "+91 54321 09876",
    status: "Read",
    timestamp: "2026-03-23T10:05:22Z"
  },
  {
    id: "rec-006",
    campaignId: "cmp-102",
    customerName: "Anjali Desai",
    phoneNumber: "+91 43210 98765",
    status: "Sent",
    timestamp: "2026-03-23T10:00:05Z"
  }
]

