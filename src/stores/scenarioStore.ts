/**
 * DEPRECATED FILE
 * ---------------------------------------------
 * The scenario store has moved to '@/lib/stores/scenarioStore'.
 * This stub remains only to keep any stale imports from breaking.
 * Please update imports to: '@/lib/stores/scenarioStore'
 */

export { useScenarioStore } from '@/lib/stores/scenarioStore'

// Dev-time warning to surface lingering legacy import paths
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.warn('[DEPRECATED] Import path "src/stores/scenarioStore" is deprecated. Use "@/lib/stores/scenarioStore" instead.')
}

