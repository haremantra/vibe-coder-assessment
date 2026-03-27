# Vibe Coder Assessment

An interactive self-assessment tool that evaluates coding maturity across 8 key competency attributes. The assessment measures whether developers are successfully generating code with AI assistance and helps identify growth areas through personalized recommendations.

## 🎯 Functionality Overview

### Core Assessment
The app walks users through a structured 8-attribute evaluation:

1. **Problem Framing** — How deeply you analyze before building
2. **Architecture Selection** — Quality of design decisions  
3. **Scope Discipline** — Boundary definition and change management
4. **Iteration Methodology** — Root cause analysis and debugging approach
5. **Testing & Validation** — Test coverage and verification rigor
6. **Documentation** — README, design rationale, and audience-specific docs
7. **Domain Grounding** — Research, standards awareness, and contextual knowledge
8. **Production Orientation** — Deployment readiness and real-world concerns

For each attribute, users score themselves 1-4:
- **Tier 1** (Novice): Starting point—working code but AI-dependent judgment
- **Tier 2** (Practitioner): Reviewing and iterating with growing understanding
- **Tier 3** (Senior): Architecting before prompting; documenting decisions
- **Tier 4** (Principal): Top-tier—founding engineer level execution

### Results Dashboard
- **Composite Score**: Aggregated maturity level (8–32 range)
- **Attribute Breakdown**: Visual gauge for each competency
- **Tier Assignment**: Tier 1–4 classification with interpretation
- **30-60-90 Plan**: Personalized growth roadmap with concrete projects

### Design Aesthetic
The interface uses an "Analytical Instrument Panel" metaphor:
- Dark navy background with electric cyan accents
- Luminous data visualization (gauges, signal bars, scan-line effects)
- Precision typography (Space Grotesk + Inter)
- Scientific/measurement aesthetic (not gamified, not corporate)
- Smooth animations on score transitions and tier reveals

## 🤔 Why This Was Built

This assessment tool addresses a critical need: **systematically evaluating developer maturity in the AI-assisted coding era.**

### Problem Space
- AI coding tools (Copilot, Claude, etc.) have democratized code generation
- Developers using these tools show wide variance in output quality and judgment
- Existing skill assessments focus on algorithm/leetcode performance—not AI-era practices
- Managers and teams lack a common rubric for evaluating "vibe coder" competency

### Solution  
The Vibe Coder Assessment provides:
- **Structured framework** for self and peer evaluation
- **Non-judgmental scaffolding** that builds confidence while surfacing growth edges
- **Actionable clarity** with concrete Tier 1–4 narratives
- **Personalized roadmaps** aligned to each developer's current level
- **Conversation starter** for mentoring and career development discussions

## 🚀 Implementation Guide

### Tech Stack
- **Frontend**: React 19.2 + Vite
- **Backend**: Express.js + tRPC
- **Database**: MySQL 8 + Drizzle ORM
- **UI Components**: Radix UI + TailwindCSS 4
- **Styling**: Framer Motion animations, custom CSS
- **State Management**: React Query (@tanstack/react-query)
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Node.js with esbuild bundling

### Project Structure
```
vibe-coder-assessment/
├── client/                 # React frontend
│   ├── components/        # Radix UI + custom components
│   ├── pages/            # Assessment & results screens
│   └── hooks/            # tRPC client hooks
├── server/               # Express backend
│   ├── _core/           # Server entry point
│   ├── routes/          # API endpoints & tRPC routers
│   └── db/              # Database queries & schema
├── shared/              # Shared types & utilities
├── drizzle/             # Database migrations
├── docs/                # Architecture & design docs
└── package.json         # Dependencies & scripts
```

### Getting Started

#### Prerequisites
- Node.js 18+
- pnpm 10.4.1+ (as specified in package.json)
- MySQL 8+ database

#### Installation
```bash
# Clone the repository
git clone https://github.com/haremantra/vibe-coder-assessment.git
cd vibe-coder-assessment

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and any API credentials

# Run database migrations
pnpm db:push

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

#### Available Scripts
- `pnpm dev` — Start development server with hot reload
- `pnpm build` — Build frontend + backend for production
- `pnpm start` — Run production server
- `pnpm check` — TypeScript type checking
- `pnpm test` — Run vitest unit tests
- `pnpm format` — Format code with Prettier
- `pnpm db:push` — Generate and run database migrations

### Key Features Implementation

#### Assessment Flow
1. **Multi-step form** with React Hook Form for state management
2. **tRPC endpoints** for validating and persisting scores
3. **Real-time calculations** of composite tier and attribute breakdowns
4. **Client-side tier determination** using score ranges

#### Results Visualization
- Recharts for gauge/radar visualizations
- Custom CSS for scan-line effects and signal animations
- Framer Motion for smooth state transitions
- Responsive dashboard grid layout

#### Database Schema
- **assessments** table: User responses + scores
- **users** table: Identity & session management  
- **tier_mappings** table: Score range → Tier classification
- Drizzle ORM manages migrations & type safety

## 📚 Source Documents & References

### Design & Strategy
- **[ideas.md](./ideas.md)** — Three design directions explored ("Terminal Noir," "Elevation Map," "Signal/Noise"). Final selection rationale.
- **[design-analysis.md](./design-analysis.md)** — First-pass design system breakdown
- **[design-analysis-v2.md](./design-analysis-v2.md)** — Refined visual specifications and component library

### Scoring & Rubric
- **[chatbot-script-reference.md](./chatbot-script-reference.md)** — The 8-attribute scoring table with tier definitions (Novice → Principal)
- **[chatbot-test-notes.md](./chat-test-notes.md)** — LLM interaction testing and prompt refinement
- **[interview-protocol.md](./interview-protocol.md)** — Interview framework for user research & validation

### Testing & Validation
- **[browser-test-notes.md](./browser-test-notes.md)** — Cross-browser compatibility testing
- **[round2-test-notes.md](./round2-test-notes.md)** — Round 2 testing findings
- **[refactor-test-notes.md](./refactor-test-notes.md)** — Testing notes from refactoring cycle
- **[review-notes.md](./review-notes.md)** — Code review feedback

### Development Planning
- **[refactoring-plan.md](./refactoring-plan.md)** — Planned code improvements and architectural shifts
- **[todo.md](./todo.md)** — Feature backlog and outstanding work items

### Configuration
- **[components.json](./components.json)** — Shadcn/Radix UI component registry
- **[drizzle.config.ts](./drizzle.config.ts)** — Database migration configuration
- **[vite.config.ts](./vite.config.ts)** — Frontend build settings
- **[vitest.config.ts](./vitest.config.ts)** — Test runner configuration

## 🔄 Architecture Decisions

### Frontend Architecture
- **React 19** for latest hooks & concurrent rendering
- **tRPC** for end-to-end typesafe API communication
- **TailwindCSS 4** for utility-first styling at scale
- **Radix UI** primitives for accessible unstyled components

### Backend Architecture
- **Express.js** for lightweight server & tRPC integration
- **Drizzle ORM** for type-safe database queries + migrations
- **MySQL** as persistent store (relational model fits assessment data well)

### State Management
- **React Query** for server state caching & synchronization
- **React Hook Form** for form state (validation at Zod schema level)
- Component-level state for UI concerns (modal open/close, tabs, etc.)

## 📖 Documentation Audience

### For Developers
- Review `./docs/` for architecture diagrams
- Check `design-analysis-v2.md` for component specifications
- See `refactoring-plan.md` for known technical debt

### For Product/Design
- `ideas.md` explains design rationale
- `chatbot-script-reference.md` details the 8-attribute framework
- Results dashboard uses this rubric as source of truth

### For Managers/Mentors
- Use `interview-protocol.md` as a conversation guide
- Share assessment results with developers for 1-on-1 discussions
- Personalized 30-60-90 plans suggest mentoring focus areas

## 🤝 Contributing

Contributions welcome! Please:
1. Check `refactoring-plan.md` for priority improvements
2. Write tests for new features (run `pnpm test`)
3. Format code with `pnpm format`
4. Update relevant docs in `./docs/`

## 📝 License

MIT — See LICENSE for details

---

**Questions?** See [chatbot-script-reference.md](./chatbot-script-reference.md) for the complete scoring framework, or check [interview-protocol.md](./interview-protocol.md) for assessment methodology.