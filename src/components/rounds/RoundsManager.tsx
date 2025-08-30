'use client'

import { useState } from 'react'
import { useScenarioStore } from '@/stores/scenarioStore'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react'
import { RoundConfigForm } from '@/components/forms/RoundConfigForm'
import type { Round } from '@/types/scenario'

export function RoundsManager() {
  const { rounds, founders, addRound, updateRound, removeRound } = useScenarioStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRound, setEditingRound] = useState<Round | undefined>()

  if (founders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Plus className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Setup Required
        </h3>
        <p className="text-gray-500">
          Please add founders in the Setup tab before managing funding rounds.
        </p>
      </div>
    )
  }

  const handleAddRound = () => {
    setEditingRound(undefined)
    setIsFormOpen(true)
  }

  const handleEditRound = (round: Round) => {
    setEditingRound(round)
    setIsFormOpen(true)
  }

  const handleSaveRound = (roundData: Omit<Round, 'id' | 'createdAt' | 'order'>) => {
    if (editingRound) {
      updateRound(editingRound.id, roundData)
    } else {
      addRound(roundData)
    }
    setIsFormOpen(false)
    setEditingRound(undefined)
  }

  const handleDeleteRound = (roundId: string) => {
    if (confirm('Are you sure you want to delete this round?')) {
      removeRound(roundId)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value}%`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Funding Rounds</h2>
        <Button onClick={handleAddRound}>
          <Plus className="h-4 w-4 mr-2" />
          Add Round
        </Button>
      </div>

      {rounds.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <div className="mb-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No funding rounds yet
          </h3>
          <p className="text-gray-500 mb-4">
            Add your first funding round to see how it affects the cap table.
          </p>
          <Button onClick={handleAddRound}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Round
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {rounds
            .sort((a, b) => a.order - b.order)
            .map((round, index) => (
              <div key={round.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{round.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            round.type === 'SAFE' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {round.type}
                          </span>
                          <span>Amount: {formatCurrency(round.amount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Round Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                      {round.type === 'Priced' ? (
                        <>
                          <div>
                            <span className="text-gray-500">Pre-Money:</span>
                            <div className="font-medium">
                              {round.preMoney ? formatCurrency(round.preMoney) : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Post-Money:</span>
                            <div className="font-medium">
                              {round.postMoney ? formatCurrency(round.postMoney) : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Share Price:</span>
                            <div className="font-medium">
                              {round.sharePrice ? formatCurrency(round.sharePrice) : 'TBD'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Shares Issued:</span>
                            <div className="font-medium">
                              {round.sharesIssued ? round.sharesIssued.toLocaleString() : 'TBD'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-gray-500">Valuation Cap:</span>
                            <div className="font-medium">
                              {round.valuationCap ? formatCurrency(round.valuationCap) : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Discount:</span>
                            <div className="font-medium">
                              {round.discount ? formatPercentage(round.discount) : 'None'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">MFN:</span>
                            <div className="font-medium">
                              {round.hasMFN ? 'Yes' : 'No'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <div className="font-medium text-orange-600">
                              Convertible
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRound(round)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRound(round.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Round Configuration Form */}
      <RoundConfigForm
        round={editingRound}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingRound(undefined)
        }}
        onSave={handleSaveRound}
      />
    </div>
  )
}
