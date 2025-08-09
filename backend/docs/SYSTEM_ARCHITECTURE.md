# System Architecture Document (SAD)

This document captures the end‑to‑end architecture for the Production Intelligence Platform: scope, components, data flows, integrations, security, operations, and a phased delivery plan.

## 1. Goals and Non‑Functional Requirements
- Business goals
  - Detect and explain production gaps; predict future gaps
  - Forecast terminal readiness and cargo; support optimization and simulation
  - Provide drill‑down from Asset → Hub → Facility → Well with network overlays (oil, domesticGas, exportGas)
- Non‑functional requirements
  - Availability: ≥ 99.5% for read APIs; graceful degradation during upstream outages
  - Performance: P95 ≤ 500 ms for cached KPIs; ≤ 1.5 s for aggregate queries
  - Freshness: KPIs updated ≤ 1 min where supported; trends hourly/daily depending on source
  - Security: SSO via Entra ID; least privilege; secrets in Key Vault; private networking
  - Observability: tracing, structured logs, metrics; health/readiness endpoints

## 2. Context and Scope
- Users: PMC Engineers, Performance Leads, Production Programmers/Technologists, Terminal Ops, Leadership
- Data sources
  - Energy Components (EC) via REST (primary) and Oracle (fallback)
  - PI System via PI Web API
  - SharePoint via Microsoft Graph API
- Consumers: Single Page App (SPA), potential external reporting (later)

## 3. Target Architecture (High Level)
- Frontend: React + Vite + TypeScript, React Router, React Query, Tailwind, Zod
- Backend: FastAPI + Pydantic v2 (contracts), async adapters, Redis cache, Postgres app store (read‑optimized)
- Gateway & Infra (Azure):
  - Frontend hosting: Azure Static Web Apps or Storage Static Website + CDN/Front Door
  - Backend hosting: Azure App Service (Linux) with containerized FastAPI (uvicorn/gunicorn)
  - API governance: Azure API Management (APIM)
  - Observability: Azure Application Insights
  - Secrets/config: Azure Key Vault + App Service env vars
  - Networking: VNet integration and private endpoints per enterprise policy

### 3.1 Logical Components
- SPA: UI, client‑side routing, unit formatting, role‑aware views
- Backend API: versioned REST (/api/v1), contracts (OpenAPI), auth, error envelopes (RFC 7807)
- Adapters: EC REST/Oracle, PI Web API, SharePoint Graph
- Services: orchestration, aggregation, unit normalization, defaults (flared gas)
- Caching: Redis for hot KPIs, “latest” values, top lists
- Persistence: Postgres for read‑optimized app data (dimensions, aggregates, histories)
- Jobs: ingestion, aggregation (hourly/daily), cache warmers, model runners (future)

## 4. API Surface (v1 summary)
- GET /api/v1/summary — assets/system KPIs; includes flared gas
- GET /api/v1/assets — assets → hubs → facilities; per‑network KPIs
- GET /api/v1/gap-drivers — top deferment contributors; filters by asset/facility
- GET /api/v1/production-flow — explicit topology (units, facilities, edges)
- GET /api/v1/terminal/{terminalId}/operations — 5 terminal KPIs
- GET /api/v1/hubs/{hubId}/performance — timeseries + events
- Facilities & wells (planned):
  - GET /api/v1/facilities/{facilityId}/wells — list wells (table)
  - GET /api/v1/wells/{wellId} — well detail (latest, last test)
  - GET /api/v1/wells/{wellId}/timeseries — oil/choke/pressure/temperature

Conventions: camelCase JSON; RFC 7807 for errors; numeric units documented in OpenAPI; additive versioning.

## 5. Data Architecture
### 5.1 Storage Strategy (Hybrid)
- Keep sources of truth in EC/PI/SharePoint
- Persist a read‑optimized application store in Postgres for:
  - Dimensions: assets, hubs, facilities, wells, tag mappings
  - Facts: daily allocations, hourly/daily aggregates for PI tags, terminal KPIs, gap drivers, recommendations
  - Derived views: hub/asset rollups, pipeline ETAs, endurance
- Redis for hot caches: latest KPIs, top gaps, hub/facility dashboards

### 5.2 Postgres (Schema Sketch)
- dims:
  - dim_asset(id, name)
  - dim_hub(id, asset_id, name)
  - dim_facility(id, hub_id, type, name)
  - dim_well(id, facility_id, name, status, priority)
  - dim_tag(id, source, path, unit)
- facts:
  - fact_daily_production(well_id, date, oil_bbl_d, gas_mscf_d, water_bbl_d, bsw_pct, gor_scf_bbl, updated_at)
  - fact_hourly_timeseries(tag_id, ts, value, agg) — downsampled 1h, 1d
  - fact_terminal_kpi(terminal_id, ts, capacity_mmbbl, gross_mmbbl, ready_kbpd, rate_kbpd, endurance_d)
  - fact_gap_driver(id, facility_id, ts, stream, lost, unit, percent, priority, status)
  - fact_recommendation(id, constraint_id, ts, actions, projected_gain, actual_gain, status)
- meta:
  - ingestion_run(id, source, started_at, finished_at, status, watermark)
  - lineage(entity, source_ref, as_of)

Indexes: ts, (asset_id, hub_id, facility_id, well_id), partitions by day/month for large facts.

## 6. Integrations
- Energy Components (REST): read‑only; incremental by updated_at; retries/backoff; 30s timeouts
- Oracle fallback: python‑oracledb thin; pool; least privilege
- PI Web API: HTTPS/JSON; tag mapping; aggregate server‑side (1h/1d); cache latest
- SharePoint (Graph): app‑only auth; delta queries; metadata and links

### 6.1 Adapters (Ports/Adapters)
- Ports (interfaces): `EnergyComponentsPort`, `PiSystemPort`, `SharePointPort`
- Adapters: `EnergyComponentsRestAdapter`, `EnergyComponentsOracleAdapter`, `PiWebApiAdapter`, `SharePointGraphAdapter`
- Services depend on ports; adapters are swappable and testable

## 7. Security & Compliance
- AuthN/AuthZ: Entra ID (OIDC) + MSAL in SPA; backend JWT validation; RBAC by role
- Secrets: Key Vault; no secrets in code; env via App Service
- Network: VNet integration; private endpoints to data sources; NSGs and firewall rules
- Data: mask sensitive fields; retention policies; audit trails; PII avoidance

## 8. Observability & Reliability
- Health: `/healthz` (liveness), `/readyz` (readiness)
- Tracing: App Insights with correlation; structured JSON logs
- Metrics: request latency, error rates, cache hit ratio, job durations, freshness SLAs
- Resilience: timeouts, retries, circuit breakers per adapter; bulkhead isolation per service/adapters

## 9. Environments & Deployment
- Environments: dev, test, staging, prod
- CI/CD: GitHub Actions or Azure DevOps
  - Lint/type/test -> build -> deploy FE/BE
  - Contract checks (OpenAPI/Zod) in CI
- Versioning: `/api/v1`; additive changes preferred; breaking → `/api/v2`

## 10. Phased Delivery Plan (Summary)
- P1 Contracts & Mocks: stabilize schemas/handlers; FE integrated (current)
- P2 EC + PI Read‑only: ingest dims/daily + PI aggregates; KPIs from Postgres/Redis
- P3 Terminals & Pipelines: terminal KPIs, ETA; pipeline constraints
- P4 Predictive & Triage: forecasts, gap drivers, alerts
- P5 Optimization & Simulation: recommended actions, what‑if scenarios; outcome tracking
- P6 Hardening: auth, APIM policies, SLO dashboards, governance

## 11. Configuration & Feature Flags
- Backend env:
  - CORE: APP_NAME, ENV, PORT, LOG_LEVEL, CORS_ALLOWED_ORIGINS
  - EC REST: EC_API_BASE_URL, EC_API_CLIENT_ID, EC_API_CLIENT_SECRET, EC_API_SCOPE, EC_API_TIMEOUT_SECONDS
  - EC Oracle: EC_DB_HOST, EC_DB_SERVICE_NAME, EC_DB_USER, EC_DB_PASSWORD
  - PI: PI_BASE_URL, PI_AUTH_MODE, PI_USERNAME/PI_PASSWORD or PI_CLIENT_ID/PI_CLIENT_SECRET
  - SharePoint: SP_TENANT_ID, SP_CLIENT_ID, SP_CLIENT_SECRET, SP_GRAPH_SCOPE
  - Cache/DB: REDIS_URL, DATABASE_URL
  - Observability: APPLICATION_INSIGHTS_CONNECTION_STRING
- Frontend env:
  - VITE_API_BASE_URL, VITE_USE_MSW, VITE_PREVIEW_MSW

## 12. Data Contracts & Units
- Facilities (non‑terminal): maxCapacity, businessTarget, currentProduction, deferment; units per network
- Terminals: capacity (MMbbl), gross stock (MMbbl), ready crude (kbbl/d), production rate (kbbl/d), endurance (days)
- Wells (table): potential EC, ML rate, current, choke, FTHP/FTT, BSW, GOR, lastTest
- Flared gas: always present as KPI default; documented in schemas

## 13. Risks & Mitigations
- Upstream outages → cached fallbacks; clear freshness stamps; degraded UI states
- PI data volume → aggregate on ingest; avoid raw storage; partitioned facts
- Auth complexity → start unauthenticated; integrate Entra ID before staging/prod
- Data drift → contract tests; schema versions; example payloads

## 14. Open Items
- Finalize EC REST endpoints and auth model with the vendor team
- Confirm PI Web API auth (Basic/NTLM/OAuth) and available tag sets
- Agree DB provider (Azure Postgres Flexible Server vs SQL Server) per enterprise standards

---
This SAD is the primary reference. Major choices are captured as ADRs (e.g., Postgres app store, caching strategy, PI aggregation policy). See also PHASING.md for milestone details. 