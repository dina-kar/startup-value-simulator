'use client'

import * as React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { useScenarioStore } from '@/lib/stores/scenarioStore'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart-simple'
import { ExitSimulator } from '@/components/charts/ExitSimulator'

interface ExitWaterfallChartProps {
  className?: string
}

interface ExitChartData {
  name: string
  value: number
  percentage: number
  color: string
  type: 'founder' | 'investor' | 'esop'
}

export function ExitWaterfallChart({ className }: ExitWaterfallChartProps) {
  const { calculations, exitValue } = useScenarioStore()

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!calculations?.exitDistribution) return []

    const data: ExitChartData[] = []
    
    calculations.exitDistribution.forEach((exit, index) => {
      if (exit.value > 0) {
        let color: string
        
        // Assign colors based on stakeholder type
        if (exit.stakeholderType === 'founder') {
          color = `hsl(${(index * 137.5) % 360}, 70%, 50%)`
        } else if (exit.stakeholderType === 'investor') {
          color = `hsl(${200 + (index * 30)}, 70%, 50%)`
        } else {
          color = 'hsl(0, 0%, 60%)' // Gray for ESOP
        }

        data.push({
          name: exit.stakeholderName,
          value: exit.value,
          percentage: exit.percentage,
          color,
          type: exit.stakeholderType,
        })
      }
    })

    return data.sort((a, b) => b.value - a.value) // Sort by value descending
  }, [calculations])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    
    chartData.forEach(item => {
      config[item.name] = {
        label: item.name,
        color: item.color,
      }
    })
    
    return config
  }, [chartData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (!calculations || chartData.length === 0) {
    return (
      <div className="space-y-6">
        <ExitSimulator />
        <div className="flex items-center justify-center h-64 border border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Data Available
            </h3>
            <p className="text-gray-500">
              Add founders and funding rounds to see exit value distribution.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Exit Simulator */}
      <ExitSimulator className="mb-8" />
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Exit Value Distribution</h3>
        <p className="text-sm text-muted-foreground mb-4">
          How the exit value would be distributed among stakeholders
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <ChartContainer config={chartConfig} className="h-80">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ChartContainer>
        </div>

        {/* Breakdown Table */}
        <div>
          <h4 className="font-medium mb-3">Detailed Breakdown</h4>
          <div className="space-y-2">
            {chartData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500 capitalize">
                      {item.type === 'esop' ? 'ESOP Pool' : item.type}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(item.value)}</div>
                  <div className="text-sm text-gray-500">
                    {formatPercentage(item.percentage)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div className="font-medium">Total Exit Value</div>
              <div className="font-bold text-lg">{formatCurrency(exitValue)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Custom tooltip component for pie chart
function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: ExitChartData
  }>
}) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0].payload

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <div className="font-medium">{data.name}</div>
      <div className="text-sm text-gray-600 capitalize mb-2">
        {data.type === 'esop' ? 'ESOP Pool' : data.type}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span>Amount:</span>
          <span className="font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(data.value)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Percentage:</span>
          <span className="font-medium">{data.percentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}
