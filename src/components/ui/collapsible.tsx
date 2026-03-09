"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { useRender } from "@base-ui/react/use-render"
import { mergeProps } from "@base-ui/react/merge-props"
import { cn } from "@/lib/utils"

function Collapsible({
  render,
  ...props
}: CollapsiblePrimitive.Root.Props & { render?: React.ReactElement }) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      render={render}
      {...props}
    />
  )
}

function CollapsibleTrigger({
  className,
  render,
  ...props
}: CollapsiblePrimitive.Trigger.Props & { render?: React.ReactElement }) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      render={render}
      {...props}
      className={cn(className)}
    />
  )
}

function CollapsibleContent({
  className,
  render,
  ...props
}: CollapsiblePrimitive.Panel.Props & { render?: React.ReactElement }) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      render={render}
      {...props}
      className={cn(
        "no-scrollbar overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
        className
      )}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
