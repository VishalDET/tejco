import * as React from "react"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { COLOR_CONFIGS } from "./color-configs"
import { TrendStatCardProps, TrendDirection } from "./types"

export function TrendStatCard({
    title,
    value,
    data = [],
    icon: IconComponent,
    color = "indigo",
    variant = "bordered",
    change,
    changePeriod,
    trend,
    onClick,
    isLoading = false,
    className = "",
    prefix,
    suffix,
}: TrendStatCardProps) {
    const config = COLOR_CONFIGS[color] || COLOR_CONFIGS.indigo

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

    const formattedChange = React.useMemo(() => {
        if (change === undefined || change === null) return null
        if (typeof change === "number") {
            const sign = change > 0 ? "+" : ""
            return `${sign}${change}%`
        }
        return String(change)
    }, [change])

    // Compute max value for sparkline bar heights
    const maxVal = React.useMemo(() => {
        if (!data.length) return 1
        return Math.max(...data.map((d) => d.value), 1)
    }, [data])

    if (isLoading) {
        return (
            <div
                className={`relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs animate-pulse ${className}`}
            >
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="h-4 w-32 rounded-md bg-muted/80" />
                    <div className="h-10 w-10 rounded-xl bg-muted/80" />
                </div>
                <div className="space-y-4">
                    <div className="h-8 w-40 rounded-lg bg-muted/80" />
                    <div className="h-12 w-full rounded-md bg-muted/60" />
                </div>
            </div>
        )
    }

    const isInteractive = Boolean(onClick)

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
            {/* Top Accent Gradient Bar */}
            {variant === "bordered" && (
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.topBar}`} />
            )}

            {/* Ambient subtle glow */}
            <div
                className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full ${config.ambientOrb} blur-xl transition-all duration-500 group-hover:scale-125`}
                aria-hidden="true"
            />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
                <span
                    className={`text-xs font-semibold tracking-wider uppercase truncate block ${
                        variant === "solid" ? "text-white/80" : "text-muted-foreground"
                    }`}
                >
                    {title}
                </span>

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

            {/* Metric Value & Trend */}
            <div className="flex items-baseline gap-1.5 flex-wrap">
                {prefix && (
                    <span
                        className={`text-lg font-bold ${
                            variant === "solid" ? "text-white/80" : "text-muted-foreground"
                        }`}
                    >
                        {prefix}
                    </span>
                )}
                <span
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                        variant === "solid" ? "text-white" : "text-foreground"
                    }`}
                >
                    {value}
                </span>
                {suffix && (
                    <span
                        className={`text-xs font-semibold ${
                            variant === "solid" ? "text-white/70" : "text-muted-foreground"
                        }`}
                    >
                        {suffix}
                    </span>
                )}
            </div>

            {/* Change pill */}
            {formattedChange && (
                <div className="mt-2 flex items-center gap-1.5 text-xs">
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
                    {changePeriod && (
                        <span
                            className={`text-[11px] ${
                                variant === "solid" ? "text-white/70" : "text-muted-foreground"
                            }`}
                        >
                            {changePeriod}
                        </span>
                    )}
                </div>
            )}

            {/* Mini Sparkline Bar Visualization */}
            {data.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/40">
                    <div className="flex items-end justify-between gap-1.5 h-10">
                        {data.map((item, idx) => {
                            const barHeight = Math.max(12, Math.round((item.value / maxVal) * 100))
                            const isLast = idx === data.length - 1

                            return (
                                <div
                                    key={`${item.label}-${idx}`}
                                    className="group/bar relative flex-1 flex flex-col items-center justify-end h-full cursor-pointer"
                                >
                                    {/* Tooltip on hover */}
                                    <div className="pointer-events-none absolute -top-8 hidden group-hover/bar:flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md font-mono whitespace-nowrap z-10">
                                        {item.label}: {item.value}
                                    </div>

                                    {/* Bar element */}
                                    <div
                                        className={`w-full rounded-t-sm transition-all duration-300 ${
                                            variant === "solid"
                                                ? isLast
                                                    ? "bg-white"
                                                    : "bg-white/40 group-hover/bar:bg-white/80"
                                                : isLast
                                                ? config.progressFill
                                                : `${config.iconBg} group-hover/bar:${config.progressFill}`
                                        }`}
                                        style={{ height: `${barHeight}%` }}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
