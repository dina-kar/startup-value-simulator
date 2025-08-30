# Startup Value Simulator – Product Requirements (Derived from Notion Spec)

This document summarizes and normalizes the requirements captured in the external Notion page ("Startup Value Simulator"). It is paraphrased for clarity and brevity.

## 1. Problem Statement
Founders lack an intuitive, reliable, interactive way to model ownership changes across successive funding rounds (SAFE + priced) and see projected outcomes at exit. Existing spreadsheets are brittle, opaque, and poor at scenario exploration (ESOP top‑ups, secondary sales, SAFE conversions, dilution over time).

## 2. Primary Users
- Founders: understand dilution + eventual cash at exit.
- Employees / Option holders: estimate potential option value across scenarios.
- (Later) Early investors / Angels: quick ownership & exit modeling.

## 3. Goals (Product Outcomes)
1. Rapidly model multiple funding scenarios (1–8 rounds) with clear visibility into evolving ownership and exit proceeds.
2. Instant recalculation (<1s target; stretch <200ms for ≤15 rounds) on input changes.
3. Support heterogeneous round structures (SAFE caps / discounts, priced rounds, ESOP pre/post adjustments, optional founder secondary).
4. Provide transparent math (audit trail) to build trust.
5. Offer actionable visualization: ownership drift & exit distribution.

## 4. Functional Scope
### 4.1 Scenario Setup
- Inputs: number of founders (1–6), initial equity split (% or shares), optional initial ESOP pool.
- Validation: total founders + ESOP must = 100% (or total initial shares). Error on mismatch.

### 4.2 Funding Round Configuration (repeatable)
- Fields per round: name (Pre-Seed / Seed / Series A…), capital raised, valuation (pre or post), round type (SAFE or Priced), ESOP adjustment (create or top‑up; pre- or post‑money basis), optional founder secondary (% or shares sold), SAFE params (cap, discount; choose better of cap PPS vs discounted price when both present), multiple SAFEs convert simultaneously.
- Secondary: transfer of existing founder shares (no new dilution from those shares, but ownership % shifts).

### 4.3 Recalculation Logic
- Trigger (auto or explicit Update) recomputes: post‑round share price, new shares issued (priced rounds), SAFE conversion shares, updated ownership % per stakeholder class, cumulative dilution, ESOP pool %, fully diluted counts.
- Exit simulation: user supplies hypothetical exit value; compute each stakeholder’s cash = ownership% × exit value (no preferences in MVP).

### 4.4 Outputs / Views
- Round Table: round name, valuation (pre/post), capital raised, ownership % before/after, cumulative dilution per founder & class.
- Exit Simulation: final cap table + cash outcomes.
- Charts: (a) ownership % over rounds; (b) exit value distribution; (later) exit waterfall.
- Audit Drawer: per-round math (share price, share counts, formulas, SAFE conversion basis, ESOP adjustment details).

## 5. Non‑Functional Requirements
- Performance: recalculation <1s for ≤10 rounds (stretch: <200ms for ≤15 rounds).
- Accuracy: matches standard VC math (pre/post money, ESOP sizing pre vs post, SAFE cap/discount rules, multi-SAFE conversion ordering). Document rounding strategy.
- Usability: mobile responsive; tooltips for financial concepts; simple defaults with ability to reveal advanced fields.
- Scalability: handle 1–6 founders, up to 8 (goal 10) rounds, multiple ESOP top‑ups.

## 6. Brownie / Optional Enhancements
- Scenario save + shareable link (public token slug).
- Advanced liquidation preferences (1x non‑participating, participating, stack order).
- Scenario comparison (baseline vs variant diff charts).
- CSV / PDF export.
- i18n.

## 7. Technical Stack (Chosen / Suggested)
- Next.js (App Router) + TypeScript.
- State: Zustand (already present) for scenario store; consider derived selectors for computed metrics.
- DB: Supabase (auth + persistence) — fallback localStorage for unauth’d draft.
- UI: MVPBlocks-inspired component primitives (hero, feature grid, forms, audit drawer, charts) + Tailwind.
- Charts: Recharts (present) or upgrade selection if needed for stacked area / waterfall.
- Auth: Supabase Auth (already integrated).
- Testing: Unit (financial engine), component tests; e2e (Playwright) for critical flows (create scenario, add rounds, simulate exit, share link).

## 8. Financial Engine – Acceptance Criteria (MVP)
Support & test at least:
1. Priced round: correct share price = preMoney / preRoundFDShares (or derived) & new shares = investment / price.
2. ESOP math: pool sizing pre-money vs post-money (premoney pool creation dilutes founders only; post-money top-up dilutes all current holders proportionally).
3. SAFE conversion: conversion PPS = min(capPrice, discountedPrice) where discountedPrice = roundPrice × (1 − discount). If only one parameter provided, use that rule. Multiple SAFEs convert at same notional round price; allocate shares for each individually.
4. Secondary sale: founders transfer existing shares; total FD shares unchanged (unless simultaneous new issuance from round).
5. Exit: cash = final FD ownership × exit value (no preferences now).
6. Integrity: total ownership ~ 100% after each round (tolerate small rounding epsilon), no negative shares, documented rounding (e.g., 6 decimal places internal, 2–3 for display).

## 9. Judging / Quality Axes Mapping
- Correctness (math passes tests & edge cases).
- UX & Accessibility (keyboard navigation, ARIA for forms & tables, color contrast).
- Code Quality (modular pure calculation layer, typed domain models, separation of concerns).
- Performance (memoized derived data; avoid unnecessary re-renders; virtualization if needed for long tables).
- Product Thinking (explanatory tooltips, audit transparency, empty / first-time states, guardrails on invalid dilution).
- Polish (theming, animations kept subtle, helpful inline validation messages, copywriting).

## 10. Data Model (Draft)
FoundingShareholder { id, name, initialPercent | initialShares }
Round { id, name, sequence, type: 'SAFE' | 'PRICED', preMoney?, postMoney?, capitalRaised, safe: { cap?, discount? }, esop: { action: 'create' | 'topup' | 'none', targetPercent?, basis: 'pre' | 'post' }, founderSecondary?: { founderId, sharesSold | percentSold }, timestampCreated }
CapTableSnapshot { roundId, totalSharesFD, perHolder[{ holderId, shares, percent }] }
Scenario { id, ownerUserId, title, createdAt, updatedAt, founders[], rounds[], snapshots[], exitValue?, sharedToken? }

## 11. Computation Flow (High-Level)
1. Initialize founders & (optional) ESOP pool.
2. Iterate rounds in order:
   a. If ESOP pre-money top-up: increase ESOP target pre pricing; adjust founder dilution accordingly.
   b. Compute priced round share price OR establish round price for SAFE conversions.
   c. For each SAFE: compute conversion shares at min(cap, discount) pricing rule.
   d. Add priced round new shares (if priced round) & SAFE shares.
   e. Secondary: transfer founder shares (no new shares) – adjust holder distribution.
   f. ESOP post-money adjustment if specified post.
   g. Record snapshot.
3. Exit simulation: multiply final ownership % by exit value.

## 12. UI / UX Requirements
- Layout: left sidebar (scenario + rounds list) / main workspace (forms + tables + charts) / right-side audit drawer (toggle).
- Round editor: inline, multi-step optional advanced accordion.
- Instant feedback: optimistic recompute on field change (debounce 200ms) with saved state indicator.
- Tooltips / help icons for: SAFE cap vs discount, ESOP pre vs post, secondary sale impact.
- Charts: Ownership over time (stacked area), Exit distribution (bar / waterfall simplified), Dilution per founder (line).
- Share: generate slug token; readonly view shows snapshots + exit results.

## 13. Edge Cases to Handle
- 0% ESOP then later create pool (dilution math accurate).
- SAFE with only discount OR only cap OR both (choose beneficial investor PPS).
- Multiple SAFEs with different caps/discounts in same priced round.
- Secondary with > one founder participating (future enhancement; MVP single founder OK—document limitation).
- Rounds with zero capital (pure ESOP top-up administrative round) – ensure stable math.
- Rounding drift across many rounds (apply normalization step to force total = 100%).

## 14. Performance Strategies
- Pure calculation engine functions: input immutable state → derived outputs; memoize per scenario + rounds hash.
- Avoid floating cascades: use integer micro-shares internally (e.g., base = 1e6) then format.
- Batch state updates in store; derive selectors for computed slices.

## 15. Testing Plan (Initial)
Unit (CalculationEngine):
- Single priced round, no ESOP.
- ESOP premoney creation + first priced round.
- SAFE (cap only) converting into priced round.
- SAFE (discount only) converting into priced round.
- SAFE (cap + discount where discount wins; where cap wins).
- Multiple SAFEs simultaneous.
- ESOP top-up post-money.
- Founder secondary sale scenario.
- Exit distribution accuracy.
Component: ScenarioSetupForm validation; RoundConfigForm edge cases; Charts render with mocked data.
E2E: create scenario → add rounds → simulate exit → open audit drawer → share link read-only view.

## 16. Roadmap (Draft Milestones)
M1 Core Engine + Basic UI: scenario setup, 1 priced round, recompute, table.
M2 SAFE support + ESOP pre/post logic + charts (ownership).
M3 Secondary sales + exit simulation + audit drawer.
M4 Persistence (save/share), polishing, accessibility hardening.
M5 Brownie features (compare, export) as stretch.

## 17. Open Questions / Assumptions
- Assumption: No liquidation preferences in MVP (pure pro-rata at exit).
- Assumption: All SAFEs convert in first priced round only (document; future: multiple triggers).
- Question: Should ESOP pool be expressed as target % of post-money in UI when adjusting? (Likely yes; implement toggle).
- Question: Rounding: adopt banker's rounding vs truncation? (Choose round-half-up; log in audit.)

## 18. Future Extensions
- Liquidation preference waterfall modeling.
- Pro-rata rights for existing investors across rounds.
- Option grant modeling & vesting schedule visualization.
- Multiple scenario compare dashboard.
- AI assistant: explain dilution changes in natural language per round.

---
Maintained file: update alongside feature implementation changes.
