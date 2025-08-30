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
   * Calculate a priced equity round with ESOP adjustments
   */
  private calculatePricedRound(round: Round, preRoundShares: number): RoundResult {
    if (!round.preMoney || round.preMoney <= 0) {
      throw new Error(`${round.name} must have valid pre-money valuation`)
    }
    
    let workingShares = preRoundShares
    const preMoney = round.preMoney
    
    // Handle ESOP adjustments BEFORE pricing (pre-money)
    if (round.esopAdjustment?.expand && round.esopAdjustment.isPreMoney) {
      const result = this.handleESOPAdjustment(round, workingShares, preMoney, true)
      workingShares = result.newTotalShares
      // Pre-money valuation stays the same, but effective share price changes
    }
    
    const sharePrice = preMoney / workingShares
    const sharesIssued = round.amount / sharePrice
    let totalShares = workingShares + sharesIssued
    
    // Handle ESOP adjustments AFTER pricing (post-money)
    if (round.esopAdjustment?.expand && !round.esopAdjustment.isPreMoney) {
      const result = this.handleESOPAdjustment(round, totalShares, preMoney + round.amount, false)
      totalShares = result.newTotalShares
    }
    
    const postMoney = preMoney + round.amount
    const dilution = (sharesIssued / totalShares) * 100

    const ownership = this.calculateRoundOwnership(round, totalShares, sharesIssued)

    return {
      roundId: round.id,
      preMoney,
      postMoney,
      sharePrice,
      sharesIssued,
      totalShares,
      dilution,
      ownership
    }
  }

  /**
   * Handle ESOP pool creation or expansion
   */
  private handleESOPAdjustment(
    round: Round,
    currentShares: number,
    _valuation: number,
    isPreMoney: boolean
  ): { newTotalShares: number; esopShares: number } {
    if (!round.esopAdjustment?.newPoolSize) {
      return { newTotalShares: currentShares, esopShares: 0 }
    }

    const targetPoolPercent = round.esopAdjustment.newPoolSize
    
    if (isPreMoney) {
      // Pre-money ESOP expansion dilutes existing shareholders proportionally
      // Target: ESOP = targetPoolPercent% of post-adjustment shares
      // newShares = currentShares / (1 - targetPoolPercent/100)
      const newTotalShares = currentShares / (1 - targetPoolPercent / 100)
      const esopShares = newTotalShares - currentShares
      
      return { newTotalShares, esopShares }
    } else {
      // Post-money ESOP expansion: add shares to reach target percentage
      // Target: ESOP = targetPoolPercent% of final shares
      const newTotalShares = currentShares / (1 - targetPoolPercent / 100)
      const esopShares = newTotalShares - currentShares
      
      return { newTotalShares, esopShares }
    }
  }

  /**
   * Calculate a SAFE conversion with proper cap and discount logic
   */
  private calculateSAFERound(
    round: Round, 
    preRoundShares: number, 
    _previousRounds: RoundResult[]
  ): RoundResult {
    if (!round.valuationCap || round.valuationCap <= 0) {
      throw new Error(`${round.name} must have valid valuation cap`)
    }
    
    const valuationCap = round.valuationCap
    const investment = round.amount
    const discount = round.discount || 0
    
    // Check if this is converting in a priced round
    const nextPricedRound = this.findNextPricedRound(round)
    
    if (nextPricedRound) {
      // SAFE converts at the better of cap price or discounted price
      return this.calculateSAFEConversion(round, nextPricedRound, preRoundShares)
    } else {
      // Standalone SAFE - estimate using cap
      const capPrice = valuationCap / preRoundShares
      const discountedPrice = discount > 0 ? capPrice * (1 - discount / 100) : capPrice
      const conversionPrice = Math.min(capPrice, discountedPrice)
      const sharesIssued = investment / conversionPrice
      
      const totalShares = preRoundShares + sharesIssued
      const dilution = (sharesIssued / totalShares) * 100
      
      const ownership = this.calculateRoundOwnership(round, totalShares, sharesIssued)

      return {
        roundId: round.id,
        preMoney: valuationCap,
        postMoney: valuationCap + investment,
        sharePrice: conversionPrice,
        sharesIssued,
        totalShares,
        dilution,
        ownership
      }
    }
  }

  /**
   * Find the next priced round for SAFE conversion
   */
  private findNextPricedRound(safeRound: Round): Round | null {
    const sortedRounds = [...this.scenario.rounds].sort((a, b) => a.order - b.order)
    const safeIndex = sortedRounds.findIndex(r => r.id === safeRound.id)
    
    for (let i = safeIndex + 1; i < sortedRounds.length; i++) {
      if (sortedRounds[i].type === 'Priced') {
        return sortedRounds[i]
      }
    }
    
    return null
  }

  /**
   * Calculate SAFE conversion into a priced round
   */
  private calculateSAFEConversion(
    safeRound: Round,
    pricedRound: Round,
    preConversionShares: number
  ): RoundResult {
    if (!safeRound.valuationCap || !pricedRound.preMoney) {
      throw new Error('Invalid SAFE or priced round parameters')
    }

    // Calculate priced round share price
    const pricedRoundPrice = pricedRound.preMoney / preConversionShares
    
    // Calculate SAFE conversion price (better of cap or discount)
    const capPrice = safeRound.valuationCap / preConversionShares
    const discountedPrice = safeRound.discount 
      ? pricedRoundPrice * (1 - safeRound.discount / 100)
      : Infinity
    
    const conversionPrice = Math.min(capPrice, discountedPrice)
    const safeShares = safeRound.amount / conversionPrice
    
    // Calculate priced round shares
    const pricedShares = pricedRound.amount / pricedRoundPrice
    
    const totalNewShares = safeShares + pricedShares
    const totalShares = preConversionShares + totalNewShares
    const dilution = (totalNewShares / totalShares) * 100

    const ownership = this.calculateRoundOwnership(pricedRound, totalShares, totalNewShares)

    return {
      roundId: pricedRound.id,
      preMoney: pricedRound.preMoney,
      postMoney: pricedRound.preMoney + pricedRound.amount + safeRound.amount,
      sharePrice: pricedRoundPrice,
      sharesIssued: totalNewShares,
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
