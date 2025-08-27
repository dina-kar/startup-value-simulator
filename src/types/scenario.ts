export interface Founder {
  id: string
  name: string
  email: string
  initialEquity: number // percentage
  currentEquity: number // percentage
  shares: number
  role?: string
}

export interface ESOPConfig {
  poolSize: number // percentage
  isPreMoney: boolean
  currentSize: number // percentage after dilution
  allocated: number // percentage allocated to employees
  available: number // percentage available for future grants
}

export interface Round {
  id: string
  name: string
  type: 'SAFE' | 'Priced'
  amount: number // investment amount
  
  // For priced rounds
  preMoney?: number
  postMoney?: number
  sharePrice?: number
  
  // For SAFE rounds
  valuationCap?: number
  discount?: number // percentage
  hasMFN?: boolean // Most Favored Nation
  
  // ESOP handling
  esopAdjustment?: {
    expand: boolean
    newPoolSize?: number
    isPreMoney?: boolean
  }
  
  // Calculated values
  sharesIssued?: number
  newShares?: number
  
  createdAt: Date
  order: number
}

export interface Scenario {
  id: string
  name: string
  userId?: string
  founders: Founder[]
  rounds: Round[]
  esop: ESOPConfig
  exitValue: number
  shareToken?: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CapTableCalculations {
  totalShares: number
  roundResults: RoundResult[]
  currentOwnership: OwnershipBreakdown[]
  exitDistribution: ExitBreakdown[]
}

export interface RoundResult {
  roundId: string
  preMoney: number
  postMoney: number
  sharePrice: number
  sharesIssued: number
  totalShares: number
  dilution: number // percentage
  ownership: OwnershipBreakdown[]
}

export interface OwnershipBreakdown {
  stakeholderId: string
  stakeholderName: string
  stakeholderType: 'founder' | 'investor' | 'esop'
  shares: number
  percentage: number
}

export interface ExitBreakdown extends OwnershipBreakdown {
  value: number // dollar amount at exit
  preferences?: number // liquidation preferences
  netValue: number // after preferences
}
