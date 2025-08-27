"use client"

import * as React from "react"
import { ResponsiveContainer } from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ReactElement
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs",
          className
        )}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

// Simple tooltip component
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean
    payload?: Array<{
      name: string
      value: number | string
      color: string
      dataKey?: string
    }>
    label?: string
    hideLabel?: boolean
  }
>(
  (
    {
      active,
      payload,
      className,
      hideLabel = false,
      label,
      ...props
    },
    ref
  ) => {
    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
        {...props}
      >
        {!hideLabel && label && (
          <div className="font-medium">{label}</div>
        )}
        <div className="grid gap-1.5">
          {payload.map((item, index) => (
            <div
              key={item.dataKey || item.name || index}
              className="flex items-center gap-2"
            >
              <div
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex flex-1 justify-between leading-none">
                <div className="text-muted-foreground">
                  {item.name}
                </div>
                <div className="font-mono font-medium tabular-nums text-foreground">
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export {
  ChartContainer,
  ChartTooltipContent,
  useChart,
}
