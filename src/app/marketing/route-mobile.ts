import { MarketingCampaign, WhatsAppTemplate } from "./types"
import { MOCK_TEMPLATES } from "./data"

/**
 * Mock Service layer representing Route Mobile WhatsApp Business API interactions.
 */
export class RouteMobileService {
  /**
   * Fetches all WhatsApp registered and approved templates from Route Mobile.
   */
  static async getTemplates(): Promise<WhatsAppTemplate[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    return MOCK_TEMPLATES
  }

  /**
   * Simulates dispatching a campaign batch to the Route Mobile API.
   * In a real application, this would map the Audience to phone numbers and substitute variables.
   */
  static async sendCampaign(campaign: MarketingCampaign, variablesMapping: Record<string, string>): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    // Simulate validation
    const template = MOCK_TEMPLATES.find(t => t.id === campaign.templateId)
    if (!template || template.status !== 'Approved') {
      throw new Error("Invalid or unapproved template provided to Route Mobile API.")
    }

    console.log(`[Route Mobile Mock] Triggering campaign: ${campaign.name}`)
    console.log(`[Route Mobile Mock] Template: ${template.name}, Targeting Audience: ${campaign.audienceId}`)
    console.log(`[Route Mobile Mock] Variables Mapped:`, variablesMapping)

    return {
      success: true,
      message: "Campaign successfully enqueued in Route Mobile for dispatch."
    }
  }
  
  /**
   * Fetches the latest delivery read receipt webhooks/metrics.
   */
  static async getCampaignMetrics(campaignId: string) {
    // In actual implementation, Route mobile pushes webhooks. This would just query our DB.
    await new Promise((resolve) => setTimeout(resolve, 500))
    return null
  }
}
