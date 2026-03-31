# 🌿 CarbonLens

> **Scan Any Product. Know Its True Cost.**
> The price tag shows dollars. CarbonLens shows what the planet pays.

Built for **Treeline Hacks 2026** — CarbonLens is an AI-powered carbon footprint analyzer that makes the environmental cost of everyday products visible, understandable, and actionable.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [What The Platform Does](#2-what-the-platform-does)
3. [System Overview](#3-system-overview)
4. [System Architecture](#4-system-architecture)
5. [Code Structure & Reproducibility](#5-code-structure--reproducibility)
6. [Core Logic Deep Dive](#6-core-logic-deep-dive)
7. [Architecture Decisions](#7-architecture-decisions)
8. [Performance Optimizations](#8-performance-optimizations)
9. [Setup Instructions](#9-setup-instructions)
10. [API Reference](#10-api-reference)
11. [Known Limitations](#11-known-limitations)
12. [What I'd Improve With More Time](#12-what-id-improve-with-more-time)

---

## 1. Problem Statement

Every product we buy has a hidden cost — one that never appears on the price tag. The carbon emissions embedded in manufacturing a smartphone, shipping a pair of jeans, or producing a cup of coffee are invisible to the average consumer.

**The core problem:**
- Carbon footprint data is locked inside academic LCA (Life Cycle Assessment) studies and industry reports that are inaccessible to the public
- Existing tools are either too technical, too slow, or require manual data entry
- Consumers have no quick, intuitive way to compare the environmental impact of products at the point of decision

**The result:** People make purchasing decisions every day with zero visibility into their planetary cost.

CarbonLens solves this by putting AI-powered carbon analysis in the hands of anyone — instantly, for any product, with no expertise required.

---

## 2. What The Platform Does

CarbonLens is a single-page web application with six core modules:

### 🔍 Product Search & Analysis
Type any product name and get a full carbon report in seconds. The AI analyzes the complete lifecycle — from raw material extraction to end-of-life disposal — and returns a structured breakdown with a letter grade (A–F).

### 📷 Product Scanner
Point your camera at a product or barcode. The AI vision model identifies the product and automatically triggers a carbon analysis. Supports both image capture and UPC/EAN barcode scanning.

### ⚖️ Product Compare
Search two products side-by-side. See their lifecycle emissions compared in a bar chart, identify the greener choice, and understand exactly where the difference comes from.

### ⚡ Scan Your Day
A gamified daily challenge: scan 5 products from your daily routine and get a lifestyle carbon score. Designed to build awareness through habit.

### 📊 Carbon Budget Tracker
Set a monthly carbon budget (50–500 kg CO₂e) and track your scanned products against it. A ring gauge visualizes your usage with color-coded status alerts.

### 🌍 Impact Wall
A community dashboard showing real-time global stats: total emissions uncovered, live feed of recent scans, leaderboard of highest-carbon products, and a trend chart of community activity.

---

## 3. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Search  │  │ Scanner  │  │ Compare  │  │  Impact Wall │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │              │                │           │
│       └──────────────┴──────────────┘                │           │
│                      │                               │           │
│              useProductSearch hook              Realtime Sub     │
│                      │                               │           │
└──────────────────────┼───────────────────────────────┼───────────┘
                       │                               │
                       ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                           │
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │   searches table    │    │      Edge Functions          │   │
│  │  ─────────────────  │    │  ──────────────────────────  │   │
│  │  id (uuid)          │    │  analyze-product             │   │
│  │  product_name       │◄───│  identify-product            │   │
│  │  result (jsonb)     │    └──────────────┬───────────────┘   │
│  │  search_count       │                   │                   │
│  │  created_at         │                   │                   │
│  └─────────────────────┘                   │                   │
└───────────────────────────────────────────┼─────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LOVABLE AI GATEWAY                            │
│                                                                 │
│         Model: google/gemini-3-flash-preview                    │
│         Endpoint: ai.gateway.lovable.dev/v1/chat/completions    │
│                                                                 │
│   ┌─────────────────────┐    ┌──────────────────────────────┐  │
│   │  Carbon Analysis    │    │   Product Identification     │  │
│   │  (text → JSON)      │    │   (image/barcode → name)     │  │
│   └─────────────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

```
User Input
    │
    ▼
Cache Check (Supabase searches table)
    │
    ├── HIT ──► Increment search_count ──► Return cached result
    │
    └── MISS ──► Call analyze-product edge function
                        │
                        ▼
                 Lovable AI Gateway
                 (Gemini 3 Flash)
                        │
                        ▼
                 Parse JSON response
                        │
                        ▼
                 Insert into searches table
                        │
                        ▼
                 Add to localStorage diary
                        │
                        ▼
                 Render CarbonReportCard
```

---

## 4. System Architecture

### Frontend Architecture

```
src/
├── App.tsx                    # Root: QueryClient, Router, Toaster providers
├── pages/
│   └── Index.tsx              # Main SPA shell — 6-view tab router
├── components/
│   ├── SearchBar.tsx          # Fuzzy search input with Fuse.js suggestions
│   ├── ProductScanner.tsx     # Camera + barcode scanning (html5-qrcode)
│   ├── CarbonReportCard.tsx   # Full analysis display (hero, charts, alts)
│   │   ├── GradeBadge.tsx     # A–F letter grade badge
│   │   ├── LifecycleChart.tsx # Horizontal bar chart of lifecycle stages
│   │   ├── EquivalentsGrid.tsx# Driving/trees/water/flight equivalents
│   │   ├── AlternativesSection.tsx # 3 greener alternatives
│   │   └── ShareableCard.tsx  # html2canvas PNG export
│   ├── ProductCompare.tsx     # Side-by-side dual product analysis
│   │   └── ShareableCompareCard.tsx
│   ├── ScanYourDay.tsx        # 5-product daily challenge
│   ├── CarbonDiary.tsx        # localStorage scan history
│   ├── CarbonBudgetTracker.tsx# Monthly budget ring gauge
│   ├── ImpactWall.tsx         # Community dashboard shell
│   │   ├── GlobalStats.tsx    # Total emissions + searches counters
│   │   ├── TrendChart.tsx     # Daily emissions trend (Recharts)
│   │   ├── LiveFeed.tsx       # Real-time recent scans
│   │   └── Leaderboard.tsx    # Top products by CO₂ / search count
│   └── ui/                    # shadcn-ui component library
├── hooks/
│   └── useProductSearch.ts    # Core search logic + cache + diary
├── types/
│   └── carbon.ts              # TypeScript interfaces for all data models
└── integrations/
    └── supabase/
        ├── client.ts          # Supabase client singleton
        └── types.ts           # Auto-generated DB types
```

### Backend Architecture

```
supabase/
├── functions/
│   ├── analyze-product/       # Carbon footprint analysis via AI
│   │   └── index.ts
│   └── identify-product/      # Product ID from image or barcode
│       └── index.ts
└── migrations/
    └── 20260308095223_*.sql   # Initial schema (searches table)
```

### Component Interaction Diagram

```
Index.tsx (view state)
│
├── view="search"
│   ├── SearchBar ──────────────────────────────────────────────┐
│   ├── ProductScanner ─────────────────────────────────────────┤
│   └── CarbonReportCard ◄── useProductSearch hook ◄────────────┘
│           ├── LifecycleChart
│           ├── EquivalentsGrid
│           ├── AlternativesSection
│           └── ShareableCard
│
├── view="compare"
│   └── ProductCompare
│       ├── SearchBar (×2)
│       ├── ProductScanner (×2)
│       ├── GradeBadge (×2)
│       ├── BarChart (Recharts)
│       └── ShareableCompareCard
│
├── view="challenge"
│   └── ScanYourDay
│       └── SearchBar (×5 slots)
│
├── view="budget"
│   └── CarbonBudgetTracker
│       └── RingGauge (SVG)
│
├── view="diary"
│   └── CarbonDiary
│       └── BarChart (Recharts)
│
└── view="impact"
    └── ImpactWall
        ├── GlobalStats
        ├── TrendChart
        ├── LiveFeed ◄── Supabase Realtime subscription
        └── Leaderboard
```

---

## 5. Code Structure & Reproducibility

### Directory Layout

```
carbonlens/
├── .env                       # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── index.html                 # Vite entry point
├── vite.config.ts             # Vite + React SWC config
├── tailwind.config.ts         # Custom theme (grade colors, fonts, glow)
├── tsconfig.json              # TypeScript config
├── components.json            # shadcn-ui config
├── package.json               # Dependencies
├── src/                       # Application source
└── supabase/                  # Backend (edge functions + migrations)
```

### Key Type Definitions

```typescript
// src/types/carbon.ts

interface CarbonLifecycle {
  raw_materials: number;   // kg CO₂e
  manufacturing: number;
  transport: number;
  use_phase: number;
  end_of_life: number;
  // sum === total_co2e_kg (enforced by AI prompt)
}

interface CarbonEquivalents {
  driving_km: number;       // km driven in average car
  trees_year: number;       // trees needed to offset for 1 year
  water_litres: number;     // litres of water equivalent
  flight_percent: number;   // % of London → NYC economy flight (~550kg)
}

interface CarbonAlternative {
  name: string;
  co2e_kg: number;
  reduction_percent: number;
  reason: string;           // one sentence explanation
}

interface CarbonResult {
  product: string;
  category: string;
  total_co2e_kg: number;
  confidence: "high" | "medium" | "low";
  lifecycle: CarbonLifecycle;
  grade: "A" | "B" | "C" | "D" | "F";
  category_average_co2e_kg: number;
  equivalents: CarbonEquivalents;
  key_insight: string;
  alternatives: CarbonAlternative[];
}
```

### Grading Scale

| Grade | CO₂e Range | Meaning |
|-------|-----------|---------|
| A | < 2 kg | Excellent — minimal impact |
| B | 2–10 kg | Good — below average |
| C | 10–50 kg | Average — room to improve |
| D | 50–200 kg | High — significant impact |
| F | > 200 kg | Very high — major emitter |

### Database Schema

```sql
-- supabase/migrations/20260308095223_*.sql

CREATE TABLE searches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  result       JSONB NOT NULL,        -- Full CarbonResult object
  search_count INTEGER DEFAULT 1,    -- How many times this was searched
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Core Logic Deep Dive

### 6.1 Product Search & Caching (`useProductSearch.ts`)

The hook implements a cache-first strategy to minimize AI API calls:

```
search(productName)
       │
       ▼
supabase.from("searches")
  .select("*")
  .ilike("product_name", productName)   ← case-insensitive match
  .limit(1)
  .maybeSingle()
       │
       ├── cached? ──► update search_count + 1
       │               return cached.result
       │               addToDiary(result)
       │
       └── not cached? ──► supabase.functions.invoke("analyze-product")
                                   │
                                   ▼
                           parse CarbonResult
                                   │
                                   ▼
                           supabase.from("searches").insert(...)
                                   │
                                   ▼
                           addToDiary(result)
                                   │
                                   ▼
                           setResult(carbonResult)
```

### 6.2 AI Carbon Analysis (`analyze-product` edge function)

The edge function uses a carefully engineered system prompt to extract structured JSON from the AI:

```
System Prompt enforces:
  ├── Exact JSON schema (no markdown, no code fences)
  ├── lifecycle values must sum to total_co2e_kg
  ├── Exactly 3 alternatives
  ├── Grade thresholds (A<2, B<10, C<50, D<200, F>200)
  ├── flight_percent = % of LDN→NYC economy (~550kg CO₂)
  └── Data sources: IPCC LCA data, academic studies, industry reports

Request flow:
  POST /analyze-product { product_name }
         │
         ▼
  Lovable AI Gateway
  model: google/gemini-3-flash-preview
         │
         ▼
  Strip markdown fences (safety)
         │
         ▼
  JSON.parse(content)
         │
         ▼
  Return CarbonResult
```

### 6.3 Product Identification (`identify-product` edge function)

Handles two input modes:

```
Input: { image_base64 } OR { barcode }
         │
         ├── barcode ──► Text prompt: "Identify product with UPC: {barcode}"
         │               Model returns: { product_name, confidence }
         │
         └── image ───► Vision prompt with base64 image
                        "What product is in this image?"
                        Model returns: { product_name, confidence }
```

### 6.4 Carbon Diary (localStorage)

```typescript
// Diary entry structure
interface DiaryEntry {
  product: string;
  co2e: number;
  grade: string;
  timestamp: number;   // Unix ms
}

// Deduplication: skip if same product scanned within 60 seconds
// Storage key: "carbonlens-diary"
```

### 6.5 Carbon Budget Tracker

```
Monthly budget (default: 100 kg)
         │
         ▼
Filter diary entries for current calendar month
         │
         ▼
Sum all co2e values → monthUsed
         │
         ▼
percentage = (monthUsed / budget) × 100
         │
         ├── < 60%  → status: "safe"    (green)
         ├── 60–80% → status: "warning" (yellow)
         ├── 80–100%→ status: "danger"  (orange)
         └── > 100% → status: "exceeded"(red)
```

### 6.6 Impact Wall — Real-time Updates

```
Component mounts
       │
       ▼
fetchData() — initial load from Supabase
       │
       ▼
supabase.channel("impact-wall")
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "searches"
  }, () => fetchData())
  .subscribe()
       │
       ▼
Any new product scan anywhere in the world
triggers a live update to all Impact Wall viewers
```

### 6.7 Milestone Celebrations

```
useEffect watches totalEmissions
       │
       ▼
currentMilestone = Math.floor(totalEmissions / 1000)
       │
       ├── currentMilestone > prevMilestone?
       │         │
       │         ▼
       │   canvas-confetti burst (green particles, 2 seconds)
       │   + toast: "Community hit X,000 kg CO₂ uncovered!"
       │
       └── update prevMilestone ref
```

---

## 7. Architecture Decisions

### Why Supabase?

Supabase provides three things in one: a PostgreSQL database for caching results, Edge Functions (Deno runtime) for server-side AI calls, and real-time subscriptions for the Impact Wall — all with a generous free tier suitable for a hackathon.

The alternative (a custom Express/Node backend) would require separate hosting, more boilerplate, and no built-in real-time support.

### Why Edge Functions for AI calls?

The `LOVABLE_API_KEY` must never be exposed to the browser. Routing AI requests through Supabase Edge Functions keeps the key server-side while still allowing the frontend to trigger analysis via the Supabase client SDK.

### Why localStorage for the Diary?

The diary is personal and ephemeral — it doesn't need to be synced across devices or persisted server-side. localStorage is zero-latency, requires no auth, and keeps the app functional offline. The tradeoff is data loss on browser clear, which is acceptable for a hackathon scope.

### Why State-based Routing (not URL routing)?

The app uses `useState` for view switching rather than URL-based routes (e.g., `/compare`, `/diary`). This keeps the implementation simple for a single-page hackathon app and avoids the need for URL parameter management. The tradeoff is no deep-linking or browser back/forward navigation between views.

### Why Recharts?

Recharts is React-native, composable, and handles responsive containers well. The lifecycle breakdown and trend charts needed horizontal bar charts and area charts with custom tooltips — Recharts covers all of this with minimal configuration.

### Why Fuse.js for Search Suggestions?

The SearchBar fetches all cached product names from Supabase and runs client-side fuzzy matching with Fuse.js. This avoids a round-trip to the database on every keystroke while still providing relevant suggestions from the community's search history.

### Caching Strategy

```
Every product analysis costs an AI API call.
Caching in Supabase means:

  First search of "iPhone 15":  AI call → store result
  All future searches of "iPhone 15": return cached result instantly

  Benefits:
  ├── Dramatically lower API costs
  ├── Sub-100ms response for cached products
  ├── search_count tracks popularity for the leaderboard
  └── Community builds a shared knowledge base over time
```

---

## 8. Performance Optimizations

### API Call Reduction
- **Cache-first lookup**: Every search checks Supabase before calling the AI. Popular products are served instantly from the database.
- **Case-insensitive matching** (`ilike`): "iphone 15", "iPhone 15", and "IPHONE 15" all hit the same cache entry.

### React Rendering
- `useMemo` in `CarbonBudgetTracker` for month filtering and sum calculations — avoids recomputing on every render
- `useRef` for milestone tracking in Impact Wall — avoids triggering re-renders for internal state
- Animated number counter uses `requestAnimationFrame` with easing, not `setInterval`, for smooth 60fps animation

### Real-time Efficiency
- Impact Wall subscribes only to `INSERT` events on the `searches` table — not all changes
- `fetchData()` is called once on mount and then only when a new insert is detected

### Image Export
- `html2canvas` renders only the shareable card DOM node, not the full page
- Canvas is created off-screen and immediately converted to a blob for download

### Bundle Size
- shadcn-ui components are individually imported (tree-shakeable)
- Recharts is imported per-component (`BarChart`, `AreaChart`) not as a full bundle
- Lucide icons are individually imported

---

## 9. Setup Instructions

### Prerequisites

- Node.js 18+ or Bun
- A Supabase project
- A Lovable AI Gateway API key

### 1. Clone & Install

```bash
git clone <repo-url>
cd carbonlens
npm install
# or
bun install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase Database Setup

Run the migration in your Supabase SQL editor:

```sql
CREATE TABLE searches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  result       JSONB NOT NULL,
  search_count INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set the AI API key secret
supabase secrets set LOVABLE_API_KEY=your-lovable-api-key

# Deploy both functions
supabase functions deploy analyze-product
supabase functions deploy identify-product
```

### 5. Run Locally

```bash
npm run dev
```

Open `http://localhost:5173`

### 6. Build for Production

```bash
npm run build
npm run preview
```

### 7. Run Tests

```bash
npm run test
```

---

## 10. API Reference

### Edge Function: `analyze-product`

**Endpoint:** `POST /functions/v1/analyze-product`

**Request:**
```json
{
  "product_name": "iPhone 15 Pro"
}
```

**Response:**
```json
{
  "product": "iPhone 15 Pro",
  "category": "Smartphones",
  "total_co2e_kg": 65.0,
  "confidence": "high",
  "lifecycle": {
    "raw_materials": 35.0,
    "manufacturing": 18.0,
    "transport": 2.0,
    "use_phase": 8.0,
    "end_of_life": 2.0
  },
  "grade": "D",
  "category_average_co2e_kg": 70.0,
  "equivalents": {
    "driving_km": 325,
    "trees_year": 3,
    "water_litres": 45000,
    "flight_percent": 11.8
  },
  "key_insight": "Raw material extraction, particularly rare earth mining for the chip and display, accounts for over half of total emissions.",
  "alternatives": [
    {
      "name": "Fairphone 5",
      "co2e_kg": 32.0,
      "reduction_percent": 51,
      "reason": "Modular design extends lifespan and uses conflict-free, recycled materials."
    }
  ]
}
```

**Error Responses:**

| Status | Meaning |
|--------|---------|
| 400 | `product_name` missing |
| 402 | AI usage credits exhausted |
| 429 | Rate limited — retry after a moment |
| 500 | Internal error |

---

### Edge Function: `identify-product`

**Endpoint:** `POST /functions/v1/identify-product`

**Request (image):**
```json
{
  "image_base64": "<base64-encoded-jpeg>"
}
```

**Request (barcode):**
```json
{
  "barcode": "012345678901"
}
```

**Response:**
```json
{
  "product_name": "Coca-Cola Classic 330ml Can",
  "confidence": "high"
}
```

---

### Supabase Table: `searches`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `product_name` | TEXT | Canonical product name |
| `result` | JSONB | Full `CarbonResult` object |
| `search_count` | INTEGER | Times this product was searched |
| `created_at` | TIMESTAMPTZ | First search timestamp |

---

## 11. Known Limitations

### AI Accuracy
- Carbon data is AI-generated based on IPCC LCA studies and industry reports, not real-time verified databases. Results should be treated as estimates, not certified measurements.
- Confidence levels (`high`/`medium`/`low`) are self-reported by the model and may not always reflect true accuracy.
- Niche or obscure products may receive `low` confidence estimates with higher uncertainty.

### Caching Granularity
- Cache lookup uses case-insensitive string matching (`ilike`). "iPhone 15 Pro Max" and "iPhone 15 Pro" will be treated as different products even though they share most lifecycle data.
- No versioning of cached results — if the AI model improves, old cached data won't be refreshed.

### Local Storage Diary
- The Carbon Diary is stored in `localStorage` and is browser/device specific. Clearing browser data wipes the diary.
- No cross-device sync — a user's diary on mobile won't appear on desktop.

### No User Authentication
- The app is fully anonymous. There's no concept of user accounts, so the Carbon Budget and Diary can't be tied to an identity.
- The Impact Wall shows community-wide data with no way to filter by user.

### Barcode Coverage
- Barcode identification relies on the AI model's training data knowledge of UPC/EAN databases. Uncommon or regional products may not be identified correctly.

### Rate Limiting
- The Lovable AI Gateway enforces rate limits. Under heavy concurrent usage, users may see 429 errors.

---

## 12. What I'd Improve With More Time

### Verified Carbon Database
Replace AI-only estimates with a hybrid approach: first query a verified LCA database (e.g., ecoinvent, OpenLCA) and fall back to AI only for products not found. This would dramatically improve accuracy and allow confidence levels to be data-backed.

### User Accounts & Sync
Add Supabase Auth so users can sign in and have their Diary and Budget synced across devices. This would also enable personalized leaderboards and social sharing of personal carbon profiles.

### Smarter Cache Invalidation
Add a `model_version` field to cached results and a background job to re-analyze stale entries when the AI model is updated. Currently, cached data never expires.

### Barcode → Product Database
Integrate a real UPC/EAN database API (e.g., Open Food Facts, Barcode Lookup) before falling back to AI identification. This would give near-perfect accuracy for consumer packaged goods.

### Offline Support
Add a Service Worker and cache the most-searched products locally. The app currently requires a network connection for every new product analysis.

### Carbon Trend Notifications
Push notifications (via Web Push API) when a user is approaching their monthly carbon budget, or when a product they've scanned gets a data update.

### Expanded Equivalents
Add more relatable equivalents: cups of coffee produced, smartphone charges, hours of Netflix streaming — metrics that resonate with different audiences.

### Lifecycle Source Citations
Show the specific studies or data sources behind each lifecycle stage estimate, making the data auditable and building user trust.

---

<p align="center">
  Built with 🌿 for <strong>Treeline Hacks 2026</strong>
  <br/>
  <em>Making the invisible cost of consumption visible.</em>
</p>
