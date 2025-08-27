'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Combobox,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Round } from '@/types/scenario'

interface RoundConfigFormProps {
  round?: Round
  isOpen: boolean
  onClose: () => void
  onSave: (roundData: Omit<Round, 'id' | 'createdAt' | 'order'>) => void
}

export function RoundConfigForm({ round, isOpen, onClose, onSave }: RoundConfigFormProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {round ? 'Edit Funding Round' : 'Add Funding Round'}
          </DialogTitle>
          <DialogDescription>
            Configure the details for this funding round. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
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
              <Combobox
                data={roundTypes}
                type="round type"
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value as 'SAFE' | 'Priced')}
              >
                <ComboboxTrigger className="w-full" />
                <ComboboxContent>
                  <ComboboxInput />
                  <ComboboxList>
                    <ComboboxGroup>
                      {roundTypes.map((type) => (
                        <ComboboxItem key={type.value} value={type.value}>
                          {type.label}
                        </ComboboxItem>
                      ))}
                    </ComboboxGroup>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
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
