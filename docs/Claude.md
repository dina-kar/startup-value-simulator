# Startup Value Simulator - Development Plan

## Project Overview
Build a responsive, production-grade Scenario Builder that lets founders model cap tables across funding rounds and instantly see how much each founder would make at exit.

## Tech Stack
- **Framework**: Next.js 15 + with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Supabase Auth with roles founder and employee
- **ShadCN/UI Tables**: Pre-built table components with TanStack integration
- **State Management**: Zustand
- **Validation**: Zod
- **Database**: Supabase
- **Charts**: Recharts (via shadcn/ui)
- **Testing**: Vitest + Playwright
- **Deployment**: Vercel

---

## Pages & Routes Structure

### 1. **Landing/Home Page** (`/`)
- **Purpose**: Marketing page explaining the tool
- **Components**: Hero section, feature highlights, CTA to get started
- **Key Features**: 
  - Value proposition explanation
  - Sample scenarios showcase
  - User testimonials/social proof

### 2. **Scenario Builder Page** (`/builder` or `/scenario/[id]`)
- **Purpose**: Main application interface
- **Layout**: Single-page app with multiple sections
- **Key Features**:
  - Scenario setup form
  - Funding rounds configuration
  - Real-time calculations
  - Charts and tables
  - Save/share functionality

### 3. **Scenario Dashboard** (`/scenarios`)
- **Purpose**: List and manage saved scenarios
- **Features**:
  - Grid/list view of scenarios
  - Quick preview cards
  - Delete/duplicate actions
  - Search and filter

### 4. **Shared Scenario View** (`/share/[token]`)
- **Purpose**: View-only shared scenarios
- **Features**:
  - Read-only scenario display
  - All charts and calculations
  - Option to clone scenario

---

## Core Components Architecture

### 📊 **Data Visualization Components**

#### 1. **OwnershipChart** 
- **shadcn Component**: `line-chart-01`
- **Purpose**: Shows ownership % changes over rounds
- **Props**: `rounds[]`, `stakeholders[]`, `activeStakeholder?`
- **Features**: Interactive legend, hover tooltips, time series

#### 2. **ExitWaterfallChart**
- **shadcn Component**: `pie-chart-01` or `bar-chart-01`
- **Purpose**: Shows exit value distribution
- **Props**: `exitValue`, `stakeholders[]`, `preferences?`
- **Features**: Percentage and dollar amounts, color coding

#### 3. **CapTableTable**
- **shadcn Component**: `ShadCN/UI Tables`
- **Purpose**: Round-by-round breakdown table
- **Props**: `rounds[]`, `showDilution?`, `showValuation?`
- **Features**: Sortable columns, expandable rows, export functionality

### 🛠️ **Input & Form Components**

#### 4. **ScenarioSetupForm**
- **shadcn Components**: `combobox`, form inputs, validation
- **Purpose**: Initial founder and ESOP setup
- **Props**: `onSubmit`, `initialData?`
- **Validation**: Equity must sum to 100%, founder limits (1-6)

#### 5. **RoundConfigForm**
- **shadcn Components**: `tabs`, `combobox`, form inputs
- **Purpose**: Add/edit funding rounds
- **Props**: `roundData?`, `onSave`, `onCancel`
- **Features**: Round type selection (SAFE/Priced), ESOP configuration

#### 6. **FounderInput**
- **shadcn Components**: Input fields, validation
- **Purpose**: Individual founder equity input
- **Props**: `founder`, `onChange`, `onRemove?`
- **Features**: Name, email, initial equity %, validation

#### 7. **ESOPConfigPanel**
- **shadcn Components**: `tabs`, toggle switches
- **Purpose**: ESOP pool configuration
- **Props**: `esopData`, `onChange`, `roundType`
- **Features**: Pre/post money toggle, percentage input

### 🎛️ **Control & Navigation Components**

#### 8. **ScenarioTabs**
- **shadcn Component**: `tabs`
- **Purpose**: Switch between setup, rounds, results views
- **Props**: `activeTab`, `onTabChange`, `completedSteps[]`
- **Features**: Progress indicators, validation states

#### 9. **RoundsList**
- **shadcn Components**: List items, action buttons
- **Purpose**: Manage funding rounds
- **Props**: `rounds[]`, `onEdit`, `onDelete`, `onReorder`
- **Features**: Drag & drop reordering, quick actions

#### 10. **ExitSimulator**
- **shadcn Components**: Input slider, cards
- **Purpose**: Exit value input and calculations
- **Props**: `currentValuation`, `onExitValueChange`
- **Features**: Slider input, preset values, real-time updates

### 📱 **Layout & UI Components**

#### 11. **AppHeader**
- **shadcn Component**: `navbar-01` style
- **Purpose**: Main navigation and actions
- **Props**: `scenarioName?`, `onSave`, `onShare`
- **Features**: Logo, scenario name, save/share buttons, user menu

#### 12. **SidebarNavigation**
- **shadcn Components**: Navigation menu
- **Purpose**: Section navigation within builder
- **Props**: `currentSection`, `onSectionChange`, `completedSections[]`
- **Features**: Progress tracking, section validation

#### 13. **AuditDrawer**
- **shadcn Components**: Drawer/modal, code blocks
- **Purpose**: Show calculation details and formulas
- **Props**: `roundData`, `calculations`
- **Features**: Step-by-step math, formula explanations

#### 14. **ShareModal**
- **shadcn Components**: Modal, copy button, QR code
- **Purpose**: Share scenario functionality
- **Props**: `shareUrl`, `onClose`
- **Features**: Link generation, QR code, access settings

### 🧮 **Financial Engine Components**

#### 15. **CalculationEngine**
- **Purpose**: Core financial calculations
- **Features**: 
  - Priced round math (pre/post money)
  - SAFE conversions (cap, discount, MFN)
  - ESOP pool calculations
  - Dilution tracking
  - Exit value distribution

#### 16. **ValidationEngine**
- **Purpose**: Data validation and error checking
- **Features**:
  - Equity sum validation (100%)
  - Positive number constraints
  - Round order validation
  - Cap table integrity checks

---

## State Management (Zustand Stores)

### 1. **ScenarioStore**
```typescript
interface ScenarioState {
  scenario: Scenario | null
  founders: Founder[]
  rounds: Round[]
  esop: ESOPConfig
  exitValue: number
  calculations: CapTableCalculations
  
  // Actions
  setScenario: (scenario: Scenario) => void
  addFounder: (founder: Founder) => void
  updateFounder: (id: string, updates: Partial<Founder>) => void
  removeFounder: (id: string) => void
  addRound: (round: Round) => void
  updateRound: (id: string, updates: Partial<Round>) => void
  removeRound: (id: string) => void
  setExitValue: (value: number) => void
  recalculate: () => void
}
```

### 2. **UIStore**
```typescript
interface UIState {
  activeTab: string
  sidebarOpen: boolean
  auditDrawerOpen: boolean
  shareModalOpen: boolean
  
  // Actions
  setActiveTab: (tab: string) => void
  toggleSidebar: () => void
  toggleAuditDrawer: () => void
  toggleShareModal: () => void
}
```

---

## Database Schema (Supabase)

### Tables

#### 1. **scenarios**
```sql
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  data JSONB NOT NULL, -- Complete scenario data
  share_token VARCHAR(255) UNIQUE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. **shared_links**
```sql
CREATE TABLE shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Tasks

### Phase 1: Foundation & Setup (Week 1)
- [ ] **T1.1**: Initialize Next.js project with TypeScript
- [ ] **T1.2**: Set up Tailwind CSS and shadcn/ui
- [ ] **T1.3**: Configure Supabase database and auth
- [ ] **T1.4**: Set up Zustand stores structure
- [ ] **T1.5**: Create basic routing and layout
- [ ] **T1.6**: Set up testing environment (Vitest + Playwright)

### Phase 2: Core Financial Engine (Week 1-2)
- [ ] **T2.1**: Implement `CalculationEngine` class
  - [ ] Basic equity math (shares, percentages)
  - [ ] Priced round calculations
  - [ ] ESOP pool math (pre/post money)
- [ ] **T2.2**: Implement SAFE conversion logic
  - [ ] Valuation cap calculations
  - [ ] Discount calculations
  - [ ] MFN (Most Favored Nation) handling
- [ ] **T2.3**: Build validation engine with Zod schemas
- [ ] **T2.4**: Create comprehensive unit tests for all calculations
- [ ] **T2.5**: Handle edge cases and error scenarios

### Phase 3: Data Components & State (Week 2)
- [x] **T3.1**: Build `ScenarioStore` with Zustand
- [x] **T3.2**: Implement `UIStore` for interface state
- [x] **T3.3**: Create TypeScript interfaces and types
- [x] **T3.4**: Set up data persistence with Supabase
- [x] **T3.5**: Implement auto-save functionality

### Phase 4: Input Forms & Validation (Week 2-3)
- [ ] **T4.1**: Create `ScenarioSetupForm` component
  - [ ] Founder input with dynamic add/remove
  - [ ] Initial equity split validation
  - [ ] ESOP pool setup
- [ ] **T4.2**: Build `RoundConfigForm` component
  - [ ] Round type selection (SAFE vs Priced)
  - [ ] Valuation and capital inputs
  - [ ] ESOP adjustment options
- [ ] **T4.3**: Implement `FounderInput` component
- [ ] **T4.4**: Create `ESOPConfigPanel` component
- [ ] **T4.5**: Add real-time validation and error handling

### Phase 5: Visualization Components (Week 3)
- [ ] **T5.1**: Build `CapTableTable` with shadcn table
  - [ ] Round-by-round data display
  - [ ] Sortable columns
  - [ ] Responsive design
- [ ] **T5.2**: Create `OwnershipChart` with line chart
  - [ ] Multi-stakeholder ownership tracking
  - [ ] Interactive legends
  - [ ] Responsive chart sizing
- [ ] **T5.3**: Implement `ExitWaterfallChart`
  - [ ] Pie chart for ownership distribution
  - [ ] Dollar amount calculations
  - [ ] Color coding by stakeholder
- [ ] **T5.4**: Add chart animations and interactions

### Phase 6: Main Interface & UX (Week 3-4)
- [ ] **T6.1**: Create main scenario builder layout
- [ ] **T6.2**: Implement `ScenarioTabs` navigation
- [ ] **T6.3**: Build `RoundsList` management interface
- [ ] **T6.4**: Create `ExitSimulator` component
- [ ] **T6.5**: Add `AuditDrawer` for calculation transparency
- [ ] **T6.6**: Implement responsive design for mobile

### Phase 7: Advanced Features (Week 4)
- [ ] **T7.1**: Build scenario save/load functionality
- [ ] **T7.2**: Implement `ShareModal` and link generation
- [ ] **T7.3**: Create scenario dashboard page
- [ ] **T7.4**: Add scenario duplication feature
- [ ] **T7.5**: Implement CSV/PDF export functionality

### Phase 8: Polish & Performance (Week 4-5)
- [ ] **T8.1**: Add loading states and error boundaries
- [ ] **T8.2**: Implement optimistic updates
- [ ] **T8.3**: Add keyboard navigation support
- [ ] **T8.4**: Create tooltips and help text
- [ ] **T8.5**: Performance optimization (memoization, lazy loading)
- [ ] **T8.6**: Add dark mode support with theme switcher

### Phase 9: Testing & QA (Week 5)
- [ ] **T9.1**: Write comprehensive component tests
- [ ] **T9.2**: Create E2E test scenarios with Playwright
- [ ] **T9.3**: Test calculation accuracy against known scenarios
- [ ] **T9.4**: Performance testing (target <200ms recalculations)
- [ ] **T9.5**: Cross-browser and mobile testing
- [ ] **T9.6**: Accessibility audit and fixes

### Phase 10: Deployment & Launch (Week 5-6)
- [ ] **T10.1**: Set up Vercel deployment pipeline
- [ ] **T10.2**: Configure environment variables and secrets
- [ ] **T10.3**: Set up error monitoring (Sentry)
- [ ] **T10.4**: Create documentation and user guides
- [ ] **T10.5**: Final testing in production environment
- [ ] **T10.6**: Launch and monitor initial usage

---

## File Structure

```
src/
├── app/                          # Next.js app router
│   ├── page.tsx                  # Landing page
│   ├── builder/
│   │   └── page.tsx              # Scenario builder
│   ├── scenarios/
│   │   └── page.tsx              # Scenario dashboard
│   └── share/
│       └── [token]/
│           └── page.tsx          # Shared scenario view
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   │   ├── ScenarioSetupForm.tsx
│   │   ├── RoundConfigForm.tsx
│   │   ├── FounderInput.tsx
│   │   └── ESOPConfigPanel.tsx
│   ├── charts/                   # Visualization components
│   │   ├── OwnershipChart.tsx
│   │   ├── ExitWaterfallChart.tsx
│   │   └── CapTableTable.tsx
│   ├── layout/                   # Layout components
│   │   ├── AppHeader.tsx
│   │   ├── SidebarNavigation.tsx
│   │   └── ScenarioTabs.tsx
│   └── modals/                   # Modal components
│       ├── AuditDrawer.tsx
│       └── ShareModal.tsx
├── lib/
│   ├── financial/                # Financial calculations
│   │   ├── CalculationEngine.ts
│   │   ├── SafeConversion.ts
│   │   └── ValidationEngine.ts
│   ├── stores/                   # Zustand stores
│   │   ├── scenarioStore.ts
│   │   └── uiStore.ts
│   ├── database/                 # Supabase utilities
│   │   ├── supabase.ts
│   │   └── queries.ts
│   └── utils/                    # Utility functions
│       ├── formatting.ts
│       └── validation.ts
├── types/                        # TypeScript type definitions
│   ├── scenario.ts
│   ├── round.ts
│   └── founder.ts
└── tests/                        # Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## Key shadcn/ui Components Mapping

| Feature | shadcn Component | Purpose |
|---------|------------------|---------|
| Cap Table | `table` | Round-by-round data display |
| Ownership Charts | `line-chart-01` | Ownership % over time |
| Exit Distribution | `pie-chart-01` | Exit value breakdown |
| Navigation | `tabs` | Section switching |
| Round Type Selection | `combobox` | SAFE vs Priced selection |
| Founder Management | `combobox` | Add/edit founders |
| Audit View | `table` + `code-block` | Calculation transparency |
| Share Feature | `copy-button` | Link sharing |
| Theme Toggle | `theme-toggle-button` | Dark/light mode |
| Navigation Bar | `navbar-01` | Main app navigation |
| Form Validation | Built-in validation | Real-time feedback |

---

## Success Metrics

### Performance Targets
- [ ] Recalculations complete in <200ms for ≤15 rounds
- [ ] Initial page load <2 seconds
- [ ] Mobile-first responsive design
- [ ] 95+ Lighthouse performance score

### User Experience Goals
- [ ] Intuitive founder onboarding flow
- [ ] Clear visual feedback for all actions
- [ ] Comprehensive error handling
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility

### Business Requirements
- [ ] Support 1-6 founders
- [ ] Handle up to 15 funding rounds
- [ ] Accurate financial calculations (unit tested)
- [ ] Scenario save/share functionality
- [ ] Export capabilities (CSV/PDF)

This development plan provides a comprehensive roadmap for building the Startup Value Simulator with clear tasks, component architecture, and shadcn/ui integration.
