'use client'

import * as React from 'react'
import { useScenarioStore } from '@/stores/scenarioStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface ExitSimulatorProps {
  className?: string
}

export function ExitSimulator({ className }: ExitSimulatorProps) {
  const { exitValue, setExitValue, calculations } = useScenarioStore()
  const [customValue, setCustomValue] = React.useState('')
  
  // Preset exit values based on current valuation
  const currentValuation = React.useMemo(() => {
    if (!calculations?.roundResults || calculations.roundResults.length === 0) {
      return 10_000_000 // Default $10M if no rounds
    }
    return calculations.roundResults[calculations.roundResults.length - 1].postMoney
  }, [calculations])

  const presetMultiples = [0.5, 1, 2, 3, 5, 10, 20]
  
  const presetValues = React.useMemo(() => {
    return presetMultiples.map(multiple => ({
      multiple,
      value: Math.round(currentValuation * multiple),
      label: `${multiple}x`
    }))
  }, [currentValuation])

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}K`
    }
    return `$${value.toLocaleString()}`
  }

  const handlePresetClick = (value: number) => {
    setExitValue(value)
    setCustomValue('')
  }

  const handleCustomValueChange = (value: string) => {
    setCustomValue(value)
    const numericValue = parseFloat(value.replace(/[,$]/g, '')) || 0
    if (numericValue > 0) {
      setExitValue(numericValue)
    }
  }

  const handleSliderChange = (values: number[]) => {
    const value = values[0]
    setExitValue(value)
    setCustomValue('')
  }

  // Slider range: 10% to 50x current valuation
  const sliderMin = Math.max(currentValuation * 0.1, 1_000_000)
  const sliderMax = currentValuation * 50
  const sliderStep = Math.max(sliderMax / 1000, 1_000_000)

  return (
    <div className={className}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Exit Value Simulator</h3>
          <p className="text-sm text-muted-foreground">
            Explore different exit scenarios and see how the proceeds would be distributed
          </p>
        </div>

        {/* Current Exit Value Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center">
            <Label className="text-sm font-medium text-blue-900">Current Exit Value</Label>
            <div className="text-3xl font-bold text-blue-700 mt-1">
              {formatCurrency(exitValue)}
            </div>
            {currentValuation > 0 && (
              <div className="text-sm text-blue-600 mt-1">
                {(exitValue / currentValuation).toFixed(1)}x current valuation
              </div>
            )}
          </div>
        </div>

        {/* Quick Preset Buttons */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Quick Scenarios</Label>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {presetValues.map(({ multiple, value, label }) => (
              <Button
                key={multiple}
                variant={exitValue === value ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetClick(value)}
                className="flex flex-col h-auto py-2"
              >
                <span className="font-medium">{label}</span>
                <span className="text-xs opacity-75">
                  {formatCurrency(value)}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Slider */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Exit Value Range: {formatCurrency(sliderMin)} - {formatCurrency(sliderMax)}
          </Label>
          <div className="px-3">
            <Slider
              value={[exitValue]}
              onValueChange={handleSliderChange}
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatCurrency(sliderMin)}</span>
            <span>{formatCurrency(sliderMax)}</span>
          </div>
        </div>

        {/* Custom Input */}
        <div>
          <Label htmlFor="customExitValue" className="text-sm font-medium">
            Custom Exit Value ($)
          </Label>
          <Input
            id="customExitValue"
            type="text"
            placeholder="e.g., 100000000"
            value={customValue}
            onChange={(e) => handleCustomValueChange(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter any custom exit value to see the detailed breakdown
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(currentValuation)}
          >
            Current Valuation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(100_000_000)}
          >
            $100M Exit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(1_000_000_000)}
          >
            $1B Exit
          </Button>
        </div>

        {/* Exit Scenarios Info */}
        {calculations?.exitDistribution && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Exit Distribution Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {calculations.exitDistribution
                .filter(stakeholder => stakeholder.value > 0)
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map((stakeholder) => (
                  <div key={stakeholder.stakeholderId} className="text-center">
                    <div className="text-sm text-gray-600">
                      {stakeholder.stakeholderName}
                    </div>
                    <div className="font-bold text-lg">
                      {formatCurrency(stakeholder.value)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {stakeholder.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
