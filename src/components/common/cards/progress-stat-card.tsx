import * as React from "react"
import { Target, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react"
import { COLOR_CONFIGS } from "./color-configs"
import { ProgressStatCardProps } from "./types"

export function ProgressStatCard({
    title,
    current,
    target,
    unit = "",
    formatValue = (v) => v.toLocaleString(),
    icon: IconComponent,
    statusLabel,
    color = "indigo",
    variant = "bordered",
    onClick,
    isLoading = false,
    className = "",
    description,
}: ProgressStatCardProps) {
    const config = COLOR_CONFIGS[color] || COLOR_CONFIGS.indigo
    const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

    const isInteractive = Boolean(onClick)

    if (isLoading) {
        return (
            <div
                className={`relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs animate-pulse ${className}`}
            >
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="h-4 w-32 rounded-md bg-muted/80" />
                    <div className="h-10 w-10 rounded-xl bg-muted/80" />
                </div>
                <div className="space-y-3">
                    <div className="h-8 w-44 rounded-lg bg-muted/80" />
                    <div className="h-2 w-full rounded-full bg-muted/60" />
                    <div className="h-4 w-28 rounded-md bg-muted/60" />
                </div>
            </div>
        )
    }

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

    const getHealthBadge = () => {
        if (statusLabel) {
            return (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
                    {statusLabel}
                </span>
            )
        }
        if (percentage >= 100) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="h-3 w-3" /> Target Reached
                </span>
            )
        }
        if (percentage >= 75) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800">
                    <Target className="h-3 w-3" /> On Track
                </span>
            )
        }
        if (percentage >= 40) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800">
                    <AlertTriangle className="h-3 w-3" /> In Progress
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800">
                <AlertCircle className="h-3 w-3" /> Attention Needed
            </span>
        )
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
            {/* Top Gradient Bar */}
            {variant === "bordered" && (
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.topBar}`} />
            )}

            {/* Ambient Glow */}
            <div
                className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${config.ambientOrb} blur-xl transition-all duration-500 group-hover:scale-125`}
                aria-hidden="true"
            />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-1 flex-1">
                    <span
                        className={`text-xs font-semibold tracking-wider uppercase truncate block ${
                            variant === "solid" ? "text-white/80" : "text-muted-foreground"
                        }`}
                    >
                        {title}
                    </span>
                    {getHealthBadge()}
                </div>

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

            {/* Numbers: Current / Target */}
            <div className="mt-2 flex items-baseline justify-between gap-2">
                <div>
                    <span
                        className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                            variant === "solid" ? "text-white" : "text-foreground"
                        }`}
                    >
                        {formatValue(current)}
                    </span>
                    {unit && (
                        <span
                            className={`ml-1 text-xs font-semibold ${
                                variant === "solid" ? "text-white/70" : "text-muted-foreground"
                            }`}
                        >
                            {unit}
                        </span>
                    )}
                </div>

                <div
                    className={`text-xs font-medium ${
                        variant === "solid" ? "text-white/80" : "text-muted-foreground"
                    }`}
                >
                    Target: <span className="font-bold">{formatValue(target)} {unit}</span>
                </div>
            </div>

            {/* Progress Bar & Percentage */}
            <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                    <span
                        className={
                            variant === "solid" ? "text-white/80" : "text-muted-foreground text-[11px]"
                        }
                    >
                        Capacity Reached
                    </span>
                    <span
                        className={`font-extrabold text-xs ${
                            variant === "solid" ? "text-white" : config.text
                        }`}
                    >
                        {percentage}%
                    </span>
                </div>

                <div
                    className={`h-2 w-full overflow-hidden rounded-full ${
                        variant === "solid" ? "bg-white/20" : "bg-muted/80"
                    }`}
                >
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                            variant === "solid" ? "bg-white" : config.progressFill
                        }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            {description && (
                <p
                    className={`mt-3 text-[11px] ${
                        variant === "solid" ? "text-white/75" : "text-muted-foreground"
                    }`}
                >
                    {description}
                </p>
            )}
        </div>
    )
}
