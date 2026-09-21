import * as React from "react"
import { StatGridProps } from "./types"

export function StatGrid({
    children,
    columns = 4,
    className = "",
}: StatGridProps) {
    const getGridColumns = () => {
        switch (columns) {
            case 1:
                return "grid-cols-1"
            case 2:
                return "grid-cols-1 sm:grid-cols-2"
            case 3:
                return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            case 5:
                return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
            case 6:
                return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
            case 4:
            default:
                return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        }
    }

    return (
        <div className={`grid gap-4 ${getGridColumns()} ${className}`}>
            {children}
        </div>
    )
}
