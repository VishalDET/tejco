export type TemplateCategory = 'Offer' | 'Update' | 'Alert'
export type TemplateStatus = 'Approved' | 'Pending' | 'Rejected'
export type CampaignStatus = 'Draft' | 'Scheduled' | 'Sending' | 'Completed' | 'Failed'

export interface WhatsAppTemplate {
  id: string
  name: string
  category: TemplateCategory
  status: TemplateStatus
  content: string // E.g. "Hello {{1}}, here is your special offer: {{2}}!"
  variables: string[] // E.g. ["name", "offer_code"]
  language: string
}

export interface AudienceSegment {
  id: string
  name: string
  customerCount: number
  description: string
}

export interface CampaignMetrics {
  totalTargeted: number
  sent: number
  delivered: number
  read: number
  failed: number
}

export interface MarketingCampaign {
  id: string
  name: string
  templateId: string
  audienceId: string
  status: CampaignStatus
  metrics: CampaignMetrics
  createdAt: string
  scheduledFor?: string | null
  sentAt?: string | null
}

export type RecipientDeliveryStatus = 'Sent' | 'Delivered' | 'Read' | 'Failed'

export interface CampaignRecipient {
  id: string
  campaignId: string
  customerName: string
  phoneNumber: string
  status: RecipientDeliveryStatus
  timestamp: string
  errorMessage?: string
}

