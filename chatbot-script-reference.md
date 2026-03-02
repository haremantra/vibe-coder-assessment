# Chatbot Script Reference — Extracted for System Prompt

## Scoring Logic Table
| Attribute | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|
| 1. Problem Framing | Started building immediately, no pre-work | Wrote goal/problem statement | Decomposition + constraints + non-goals | Challenged problem framing with evidence |
| 2. Architecture Selection | Used what AI gave, no alternatives | Compared 2-3 options, names one advantage | Documented tradeoffs across dimensions | First-principles/hybrid design with competitive rationale |
| 3. Scope Discipline | No boundary defined, built until done | Had feature list upfront, some drift | Documented in-scope AND out-of-scope with justification | Stopping decision based on data/diminishing returns |
| 4. Iteration Methodology | Re-prompted until it worked, no root cause | Described symptoms, verified fix | Traced root cause, analyzed before fixing | Formal work items, options analysis, before/after measurement |
| 5. Testing & Validation | Manual only or zero tests | 10+ unit tests, core happy path | Integration + real data + edge cases | Tracked metrics over time, statistical confidence |
| 6. Documentation | Code only, empty README | README with setup + usage + comments | Multiple docs: architecture + design rationale | Audience-differentiated: technical + business + ops |
| 7. Domain Grounding | Treated as generic software problem | Used domain terminology, aware of constraints | Researched standards, compared to existing solutions | Systematic review, novel contribution identified |
| 8. Production Orientation | Hardcoded paths, won't run elsewhere | Dependencies documented, another dev can run | CLI/API + error handling + integration points | Deployment config + monetization/business model |

## Tier Interpretation Text
- Novice (8-13): Successfully generating working code with AI but leaning on AI judgment. Start writing tests.
- Practitioner (14-19): Reviewing, iterating, understanding. Growth edge: proactive architecture. Write a design doc before next project.
- Senior (20-25): Architects before prompting, documents decisions. Growth edge: broadening impact. Publish an artifact.
- Principal (26-32): Top tier, founding engineer level. Growth edge: execution and scale. Ship something others use.
