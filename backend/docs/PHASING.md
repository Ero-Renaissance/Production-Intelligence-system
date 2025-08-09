# Phased Delivery Plan

This plan sequences delivery from contract-first foundations to predictive analytics and optimization, with clear scope, acceptance criteria, and dependencies per phase.

## Phase Overview
- P1 Contracts & Mocks (current)
- P2 Live Data (EC/PI) Read‑only
- P3 Terminals & Pipelines
- P4 Predictive & Triage
- P5 Optimization & Simulation
- P6 Hardening & Governance

---
## P1 — Contracts & Mocks
- Goals
  - Stabilize API contracts and SPA integration using mock data
  - Establish backend skeleton, routing, health checks, and CI
- Scope
  - SPA: Zod schemas; React Query patterns; URL/localStorage state; drill‑down: Asset → Hub → Facility → Well
  - Backend: FastAPI app; versioned router `/api/v1`; stub endpoints; OpenAPI
  - Mocking: MSW in FE; sample payloads + contract tests
- Deliverables
  - SYSTEM_ARCHITECTURE.md, PHASING.md
  - Contract tests green for `/summary`, `/assets`, `/gap-drivers`, `/production-flow`, `/terminal/{id}/operations`
  - Basic docs and env templates
- Acceptance Criteria
  - `npm run dev` shows mock data with no console/linter errors
  - CI runs FE unit + contract tests successfully
- Dependencies: none

---
## P2 — Live Data (EC/PI) Read‑only
- Goals
  - Ingest core dimensions and read operational KPIs from EC and PI
  - Serve SPA endpoints from Postgres/Redis instead of mocks
- Scope
  - Infra: Provision Azure Postgres (Flexible Server) and Redis; connect App Service
  - Backend services
    - Adapters: `EnergyComponentsRestAdapter`, `PiWebApiAdapter`
    - Ingestion jobs: assets/hubs/facilities/wells (EC), daily allocations, PI aggregates (1h/1d)
    - Service layer: aggregation + unit normalization
    - Caching: latest KPIs and top gap drivers
  - SPA: switch base URL; show freshness stamps; graceful degraded states
- Deliverables
  - Tables: dims, fact_daily_production, fact_hourly_timeseries
  - Endpoints backed by DB/cache: `/summary`, `/assets`, `/hubs/{id}/performance`
  - Operational runbooks for ingestion jobs
- Acceptance Criteria
  - P95 ≤ 500 ms for cached `/summary` and `/assets`
  - Freshness SLA met (latest ≤ 5 min for supported tags)
  - API returns non-mock data in test/staging
- Dependencies
  - EC REST credentials, base URL, scopes
  - PI Web API connectivity and auth mode

---
## P3 — Terminals & Pipelines
- Goals
  - Provide terminal KPIs and cargo views; compute pipeline travel/ETA
- Scope
  - Backend: terminal KPI ingestion (EC/SharePoint as needed); ETA computation service; sharepoint metadata adapter
  - SPA: Terminal Overview + Upcoming Cargo per asset/hub/facility context
- Deliverables
  - Endpoint: `/terminal/{id}/operations` populated
  - Cargo schedule endpoint or aggregation from SharePoint Graph
- Acceptance Criteria
  - Terminal endurance matches spec (days); KPIs coherent over time
  - Cargo table filtered by asset shows realistic schedule
- Dependencies
  - Terminal inventory and cargo source access (EC or SharePoint)

---
## P4 — Predictive & Triage
- Goals
  - Forecast KPIs and gaps; prioritize drivers; notify stakeholders
- Scope
  - Baseline models: time‑series (Prophet/ARIMA) on downsampled signals; feature store from facts
  - Forecast services: expose `/hubs/{id}/performance?forecast=true`
  - Alerting hooks; triage views in SPA with confidence/feature attributions
- Deliverables
  - Model pipelines (offline) with validation; scheduled retraining
  - Forecast APIs and SPA overlays
- Acceptance Criteria
  - Backtests show acceptable MAPE for key KPIs
  - Forecasts render in hub/well charts with uncertainty bands
- Dependencies
  - Historical depth (≥ 6–12 months aggregates)

---
## P5 — Optimization & Simulation
- Goals
  - Recommend operating changes under constraints; support what‑if simulations
- Scope
  - Optimizer service scaffold (linear/convex heuristic first); constraint catalog
  - Recommendation engine; action/outcome tracking
  - SPA: Optimisation/Simulation workspace (role‑gated)
- Deliverables
  - Endpoint: `/optimization/recommendations` (input: constraints, objectives)
  - Scenario runner with persistence and comparison
- Acceptance Criteria
  - At least one validated optimization scenario produces measurable uplift in backtest/sandbox
  - Recommendations traceable from suggestion → action → outcome
- Dependencies
  - Reliable constraint/actuator data; SME validation loop

---
## P6 — Hardening & Governance
- Goals
  - Enterprise‑grade security, reliability, and governance; production readiness
- Scope
  - SSO via Entra ID (OIDC), APIM policies (rate limit, JWT validation)
  - Observability: App Insights dashboards, SLOs, error budgets; chaos/resilience tests
  - DR/Backup: Postgres PITR; Redis persistence; runbooks
  - Performance/load testing; cost optimization
- Deliverables
  - Go‑live checklist; runbooks; incident response procedures
- Acceptance Criteria
  - Pen test findings resolved; SLAs met for 2 consecutive weeks in staging
  - DR drill successful; RPO/RTO within policy
- Dependencies
  - Security review, networking approvals

---
## Cross‑Cutting Concerns
- Contracts: OpenAPI + Zod schema parity; CI contract tests on sample payloads
- Units/Formatting: centralized unit map in services; FE `formatWithUnit`
- Feature Flags: MSW preview, new endpoints, model overlays
- RBAC: role mapping (PMC Engineer, Performance Lead, Production Programmer, Production Technologist)

## Environment Progression
- dev → test → staging → prod
- Promotion gates: tests green, contracts unchanged (or additive), performance checks, security scan

## Risks & Mitigations
- Source availability/performance → caching, backpressure, retries, circuit breakers
- Data drift → schema versions, validations, alerts on anomalies
- Model risk → guardrails, human‑in‑the‑loop, shadow deployments
- Scope creep → phase gates, ADRs for major decisions

## Milestones (Indicative)
- P1: Week 0–2
- P2: Week 3–8
- P3: Week 9–12
- P4: Week 13–18
- P5: Week 19–24
- P6: Week 25–28

Dates are placeholders; adjust with org calendars and dependencies. 