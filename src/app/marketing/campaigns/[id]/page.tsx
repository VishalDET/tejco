import { notFound } from "next/navigation"
import { MOCK_CAMPAIGNS, MOCK_TEMPLATES, MOCK_AUDIENCES, MOCK_CAMPAIGN_RECIPIENTS } from "../../data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Users, MessageCircle, AlertCircle, CheckCircle2, Clock, Map, Send, Eye, RefreshCw, Smartphone } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function CampaignDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === params.id)

  if (!campaign) {
    notFound()
  }

  const template = MOCK_TEMPLATES.find((t) => t.id === campaign.templateId)
  const audience = MOCK_AUDIENCES.find((a) => a.id === campaign.audienceId)
  const recipients = MOCK_CAMPAIGN_RECIPIENTS.filter((r) => r.campaignId === campaign.id)

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'default'
      case 'Sending': return 'secondary'
      case 'Scheduled': return 'outline'
      case 'Draft': return 'outline'
      case 'Failed': return 'destructive'
      default: return 'secondary'
    }
  }

  const deliveryRate = campaign.metrics.sent > 0 ? (campaign.metrics.delivered / campaign.metrics.sent) * 100 : 0
  const readRate = campaign.metrics.delivered > 0 ? (campaign.metrics.read / campaign.metrics.delivered) * 100 : 0

  const getRecipientBadge = (status: string) => {
    switch (status) {
      case 'Read': return 'default'
      case 'Delivered': return 'secondary'
      case 'Sent': return 'outline'
      case 'Failed': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/marketing">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
          <Badge variant={getStatusBadgeVariant(campaign.status)} className="text-sm">
            {campaign.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Core Metrics */}
        <Card className="col-span-full xl:col-span-2">
          <CardHeader>
            <CardTitle>Delivery Performance</CardTitle>
            <CardDescription>Route Mobile WhatsApp execution statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Users className="h-4 w-4"/> Target Size</p>
                <p className="text-2xl font-bold">{campaign.metrics.totalTargeted.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Send className="h-4 w-4"/> Sent</p>
                <p className="text-2xl font-bold">{campaign.metrics.sent.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4"/> Delivered</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{campaign.metrics.delivered.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400"><Eye className="h-4 w-4"/> Read</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{campaign.metrics.read.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Delivery Rate</span>
                  <span>{deliveryRate.toFixed(1)}%</span>
                </div>
                {/* Simulated Progress Bar */}
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${deliveryRate}%` }}></div>
                </div>
                <p className="text-xs text-muted-foreground">Percentage of sent messages successfully delivered to WhatsApp clients.</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Read Rate</span>
                  <span>{readRate.toFixed(1)}%</span>
                </div>
                {/* Simulated Progress Bar */}
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${readRate}%` }}></div>
                </div>
                <p className="text-xs text-muted-foreground">Percentage of delivered messages that triggered a WhatsApp read receipt (blue ticks).</p>
              </div>

              {campaign.metrics.failed > 0 && (
                <div className="rounded-md bg-destructive/10 p-4 flex items-start gap-3 mt-6 border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-destructive">Failed Dispatches</h4>
                    <p className="text-sm text-destructive/90 mt-1">
                      {campaign.metrics.failed.toLocaleString()} messages failed to send due to invalid numbers or unreachable recipients based on Route Mobile logs.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Column */}
        <div className="col-span-full md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 border-b pb-4">
                <p className="text-sm text-muted-foreground">Selected Audience</p>
                <div>
                  <Link href="/marketing/audiences" className="font-medium text-sm hover:underline">{audience?.name || campaign.audienceId}</Link>
                  <p className="text-xs text-muted-foreground mt-1">{audience?.description}</p>
                </div>
              </div>
              
              <div className="space-y-2 border-b pb-4">
                <p className="text-sm text-muted-foreground">Template Utilized</p>
                <div>
                  <Link href="/marketing/templates" className="font-medium text-sm flex items-center gap-2 hover:underline">
                    <MessageCircle className="h-4 w-4" />
                    {template?.name || campaign.templateId}
                  </Link>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="text-xs">{template?.category}</Badge>
                    <Badge variant="outline" className="text-xs">{template?.language}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Timeline</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(campaign.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  {campaign.sentAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dispatched:</span>
                      <span>{new Date(campaign.sentAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template preview box */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                Message Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent>
              {template ? (
                <div className="rounded-xl bg-[#e5ddd5] p-4 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                  <div className="relative bg-white rounded-lg p-3 shadow-sm text-xs whitespace-pre-wrap">
                    <p className="text-slate-800 leading-relaxed">
                      {template.content}
                    </p>
                    <div className="text-[9px] text-right text-slate-400 mt-1">Status: {getStatusBadgeVariant(campaign.status) === 'default' ? 'Delivered' : campaign.status}</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Template snapshot unavailable.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recipients Data Log Table */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Recipient Delivery Log</CardTitle>
            <CardDescription>Line-by-line breakdown of individual message dispatches and delivery statuses.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Customer Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Timestamp (Latest Update)</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right pr-6">Info / Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No recipient data available for this campaign simulation.
                    </TableCell>
                  </TableRow>
                ) : (
                  recipients.map((recipient) => (
                    <TableRow key={recipient.id}>
                      <TableCell className="pl-6 font-medium">{recipient.customerName}</TableCell>
                      <TableCell className="text-muted-foreground">{recipient.phoneNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(recipient.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getRecipientBadge(recipient.status)}>{recipient.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-xs text-muted-foreground">
                        {recipient.errorMessage ? (
                          <span className="text-destructive flex items-center justify-end gap-1">
                            <AlertCircle className="h-3 w-3" /> {recipient.errorMessage}
                          </span>
                        ) : (
                           "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
