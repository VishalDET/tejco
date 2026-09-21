import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export type StatColor =
    | "blue"
    | "indigo"
    | "emerald"
    | "violet"
    | "amber"
    | "rose"
    | "cyan"
    | "fuchsia"
    | "teal"
    | "orange"

export type StatVariant = "classic" | "gradient" | "glass" | "bordered" | "solid"

export type TrendDirection = "up" | "down" | "neutral"

export interface StatBadge {
    text: string
    variant?: "default" | "outline" | "secondary" | "success" | "warning" | "danger"
}

export interface StatCardProps {
    /** Label or title of the metric */
    title: ReactNode
    /** Primary value to display */
    value: ReactNode
    /** Optional Lucide icon or ReactNode */
    icon?: LucideIcon | ReactNode
    /** Secondary descriptive note or subtitle */
    description?: ReactNode
    /** Numeric or string change indicator (e.g. 12.5 or "+12.5%") */
    change?: number | string
    /** Comparative text for change (e.g. "vs last month", "vs yesterday") */
    changePeriod?: string
    /** Direction of trend; auto-calculated from change if numeric */
    trend?: TrendDirection
    /** Color theme of the card */
    color?: StatColor
    /** Visual style variant of the card */
    variant?: StatVariant
    /** Pill badge displayed in header */
    badge?: string | StatBadge
    /** Click handler if card is interactive */
    onClick?: () => void
    /** Loading skeleton state */
    isLoading?: boolean
    /** Optional mini progress bar */
    progress?: {
        value: number
        max?: number
        label?: string
    }
    /** Optional custom footer element */
    footer?: ReactNode
    /** Prefix for value (e.g. currency symbol '₹' or '$') */
    prefix?: ReactNode
    /** Suffix for value (e.g. unit 'SKUs' or 'units') */
    suffix?: ReactNode
    /** Additional CSS classes */
    className?: string
}

export interface ProgressStatCardProps {
    title: ReactNode
    current: number
    target: number
    unit?: string
    formatValue?: (val: number) => string
    icon?: LucideIcon | ReactNode
    statusLabel?: string
    color?: StatColor
    variant?: StatVariant
    onClick?: () => void
    isLoading?: boolean
    className?: string
    description?: ReactNode
}

export interface TrendDataPoint {
    label: string
    value: number
}

export interface TrendStatCardProps {
    title: ReactNode
    value: ReactNode
    data?: TrendDataPoint[]
    icon?: LucideIcon | ReactNode
    color?: StatColor
    variant?: StatVariant
    change?: number | string
    changePeriod?: string
    trend?: TrendDirection
    onClick?: () => void
    isLoading?: boolean
    className?: string
    prefix?: ReactNode
    suffix?: ReactNode
}

export interface StatGridProps {
    children: ReactNode
    columns?: 1 | 2 | 3 | 4 | 5 | 6
    className?: string
}
