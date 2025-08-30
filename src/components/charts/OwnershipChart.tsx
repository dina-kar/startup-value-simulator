'use client'

import * as React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { useScenarioStore } from '@/stores/scenarioStore'
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart-simple'

interface OwnershipChartProps {
  className?: string
}

interface ChartDataPoint {
  round: string
  roundIndex: number
  [stakeholder: string]: string | number
}

interface TooltipPayload {
  name: string
  value: number | string
  color: string
  dataKey?: string
}

export function OwnershipChart({ className }: OwnershipChartProps) {
  const { calculations, founders, rounds } = useScenarioStore()

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!calculations) return []

    const data: ChartDataPoint[] = []
    
    // Initial state (before any rounds)
    const initialData: ChartDataPoint = {
      round: 'Initial',
      roundIndex: 0,
    }
    
    // Add founder percentages
    founders.forEach(founder => {
      initialData[founder.name] = founder.initialEquity
    })
    
    // Add ESOP
    initialData['ESOP Pool'] = calculations.currentOwnership.find(o => o.stakeholderType === 'esop')?.percentage || 0
    
    data.push(initialData)

    // Add data for each round
    calculations.roundResults.forEach((result, index) => {
      const roundData: ChartDataPoint = {
        round: rounds.find(r => r.id === result.roundId)?.name || `Round ${index + 1}`,
        roundIndex: index + 1,
      }

      result.ownership.forEach(ownership => {
        roundData[ownership.stakeholderName] = Number(ownership.percentage.toFixed(2))
      })

      data.push(roundData)
    })

    return data
  }, [calculations, founders, rounds])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    
    // Add founders
    founders.forEach((founder, index) => {
      config[founder.name] = {
        label: founder.name,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`, // Generate distinct colors
      }
    })
    
    // Add ESOP
    config['ESOP Pool'] = {
      label: 'ESOP Pool',
      color: 'hsl(0, 0%, 60%)', // Gray for ESOP
    }
    
    // Add investors
    if (calculations) {
      let investorIndex = 0
      calculations.roundResults.forEach(result => {
        result.ownership.forEach(ownership => {
          if (ownership.stakeholderType === 'investor' && !config[ownership.stakeholderName]) {
            config[ownership.stakeholderName] = {
              label: ownership.stakeholderName,
              color: `hsl(${200 + (investorIndex * 30)}, 70%, 50%)`, // Blue spectrum for investors
            }
            investorIndex++
          }
        })
      })
    }
    
    return config
  }, [founders, calculations])

  if (!calculations || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-500">
            Add founders and funding rounds to see ownership changes over time.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Ownership Over Time</h3>
        <p className="text-sm text-muted-foreground">
          How ownership percentages change with each funding round
        </p>
      </div>
      
      <ChartContainer config={chartConfig} className="h-80">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="round" 
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Render lines for each stakeholder */}
          {Object.entries(chartConfig).map(([key, configItem]) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={configItem.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  )
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{
    value: number
    dataKey: string
    color: string
  }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const validPayload = payload.filter((entry) => 
    entry.value !== undefined && 
    entry.value !== null && 
    entry.dataKey !== 'round' && 
    entry.dataKey !== 'roundIndex'
  )

  return (
    <ChartTooltipContent
      active={active}
      payload={validPayload.map((entry): TooltipPayload => ({
        name: entry.dataKey,
        value: `${entry.value}%`,
        color: entry.color,
      }))}
      label={label}
    />
  )
}
