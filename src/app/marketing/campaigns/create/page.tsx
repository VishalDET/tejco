"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, Sparkles, AlertCircle } from "lucide-react"
import Link from "next/link"
import { MOCK_AUDIENCES, MOCK_TEMPLATES } from "../../data"
import { RouteMobileService } from "../../route-mobile"
import { MarketingCampaign, WhatsAppTemplate } from "../../types"

export default function CreateCampaignPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [audienceId, setAudienceId] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [isSending, setIsSending] = useState(false)
  
  const selectedTemplate = MOCK_TEMPLATES.find(t => t.id === templateId)
  const selectedAudience = MOCK_AUDIENCES.find(a => a.id === audienceId)

  const handleSend = async () => {
    if (!name || !audienceId || !templateId) return

    setIsSending(true)
    
    const newCampaign: MarketingCampaign = {
      id: `cmp-${Math.random().toString(36).substr(2, 9)}`,
      name,
      audienceId,
      templateId,
      status: 'Sending',
      createdAt: new Date().toISOString(),
      metrics: {
        totalTargeted: selectedAudience?.customerCount || 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0
      }
    }

    try {
      // Simulate variable mapping based on current user context / audience DB logic
      const mockVariablesMap: Record<string, string> = {}
      selectedTemplate?.variables.forEach(v => {
         mockVariablesMap[v] = `[Dynamic ${v}]`
      })

      await RouteMobileService.sendCampaign(newCampaign, mockVariablesMap)
      
      // Usually we'd save this to a backend database, but here we just redirect
      // to let the mock dashboard show it (though the dashboard uses static MOCK_CAMPAIGNS currently, 
      // in a real app it would fetch the newly inserted row).
      router.push("/marketing")
    } catch (error) {
      console.error(error)
      alert("Failed to send campaign")
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/marketing">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create WhatsApp Campaign</h1>
          <p className="text-muted-foreground">Configure and broadcast a message via Route Mobile.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Basic information for tracking this broadcast.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Summer Mega Sale 2026" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select value={audienceId} onValueChange={setAudienceId}>
                  <SelectTrigger id="audience">
                    <SelectValue placeholder="Select an audience segment" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_AUDIENCES.map(aud => (
                      <SelectItem key={aud.id} value={aud.id}>
                        {aud.name} ({aud.customerCount.toLocaleString()} users)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAudience && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedAudience.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">WhatsApp Template</Label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select an approved template" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_TEMPLATES.filter(t => t.status === 'Approved').map(tpl => (
                      <SelectItem key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templateId && !selectedTemplate && (
                  <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-4 w-4" /> Selected template not found.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Variable Mapping</CardTitle>
                <CardDescription>
                  This template requires dynamic variables. In this demo, they will be automatically mapped to customer data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedTemplate.variables.map((variable, idx) => (
                    <div key={idx} className="space-y-2">
                      <Label className="text-xs font-mono bg-muted px-2 py-1 rounded inline-block">{`{{${idx+1}}}`} {variable}</Label>
                      <Input disabled value={`Auto-mapped from Database`} className="bg-muted text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Link href="/marketing">
              <Button variant="outline" disabled={isSending}>Cancel</Button>
            </Link>
            <Button 
              onClick={handleSend} 
              disabled={isSending || !name || !audienceId || !templateId}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSending ? "Dispatching..." : "Send Campaign"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-[#e5ddd5] p-4 relative overflow-hidden min-h-[300px]">
                {/* Chat background pattern mockup */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                
                {selectedTemplate ? (
                  <div className="relative bg-white rounded-lg p-3 shadow-sm text-sm whitespace-pre-wrap max-w-[85%]">
                    <p className="text-slate-800 leading-relaxed">
                      {selectedTemplate.content.split(/(\{\{\d+\}\})/).map((part, i) => {
                        if (part.match(/\{\{\d+\}\}/)) {
                          const varName = selectedTemplate.variables[parseInt(part.replace(/[\{\}]/g, '')) - 1]
                          return <span key={i} className="bg-emerald-100 text-emerald-800 font-medium px-1 rounded text-xs">[{varName}]</span>
                        }
                        return part
                      })}
                    </p>
                    <div className="text-[10px] text-right text-slate-400 mt-2">12:00 PM</div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm text-slate-500 relative">
                    Select a template to view the preview here.
                  </div>
                )}
              </div>
            </CardContent>
            {selectedTemplate && selectedAudience && (
              <CardFooter className="flex flex-col items-start border-t bg-muted/30 pt-4">
                <p className="text-sm font-medium">Estimated Reach</p>
                <h3 className="text-2xl font-bold mt-1 text-primary">{selectedAudience.customerCount.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-1">recipients</p>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
