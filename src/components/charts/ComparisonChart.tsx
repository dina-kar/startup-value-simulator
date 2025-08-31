'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useCurrencyFormatter } from '@/lib/format/currency'
import type { CapTableCalculations } from '@/types/scenario'

interface ComparisonChartProps {
  calculations: CapTableCalculations
  title: string
  className?: string
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', 
  '#d084d0', '#87ceeb', '#ffd700', '#ff6347', '#90ee90'
]

export function ComparisonChart({ calculations, title, className }: ComparisonChartProps) {
  if (!calculations || !calculations.currentOwnership) {
    return (
      <div className={`h-48 bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  const chartData = calculations.currentOwnership.map((owner, index) => ({
    name: owner.stakeholderName,
    value: parseFloat(owner.percentage.toFixed(2)),
    color: COLORS[index % COLORS.length]
  }))

  return (
    <div className={className}>
      <h4 className="font-medium mb-2 text-center">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={`ownership-${entry.name}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Ownership']}
            labelStyle={{ color: '#333' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

interface ExitDistributionChartProps {
  calculations: CapTableCalculations
  title: string
  exitValue?: number
  className?: string
}

export function ExitDistributionChart({ 
  calculations, 
  title, 
  exitValue = 100_000_000,
  className 
}: ExitDistributionChartProps) {
  const format = useCurrencyFormatter()
  if (!calculations || !calculations.currentOwnership) {
    return (
      <div className={`h-48 bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  const chartData = calculations.currentOwnership.map((owner, index) => {
    const exitAmount = (owner.percentage / 100) * exitValue
    return {
      name: owner.stakeholderName,
      value: Math.round(exitAmount),
      percentage: owner.percentage,
      color: COLORS[index % COLORS.length]
    }
  })

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) return format(value, { notation: 'compact', maximumFractionDigits: 1 })
    if (value >= 1_000_000) return format(value, { notation: 'compact', maximumFractionDigits: 1 })
    if (value >= 1_000) return format(value, { notation: 'compact', maximumFractionDigits: 0 })
    return format(value)
  }

  return (
    <div className={className}>
      <h4 className="font-medium mb-2 text-center">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={`exit-${entry.name}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name) => [
              formatCurrency(value), 
              `${name} (${chartData.find(d => d.name === name)?.percentage.toFixed(1)}%)`
            ]}
            labelStyle={{ color: '#333' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
