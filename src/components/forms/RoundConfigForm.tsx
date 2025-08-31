'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Round, SecondaryTransaction } from '@/types/scenario'
import { useScenarioStore } from '@/lib/stores/scenarioStore'

interface RoundConfigFormProps {
  round?: Round
  isOpen: boolean
  onClose: () => void
  onSave: (roundData: Omit<Round, 'id' | 'createdAt' | 'order'>) => void
}

export function RoundConfigForm({ round, isOpen, onClose, onSave }: RoundConfigFormProps) {
  const { founders } = useScenarioStore()
  
  const [formData, setFormData] = useState({
    name: round?.name || '',
    type: round?.type || 'Priced' as 'SAFE' | 'Priced',
    amount: round?.amount || 0,
    preMoney: round?.preMoney || 0,
    postMoney: round?.postMoney || 0,
    sharePrice: round?.sharePrice || 0,
    valuationCap: round?.valuationCap || 0,
    discount: round?.discount || 0,
    hasMFN: round?.hasMFN || false,
    
    // ESOP Configuration
    esopExpand: round?.esopAdjustment?.expand || false,
    esopNewPoolSize: round?.esopAdjustment?.newPoolSize || 20,
    esopIsPreMoney: round?.esopAdjustment?.isPreMoney || false,
    
    // Secondary Sales Configuration
    secondaryEnabled: round?.secondaryConfig?.enabled || false,
    secondaryTiming: round?.secondaryConfig?.timing || 'before' as 'before' | 'after',
    secondaryTransactions: round?.secondaryConfig?.transactions || []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const roundTypes = [
    { label: 'Priced Round', value: 'Priced' },
    { label: 'SAFE', value: 'SAFE' },
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Round name is required'
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Investment amount must be positive'
    }

    if (formData.type === 'Priced') {
      if (formData.preMoney <= 0) {
        newErrors.preMoney = 'Pre-money valuation must be positive'
      }
    } else if (formData.type === 'SAFE') {
      if (formData.valuationCap <= 0) {
        newErrors.valuationCap = 'Valuation cap must be positive'
      }
      if (formData.discount < 0 || formData.discount >= 100) {
        newErrors.discount = 'Discount must be between 0% and 99%'
      }
    }

    // ESOP validation
    if (formData.esopExpand) {
      if (formData.esopNewPoolSize <= 0 || formData.esopNewPoolSize >= 100) {
        newErrors.esopNewPoolSize = 'ESOP pool size must be between 0% and 100%'
      }
    }

    // Secondary transaction validation
    if (formData.secondaryEnabled && formData.secondaryTransactions.length === 0) {
      newErrors.secondaryTransactions = 'At least one secondary transaction is required when enabled'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const roundData: Omit<Round, 'id' | 'createdAt' | 'order'> = {
      name: formData.name.trim(),
      type: formData.type,
      amount: formData.amount,
      preMoney: formData.type === 'Priced' ? formData.preMoney : undefined,
      postMoney: formData.type === 'Priced' ? formData.preMoney + formData.amount : undefined,
      sharePrice: formData.type === 'Priced' ? formData.sharePrice : undefined,
      valuationCap: formData.type === 'SAFE' ? formData.valuationCap : undefined,
      discount: formData.type === 'SAFE' ? formData.discount : undefined,
      hasMFN: formData.type === 'SAFE' ? formData.hasMFN : undefined,
      
      // ESOP Configuration
      esopAdjustment: formData.esopExpand ? {
        expand: true,
        newPoolSize: formData.esopNewPoolSize,
        isPreMoney: formData.esopIsPreMoney
      } : undefined,
      
      // Secondary Sales Configuration
      secondaryConfig: formData.secondaryEnabled ? {
        enabled: true,
        timing: formData.secondaryTiming,
        transactions: formData.secondaryTransactions
      } : undefined
    }

    onSave(roundData)
    onClose()
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addSecondaryTransaction = () => {
    const newTransaction: SecondaryTransaction = {
      id: crypto.randomUUID(),
      founderId: '',
      founderName: '',
      sharesOrPercent: 0,
      isPercentage: true,
      pricePerShare: 0,
      totalValue: 0
    }
    
    setFormData(prev => ({
      ...prev,
      secondaryTransactions: [...prev.secondaryTransactions, newTransaction]
    }))
  }

  const removeSecondaryTransaction = (id: string) => {
    setFormData(prev => ({
      ...prev,
      secondaryTransactions: prev.secondaryTransactions.filter(t => t.id !== id)
    }))
  }

  const updateSecondaryTransaction = (id: string, updates: Partial<SecondaryTransaction>) => {
    setFormData(prev => ({
      ...prev,
      secondaryTransactions: prev.secondaryTransactions.map(t => 
        t.id === id ? { ...t, ...updates } : t
      )
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {round ? 'Edit Funding Round' : 'Add Funding Round'}
          </DialogTitle>
          <DialogDescription>
            Configure the details for this funding round. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="esop">ESOP</TabsTrigger>
              <TabsTrigger value="secondary">Secondary</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Round Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Seed Round, Series A"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Round Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as 'SAFE' | 'Priced')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {roundTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount * ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 1000000"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', Number(e.target.value))}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount}</p>
                )}
              </div>

              {/* Priced Round Fields */}
              {formData.type === 'Priced' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Priced Round Details</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="preMoney">Pre-Money Valuation * ($)</Label>
                    <Input
                      id="preMoney"
                      type="number"
                      placeholder="e.g., 5000000"
                      value={formData.preMoney || ''}
                      onChange={(e) => handleInputChange('preMoney', Number(e.target.value))}
                    />
                    {errors.preMoney && (
                      <p className="text-sm text-red-500">{errors.preMoney}</p>
                    )}
                  </div>

                  {formData.preMoney > 0 && formData.amount > 0 && (
                    <div className="text-sm text-gray-600">
                      Post-Money Valuation: ${(formData.preMoney + formData.amount).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* SAFE Fields */}
              {formData.type === 'SAFE' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">SAFE Details</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="valuationCap">Valuation Cap * ($)</Label>
                    <Input
                      id="valuationCap"
                      type="number"
                      placeholder="e.g., 10000000"
                      value={formData.valuationCap || ''}
                      onChange={(e) => handleInputChange('valuationCap', Number(e.target.value))}
                    />
                    {errors.valuationCap && (
                      <p className="text-sm text-red-500">{errors.valuationCap}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      placeholder="e.g., 20"
                      min="0"
                      max="99"
                      value={formData.discount || ''}
                      onChange={(e) => handleInputChange('discount', Number(e.target.value))}
                    />
                    {errors.discount && (
                      <p className="text-sm text-red-500">{errors.discount}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="hasMFN"
                      type="checkbox"
                      checked={formData.hasMFN}
                      onChange={(e) => handleInputChange('hasMFN', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="hasMFN" className="text-sm">
                      Most Favored Nation (MFN) clause
                    </Label>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ESOP Configuration Tab */}
            <TabsContent value="esop" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    id="esopExpand"
                    type="checkbox"
                    checked={formData.esopExpand}
                    onChange={(e) => handleInputChange('esopExpand', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="esopExpand" className="text-sm font-medium">
                    Expand ESOP Pool in this round
                  </Label>
                </div>

                {formData.esopExpand && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="esopNewPoolSize">New ESOP Pool Size (%)</Label>
                      <Input
                        id="esopNewPoolSize"
                        type="number"
                        placeholder="e.g., 20"
                        min="1"
                        max="99"
                        value={formData.esopNewPoolSize || ''}
                        onChange={(e) => handleInputChange('esopNewPoolSize', Number(e.target.value))}
                      />
                      {errors.esopNewPoolSize && (
                        <p className="text-sm text-red-500">{errors.esopNewPoolSize}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Expansion Timing</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            id="esopPreMoney"
                            name="esopTiming"
                            type="radio"
                            checked={formData.esopIsPreMoney}
                            onChange={() => handleInputChange('esopIsPreMoney', true)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="esopPreMoney" className="text-sm">
                            Pre-money (dilutes existing shareholders before investment)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            id="esopPostMoney"
                            name="esopTiming"
                            type="radio"
                            checked={!formData.esopIsPreMoney}
                            onChange={() => handleInputChange('esopIsPreMoney', false)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="esopPostMoney" className="text-sm">
                            Post-money (target final ownership percentage)
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">
                        <strong>Pre-money:</strong> ESOP expansion dilutes existing shareholders before the investment.<br/>
                        <strong>Post-money:</strong> ESOP is expanded to achieve the target percentage after the investment.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Secondary Sales Tab */}
            <TabsContent value="secondary" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    id="secondaryEnabled"
                    type="checkbox"
                    checked={formData.secondaryEnabled}
                    onChange={(e) => handleInputChange('secondaryEnabled', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="secondaryEnabled" className="text-sm font-medium">
                    Enable founder secondary sales in this round
                  </Label>
                </div>

                {formData.secondaryEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Secondary Sale Timing</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            id="secondaryBefore"
                            name="secondaryTiming"
                            type="radio"
                            checked={formData.secondaryTiming === 'before'}
                            onChange={() => handleInputChange('secondaryTiming', 'before')}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="secondaryBefore" className="text-sm">
                            Before primary investment
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            id="secondaryAfter"
                            name="secondaryTiming"
                            type="radio"
                            checked={formData.secondaryTiming === 'after'}
                            onChange={() => handleInputChange('secondaryTiming', 'after')}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="secondaryAfter" className="text-sm">
                            After primary investment
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Secondary Transactions</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addSecondaryTransaction}
                        >
                          Add Transaction
                        </Button>
                      </div>

                      {formData.secondaryTransactions.map((transaction, index) => (
                        <div key={transaction.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-sm">Transaction {index + 1}</h5>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSecondaryTransaction(transaction.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Founder</Label>
                              <select
                                value={transaction.founderId}
                                onChange={(e) => {
                                  const selectedFounder = founders.find(f => f.id === e.target.value)
                                  updateSecondaryTransaction(transaction.id, {
                                    founderId: e.target.value,
                                    founderName: selectedFounder?.name || ''
                                  })
                                }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              >
                                <option value="">Select founder</option>
                                {founders.map((founder) => (
                                  <option key={founder.id} value={founder.id}>
                                    {founder.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label>Amount Type</Label>
                              <select
                                value={transaction.isPercentage ? 'percentage' : 'shares'}
                                onChange={(e) => updateSecondaryTransaction(transaction.id, {
                                  isPercentage: e.target.value === 'percentage'
                                })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              >
                                <option value="percentage">Percentage</option>
                                <option value="shares">Shares</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label>
                                {transaction.isPercentage ? 'Percentage (%)' : 'Number of Shares'}
                              </Label>
                              <Input
                                type="number"
                                value={transaction.sharesOrPercent || ''}
                                onChange={(e) => updateSecondaryTransaction(transaction.id, {
                                  sharesOrPercent: Number(e.target.value)
                                })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Price per Share ($)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={transaction.pricePerShare || ''}
                                onChange={(e) => {
                                  const price = Number(e.target.value)
                                  updateSecondaryTransaction(transaction.id, {
                                    pricePerShare: price,
                                    totalValue: price * transaction.sharesOrPercent
                                  })
                                }}
                              />
                            </div>
                          </div>

                          {transaction.sharesOrPercent > 0 && transaction.pricePerShare > 0 && (
                            <div className="text-sm text-gray-600">
                              Total Transaction Value: ${(transaction.sharesOrPercent * transaction.pricePerShare).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}

                      {errors.secondaryTransactions && (
                        <p className="text-sm text-red-500">{errors.secondaryTransactions}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Advanced Options Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h4 className="font-medium text-sm mb-2">Advanced Configuration</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Additional options for complex funding scenarios.
                </p>
                
                {formData.type === 'SAFE' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <h5 className="font-medium text-sm text-blue-900 mb-2">SAFE Conversion Preview</h5>
                      <p className="text-sm text-blue-700">
                        This SAFE will convert in the next priced round based on the better of:
                      </p>
                      <ul className="text-sm text-blue-700 mt-2 space-y-1">
                        <li>• Valuation cap: ${formData.valuationCap.toLocaleString()}</li>
                        {formData.discount > 0 && (
                          <li>• {formData.discount}% discount to round price</li>
                        )}
                        {formData.hasMFN && (
                          <li>• Most Favored Nation protection</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {formData.type === 'Priced' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <h5 className="font-medium text-sm text-green-900 mb-2">Round Summary</h5>
                      <div className="text-sm text-green-700 space-y-1">
                        <div>Pre-money: ${formData.preMoney.toLocaleString()}</div>
                        <div>Investment: ${formData.amount.toLocaleString()}</div>
                        <div>Post-money: ${(formData.preMoney + formData.amount).toLocaleString()}</div>
                        {formData.preMoney > 0 && (
                          <div>Investor ownership: {((formData.amount / (formData.preMoney + formData.amount)) * 100).toFixed(1)}%</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {round ? 'Update Round' : 'Add Round'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
