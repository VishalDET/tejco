import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { Search, ChevronDown, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface SearchableOption {
  value: string | number
  label: string
  subLabel?: string
  badge?: string
  price?: string | number
  extra?: React.ReactNode
  keywords?: string[]
}

export interface SearchableDropdownProps {
  value?: string | number | null
  onChange: (value: string) => void
  options: SearchableOption[]
  placeholder?: string
  searchPlaceholder?: string
  icon?: React.ReactNode
  disabled?: boolean
  className?: string
  triggerClassName?: string
  popoverWidth?: number
  allowClear?: boolean
  size?: "sm" | "default"
  emptyMessage?: string
}

export function SearchableDropdown({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  icon,
  disabled = false,
  className,
  triggerClassName,
  popoverWidth = 380,
  allowClear = false,
  size = "default",
  emptyMessage = "No matching options found",
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const optionsListRef = useRef<HTMLDivElement>(null)

  const [coords, setCoords] = useState<{
    top: number
    left: number
    width: number
    placeAbove: boolean
  }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  })

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (value === null || value === undefined || value === "") return null
    return options.find((opt) => String(opt.value) === String(value)) || null
  }, [value, options])

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options
    const q = searchQuery.toLowerCase().trim()
    return options.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(q)
      const subLabelMatch = opt.subLabel?.toLowerCase().includes(q)
      const badgeMatch = opt.badge?.toLowerCase().includes(q)
      const keywordMatch = opt.keywords?.some((k) => k.toLowerCase().includes(q))
      return Boolean(labelMatch || subLabelMatch || badgeMatch || keywordMatch)
    })
  }, [options, searchQuery])

  // Compute popover position relative to viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const estimatedHeight = 320

    const placeAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow

    // Minimum width is trigger width or popoverWidth, bounded by viewport width
    const targetWidth = Math.max(rect.width, Math.min(popoverWidth, window.innerWidth - 32))

    let left = rect.left
    if (left + targetWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - targetWidth - 16)
    }
    if (left < 16) left = 16

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left,
      width: targetWidth,
      placeAbove,
    })
  }, [popoverWidth])

  // Handle open state changes
  useEffect(() => {
    if (isOpen) {
      updatePosition()
      setHighlightedIndex(0)

      // Focus search input
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 40)

      const handleScrollOrResize = () => {
        updatePosition()
      }

      window.addEventListener("scroll", handleScrollOrResize, true)
      window.addEventListener("resize", handleScrollOrResize)

      return () => {
        clearTimeout(timer)
        window.removeEventListener("scroll", handleScrollOrResize, true)
        window.removeEventListener("resize", handleScrollOrResize)
      }
    }
  }, [isOpen, updatePosition])

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
        setSearchQuery("")
        triggerRef.current?.focus()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : Math.max(0, filteredOptions.length - 1)
        )
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, filteredOptions, highlightedIndex])

  // Scroll active option into view
  useEffect(() => {
    if (!isOpen || !optionsListRef.current) return
    const activeEl = optionsListRef.current.children[highlightedIndex] as HTMLElement
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" })
    }
  }, [highlightedIndex, isOpen])

  const handleSelect = (val: string | number) => {
    onChange(String(val))
    setIsOpen(false)
    setSearchQuery("")
    triggerRef.current?.focus()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setSearchQuery("")
    setIsOpen(false)
  }

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev)
          }
        }}
        className={cn(
          "flex items-center justify-between w-full rounded-lg border border-input bg-background hover:bg-muted/40 hover:border-primary/50 transition-all text-left outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-2xs group",
          size === "sm" ? "h-8 px-2.5 text-[11px]" : "h-9 px-3 text-xs",
          isOpen && "border-primary ring-2 ring-ring/30",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1.5 overflow-hidden">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              <span className="font-semibold text-foreground truncate block">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 font-medium hidden sm:inline-block">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground truncate block">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
              title="Clear selection"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180 text-primary"
            )}
          />
        </div>
      </button>

      {/* Portaled Popover Menu: Never clipped by card or table scroll container */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: coords.placeAbove ? undefined : coords.top,
              bottom: coords.placeAbove ? window.innerHeight - coords.top : undefined,
              left: coords.left,
              width: coords.width,
              maxWidth: "calc(100vw - 32px)",
              zIndex: 99999,
            }}
            className="rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl ring-1 ring-black/10 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[75vh]"
          >
            {/* Search Input Box */}
            <div className="p-2 border-b bg-muted/40 shrink-0">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setHighlightedIndex(0)
                  }}
                  placeholder={searchPlaceholder}
                  className="h-8 pl-8 pr-7 text-xs bg-background shadow-none border-input focus-visible:ring-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("")
                      setHighlightedIndex(0)
                      searchInputRef.current?.focus()
                    }}
                    className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Options List */}
            <div
              ref={optionsListRef}
              className="overflow-y-auto p-1.5 divide-y divide-border/30 max-h-64 sm:max-h-80 overscroll-contain"
            >
              {filteredOptions.length === 0 ? (
                <div className="py-7 px-4 text-center space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {emptyMessage}
                  </p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("")
                        setHighlightedIndex(0)
                        searchInputRef.current?.focus()
                      }}
                      className="text-[11px] text-primary hover:underline cursor-pointer font-medium"
                    >
                      Clear search query
                    </button>
                  )}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value)
                  const isHighlighted = idx === highlightedIndex

                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        "flex items-start justify-between gap-3 p-2.5 rounded-lg transition-colors cursor-pointer select-none text-left",
                        isSelected
                          ? "bg-primary/10 text-foreground border border-primary/25"
                          : isHighlighted
                          ? "bg-muted/80 text-foreground"
                          : "hover:bg-muted/60 text-foreground"
                      )}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        {/* Title & Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-foreground leading-snug break-words">
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium shrink-0">
                              {opt.badge}
                            </span>
                          )}
                        </div>

                        {/* Subtitle, Price & Extra meta */}
                        {(opt.subLabel || opt.price !== undefined || opt.extra) && (
                          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground flex-wrap pt-0.5">
                            {opt.subLabel && (
                              <span className="truncate max-w-[240px]">{opt.subLabel}</span>
                            )}
                            {opt.price !== undefined && (
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {typeof opt.price === "number"
                                  ? `₹${opt.price.toLocaleString()}`
                                  : opt.price}
                              </span>
                            )}
                            {opt.extra && (
                              <span className="text-[10px] text-primary/80 font-medium bg-primary/5 px-1.5 py-0.5 rounded">
                                {opt.extra}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Selected checkmark indicator */}
                      <div className="shrink-0 pt-0.5">
                        {isSelected ? (
                          <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xs">
                            <Check className="h-3 w-3 stroke-[2.5]" />
                          </span>
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-border/80 block" />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2 px-3 border-t bg-muted/20 text-[10px] text-muted-foreground flex items-center justify-between shrink-0">
              <span>
                Showing {filteredOptions.length} of {options.length} options
              </span>
              {selectedOption ? (
                <span className="text-primary font-semibold">Selected</span>
              ) : (
                <span className="text-muted-foreground">Press ↑↓ to navigate</span>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
