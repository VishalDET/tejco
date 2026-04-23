"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Megaphone, Send, CheckCircle2, AlertCircle, Eye, RefreshCw } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MarketingCampaign } from "./types"
import { MOCK_CAMPAIGNS } from "./data"
import Link from "next/link"

export default function MarketingDashboardPage() {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCampaigns(MOCK_CAMPAIGNS)
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getStatusBadgeVariant = (status: MarketingCampaign['status']) => {
    switch (status) {
      case 'Completed': return 'default'
      case 'Sending': return 'secondary'
      case 'Scheduled': return 'outline'
      case 'Draft': return 'outline'
      case 'Failed': return 'destructive'
      default: return 'secondary'
    }
  }

  // Calculate high-level summary stats
  const totalSent = campaigns.reduce((acc, curr) => acc + curr.metrics.sent, 0)
  const totalRead = campaigns.reduce((acc, curr) => acc + curr.metrics.read, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'Sending' || c.status === 'Scheduled').length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h1>
          <p className="text-muted-foreground">Manage and track your WhatsApp broadcasts via Route Mobile.</p>
        </div>
        <Link href="/marketing/campaigns/create">
          <Button disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-24" /> : totalSent.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages Read</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-24" /> : totalRead.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active/Scheduled</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : activeCampaigns}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-xl">Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aimed Audience</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Read</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                    <TableCell align="right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                    <TableCell align="right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                    <TableCell align="right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Megaphone className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No Campaigns Found</h3>
              <p className="mb-4 text-sm text-muted-foreground text-balance">
                You haven't run any WhatsApp marketing campaigns yet. Broadcast to your customer base easily!
              </p>
              <Link href="/marketing/campaigns/create">
                <Button>Create Campaign</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aimed Audience</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">Read</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const readRate = campaign.metrics.delivered > 0 
                  ? ((campaign.metrics.read / campaign.metrics.delivered) * 100).toFixed(1) 
                  : 0;

                  return (
                    <TableRow key={campaign.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link href={`/marketing/campaigns/${campaign.id}`} className="hover:underline hover:text-primary transition-colors">
                          <div className="text-base">{campaign.name}</div>
                        </Link>
                        <div className="text-xs text-muted-foreground font-normal mt-1">
                          Created: {new Date(campaign.createdAt).toLocaleDateString("en-GB")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.metrics.totalTargeted.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.metrics.delivered.toLocaleString()}
                        <div className="text-xs text-muted-foreground mt-1">
                          {campaign.metrics.failed > 0 && <span className="text-destructive flex items-center justify-end gap-1"><AlertCircle className="h-3 w-3"/> {campaign.metrics.failed} failed</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {campaign.metrics.read.toLocaleString()}
                        {campaign.status === 'Completed' && (
                          <div className="text-xs mt-1">{readRate}% Rate</div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
