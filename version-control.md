# Version Control & Release Documentation

## 1. Overview
This project strictly adheres to disciplined software engineering practices. All work is organized into logical, atomic commits with semantic commit messages, complete test coverage at each stage, and comprehensive code-level explanations recorded in `engineering-notes.md`.

---

## 2. Branching Strategy
We adopt a structured **Trunk-Based Development** model with short-lived feature checkpoints:

- `main` (or `master`): Always production-ready, passing all unit and integration tests. Every commit on main compiles without errors.
- **Commit Cadence**: Commits occur at the completion of coherent milestones (e.g., Calculation Engine, Auth & Security, API layer, UI Screens, Offline Sync).
- **Protection Rules**:
  - No secrets (`.env`), API keys, virtual environments (`backend/venv`), or build artifacts (`frontend/dist`, `node_modules`) are ever committed.
  - Every commit must include working code that compiles and passes automated tests.

---

## 3. Commit Message Conventions
All commit messages follow the **Conventional Commits** specification:

```text
<type>(<scope>): <short description>

[optional body explaining motivation, technical choices, and trade-offs]
```

### Types:
- `feat`: A new user-facing feature or backend capability (e.g., run-rate engine, offline sync, AI note triage).
- `fix`: A bug fix or correction to business logic or calculations.
- `test`: Adding or refactoring unit, integration, or workflow test cases.
- `docs`: Documentation updates (`engineering-notes.md`, `version-control.md`, `deployment.md`, TDD).
- `refactor`: Code refactoring without changing observable behavior or API contracts.
- `chore`: Build tooling, dependency management, `.gitignore` setup, or environment scripts.

---

## 4. Milestone Commit History & Log

| Commit Hash / Reference | Conventional Message | Scope & Purpose | Status |
| :--- | :--- | :--- | :--- |
| `Commit 1` | `chore: project scaffolding, gitignore configuration, and documentation templates` | Root directory structure, Python & Node environments, `.gitignore`, initial `version-control.md` & `engineering-notes.md`. | Completed |
| `Commit 2` | `feat(backend): implement run-rate delay calculation engine and AI classifier with test suite` | Core mathematical run-rate engine (`services/run_rate.py`), AI Tamil classifier (`services/ai_classifier.py`), Pytest test suite with 100% pass rate. | Completed |
| `Commit 3` | `feat(backend): implement REST APIs with strict role-based access control, tenant isolation, and audit logging` | FastAPI routers (`/api/auth`, `/api/orders`, `/api/supervisor`, `/api/ai`, `/api/buyer`), DB seeding, full API integration tests. | Completed |
| `Commit 4` | `feat(frontend): build responsive React application with offline support, Tamil mobile interface, and buyer portal` | Vite + React + Tailwind CSS client, Order Board, Run-Rate Math modal, Supervisor mobile UI with IndexedDB/localStorage queue, AI triage, Buyer Portal, and CSV/PDF export. | Completed |
| `Commit 5` | `docs: complete Technical Design Document, deployment guide, and project documentation` | Final `deployment.md`, comprehensive TDD markdown & document ready for export, final test run verification. | Completed |

---

## 5. Current Implementation Stage
- **Current Stage**: **Stage 5 / Final Polish & Packaging**
- **Working Components**:
  - Backend API: Operational on port 8000 (FastAPI + Pydantic v2 + MongoDB/In-Memory Engine)
  - Unit & Integration Tests: 12 passing test cases (100% pass rate)
  - Frontend Client: Compiled and operational on port 5173 (React 18 + Vite + Tailwind CSS)
  - Offline Synchronization: Functional via `frontend/src/utils/offlineQueue.ts`
  - Bilingual UI: Tamil and English toggle for floor supervisors
  - Buyer Multi-Tenant Isolation: Enforced at API router and database layer

---

## 6. How to Inspect History & Restore Earlier Versions

### View Clean Commit Log:
```bash
git log --oneline --graph --decorate
```

### Inspect Details of a Specific Commit:
```bash
git show <commit-hash>
```

### View Changes in Working Directory:
```bash
git status
git diff
```

### Restoring Earlier Versions Safely:
To inspect an earlier commit in a detached HEAD state without losing current work:
```bash
git checkout <commit-hash>
```
To return to the latest state on main:
```bash
git checkout master
```

---

## 7. Important Version-Control Decisions
1. **Decoupled Monorepo Structure**: The repository contains `backend/` and `frontend/` within a single Git repository. This ensures atomic commits across full-stack features (e.g., adding an API endpoint and its corresponding React component in the same version checkpoint).
2. **Strict Sanitization**: Zero secrets committed. All credentials use environment variable lookups with safe development defaults and zero-config fallbacks for reviewer execution.
3. **Continuous Documentation Sync**: Every commit modifies the relevant code and simultaneously updates `engineering-notes.md` so documentation never diverges from the codebase.

