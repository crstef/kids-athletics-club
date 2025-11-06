# Kids Athletics Club Learning Roadmap

This roadmap captures a tutor-style plan to help you understand how the project is structured and how each part was developed. Sessions focus on the currently unlocked scope (parent-role experience) and build outward once additional modules are explicitly unlocked.

---

## 1. Architectural Walkthrough (60 min)

**Goal:** Build a mental model of the full stack.

- Review repo layout (`src/`, `server/`, build scripts, hashed assets policy).
- Follow request flow: authentication → API client → hooks → components → database.
- Note locked vs. unlocked areas; document how to request a temporary unlock before touching other modules.
- Deliverable: annotated diagram or bullet summary of the system flow.

## 2. Frontend Deep Dive (2 × 45 min)

### Session A – App Orchestration & Data Hooks
- Read through `App.tsx`, `UnifiedLayout.tsx`, and the widget registry.
- Explore `useApi` and `api-client` integration; practice tracing a parent dashboard fetch.
- Exercises: map which hook loads which dataset; explain how `hasFetched` prevents retry loops.

### Session B – Parent Dashboard & Messaging
- Inspect parent-role widgets, messaging panel, and permission guards.
- Examine state scoping for parent vs. athlete vs. coach.
- Exercises: identify where role-based filters are applied; describe how widget props are constructed.

## 3. Backend & Data Session (60 min)

**Goal:** Understand the Express/PG layer supporting the parent experience.

- Trace API routes → controllers → SQL for parent dashboard widgets and messaging.
- Run example queries against `athletes`, `results`, `messages` tables.
- Review approval workflow for context, even though it is locked for edits.
- Exercises: describe how role scoping is enforced server-side; outline the transaction flow when approving an athlete.

## 4. Testing & Tooling Lab (45 min)

- Run `npm test`, inspect Vitest reports, and note the advisory output.
- Explore coverage metrics and how to expand tests safely within the unlocked scope.
- Troubleshooting drills: simulate a widget failure, identify logs/props to check, choose a fix path.

## 5. Hands-on Capstone (Flexible 60–90 min)

**Goal:** Apply the knowledge on a guarded change within the parent experience.

- Choose a small enhancement (UI copy tweak, minor widget improvement) that stays inside the locked scope.
- Design the change, outline affected files, and confirm no other module is touched.
- Implement with checkpoints: plan → code review → tests → summary.
- Debrief what worked, what felt unclear, and list topics to unlock next.

---

### Tracking & Next Steps

- Keep session notes and questions in a shared document or issue.
- After completing the capstone, decide which module to unlock next (e.g., coach dashboard, approval flow).
- Update `.github/agent-directive.md` or the conversation log when scopes change so every collaborator stays aligned.

Happy to adjust pacing, merge sessions, or add supplemental materials (videos, diagrams) as you progress.
