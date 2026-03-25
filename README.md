<p align="center">
  <img src="./banner.png" alt="Pedestal Banner" width="100%" />
</p>

<h1 align="center">🏛️ Pedestal</h1>

<p align="center">
  <strong>Gen-Z Fintech Micro-Learning Platform — Reinforced Learning Stack</strong><br/>
  Learn investing. Build wealth. Level up — one micro-lesson at a time.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-6C63FF?style=for-the-badge" />
  <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android-black?style=for-the-badge&logo=expo" />
  <img src="https://img.shields.io/badge/backend-FastAPI%202.0-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/database-Supabase-3ECF8E?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/auth-Firebase%20%2B%20Supabase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/react_native-0.81-61DAFB?style=for-the-badge&logo=react" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Adaptive Learning Engine](#-adaptive-learning-engine)
- [Energy Economy System](#-energy-economy-system)
- [Database Schema](#-database-schema)
- [User Flow & Navigation](#-user-flow--navigation)
- [UI/UX Design Philosophy](#-uiux-design-philosophy)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Build & Deployment](#-build--deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Pedestal** is a gamified, adaptive micro-learning platform that makes financial education engaging, interactive, and personalized for Gen-Z learners. Built on a proprietary **Reinforced Learning Stack (RLS)**, Pedestal dynamically adjusts learning paths based on real-time performance — combining concept flip cards, virtual paper trading, adaptive quizzes, an energy economy, streaks, and global leaderboards into a cohesive learning experience.

The platform bridges the gap between "wanting to learn about money" and "actually understanding investing" by turning complex financial concepts into bite-sized, swipeable, gamified micro-lessons that feel like a game, not a textbook.

### 🎯 Core Vision
> *"Financial literacy shouldn't require a finance degree. It should feel as natural as scrolling through your feed."*

Pedestal distills complex financial topics — stocks, crypto, budgeting, risk management — into 60-second micro-lessons with immediate reinforcement through quizzes and flashcards, all driven by an AI-powered adaptive engine that meets each learner exactly where they are.

---

## 🔥 Problem Statement

```mermaid
graph LR
    A["🎓 Traditional Finance Education"] -->|Boring, Long, Abstract| B["😴 Low Engagement"]
    B --> C["❌ Knowledge Gap"]
    
    D["📱 Pedestal Approach"] -->|Gamified, Bite-sized, Adaptive| E["🎮 High Engagement"]
    E --> F["✅ Financial Literacy"]
    
    style A fill:#FECACA,stroke:#EF4444,color:#111
    style B fill:#FECACA,stroke:#EF4444,color:#111
    style C fill:#FECACA,stroke:#EF4444,color:#111
    style D fill:#BBF7D0,stroke:#22C55E,color:#111
    style E fill:#BBF7D0,stroke:#22C55E,color:#111
    style F fill:#BBF7D0,stroke:#22C55E,color:#111
```

| Traditional Approach | Pedestal Approach |
|---|---|
| 45-minute lectures | 60-second micro-lessons |
| Static PDFs | Interactive flip cards & videos |
| One-size-fits-all | AI-adaptive difficulty scaling |
| No feedback loop | Real-time quizzes + reinforcement queue |
| Theory only | Virtual paper trading with ₹1,00,000 |
| Isolated learning | Global leaderboards & streaks |

---

## ✨ Key Features

### 🎴 Concept Flip Cards
Swipeable, interactive cards that teach one financial concept at a time. Tap to flip — "The Term" on the front, the explanation on the back. Designed for micro-moment learning during commutes, breaks, or downtime.

### 📊 Virtual Paper Trading
Every user starts with a virtual ₹1,00,000 portfolio. Buy, sell, and short-sell stocks in a risk-free simulation powered by real-time market data. Track your P&L, view holdings, and learn from your trading history.

### 🤖 Adaptive Learning Engine
An AI-powered engine that evaluates quiz performance and dynamically adjusts:
- **Difficulty level** (1–10 scale)
- **Adaptive scores** across 4 dimensions (Risk, Discipline, Knowledge, Stability)
- **Reinforcement queue** (remedial lessons + flashcard reviews)
- **Next lesson path** based on mastery

### ⚡ Energy Economy (Lightning Bolts)
A balanced energy system that paces learning to prevent burnout while encouraging daily returns:
- 100 max energy with time-based regeneration
- Lessons cost energy to start
- Energy regenerates at 5 points every 30 minutes

### 🏆 Leaderboards & Streaks
Compete globally. Maintain daily streaks. Earn XP to level up. The gamification layer keeps users coming back.

### 🗺️ Learning Roadmap
A visual, Duolingo-inspired skill tree with branching learning paths. Nodes unlock sequentially, showing locked, current, and completed states.

### 📝 Adaptive Quizzes
Context-aware quizzes that evaluate understanding after each lesson. Performance directly feeds into the adaptive engine to customize future content.

### 🔔 Push Notifications
Firebase Cloud Messaging (FCM) delivers streak reminders, achievement unlocks, and lesson recommendations directly to the device.

---

## 🏛️ System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph Client ["📱 Mobile App (React Native + Expo)"]
        UI["UI Layer<br/>Expo Router"]
        State["State Layer<br/>Context API"]
        Auth["Auth Layer<br/>Supabase + Google OAuth"]
    end

    subgraph Backend ["⚙️ Backend (FastAPI)"]
        API["REST API<br/>FastAPI v0.111"]
        Services["Service Layer<br/>Business Logic"]
        Adaptive["Adaptive Engine<br/>Reinforced Learning Stack"]
        Energy["Energy Service<br/>Lightning Bolts"]
    end

    subgraph Data ["🗄️ Data Layer"]
        Supabase["Supabase<br/>PostgreSQL + Auth + RLS"]
        Firebase["Firebase<br/>FCM Push Notifications"]
    end

    UI --> State
    State --> Auth
    Auth -->|JWT| API
    API --> Services
    Services --> Adaptive
    Services --> Energy
    Services -->|Read/Write| Supabase
    Auth -->|Google OAuth| Supabase
    Client -->|FCM Token| Firebase
    Firebase -->|Push| Client

    style Client fill:#EDE9FE,stroke:#8B5CF6,color:#111
    style Backend fill:#DBEAFE,stroke:#3B82F6,color:#111
    style Data fill:#D1FAE5,stroke:#10B981,color:#111
```

### Request Lifecycle

```mermaid
sequenceDiagram
    participant User as 📱 User
    participant App as React Native App
    participant Auth as Supabase Auth
    participant API as FastAPI Backend
    participant DB as PostgreSQL (Supabase)
    participant FCM as Firebase FCM

    User->>App: Opens Pedestal
    App->>Auth: getSession()
    Auth-->>App: JWT Token + User Profile
    
    Note over App: Checks onboarding_completed flag

    User->>App: Starts a Lesson
    App->>API: POST /api/energy/consume
    API->>DB: Check & deduct energy
    DB-->>API: Energy status
    API-->>App: ⚡ Energy consumed
    
    App->>API: GET /api/lessons/{id}
    API->>DB: Fetch lesson + blocks
    DB-->>API: Lesson content (video, text, flashcards)
    API-->>App: Lesson payload
    
    User->>App: Completes Quiz
    App->>API: POST /api/quiz/submit
    API->>DB: Store quiz attempt
    API->>API: Adaptive Engine evaluates
    
    alt Score >= 80%
        API->>DB: ⬆️ Increase difficulty + scores
        API-->>App: 🎉 Advance to next lesson
    else Score <= 50%
        API->>DB: ⬇️ Queue remedial + flashcards
        API-->>App: 📚 Remedial lesson assigned
    else 50% < Score < 80%
        API->>DB: Maintain difficulty
        API-->>App: Continue at current level
    end

    API->>DB: Update XP, streak, progress
    API-->>App: Updated user profile
    App->>FCM: Update streak notification schedule
```

---

## 🧠 Adaptive Learning Engine

The heart of Pedestal is the **Reinforced Learning Stack (RLS)** — an adaptive engine that personalizes each learner's path in real-time.

### How It Works

```mermaid
flowchart TD
    A["📝 User Completes Quiz"] --> B{"Score Analysis"}
    
    B -->|"≥ 80%"| C["✅ ADVANCE"]
    B -->|"50% – 79%"| D["⚠️ MAINTAIN"]
    B -->|"≤ 50%"| E["❌ REMEDIATE"]
    
    C --> C1["⬆️ Difficulty +1"]
    C --> C2["📈 All scores +5"]
    C --> C3["🎓 Knowledge +7.5"]
    C --> C4["➡️ Next advanced lesson"]
    
    D --> D1["➡️ Same difficulty"]
    D --> D2["📈 Knowledge +2.5"]
    D --> D3["📖 Next lesson at level"]
    
    E --> E1["⬇️ Difficulty -1"]
    E --> E2["📉 All scores -3"]
    E --> E3["📚 Remedial lesson queued"]
    E --> E4["🎴 Flashcards queued"]
    E --> E5["📉 Knowledge -4.5"]
    
    C1 & C2 & C3 & C4 --> F["👤 Updated User Profile"]
    D1 & D2 & D3 --> F
    E1 & E2 & E3 & E4 & E5 --> F
    
    F --> G["🔄 Next Session"]
    G --> A

    style C fill:#BBF7D0,stroke:#22C55E,color:#111
    style D fill:#FEF3C7,stroke:#F59E0B,color:#111
    style E fill:#FECACA,stroke:#EF4444,color:#111
```

### Adaptive Score Dimensions

Each user has 4 continuously-updating adaptive scores (0–100):

```mermaid
quadrantChart
    title Learner Profile Dimensions
    x-axis Low Risk Awareness --> High Risk Awareness
    y-axis Low Knowledge --> High Knowledge
    quadrant-1 "Expert Investor"
    quadrant-2 "Cautious Learner"
    quadrant-3 "Beginner"
    quadrant-4 "Risk-Tolerant Novice"
```

| Score | What It Measures | Affects |
|---|---|---|
| 🎯 **Risk Score** | Understanding of risk/reward concepts | Portfolio lesson difficulty |
| 📏 **Discipline Score** | Consistency and habit formation | Streak bonus multipliers |
| 📚 **Knowledge Score** | Overall financial literacy | Lesson content difficulty |
| ⚖️ **Stability Score** | Emotional decision-making patterns | Trading simulation complexity |

### Reinforcement Queue Priority System

```
Remedial Lessons   → Priority 10 (highest)
Flashcard Reviews  → Priority  5 (medium)
Spaced Repetition  → Priority  3 (lowest)
```

The engine always checks the reinforcement queue before recommending a new lesson. Unfinished remedial content takes absolute priority.

---

## ⚡ Energy Economy System

The **Lightning Bolts** energy system balances engagement with healthy learning pacing.

```mermaid
stateDiagram-v2
    [*] --> Full: User registers (100⚡)
    Full --> Depleting: Start lesson (-10⚡)
    Depleting --> Depleting: More lessons
    Depleting --> Empty: Energy hits 0
    Empty --> Regenerating: Wait 30 min (+5⚡)
    Regenerating --> Regenerating: Every 30 min (+5⚡)
    Regenerating --> Full: Reaches 100⚡
    Full --> Depleting: Start lesson

    note right of Regenerating
        Lazy regeneration:
        Calculated on-demand,
        not via cron jobs
    end note
```

| Parameter | Value | Purpose |
|---|---|---|
| Max Energy | 100 ⚡ | Allows ~10 lessons per cycle |
| Lesson Cost | 10 ⚡ | Balanced pacing |
| Regen Rate | 5 ⚡ / interval | Gradual recovery |
| Regen Interval | 30 minutes | Encourages daily return |
| Time to Full | ~10 hours | Prevents all-day binging |
| Minimum to Start | 1 ⚡ | Must have some energy |

> **Design Decision:** Energy is calculated **lazily** on each API request — no background cron jobs. The backend computes elapsed time since `last_updated`, calculates regenerated energy, and persists the result. This is infinitely scalable and eliminates timer infrastructure.

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    USER_PROFILES {
        uuid id PK
        uuid auth_uid UK
        text display_name
        text email
        int xp_total
        int level
        int streak_days
        float risk_score
        float discipline_score
        float knowledge_score
        float stability_score
        bool onboarding_completed
        uuid assigned_track_id FK
        int current_difficulty_level
    }

    TRACKS {
        uuid id PK
        text title
        text category
        int difficulty
        int order_index
        bool is_active
    }

    LESSONS {
        uuid id PK
        uuid track_id FK
        text title
        int difficulty_level
        int energy_cost
        int xp_reward
        int order_index
        bool is_remedial
        bool has_video
    }

    LESSON_BLOCKS {
        uuid id PK
        uuid lesson_id FK
        text block_type
        int order_index
        jsonb content
    }

    USER_PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid lesson_id FK
        bool is_completed
        float quiz_score
        int attempts
        float best_score
        int xp_earned
    }

    USER_ENERGY {
        uuid id PK
        uuid user_id FK
        int current_energy
        int max_energy
        int regen_rate
        int regen_interval_seconds
    }

    QUIZ_ATTEMPTS {
        uuid id PK
        uuid user_id FK
        uuid lesson_id FK
        jsonb answers
        float score
        bool passed
    }

    REINFORCEMENT_QUEUE {
        uuid id PK
        uuid user_id FK
        uuid lesson_id FK
        text queue_type
        int priority
        text reason
        bool is_completed
    }

    ONBOARDING_RESPONSES {
        uuid id PK
        uuid user_id FK
        jsonb responses
        uuid assigned_track_id FK
        jsonb computed_scores
    }

    USER_PORTFOLIOS {
        uuid id PK
        uuid user_id FK
        float cash
    }

    PORTFOLIO_HOLDINGS {
        uuid id PK
        uuid portfolio_id FK
        text symbol
        int qty
        float avg_price
    }

    PORTFOLIO_SHORTS {
        uuid id PK
        uuid portfolio_id FK
        text symbol
        int qty
        float entry_price
        float margin_held
    }

    PORTFOLIO_TRADES {
        uuid id PK
        uuid portfolio_id FK
        text symbol
        text type
        int qty
        float price
        float total
    }

    USER_PROFILES ||--o| TRACKS : "assigned to"
    USER_PROFILES ||--|| USER_ENERGY : "has"
    USER_PROFILES ||--o{ USER_PROGRESS : "tracks"
    USER_PROFILES ||--o{ QUIZ_ATTEMPTS : "takes"
    USER_PROFILES ||--o{ REINFORCEMENT_QUEUE : "queued for"
    USER_PROFILES ||--|| ONBOARDING_RESPONSES : "completes"
    USER_PROFILES ||--|| USER_PORTFOLIOS : "owns"

    TRACKS ||--o{ LESSONS : "contains"
    LESSONS ||--o{ LESSON_BLOCKS : "composed of"
    LESSONS ||--o{ USER_PROGRESS : "tracked in"
    LESSONS ||--o{ QUIZ_ATTEMPTS : "assessed by"
    LESSONS ||--o{ REINFORCEMENT_QUEUE : "referenced in"

    USER_PORTFOLIOS ||--o{ PORTFOLIO_HOLDINGS : "holds"
    USER_PORTFOLIOS ||--o{ PORTFOLIO_SHORTS : "shorts"
    USER_PORTFOLIOS ||--o{ PORTFOLIO_TRADES : "records"

    QUIZ_ATTEMPTS ||--o{ REINFORCEMENT_QUEUE : "triggers"
```

### Content Block System

Lesson content is modular, stored as flexible JSONB blocks:

| Block Type | Content Structure | Purpose |
|---|---|---|
| `video` | `{ url, duration_seconds, thumbnail_url }` | Short video explanations |
| `audio` | `{ url, duration_seconds, transcript }` | Audio-first learning |
| `text` | `{ body, highlights }` | Text explanations with highlights |
| `quiz` | `{ questions: [{ q, options, correct }] }` | Inline assessment |
| `flashcard` | `{ cards: [{ front, back }] }` | Spaced-repetition cards |
| `live_data` | `{ widget_type, symbol, config }` | Real-time market widgets |

### Row Level Security (RLS)

All user-specific tables enforce RLS policies. Users can **only** read and modify their own data. Tracks and lessons are publicly readable.

---

## 🗺️ User Flow & Navigation

### Complete User Journey

```mermaid
flowchart TD
    Launch["🚀 App Launch"] --> Splash["Custom Animated Splash"]
    Splash --> AuthCheck{"Session exists?"}
    
    AuthCheck -->|No| GetStarted["📱 Get Started Page"]
    GetStarted --> Login["🔐 Login"]
    GetStarted --> Signup["📝 Sign Up"]
    Login -->|Google OAuth / Email| AuthCheck2{"Auth success?"}
    Signup -->|Email + Password| AuthCheck2
    AuthCheck2 -->|No| GetStarted
    AuthCheck2 -->|Yes| OnboardCheck
    
    AuthCheck -->|Yes| OnboardCheck{"Onboarding done?"}
    OnboardCheck -->|No| Onboarding["🎯 Onboarding Quiz<br/>(5 personality questions)"]
    Onboarding --> TrackAssign["AI assigns track + scores"]
    TrackAssign --> Dashboard
    
    OnboardCheck -->|Yes| Dashboard["🏠 Home Dashboard"]
    
    Dashboard --> Tab1["📚 Learn Tab"]
    Dashboard --> Tab2["📈 Trade Tab"]
    Dashboard --> Tab3["🎮 Simulator Tab"]
    Dashboard --> Tab4["👤 Profile Tab"]
    
    Tab1 --> Roadmap["🗺️ Skill Roadmap"]
    Roadmap --> Lesson["📖 Lesson Screen"]
    Lesson --> Quiz["📝 Quiz"]
    Quiz --> AdaptiveEngine["🧠 Adaptive Engine"]
    AdaptiveEngine --> Dashboard
    
    Tab2 --> Market["📊 Market Overview"]
    Market --> StockDetail["📈 Stock Detail"]
    StockDetail --> BuySell["💰 Buy / Sell / Short"]
    BuySell --> Portfolio["📋 Portfolio"]
    
    Dashboard --> Streaks["🔥 Streaks Page"]
    Dashboard --> Leaderboard["🏆 Leaderboard"]
    Dashboard --> DailyCheckin["📅 Daily Check-in"]

    style Dashboard fill:#DDD6FE,stroke:#8B5CF6,color:#111
    style AdaptiveEngine fill:#DBEAFE,stroke:#3B82F6,color:#111
    style Onboarding fill:#FEF3C7,stroke:#F59E0B,color:#111
```

### Tab Navigation Structure

```mermaid
graph LR
    subgraph Tabs ["Bottom Tab Bar"]
        H["🏠 Home"]
        L["📚 Learn"]
        T["📈 Trade"]
        S["🎮 Simulator"]
        P["👤 Profile"]
    end
    
    H --> Home_Dashboard["Dashboard<br/>Net Worth, Streaks, Quick Actions"]
    L --> Learn_Page["Track List<br/>→ Roadmap → Lesson"]
    T --> Trade_Page["Market Arena<br/>→ Stock Detail → Buy/Sell"]
    S --> Sim_Page["Paper Trading Sim<br/>→ Portfolio"]
    P --> Profile_Page["Profile, Settings, Logout"]

    style Tabs fill:#F8FAFC,stroke:#E5E7EB,color:#111
```

---

## 🎨 UI/UX Design Philosophy

### Design Principles

Pedestal's UI is built on a carefully considered set of design principles that prioritize clarity, engagement, and delight.

```mermaid
mindmap
  root((Pedestal Design))
    Clarity
      Clean card-based layouts
      Generous whitespace
      Clear visual hierarchy
      Semantic color coding
    Engagement
      Micro-animations on every interaction
      Haptic feedback on taps
      Progress visualization
      Achievement celebrations
    Delight
      3D raised card borders
      Gradient overlays
      Smooth page transitions
      Animated splash screen
    Accessibility
      Nunito font for readability
      High contrast ratios
      Consistent spacing scale
      Touch-friendly hit areas
```

### Design System Tokens

| Category | Token | Value | Intent |
|---|---|---|---|
| **Primary** | `primary` | `#2563EB` | CTAs, active states, navigation |
| **Secondary** | `secondary` | `#111827` | Headers, dark cards, emphasis |
| **Background** | `background` | `#F8FAFC` | Clean, minimal canvas |
| **Success** | `neonGreen` | `#22C55E` | Positive P&L, completion states |
| **Streak** | `streak` | `#F97316` | Fire/streak highlight color |
| **XP** | `xp` | `#FBBF24` | XP badges, reward indicators |
| **Error** | `error` | `#EF4444` | Negative P&L, failure states |
| **Font** | `Nunito` | Regular → Black (400–900) | Friendly, rounded, approachable |
| **Border Radius** | `sm – full` | 12px → 999px | Consistent rounded feel |
| **Spacing** | `xs – huge` | 4px → 48px | 8-point aligned scale |

### Signature UI Patterns

#### 1. 3D Raised Cards
Cards across the app use a distinctive **bottom-border technique** to create a tactile, raised-platform aesthetic:
```css
border-bottom-width: 4px;
border-bottom-color: #1E40AF;  /* navy shadow */
```
This creates a subtle 3D "pedestal" effect — tying the visual language directly to the brand name.

#### 2. Dark Hero Cards
The portfolio/net worth widget at the top of the Home screen uses a **dark card** (`#111827`) with `neonGreen` accents for the P&L, creating a premium, fintech-grade contrast against the light `#F8FAFC` background.

#### 3. Pastel Category Tags
Category chips and tags use soft pastel backgrounds (`#DDD6FE`, `#FEF3C7`, `#BBF7D0`, `#FECACA`) to differentiate content types while maintaining visual harmony.

#### 4. Duolingo-Inspired Skill Roadmap
The learn screen features a **winding path layout** with unlockable nodes that show progression. Completed nodes use `primary` blue, the current node pulses with animation, and locked nodes are greyed out — creating an intuitive sense of journey.

#### 5. Flip Card Interaction
Lesson concept cards use a **tap-to-flip** paradigm. The front shows "The Term" as a prompt; tapping reveals the explanation on the reverse. This leverages active recall — a proven learning technique.

### UI/UX Improvement Ideas

> These are planned enhancements and considerations for future iterations:

| Area | Current | Proposed Enhancement |
|---|---|---|
| **Onboarding** | Linear 5-question survey | Animated, story-driven onboarding with illustrations per question |
| **Lesson Completion** | Simple success toast | Full-screen confetti animation with XP/level-up celebration |
| **Portfolio View** | Flat holdings list | Mini stock charts inline (sparklines) for each holding |
| **Leaderboard** | Static list | Animated rank transitions, "you vs friends" dual view |
| **Streaks** | Calendar grid | Heatmap-style contribution graph (like GitHub) |
| **Empty States** | None / blank | Illustrated empty states with motivational CTAs |
| **Skeleton Loading** | None | Shimmer/skeleton placeholders while content loads |
| **Micro-animations** | Limited | Add spring-based enter/exit anims to every card |
| **Haptics** | Basic tab press | Rich haptic patterns: success, error, milestone |
| **Dark Mode** | Auto system | Manual toggle with smooth theme transition |
| **Sound Effects** | None | Optional subtle sounds for XP gain, level up, streak |
| **Accessibility** | Basic | VoiceOver labels, reduced motion support, font scaling |
| **Gesture Nav** | Tap only | Swipe between lessons, pull-to-refresh on portfolio |
| **Offline Mode** | None | Cache last 5 lessons for offline learning |
| **Notifications** | Basic reminders | Rich notifications with inline lesson preview |

### Color Mood Board

```
┌─────────────────────────────────────────────────────────────┐
│  ██████  Primary     #2563EB   Trust, Technology, Finance   │
│  ██████  Secondary   #111827   Premium, Dark, Authority     │
│  ██████  Background  #F8FAFC   Clean, Open, Minimal         │
│  ██████  Success     #22C55E   Growth, Profit, Achievement  │
│  ██████  Streak      #F97316   Fire, Urgency, Momentum      │
│  ██████  XP/Gold     #FBBF24   Reward, Value, Currency      │
│  ██████  Error       #EF4444   Loss, Warning, Alert         │
│  ██████  Pastel P    #DDD6FE   Calm, Category, Tag          │
│  ██████  Pastel Y    #FEF3C7   Warm, Highlight, Tip         │
│  ██████  Pastel G    #BBF7D0   Growth, Positive, New        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend — Mobile Application

| Technology | Version | Purpose |
|---|---|---|
| [React Native](https://reactnative.dev/) | `0.81.5` | Cross-platform mobile framework |
| [Expo](https://expo.dev/) | `~54.0` | Build toolchain & managed workflow |
| [Expo Router](https://expo.github.io/router/) | `~6.0` | File-based navigation with deep linking |
| [Supabase JS](https://supabase.com/) | `^2.98` | Auth sessions, real-time queries, database SDK |
| [React Native Firebase](https://rnfirebase.io/) | `^23.8` | Push notifications via FCM |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | `~4.1` | Fluid, performant animations |
| [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) | `~2.28` | Swipe, pan, pinch gestures |
| [Lucide React Native](https://lucide.dev/) | `^0.576` | Consistent, clean icon library |
| [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) | `~15.0` | UI gradient effects |
| [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) | `~15.0` | Tactile haptic feedback |
| [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/) | `~15.0` | Secure token/credential storage |
| [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/) | `~16.0` | Audio/video playback for lessons |
| [Nunito Font](https://fonts.google.com/specimen/Nunito) | 400–900 | Brand typography (rounded, friendly) |
| TypeScript | `~5.9` | Type safety across the entire frontend |

### Backend — REST API

| Technology | Version | Purpose |
|---|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | `0.111` | High-performance async REST API |
| [Uvicorn](https://www.uvicorn.org/) | `0.30.1` | ASGI server with hot-reload |
| [Pydantic v2](https://docs.pydantic.dev/) | `>=2.9.2` | Data validation, settings, serialization |
| [Supabase Python](https://supabase.com/docs/reference/python/) | `2.5.1` | Database client + RPC access |
| [Python-JOSE](https://python-jose.readthedocs.io/) | `3.3.0` | JWT creation & validation |
| [HTTPX](https://www.python-httpx.org/) | `0.27.0` | Async HTTP client for external APIs |
| [python-dotenv](https://pypi.org/project/python-dotenv/) | `1.0.1` | Environment variable management |

### Infrastructure

| Service | Purpose |
|---|---|
| [Supabase](https://supabase.com/) | PostgreSQL database, Auth, RLS, real-time |
| [Firebase](https://firebase.google.com/) | Push notifications (FCM), analytics |
| [EAS (Expo)](https://docs.expo.dev/eas/) | Cloud builds, OTA updates, app store submission |

---

## 📁 Project Structure

```
APP_PEDESTAL/
│
├── 📄 README.md                        # This file
├── 🖼️ banner.png                       # Project banner
├── 📄 .gitignore                       # Git exclusions
│
├── 📱 Frontend/                         # React Native (Expo) Mobile App
│   ├── app/                            # Expo Router: file-based navigation
│   │   ├── _layout.tsx                 # Root layout (AuthProvider, fonts, splash)
│   │   ├── index.tsx                   # Get Started / Landing screen
│   │   ├── login.tsx                   # Email + Google login
│   │   ├── signup.tsx                  # Registration with display name
│   │   ├── onboarding.tsx              # 5-question personality quiz
│   │   ├── daily-checkin.tsx           # Daily check-in rewards
│   │   ├── leaderboard.tsx             # Global XP leaderboard
│   │   ├── streaks.tsx                 # Streak calendar & stats
│   │   ├── (tabs)/                     # Bottom tab navigator
│   │   │   ├── _layout.tsx             # Tab bar config
│   │   │   ├── home.tsx                # 🏠 Dashboard (net worth, quick actions)
│   │   │   ├── learn.tsx               # 📚 Track list & categories
│   │   │   ├── trade.tsx               # 📈 Market arena & watchlists
│   │   │   ├── profile.tsx             # 👤 User profile & settings
│   │   │   └── simulator/              # 🎮 Paper trading simulator
│   │   ├── learn/                      # Learning sub-routes
│   │   │   ├── roadmap.tsx             # Skill tree / learning path
│   │   │   └── lesson.tsx              # Individual lesson (video, text, quiz)
│   │   └── paper-trading/              # Paper trading sub-routes
│   │       ├── market.tsx              # Market overview
│   │       ├── stock-detail.tsx        # Individual stock + buy/sell
│   │       └── portfolio.tsx           # User holdings & trade history
│   │
│   ├── components/                     # Reusable UI components
│   │   ├── ui/                         # Base UI primitives
│   │   ├── Toast.tsx                   # Toast notification component
│   │   ├── splashscreen.tsx            # Custom animated splash
│   │   └── haptic-tab.tsx              # Haptic-enabled tab button
│   │
│   ├── context/                        # React Context providers
│   │   └── AuthContext.tsx             # Auth state (session, profile, OAuth)
│   │
│   ├── lib/                            # External service clients
│   │   └── supabase.ts                 # Supabase client initialization
│   │
│   ├── constants/                      # App-wide constants
│   │   └── theme.ts                    # Design system tokens
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── use-color-scheme.ts         # Native color scheme
│   │   └── use-color-scheme.web.ts     # Web color scheme fallback
│   │
│   ├── assets/                         # Images, fonts, icons
│   ├── utils/                          # Helper functions
│   ├── data/                           # Static/mock data
│   ├── scripts/                        # Build & utility scripts
│   ├── app.json                        # Expo configuration
│   ├── eas.json                        # EAS Build profiles
│   ├── package.json                    # Dependencies & scripts
│   ├── tsconfig.json                   # TypeScript config
│   └── firebase.json                   # Firebase project config
│
└── ⚙️ Backend/                          # Python FastAPI REST API
    ├── main.py                         # App entry point + CORS + routers
    ├── schema.sql                      # Full Supabase PostgreSQL schema
    ├── requirements.txt                # Python dependencies
    ├── runtime.txt                     # Python version for hosting
    │
    └── app/                            # Application package
        ├── core/                       # Framework core
        │   ├── config.py               # Pydantic settings (env vars)
        │   ├── database.py             # Supabase client singleton
        │   ├── auth.py                 # JWT verification middleware
        │   └── constants.py            # Business rule constants
        │
        ├── models/                     # Data models
        │   ├── user.py                 # User profile model
        │   ├── track.py                # Learning track model
        │   ├── lesson.py               # Lesson model
        │   ├── quiz.py                 # Quiz model
        │   ├── progress.py             # Progress model
        │   ├── onboarding.py           # Onboarding model
        │   └── reinforcement.py        # Reinforcement queue model
        │
        ├── schemas/                    # Pydantic request/response schemas
        │
        ├── services/                   # Business logic layer
        │   ├── adaptive_service.py     # 🧠 Adaptive engine (RLS core)
        │   ├── energy_service.py       # ⚡ Lightning Bolts economy
        │   ├── lesson_service.py       # Lesson content delivery
        │   ├── quiz_service.py         # Quiz evaluation
        │   ├── progress_service.py     # XP, levels, completion
        │   ├── track_service.py        # Track management
        │   ├── portfolio_service.py    # Paper trading engine
        │   └── onboarding_service.py   # Score computation & track assignment
        │
        ├── routes/                     # API endpoint handlers
        │   ├── auth.py                 # Authentication routes
        │   ├── tracks.py               # Learning tracks CRUD
        │   ├── lessons.py              # Lesson retrieval
        │   ├── progress.py             # Progress tracking
        │   ├── quiz.py                 # Quiz submission
        │   ├── adaptive.py             # Adaptive path recommendations
        │   ├── energy.py               # Energy status & consumption
        │   ├── leaderboard.py          # Global leaderboard
        │   ├── portfolio.py            # Portfolio operations
        │   ├── onboarding.py           # Onboarding flow
        │   └── admin.py                # Admin content management
        │
        ├── data/                       # Static data / seed content
        └── utils/                      # Utility functions
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/verify` | Verify Supabase JWT token |
| `GET` | `/api/auth/me` | Get current authenticated user profile |

### Learning Content

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tracks` | List all learning tracks (with categories) |
| `GET` | `/api/tracks/{id}` | Get track details |
| `GET` | `/api/lessons` | List lessons (filterable by track) |
| `GET` | `/api/lessons/{id}` | Get full lesson with content blocks |

### Progress & Assessment

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/progress/start` | Mark lesson as started |
| `POST` | `/api/progress/complete` | Mark lesson as completed, award XP |
| `GET` | `/api/progress` | Get all user progress records |
| `POST` | `/api/quiz/submit` | Submit quiz answers, trigger adaptive engine |

### Adaptive Engine

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/adaptive/evaluate` | Evaluate quiz performance & adjust path |
| `GET` | `/api/adaptive/next` | Get next recommended lesson |

### Energy Economy

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/energy` | Get current energy with real-time regen |
| `POST` | `/api/energy/consume` | Deduct energy before starting a lesson |

### Paper Trading

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/portfolio` | Get user portfolio (cash, holdings, shorts) |
| `POST` | `/api/portfolio/trade` | Execute a buy/sell/short/cover trade |
| `GET` | `/api/portfolio/history` | Get trade history |

### Gamification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leaderboard` | Global leaderboard (ranked by XP) |
| `POST` | `/api/onboarding/submit` | Submit onboarding answers, compute scores |

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status check |
| `GET` | `/api/health` | Detailed health check |
| `GET` | `/docs` | Interactive Swagger documentation |
| `GET` | `/redoc` | ReDoc API documentation |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Required For |
|---|---|---|
| Node.js | `>=18.x` | Frontend dependencies |
| npm | `>=9.x` | Package management |
| Python | `>=3.11` | Backend runtime |
| Expo CLI | Latest | Mobile development |
| EAS CLI | Latest | Cloud builds |
| Xcode | `>=15` | iOS development (macOS only) |
| Android Studio | Latest | Android development |

### External Services Setup

1. **Supabase Project** — [supabase.com](https://supabase.com)
   - Create a new project
   - Run `Backend/schema.sql` in the SQL editor
   - Enable Google OAuth under Authentication → Providers
   - Copy Project URL and anon/service keys

2. **Firebase Project** — [firebase.google.com](https://firebase.google.com)
   - Create an iOS app (bundle ID: `com.abhiman12.pedestal`)
   - Create an Android app (package: `com.abhiman12.pedestal`)
   - Download `GoogleService-Info.plist` → `Frontend/`
   - Download `google-services.json` → `Frontend/`
   - Enable Cloud Messaging

---

### Backend Setup

```bash
# 1. Navigate to backend
cd Backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your Supabase URL, keys, and secrets

# 5. Initialize database
# Run schema.sql in your Supabase SQL Editor

# 6. Start development server
uvicorn main:app --reload --port 8000
```

> 📍 API available at `http://localhost:8000`  
> 📖 Swagger docs at `http://localhost:8000/docs`  
> 📘 ReDoc at `http://localhost:8000/redoc`

---

### Frontend Setup

```bash
# 1. Navigate to frontend
cd Frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create Frontend/.env with:
# EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# EXPO_PUBLIC_API_URL=http://localhost:8000

# 4. Start Expo dev server
npx expo start

# 5. Run on platform
npx expo run:ios          # iOS Simulator
npx expo run:android      # Android Emulator

# 6. Or scan QR with Expo Go (limited — no Firebase)
```

> ⚠️ **Note:** Since Pedestal uses native Firebase modules, you must use `expo run:ios` / `expo run:android` (dev client builds), not Expo Go.

---

## 🔑 Environment Variables

### Backend — `Backend/.env`

| Variable | Description | Example |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_KEY` | Service role key (server-side) | `eyJhbGciOiJ...` |
| `SECRET_KEY` | JWT signing secret | `your-secret-key-256` |
| `APP_ENV` | Environment name | `development` |
| `DEBUG` | Debug mode | `true` |

### Frontend — `Frontend/.env`

| Variable | Description | Example |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGciOiJ...` |
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` |

> 🔒 **Security:** `.env` files are excluded from version control via `.gitignore`. Never commit secrets.

---

## 📦 Build & Deployment

### EAS Build (Recommended)

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to App Store / Play Store
eas submit --platform ios
eas submit --platform android

# Over-the-Air update (JS-only changes)
eas update --branch production --message "Bug fix"
```

### Backend Deployment

The backend is a standard FastAPI app deployable to any ASGI-compatible host:

| Platform | Command / Config |
|---|---|
| **Railway** | Connect repo → auto-detects Python |
| **Render** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Fly.io** | `fly launch` → configure `Procfile` |
| **Docker** | Standard Python Dockerfile with uvicorn |

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request


## 📄 License

This project is proprietary and confidential.  
All rights reserved © 2026 **Pedestal**.


<p align="center">
  <img src="https://img.shields.io/badge/built_with-❤️-EF4444?style=for-the-badge" />
  <img src="https://img.shields.io/badge/by-Pedestal_Team-6C63FF?style=for-the-badge" />
</p>

<p align="center">
  <sub>Making financial literacy accessible, one micro-lesson at a time.</sub>
</p>
