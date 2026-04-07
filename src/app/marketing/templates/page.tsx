"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RouteMobileService } from "../route-mobile"
import { WhatsAppTemplate } from "../types"
import { MessageCircle, CheckCircle2, Clock, XCircle } from "lucide-react"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTemplates() {
      const data = await RouteMobileService.getTemplates()
      setTemplates(data)
      setIsLoading(false)
    }
    loadTemplates()
  }, [])

  const getStatusIcon = (status: WhatsAppTemplate['status']) => {
    switch(status) {
      case 'Approved': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'Pending': return <Clock className="h-4 w-4 text-amber-500" />
      case 'Rejected': return <XCircle className="h-4 w-4 text-destructive" />
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Templates</h1>
        <p className="text-muted-foreground">Manage your Route Mobile approved messaging templates.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col h-full">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    {template.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    {getStatusIcon(template.status)}
                    <span className="font-medium text-foreground">{template.status}</span>
                  </CardDescription>
                </div>
                <Badge variant={template.category === 'Offer' ? 'default' : template.category === 'Alert' ? 'destructive' : 'secondary'}>
                  {template.category}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="rounded-md bg-muted/50 p-4 border relative">
                  <div className="absolute top-0 right-0 p-2 text-xs text-muted-foreground font-mono bg-muted rounded-bl-md border-b border-l">
                    {template.language}
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed mt-2 text-muted-foreground">
                    {template.content.split(/(\{\{\d+\}\})/).map((part, i) => {
                      if (part.match(/\{\{\d+\}\}/)) {
                        return <span key={i} className="inline-block bg-primary/10 text-primary font-mono px-1 rounded mx-0.5 text-xs">{part}</span>
                      }
                      return part
                    })}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Variables Needed</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((v, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-mono">{`{{${i+1}}}`} {v}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
