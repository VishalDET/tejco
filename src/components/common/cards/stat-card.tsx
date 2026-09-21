import * as React from "react"
import {
    TrendingUp,
    TrendingDown,
    Minus,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react"
import { COLOR_CONFIGS } from "./color-configs"
import { StatCardProps, TrendDirection } from "./types"

export function StatCard({
    title,
    value,
    icon: IconComponent,
    description,
    change,
    changePeriod,
    trend,
    color = "indigo",
    variant = "bordered",
    badge,
    onClick,
    isLoading = false,
    progress,
    footer,
    prefix,
    suffix,
    className = "",
}: StatCardProps) {
    const config = COLOR_CONFIGS[color] || COLOR_CONFIGS.indigo

    // Derive trend direction if not explicitly provided
    const resolvedTrend: TrendDirection = React.useMemo(() => {
        if (trend) return trend
        if (typeof change === "number") {
            if (change > 0) return "up"
            if (change < 0) return "down"
            return "neutral"
        }
        if (typeof change === "string") {
            if (change.trim().startsWith("+")) return "up"
            if (change.trim().startsWith("-")) return "down"
        }
        return "neutral"
    }, [trend, change])

    // Format change string for display
    const formattedChange = React.useMemo(() => {
        if (change === undefined || change === null) return null
        if (typeof change === "number") {
            const sign = change > 0 ? "+" : ""
            return `${sign}${change}%`
        }
        return String(change)
    }, [change])

    if (isLoading) {
        return (
            <div
                className={`relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs animate-pulse ${className}`}
            >
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="h-4 w-28 rounded-md bg-muted/80" />
                    <div className="h-10 w-10 rounded-xl bg-muted/80" />
                </div>
                <div className="space-y-2">
                    <div className="h-8 w-36 rounded-lg bg-muted/80" />
                    <div className="h-3 w-48 rounded-md bg-muted/60" />
                </div>
            </div>
        )
    }

    const isInteractive = Boolean(onClick)

    // Variant-specific surface classes
    const getSurfaceClasses = () => {
        switch (variant) {
            case "solid":
                return `${config.solidBg} border-transparent shadow-md hover:shadow-xl`
            case "gradient":
                return `bg-gradient-to-br ${config.gradientBg} border ${config.border} ${config.hoverBorder} shadow-xs ${config.glowShadow}`
            case "glass":
                return `backdrop-blur-md bg-card/85 dark:bg-slate-900/75 border border-border/80 ${config.hoverBorder} shadow-xs ${config.glowShadow}`
            case "bordered":
                return `bg-card border border-border/80 ${config.hoverBorder} shadow-xs ${config.glowShadow}`
            case "classic":
            default:
                return `bg-card border border-border shadow-xs hover:border-border/80`
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isInteractive && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            onClick?.()
        }
    }

    return (
        <div
            role={isInteractive ? "button" : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${
                isInteractive ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" : ""
            } ${getSurfaceClasses()} ${className}`}
        >
            {/* Top Accent Gradient Bar for bordered variant */}
            {variant === "bordered" && (
                <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.topBar}`}
                />
            )}

            {/* Ambient subtle glow orb for gradient / glass / bordered */}
            {(variant === "gradient" || variant === "glass" || variant === "bordered") && (
                <div
                    className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full ${config.ambientOrb} blur-2xl transition-all duration-500 group-hover:scale-150`}
                    aria-hidden="true"
                />
            )}

            {/* Header: Title, Custom Badge & Icon */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className={`text-xs font-semibold tracking-wider uppercase truncate ${
                                variant === "solid"
                                    ? "text-white/80"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {title}
                        </span>

                        {badge && (
                            <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    typeof badge === "string"
                                        ? variant === "solid"
                                            ? "bg-white/20 text-white border-white/30"
                                            : config.badgeBg
                                        : badge.variant === "success"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                        : badge.variant === "warning"
                                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                                        : badge.variant === "danger"
                                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                                        : config.badgeBg
                                }`}
                            >
                                {typeof badge === "string" ? badge : badge.text}
                            </span>
                        )}
                    </div>
                </div>

                {/* Icon Container */}
                {IconComponent && (
                    <div
                        className={`shrink-0 flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-300 shadow-2xs group-hover:scale-110 ${
                            variant === "solid"
                                ? "bg-white/15 text-white group-hover:bg-white group-hover:text-foreground"
                                : `${config.iconBg} ${config.iconColor} ${config.iconHoverBg}`
                        }`}
                    >
                        {React.isValidElement(IconComponent) ? (
                            IconComponent
                        ) : (
                            React.createElement(IconComponent as React.ElementType, {
                                className: "h-5 w-5",
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Primary Value */}
            <div className="flex items-baseline gap-1.5 flex-wrap">
                {prefix && (
                    <span
                        className={`text-lg font-bold ${
                            variant === "solid"
                                ? "text-white/80"
                                : "text-muted-foreground"
                        }`}
                    >
                        {prefix}
                    </span>
                )}
                <span
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                        variant === "solid"
                            ? "text-white"
                            : "text-foreground"
                    }`}
                >
                    {value}
                </span>
                {suffix && (
                    <span
                        className={`text-xs font-semibold ${
                            variant === "solid"
                                ? "text-white/70"
                                : "text-muted-foreground"
                        }`}
                    >
                        {suffix}
                    </span>
                )}
            </div>

            {/* Trend Indicator or Subtitle Note */}
            {(formattedChange || description) && (
                <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                    {formattedChange && (
                        <div
                            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                                variant === "solid"
                                    ? "bg-white/20 text-white"
                                    : resolvedTrend === "up"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                                    : resolvedTrend === "down"
                                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60"
                                    : "bg-muted text-muted-foreground border border-border/60"
                            }`}
                        >
                            {resolvedTrend === "up" ? (
                                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            ) : resolvedTrend === "down" ? (
                                <ArrowDownRight className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                            ) : (
                                <Minus className="h-3 w-3 shrink-0" />
                            )}
                            <span>{formattedChange}</span>
                        </div>
                    )}

                    {changePeriod && (
                        <span
                            className={`text-[11px] ${
                                variant === "solid"
                                    ? "text-white/70"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {changePeriod}
                        </span>
                    )}

                    {!formattedChange && description && (
                        <div
                            className={`text-xs flex items-center gap-1.5 ${
                                variant === "solid"
                                    ? "text-white/80"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <span
                                className={`inline-block h-1.5 w-1.5 rounded-full ${
                                    variant === "solid"
                                        ? "bg-white"
                                        : "bg-emerald-500"
                                }`}
                            />
                            <span>{description}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Optional Progress Bar */}
            {progress && (
                <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                        <span
                            className={
                                variant === "solid"
                                    ? "text-white/80"
                                    : "text-muted-foreground font-medium"
                            }
                        >
                            {progress.label || "Progress"}
                        </span>
                        <span
                            className={`font-bold ${
                                variant === "solid" ? "text-white" : "text-foreground"
                            }`}
                        >
                            {Math.round(
                                (progress.value / (progress.max || 100)) * 100
                            )}
                            %
                        </span>
                    </div>
                    <div
                        className={`h-1.5 w-full overflow-hidden rounded-full ${
                            variant === "solid" ? "bg-white/20" : "bg-muted"
                        }`}
                    >
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                variant === "solid" ? "bg-white" : config.progressFill
                            }`}
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        (progress.value / (progress.max || 100)) *
                                            100
                                    )
                                )}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Optional Custom Footer */}
            {footer && <div className="mt-4 pt-3 border-t border-border/40">{footer}</div>}
        </div>
    )
}
