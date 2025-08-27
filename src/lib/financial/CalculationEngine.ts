import type { 
  Scenario, 
  Round, 
  CapTableCalculations, 
  RoundResult, 
  OwnershipBreakdown,
  ExitBreakdown 
} from '@/types/scenario'

export class CalculationEngine {
  private scenario: Scenario

  constructor(scenario: Scenario) {
    this.scenario = scenario
  }

  /**
   * Calculate the complete cap table across all rounds
   */
  calculateCapTable(): CapTableCalculations {
    let totalShares = this.calculateInitialShares()
    const roundResults: RoundResult[] = []
    
    // Process each round in order
    const sortedRounds = [...this.scenario.rounds].sort((a, b) => a.order - b.order)
    
    for (const round of sortedRounds) {
      const roundResult = this.calculateRound(round, totalShares, roundResults)
      roundResults.push(roundResult)
      totalShares = roundResult.totalShares
    }

    const currentOwnership = this.getCurrentOwnership(totalShares, roundResults)
    const exitDistribution = this.calculateExitDistribution(currentOwnership)

    return {
      totalShares,
      roundResults,
      currentOwnership,
      exitDistribution
    }
  }

  /**
   * Calculate initial shares based on founder equity splits
   */
  private calculateInitialShares(): number {
    // Start with a round number that gives clean share counts
    const baseShares = 10000000 // 10M shares initially
    
    // Verify equity splits add up to expected total (100% - ESOP pool)
    const founderEquityTotal = this.scenario.founders.reduce(
      (sum, founder) => sum + founder.initialEquity, 0
    )
    const expectedTotal = 100 - this.scenario.esop.poolSize
    
    if (Math.abs(founderEquityTotal - expectedTotal) > 0.01) {
      throw new Error(`Founder equity (${founderEquityTotal}%) must equal ${expectedTotal}% (100% - ${this.scenario.esop.poolSize}% ESOP pool)`)
    }

    return baseShares
  }

  /**
   * Calculate the impact of a single funding round
   */
  private calculateRound(
    round: Round, 
    preRoundShares: number, 
    previousRounds: RoundResult[]
  ): RoundResult {
    if (round.type === 'Priced') {
      return this.calculatePricedRound(round, preRoundShares)
    } else {
      return this.calculateSAFERound(round, preRoundShares, previousRounds)
    }
  }

  /**
   * Calculate a priced equity round
   */
  private calculatePricedRound(round: Round, preRoundShares: number): RoundResult {
    if (!round.preMoney || round.preMoney <= 0) {
      throw new Error(`${round.name} must have valid pre-money valuation`)
    }
    
    const preMoney = round.preMoney
    const investment = round.amount
    const postMoney = preMoney + investment
    
    const sharePrice = preMoney / preRoundShares
    const sharesIssued = investment / sharePrice
    const totalShares = preRoundShares + sharesIssued
    
    const dilution = (sharesIssued / totalShares) * 100

    // Handle ESOP pool adjustments if specified
    const adjustedTotalShares = totalShares
    if (round.esopAdjustment?.expand) {
      // TODO: Implement ESOP pool expansion logic
    }

    const ownership = this.calculateRoundOwnership(round, adjustedTotalShares, sharesIssued)

    return {
      roundId: round.id,
      preMoney,
      postMoney,
      sharePrice,
      sharesIssued,
      totalShares: adjustedTotalShares,
      dilution,
      ownership
    }
  }

  /**
   * Calculate a SAFE conversion (simplified - assumes conversion at next round)
   */
  private calculateSAFERound(
    round: Round, 
    preRoundShares: number, 
    _previousRounds: RoundResult[]
  ): RoundResult {
    // For now, treat SAFE as a note that will convert in the next priced round
    // This is a simplified implementation
    
    if (!round.valuationCap || round.valuationCap <= 0) {
      throw new Error(`${round.name} must have valid valuation cap`)
    }
    
    const valuationCap = round.valuationCap
    const investment = round.amount
    const discount = round.discount || 0
    
    // Estimate conversion assuming cap is hit
    const sharePrice = valuationCap / preRoundShares
    const effectivePrice = sharePrice * (1 - discount / 100)
    const sharesIssued = investment / effectivePrice
    
    const totalShares = preRoundShares + sharesIssued
    const dilution = (sharesIssued / totalShares) * 100
    
    const ownership = this.calculateRoundOwnership(round, totalShares, sharesIssued)

    return {
      roundId: round.id,
      preMoney: valuationCap,
      postMoney: valuationCap + investment,
      sharePrice: effectivePrice,
      sharesIssued,
      totalShares,
      dilution,
      ownership
    }
  }

  /**
   * Calculate ownership breakdown after a round
   */
  private calculateRoundOwnership(
    round: Round, 
    totalShares: number, 
    newSharesIssued: number
  ): OwnershipBreakdown[] {
    const ownership: OwnershipBreakdown[] = []
    
    // Calculate founder ownership (diluted)
    for (const founder of this.scenario.founders) {
      const shares = (founder.initialEquity / 100) * (totalShares - newSharesIssued)
      const percentage = (shares / totalShares) * 100
      
      ownership.push({
        stakeholderId: founder.id,
        stakeholderName: founder.name,
        stakeholderType: 'founder',
        shares,
        percentage
      })
    }

    // Add ESOP pool
    const esopShares = (this.scenario.esop.poolSize / 100) * (totalShares - newSharesIssued)
    const esopPercentage = (esopShares / totalShares) * 100
    
    ownership.push({
      stakeholderId: 'esop',
      stakeholderName: 'ESOP Pool',
      stakeholderType: 'esop',
      shares: esopShares,
      percentage: esopPercentage
    })

    // Add investor from this round
    const investorPercentage = (newSharesIssued / totalShares) * 100
    
    ownership.push({
      stakeholderId: `investor-${round.id}`,
      stakeholderName: `${round.name} Investor`,
      stakeholderType: 'investor',
      shares: newSharesIssued,
      percentage: investorPercentage
    })

    return ownership
  }

  /**
   * Get current ownership after all rounds
   */
  private getCurrentOwnership(
    totalShares: number, 
    roundResults: RoundResult[]
  ): OwnershipBreakdown[] {
    if (roundResults.length === 0) {
      // No funding rounds - just founders and ESOP
      return this.getInitialOwnership(totalShares)
    }

    // Return ownership from the last round
    return roundResults[roundResults.length - 1].ownership
  }

  /**
   * Get initial ownership before any funding
   */
  private getInitialOwnership(totalShares: number): OwnershipBreakdown[] {
    const ownership: OwnershipBreakdown[] = []
    
    for (const founder of this.scenario.founders) {
      const shares = (founder.initialEquity / 100) * totalShares
      const percentage = founder.initialEquity
      
      ownership.push({
        stakeholderId: founder.id,
        stakeholderName: founder.name,
        stakeholderType: 'founder',
        shares,
        percentage
      })
    }

    // Add ESOP pool
    const esopShares = (this.scenario.esop.poolSize / 100) * totalShares
    
    ownership.push({
      stakeholderId: 'esop',
      stakeholderName: 'ESOP Pool',
      stakeholderType: 'esop',
      shares: esopShares,
      percentage: this.scenario.esop.poolSize
    })

    return ownership
  }

  /**
   * Calculate exit value distribution
   */
  private calculateExitDistribution(ownership: OwnershipBreakdown[]): ExitBreakdown[] {
    const exitValue = this.scenario.exitValue
    
    return ownership.map(owner => ({
      ...owner,
      value: (owner.percentage / 100) * exitValue,
      preferences: 0, // TODO: Add liquidation preferences
      netValue: (owner.percentage / 100) * exitValue
    }))
  }

  /**
   * Validate scenario data
   */
  static validate(scenario: Scenario): string[] {
    const errors: string[] = []

    // Check founder equity sums correctly
    const founderEquityTotal = scenario.founders.reduce(
      (sum, founder) => sum + founder.initialEquity, 0
    )
    const expectedTotal = 100 - scenario.esop.poolSize
    
    if (Math.abs(founderEquityTotal - expectedTotal) > 0.01) {
      errors.push(`Founder equity must sum to ${expectedTotal}% (found ${founderEquityTotal}%)`)
    }

    // Check individual founder equity is positive
    for (const founder of scenario.founders) {
      if (founder.initialEquity <= 0) {
        errors.push(`${founder.name} must have positive equity`)
      }
    }

    // Check ESOP pool size is reasonable
    if (scenario.esop.poolSize < 0 || scenario.esop.poolSize > 50) {
      errors.push('ESOP pool must be between 0% and 50%')
    }

    // Check rounds have required fields
    for (const round of scenario.rounds) {
      if (round.amount <= 0) {
        errors.push(`${round.name} must have positive investment amount`)
      }

      if (round.type === 'Priced') {
        if (!round.preMoney || round.preMoney <= 0) {
          errors.push(`${round.name} must have positive pre-money valuation`)
        }
      } else if (round.type === 'SAFE') {
        if (!round.valuationCap || round.valuationCap <= 0) {
          errors.push(`${round.name} must have positive valuation cap`)
        }
      }
    }

    return errors
  }
}
