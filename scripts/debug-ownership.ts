import { CalculationEngine } from './src/lib/financial/CalculationEngine'

// Test scenario: Alice 60%, Bob 25%, ESOP 15%
const scenario = {
  id: 'test',
  name: 'Test',
  founders: [
    {
      id: 'founder-1',
      name: 'Alice',
      email: 'alice@startup.com',
      initialEquity: 60,
      currentEquity: 60,
      shares: 0,
      role: 'CEO'
    },
    {
      id: 'founder-2', 
      name: 'Bob',
      email: 'bob@startup.com',
      initialEquity: 25,
      currentEquity: 25,
      shares: 0,
      role: 'CTO'
    }
  ],
  rounds: [
    {
      id: 'series-a',
      name: 'Series A',
      type: 'Priced' as const,
      amount: 5000000, // $5M investment
      preMoney: 20000000, // $20M pre-money
      order: 1,
      createdAt: new Date()
    }
  ],
  esop: {
    poolSize: 15,
    isPreMoney: true,
    currentSize: 15,
    allocated: 0,
    available: 15
  },
  exitValue: 100000000,
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date()
}

const engine = new CalculationEngine(scenario)
const result = engine.calculateCapTable()

console.log('Round Result:', result.roundResults[0])
console.log('\nOwnership Breakdown:')
for (const owner of result.roundResults[0].ownership) {
  console.log(`${owner.stakeholderName}: ${owner.percentage.toFixed(2)}% (${owner.shares.toFixed(0)} shares)`)
}

console.log('\nTotal shares:', result.roundResults[0].totalShares)
console.log('Share price:', result.roundResults[0].sharePrice)
console.log('New shares issued:', result.roundResults[0].sharesIssued)

// Expected math:
// Initial: 10M shares
// Series A: $20M pre-money / 10M shares = $2/share
// Investment: $5M / $2 = 2.5M new shares
// Total: 12.5M shares
// Alice should have: 60% of 10M = 6M shares = 48% of 12.5M
// Bob should have: 25% of 10M = 2.5M shares = 20% of 12.5M
// ESOP should have: 15% of 10M = 1.5M shares = 12% of 12.5M
// Investor should have: 2.5M shares = 20% of 12.5M
