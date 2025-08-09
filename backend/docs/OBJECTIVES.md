# Production Intelligence Platform – Objectives & Vision

This document explains, in plain language, what the platform is, who it is for, why it matters, and what success looks like. It is intended for engineers, PMs, domain experts, and stakeholders across operations, planning, and leadership.

## What is it?
A single, unified web platform that monitors oil and gas production in real time, detects and explains production gaps, predicts upcoming issues, forecasts cargo readiness at terminals, and recommends optimized actions to improve outcomes. It supports drill‑down across the operational hierarchy from Asset → Production Hub → Facility → Network (oil, domestic gas, export gas, flared gas).

## Who is it for?
- Production Monitoring/PMC Engineers: day‑to‑day surveillance, gap detection, rapid response
- Performance Leads: targets, KPI tracking, performance reviews, deferment analysis
- Production Programmers & Technologists: optimization, simulation, scenario analysis
- Terminal Operations & Scheduling: cargo readiness, endurance, export planning
- Leadership: high‑level KPIs, trend insights, risk awareness, decision support

## The problems it solves
- Fragmented data and delayed insights across EC (Energy Components), PI System, SharePoint, and spreadsheets
- Manual, reactive gap analysis with inconsistent units and definitions
- Lack of early warning for constraints (flow assurance, equipment, power, feedstock)
- Limited visibility into when crude will arrive at terminals and cargo readiness
- No closed loop between recommendations and measured impact on performance

## What it does (capabilities)
- Monitor production in near real‑time with clear KPIs and drill‑down navigation
- Detect production gaps and explain likely drivers using rules + machine learning
- Predict upcoming gaps (when, where, why) with confidence and lead time
- Forecast terminal readiness: max capacity, gross stock, ready crude, production rate, endurance
- Estimate transit/arrival of crude from flowstations to terminals along the flow path
- Automatically run optimization algorithms when constraints are detected, and recommend actions
- Track the outcomes of recommendations to continuously improve suggestions (learning loop)
- Simulate “what‑if” scenarios to assess the impact of parameter changes before execution

## Domain scope (what we cover)
- Hierarchy (drill‑down path): Asset → Production Hub → Facility → Well
- Network is an overlay (not a hierarchy level): oil, domestic gas, export gas. It groups facilities (and wells) across hubs for cross‑cut analysis and constraint triage. Flared gas is always tracked as a KPI.
- Facility KPIs (non‑terminal): maxCapacity, businessTarget, currentProduction, deferment
- Terminal KPIs: maxCapacity (MMbbl), grossStock (MMbbl), readyCrude (kbbl/d), productionRate (kbbl/d), endurance (days)
- Well table (per facility) highlights: potential (EC), ML rate (predicted), current rate, choke setting, FTHP/FTT, last test (date, oil/gas/water, BSW, GOR)
- Reference: see `Master Data Requirements Table - Sheet1.csv` for the detailed attributes and sources used to populate these views.

## Data sources
- Energy Components (REST) for operational records, reconciled volumes, targets
- PI System (Web API) for time‑series tags and live telemetry
- SharePoint (Graph) for operational documents, approvals, and structured lists

## Users and primary journeys
- “See today’s performance”: Overview → Asset → Hub → Facility KPIs; identify issues
- “Find and explain gaps”: Gap analysis table and detail; drivers, impacted streams, timeline
- “Get ahead of problems”: Predictive alerts for time‑to‑breach and expected severity
- “Plan cargo/export”: Terminal overview; forecast endurance and ready crude vs. targets
- “Optimize and simulate”: Suggested actions; run scenarios; compare before/after metrics
- “Review outcomes”: Track recommendation adoption and realized impact; refine playbooks

## What the product is NOT (non‑goals)
- A replacement for the source systems (EC/PI/SharePoint) or their governance
- A generic BI dashboard without operational context or closed‑loop optimization
- An ad‑hoc modeling sandbox without traceability or approval workflows

## Success criteria (how we know it works)
- Reduced deferment and flaring; improved target attainment and throughput
- Earlier detection and mitigation of constraints (longer lead times, fewer surprises)
- Faster decision cycles: time from alert → action reduced measurably
- Accurate terminal readiness forecasts that improve export planning
- Recommendation adoption and positive realized impact tracked over time

## Design principles
- Contract‑first API and clear units/definitions; flared gas always present
- Opinionated, drill‑down UX with consistent KPIs and language
- Trustworthy: explainability, data lineage, and auditability
- Reliable and fast: resilient data access, caching, and graceful degradation
- Secure by default: least‑privilege access, secrets in vault, private networking

## MVP → Beyond (phased delivery)
1) MVP (Foundations)
   - Frontend SPA with KPIs, drill‑down, terminal overview, cargo schedule
   - Backend APIs with contract‑validated payloads; EC/PI/SharePoint adapters scaffolded
   - Manual gap analysis (rules), no ML yet; clean navigation and error states
2) Early Intelligence
   - Predictive alerts for gaps (nowcast/short‑term forecast)
   - Better gap drivers using combined rules + models; improved cargo/endurance forecast
3) Optimization & Simulation
   - Detect constraints automatically; run optimization; produce ranked recommendations
   - What‑if simulations across the flow path with parameter sweeps and constraints
4) Closed‑loop Learning
   - Outcome tracking for recommendations; reinforcement of best actions
   - Model monitoring, data drift detection, retraining workflows

## Governance & compliance
- Versioned APIs and schemas; documented KPIs and units
- Access control via Entra ID; audit logs for sensitive actions
- Data residency, retention, and masking per enterprise policy

## One‑page summary
A production intelligence platform that unifies data, detects and predicts gaps, forecasts cargo readiness, optimizes operations, and learns from outcomes—so teams can act earlier, export reliably, and continuously improve performance. 