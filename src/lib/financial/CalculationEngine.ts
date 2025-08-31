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
    
    // Verify equity splits don't exceed available equity (allow partial allocation)
    const founderEquityTotal = this.scenario.founders.reduce(
      (sum, founder) => sum + founder.initialEquity, 0
    )
    const maxAllowedTotal = 100 - this.scenario.esop.poolSize
    
    if (founderEquityTotal > maxAllowedTotal + 0.01) {
      throw new Error(`Founder equity (${founderEquityTotal}%) cannot exceed ${maxAllowedTotal}% (100% - ${this.scenario.esop.poolSize}% ESOP pool)`)
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
      // Check if any previous SAFEs need to convert into this priced round
      const pendingSAFEs = this.getPendingSAFEs(round, previousRounds)
      if (pendingSAFEs.length > 0) {
        return this.calculatePricedRoundWithSAFEConversions(round, preRoundShares, pendingSAFEs, previousRounds)
      } else {
        return this.calculatePricedRound(round, preRoundShares, previousRounds)
      }
    } else {
      // SAFE round - just track it, don't convert yet
      return this.calculateStandaloneSAFE(round, preRoundShares)
    }
  }

  /**
   * Get all pending SAFEs that should convert into this priced round
   */
  private getPendingSAFEs(pricedRound: Round, previousRounds: RoundResult[]): Round[] {
    const sortedRounds = [...this.scenario.rounds].sort((a, b) => a.order - b.order)
    const pricedRoundIndex = sortedRounds.findIndex(r => r.id === pricedRound.id)
    
    const pendingSAFEs: Round[] = []
    for (let i = 0; i < pricedRoundIndex; i++) {
      const round = sortedRounds[i]
      if (round.type === 'SAFE') {
        // Check if this SAFE hasn't been converted yet
        const wasConverted = previousRounds.some(result => 
          result.roundId === round.id && result.sharePrice < (round.valuationCap || 0) / 10000000
        )
        if (!wasConverted) {
          pendingSAFEs.push(round)
        }
      }
    }
    
    return pendingSAFEs
  }

  /**
   * Calculate a priced round with SAFE conversions
   */
  private calculatePricedRoundWithSAFEConversions(
    pricedRound: Round,
    preRoundShares: number,
    pendingSAFEs: Round[],
    previousRounds?: RoundResult[]
  ): RoundResult {
    if (!pricedRound.preMoney || pricedRound.preMoney <= 0) {
      throw new Error(`${pricedRound.name} must have valid pre-money valuation`)
    }
    
    let workingShares = preRoundShares
    const preMoney = pricedRound.preMoney
    
    // Calculate total investment (priced round + converting SAFEs)
    const totalInvestment = pricedRound.amount + pendingSAFEs.reduce((sum, safe) => sum + safe.amount, 0)
    
    // Handle ESOP adjustments BEFORE pricing (pre-money) - account for upcoming dilution
    if (pricedRound.esopAdjustment?.expand && pricedRound.esopAdjustment.isPreMoney) {
      const result = this.handleESOPAdjustmentWithDilution(
        pricedRound, 
        workingShares, 
        preMoney, 
        totalInvestment, 
        true,
        previousRounds
      )
      workingShares = result.newTotalShares
    }
    
    // Calculate priced round share price
    const sharePrice = preMoney / workingShares
    
    // Convert all pending SAFEs
    let totalSAFEShares = 0
    for (const safe of pendingSAFEs) {
      const safeShares = this.calculateSAFEShares(safe, sharePrice, workingShares)
      totalSAFEShares += safeShares
    }
    
    // Calculate priced round new shares
    const pricedRoundShares = pricedRound.amount / sharePrice
    const totalNewShares = totalSAFEShares + pricedRoundShares
    
    let totalShares = workingShares + totalNewShares
    
    // Handle ESOP adjustments AFTER pricing (post-money)
    if (pricedRound.esopAdjustment?.expand && !pricedRound.esopAdjustment.isPreMoney) {
      const result = this.handleESOPAdjustmentWithDilution(
        pricedRound, 
        totalShares, 
        preMoney + totalInvestment, 
        0, // No additional dilution for post-money
        false,
        previousRounds
      )
      totalShares = result.newTotalShares
    }
    
    const postMoney = preMoney + totalInvestment
    const dilution = (totalNewShares / totalShares) * 100

    const ownership = this.calculateRoundOwnership(pricedRound, totalShares, totalNewShares, 0, [])

    return {
      roundId: pricedRound.id,
      preMoney,
      postMoney,
      sharePrice,
      sharesIssued: totalNewShares,
      totalShares,
      dilution,
      ownership
    }
  }

  /**
   * Calculate shares for a SAFE conversion
   */
  private calculateSAFEShares(safe: Round, pricedRoundSharePrice: number, preConversionShares: number): number {
    if (!safe.valuationCap) {
      throw new Error(`SAFE ${safe.name} must have valuation cap`)
    }
    
    // Calculate cap price
    const capPrice = safe.valuationCap / preConversionShares
    
    // Calculate discount price (if any)
    const discountPrice = safe.discount 
      ? pricedRoundSharePrice * (1 - safe.discount / 100)
      : Infinity
    
    // SAFE converts at better price (lower price = more shares)
    const conversionPrice = Math.min(capPrice, discountPrice)
    
    return safe.amount / conversionPrice
  }

  /**
   * Calculate standalone SAFE (before conversion)
   */
  private calculateStandaloneSAFE(round: Round, preRoundShares: number): RoundResult {
    if (!round.valuationCap || round.valuationCap <= 0) {
      throw new Error(`${round.name} must have valid valuation cap`)
    }
    
    // For standalone SAFE, just track it - no actual conversion yet
    // Use cap price as estimate
    const estimatedPrice = round.valuationCap / preRoundShares
    
    // Don't actually change share count yet - SAFEs convert later
    const ownership = this.calculateRoundOwnership(round, preRoundShares, 0, 0, [])

    return {
      roundId: round.id,
      preMoney: round.valuationCap,
      postMoney: round.valuationCap,
      sharePrice: estimatedPrice,
      sharesIssued: 0, // No shares issued yet
      totalShares: preRoundShares,
      dilution: 0, // No dilution until conversion
      ownership
    }
  }
  private calculatePricedRound(round: Round, preRoundShares: number, previousRounds?: RoundResult[]): RoundResult {
    if (!round.preMoney || round.preMoney <= 0) {
      throw new Error(`${round.name} must have valid pre-money valuation`)
    }
    
    let workingShares = preRoundShares
    let esopSharesAdded = 0
    const preMoney = round.preMoney
    
    // Handle ESOP adjustments BEFORE pricing (pre-money) - account for upcoming dilution
    if (round.esopAdjustment?.expand && round.esopAdjustment.isPreMoney) {
      const result = this.handleESOPAdjustmentWithDilution(
        round, 
        workingShares, 
        preMoney, 
        round.amount, 
        true,
        previousRounds
      )
      workingShares = result.newTotalShares
      esopSharesAdded += result.esopShares
    }
    
    const sharePrice = preMoney / workingShares
    const sharesIssued = round.amount / sharePrice
    let totalShares = workingShares + sharesIssued
    
    // Handle ESOP adjustments AFTER pricing (post-money)
    if (round.esopAdjustment?.expand && !round.esopAdjustment.isPreMoney) {
      const result = this.handleESOPAdjustmentWithDilution(
        round, 
        totalShares, 
        preMoney + round.amount, 
        0, // No additional dilution for post-money
        false,
        previousRounds
      )
      totalShares = result.newTotalShares
      esopSharesAdded += result.esopShares
    }
    
    const postMoney = preMoney + round.amount
    const dilution = (sharesIssued / totalShares) * 100

    // Handle secondary transactions (if any)
    let adjustedOwnership = this.calculateRoundOwnership(round, totalShares, sharesIssued, esopSharesAdded, previousRounds)
    if (round.secondaryConfig?.enabled) {
      adjustedOwnership = this.processSecondaryTransactions(round, adjustedOwnership, totalShares, sharePrice)
    }

    return {
      roundId: round.id,
      preMoney,
      postMoney,
      sharePrice,
      sharesIssued,
      totalShares, // Secondary sales don't change total share count
      dilution,
      ownership: adjustedOwnership
    }
  }

  /**
   * Handle ESOP pool creation or expansion with dilution awareness
   */
  private handleESOPAdjustmentWithDilution(
    round: Round,
    currentShares: number,
    valuation: number,
    upcomingInvestment: number,
    isPreMoney: boolean,
    previousRounds?: RoundResult[]
  ): { newTotalShares: number; esopShares: number } {
    if (!round.esopAdjustment?.newPoolSize) {
      return { newTotalShares: currentShares, esopShares: 0 }
    }

    const targetPoolPercent = round.esopAdjustment.newPoolSize / 100
    
    if (isPreMoney) {
      // Pre-money ESOP expansion: expand share count so ESOP = targetPoolPercent% of pre-money shares
      // This gets diluted by the investment, which is the standard behavior
      const newTotalShares = currentShares / (1 - targetPoolPercent)
      const esopShares = newTotalShares - currentShares
      return { newTotalShares, esopShares }
    } else {
      // Post-money ESOP expansion: after investment, add shares to make ESOP targetPoolPercent% of final total
      
      // Step 1: Calculate post-investment shares (before ESOP adjustment)
      const sharePrice = valuation / currentShares
      const investmentShares = upcomingInvestment / sharePrice
      const postInvestmentShares = currentShares + investmentShares
      
      // Step 2: Calculate current ESOP shares (total ESOP shares from all previous rounds)
      let currentESOPShares = 0
      if (previousRounds && previousRounds.length > 0) {
        // Get ESOP shares from the most recent round
        const lastRound = previousRounds[previousRounds.length - 1]
        const esopEntry = lastRound.ownership.find(o => o.stakeholderType === 'esop')
        currentESOPShares = esopEntry?.shares || 0
      } else {
        // No previous rounds, calculate from initial scenario
        const currentESOPPercent = this.scenario.esop.poolSize / 100
        currentESOPShares = currentESOPPercent * currentShares
      }
      
      // Step 3: Calculate the exact number of shares needed for target percentage
      // We want: targetESOPShares / (postInvestmentShares + additionalESOPShares) = targetPoolPercent
      // Solving: targetESOPShares = targetPoolPercent * (postInvestmentShares + additionalESOPShares)
      // Since additionalESOPShares = targetESOPShares - currentESOPShares:
      // targetESOPShares = targetPoolPercent * (postInvestmentShares + targetESOPShares - currentESOPShares)
      // targetESOPShares = targetPoolPercent * postInvestmentShares + targetPoolPercent * targetESOPShares - targetPoolPercent * currentESOPShares
      // targetESOPShares * (1 - targetPoolPercent) = targetPoolPercent * (postInvestmentShares - currentESOPShares)
      // targetESOPShares = targetPoolPercent * (postInvestmentShares - currentESOPShares) / (1 - targetPoolPercent)
      
      const targetESOPShares = targetPoolPercent * (postInvestmentShares - currentESOPShares) / (1 - targetPoolPercent)
      const additionalESOPShares = Math.max(0, targetESOPShares - currentESOPShares)
      const esopShares = additionalESOPShares
      const newTotalShares = postInvestmentShares + esopShares
      
      return { newTotalShares, esopShares }
    }
  }

  /**
   * Calculate ownership breakdown after a round
   */
  private calculateRoundOwnership(
    round: Round, 
    totalShares: number, 
    newSharesIssued: number,
    esopSharesAdded: number = 0,
    previousRounds?: RoundResult[]
  ): OwnershipBreakdown[] {
    const ownership: OwnershipBreakdown[] = []
    
    // Calculate current ESOP shares
    let currentESOPShares = 0
    if (previousRounds && previousRounds.length > 0) {
      // Get ESOP shares from the most recent round and add any new ESOP shares from this round
      const lastRound = previousRounds[previousRounds.length - 1]
      const esopEntry = lastRound.ownership.find(o => o.stakeholderType === 'esop')
      currentESOPShares = (esopEntry?.shares || 0) + esopSharesAdded
    } else {
      // No previous rounds - handle initial ESOP allocation
      if (esopSharesAdded > 0) {
        // ESOP expansion occurred in this round, so use the expanded amount
        // The expansion is a replacement, not addition to the initial ESOP
        const targetESOPPercent = round.esopAdjustment?.newPoolSize || this.scenario.esop.poolSize
        currentESOPShares = (targetESOPPercent / 100) * (totalShares - newSharesIssued)
      } else {
        // No ESOP expansion, use initial allocation
        const initialESOPPercent = this.scenario.esop.poolSize / 100
        const preInvestmentShares = totalShares - newSharesIssued
        currentESOPShares = initialESOPPercent * preInvestmentShares
      }
    }
    
    // Calculate remaining shares for founders and investors
    const investorShares = newSharesIssued
    const founderShares = totalShares - currentESOPShares - investorShares
    
    // Calculate founder ownership (split proportionally based on initial equity)
    const totalFounderEquity = this.scenario.founders.reduce(
      (sum, founder) => sum + founder.initialEquity, 0
    )
    
    for (const founder of this.scenario.founders) {
      const founderProportion = founder.initialEquity / totalFounderEquity
      const shares = founderShares * founderProportion
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
    const esopPercentage = (currentESOPShares / totalShares) * 100
    
    ownership.push({
      stakeholderId: 'esop',
      stakeholderName: 'ESOP Pool',
      stakeholderType: 'esop',
      shares: currentESOPShares,
      percentage: esopPercentage
    })

    // Add investor from this round
    const investorPercentage = (investorShares / totalShares) * 100
    
    ownership.push({
      stakeholderId: `investor-${round.id}`,
      stakeholderName: `${round.name} Investor`,
      stakeholderType: 'investor',
      shares: investorShares,
      percentage: investorPercentage
    })

    return ownership
  }

  /**
   * Process secondary transactions (founder share sales)
   */
  private processSecondaryTransactions(
    round: Round,
    ownership: OwnershipBreakdown[],
    totalShares: number,
    _sharePrice: number
  ): OwnershipBreakdown[] {
    if (!round.secondaryConfig?.enabled || !round.secondaryConfig.transactions.length) {
      return ownership
    }

    // Create a copy of ownership to modify
    const adjustedOwnership = [...ownership]
    
    for (const transaction of round.secondaryConfig.transactions) {
      // Find the founder selling shares
      const founderIndex = adjustedOwnership.findIndex(
        owner => owner.stakeholderId === transaction.founderId
      )
      
      if (founderIndex === -1) {
        continue // Founder not found, skip transaction
      }
      
      const founder = adjustedOwnership[founderIndex]
      
      // Calculate shares being sold
      let sharesSold: number
      if (transaction.isPercentage) {
        // Selling a percentage of their current equity
        sharesSold = (transaction.sharesOrPercent / 100) * founder.shares
      } else {
        // Selling a specific number of shares
        sharesSold = transaction.sharesOrPercent
      }
      
      // Ensure founder has enough shares to sell
      sharesSold = Math.min(sharesSold, founder.shares)
      
      if (sharesSold <= 0) {
        continue
      }
      
      // Update founder's ownership
      founder.shares -= sharesSold
      founder.percentage = (founder.shares / totalShares) * 100
      
      // Add shares to investor (or create separate secondary investor entry)
      // For simplicity, add to the primary investor for this round
      const investorIndex = adjustedOwnership.findIndex(
        owner => owner.stakeholderId === `investor-${round.id}`
      )
      
      if (investorIndex !== -1) {
        const investor = adjustedOwnership[investorIndex]
        investor.shares += sharesSold
        investor.percentage = (investor.shares / totalShares) * 100
      }
    }
    
    return adjustedOwnership
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

    // Check founder equity doesn't exceed available equity
    const founderEquityTotal = scenario.founders.reduce(
      (sum, founder) => sum + founder.initialEquity, 0
    )
    const maxAllowedTotal = 100 - scenario.esop.poolSize
    
    if (founderEquityTotal > maxAllowedTotal) {
      errors.push(`Founder equity cannot exceed ${maxAllowedTotal}% (found ${founderEquityTotal}%)`)
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
