# MYGYMAGENT — AI TASK STATE

> Persistent project state for ChatGPT/Claude/Codex. Read before major work and update after meaningful milestones.

## MASTER MISSION

Build **MyGymAgent** into an **AI-driven multi-tenant Gym Management SaaS platform**.

Strategic direction:

> **YDL operational depth + AdviceFit intelligence + MyGymAgent architecture, UX and AI-native ecosystem**

MyGymAgent must become an actual **AI-native Gym Operating System**, not merely a YDL clone and not merely a chatbot layered on top of gym software.

## PRODUCT VISION

The platform should eventually cover:

- Multi-tenant organization management
- Multi-location gym management
- Members
- Trainers / staff
- Personal training
- Workout programming
- Exercise library
- Attendance
- Memberships and packages
- Billing and payments
- Expenses and revenue
- Trainer commissions
- Inventory
- Leads / CRM / follow-ups
- Notifications and WhatsApp integrations
- Reports and analytics
- Dashboards
- RBAC and permissions
- AI agents
- AI analytics
- AI recommendations
- AI automation
- AI business intelligence

Long-term goal: a gym owner should be able to operate the entire gym through MyGymAgent while AI continuously analyzes the business and assists with decisions and operations.

## PRODUCT BENCHMARKS

### YDL
Benchmark for operational depth, gym workflows, PT, members, attendance, billing and workout management.

### AdviceFit
Benchmark for intelligence, AI capabilities, automation concepts and AI-assisted workflows.

### MyGymAgent
Our differentiators: AI-native architecture, multi-tenancy, premium UX, modern SaaS architecture, intelligent gym operations, AI agents, business intelligence and automation.

Do not blindly copy proprietary implementations. Extract useful product capabilities and architectural lessons, then build our own system.

## MULTI-TENANCY — NON-NEGOTIABLE

Tenant isolation is a core architectural requirement.

Every relevant database query, API, service, background job, AI operation, report, analytics calculation, notification and storage operation must respect tenant boundaries.

Conceptual hierarchy:

```text
Platform
   ↓
Organization / Tenant
   ↓
Locations
   ↓
Users / Staff
   ↓
Members
   ↓
Business Data
```

Tenant isolation must be enforced at appropriate layers: authentication, authorization, API, service layer, database, AI context, background jobs, reports, analytics, notifications and storage.

## AI-NATIVE PRINCIPLE

AI is not a cosmetic feature. Do not simply add "Ask AI" buttons.

Target flow:

```text
GYM DATA → DOMAIN / DATA LAYER → AI CONTEXT → AI AGENTS / INTELLIGENCE → INSIGHTS → RECOMMENDATIONS → AUTOMATION → ACTION
```

Potential AI capabilities include member churn/inactivity intelligence, attendance patterns, renewal prediction, PT progress and adherence analysis, trainer performance, revenue intelligence, expense anomalies, lead conversion, forecasting, follow-ups, reminders, renewal workflows, attendance alerts, task generation, WhatsApp assistance and a Gym Owner Copilot.

AI answers must use actual tenant data.

## NO FABRICATED DATA

Never fabricate revenue, member counts, churn percentages, AI metrics, KPIs, predictions, analytics or business numbers.

If required backend/database data is unavailable, use `—` or `Data unavailable`.

## CURRENT PROJECT STATE

### Current Phase
`FRONTEND STABILIZATION → PRODUCTION ARCHITECTURE BASELINE`

### Current Task
`Establish and maintain a verified project baseline before adding the next feature.`

### Current Subtask
`Track the stable frontend checkpoint and use it as the baseline for subsequent architecture work.`

### Status
`ACTIVE`

## COMPLETED WORK

Keep only verified completed work here. Add dates and evidence where possible.

- [x] Persistent anti-drift project state created
- [x] Master mission and product benchmarks documented
- [x] Frontend world-class UI work completed through the current V2 iteration
- [x] Members workspace redesigned
- [x] Member 360 redesigned
- [x] Sales OS / CRM redesigned
- [x] Finance OS redesigned
- [x] Frontend build/type errors from the V2 iteration resolved through iterative fixes
- [x] Stable frontend deployment checkpoint verified: `d4fbb19` on `feat/world-class-ui-v2`
- [ ] Architecture baseline documented
- [ ] Multi-tenancy audited
- [ ] Authentication audited
- [ ] Authorization / RBAC audited
- [ ] Core gym workflows audited
- [ ] AI architecture audited
- [ ] Frontend full audit completed
- [ ] Backend full audit completed
- [ ] Database audited
- [ ] Production deployment audited

## IN PROGRESS

### Current Work
`Production baseline and architecture continuity`

### Files / Modules Being Changed
`AI_TASK_STATE.md` is the persistent state source; application code changes require an explicit implementation task and verification.

### Expected Outcome
`Every subsequent task has a known starting point, verified baseline, single next action, and recorded result.`

## BLOCKERS

| Blocker | Severity | Impact | Owner / Action |
|---|---|---|---|
| No verified full-system architecture/security audit yet | P1 | Security and scalability decisions lack complete evidence | Perform evidence-based audit before major backend architecture changes |

## NEXT ACTION

There must be exactly **ONE primary next action**.

`Perform an evidence-based architecture baseline audit of the current MyGymAgent frontend and backend before implementing the next major feature.`

## IMPORTANT DECISIONS

| Decision | Status | Date | Reason |
|---|---|---|---|
| MyGymAgent is AI-driven | Active | 2026-08-24 | Core product mission |
| MyGymAgent is multi-tenant SaaS | Active | 2026-08-24 | Core architecture |
| YDL is an operational benchmark | Active | 2026-08-24 | Product depth |
| AdviceFit is an intelligence benchmark | Active | 2026-08-24 | AI capability |
| No fabricated AI metrics | Active | 2026-08-24 | Data integrity |
| Stable frontend checkpoint is `d4fbb19` on `feat/world-class-ui-v2` | Active | 2026-08-24 | Prevent regression while architecture work proceeds |
| Failed deployment history must remain tracked as regression evidence | Active | 2026-08-24 | Prevent repeated build/deployment mistakes |
| Audit before major architecture changes | Active | 2026-08-24 | Security, tenancy and data integrity |

## NON-NEGOTIABLE RULES

1. Multi-tenant architecture is mandatory.
2. Tenant data isolation is mandatory.
3. Never fabricate business or AI data.
4. Preserve existing production functionality.
5. Audit before changing architecture.
6. Evidence before claiming root cause.
7. Security before convenience.
8. Data integrity before UI polish.
9. Core gym operations before flashy AI.
10. AI must use real tenant data.
11. Never silently change an important architectural decision.
12. Never declare something verified without verification.
13. Never perform destructive database changes casually.
14. Never expose one tenant's data to another tenant.
15. Keep the current task separate from the master mission.

## AUDIT MODE

When the task is an audit, **DO NOT MODIFY CODE** unless explicitly instructed.

Every finding should ideally contain:

```text
Severity
Status: Confirmed / Likely / Possible / Unknown
Problem
Root Cause
Evidence
File
Function
Route
Database
Impact
Recommended Fix
```

Priorities: `P0 Critical`, `P1 High`, `P2 Medium`, `P3 Low`.

Never call a suspected issue a confirmed root cause without evidence.

## CODING MODE

When explicitly asked to implement:

1. Understand current architecture.
2. Identify affected files.
3. Preserve existing functionality.
4. Make the smallest safe change.
5. Avoid unnecessary refactoring.
6. Consider frontend/backend/database impact.
7. Consider tenancy and permissions.
8. Consider error handling.
9. Consider loading/empty/error states.
10. Verify the implementation.

## DATABASE RULES

Before database changes inspect schema, relationships, foreign keys, indexes, unique constraints, tenant boundaries, migrations, existing data and backward compatibility.

Do not casually drop tables, delete production data, remove columns, change constraints or rewrite migrations.

## SECURITY CHECKLIST

Always consider authentication, authorization, RBAC, tenant isolation, IDOR, API security, input validation, SQL injection, XSS, CSRF where relevant, secrets, file uploads, rate limiting, sensitive data exposure and audit logging.

For AI also consider prompt injection, tenant data leakage, unauthorized tool execution, excessive AI permissions and malicious instructions inside user-controlled data.

## AI AGENT CONTRACT

Every production AI agent should have:

```text
Identity
Purpose
Tenant Context
Permissions
Allowed Tools
Input
Output
Guardrails
Failure Handling
Auditability
```

Agents should receive minimum required permissions.

## CONVERSATION STATE

Long conversations may contain screenshots, errors, ideas, comparisons, experiments, temporary decisions, abandoned approaches and completed tasks.

Classify information as:

`ACTIVE REQUIREMENT` / `CURRENT TASK` / `IMPORTANT DECISION` / `COMPLETED` / `ABANDONED` / `EXPERIMENTAL` / `REFERENCE ONLY`

Only active requirements and important decisions should automatically affect current implementation.

## SIDE-QUEST CONTROL

A temporary issue does not become the product mission. A bug, UI request or AI feature remains a subtask of the master mission.

If the conversation moves to an unrelated topic, preserve project state and resume from the recorded current task.

## DRIFT RECOVERY

If the user says **"You are drifting"**, immediately stop and reconstruct:

```text
DRIFT RECOVERY

MASTER MISSION:
AI-driven multi-tenant Gym Management SaaS

CURRENT TASK:
...

WHAT WE WERE SUPPOSED TO DO:
...

WHAT I STARTED DOING:
...

WHERE I DRIFTED:
...

COMPLETED:
...

BLOCKED:
...

NEXT CORRECT ACTION:
...
```

Then continue only with the correct task.

## MILESTONE CHECKPOINT

After a meaningful milestone update:

```text
MYGYMAGENT CHECKPOINT

Master Mission:
AI-driven multi-tenant Gym Management SaaS

Completed:
...

Current:
...

Next:
...

Blocked:
...

Important Decisions:
...

Files / Modules Affected:
...

Verification:
...
```

## VERIFICATION RULE

Never say `DONE` simply because code was written.

Use appropriate verification: build, typecheck, lint, tests, API verification, database verification, UI verification, permission verification, tenant isolation verification and deployment verification.

If verification was not possible, say:

> Implementation completed, but verification is pending.

## COMMAND INTERPRETATION

| User Command | Mode |
|---|---|
| Audit | Analyze only |
| Analyze | Investigate, don't modify |
| Fix | Implement the required fix |
| Implement | Build requested feature |
| Go | Continue current task |
| Next | Move to next logical step |
| Stop | Stop immediately |
| Don't change anything | Read-only |
| Compare | Objective comparison |
| Explain | Explain only |

## FINAL MISSION LOCK

Regardless of conversation length:

> **MYGYMAGENT = AI-DRIVEN MULTI-TENANT GYM MANAGEMENT SAAS**

The assistant must continuously optimize toward this mission while respecting the current task.

A new idea does not automatically replace the mission. A bug does not become the mission. A UI request does not replace the architecture. An AI feature does not replace core gym operations.

## LAST UPDATED

`2026-08-24`

Current state: `FRONTEND STABILIZATION → PRODUCTION ARCHITECTURE BASELINE`
