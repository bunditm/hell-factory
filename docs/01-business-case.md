---
title: Business Case
last_updated: 2026-06-05
status: draft
---

# Business Case

## Problem Statement

Our multi-agent development team (Hermes + 4 specialized agents: frontend-dev, backend-dev, devops, qa-engineer) operates entirely via Discord with no visual representation of agent activity. Understanding what each agent is doing requires reading text logs — there's no "at a glance" view of team status.

Other teams face the same problem: multi-agent systems are black boxes. You know you launched agents, but you can't *see* them working.

## Business Opportunity

**Visual agent management** — turn the terminal into a living office where agents are characters that walk around, sit at desks, and show their current task through animation.

Value proposition: *"Managing AI agents should feel like playing the Sims — but the results are real software built."*

Market timing: pixel-agents (8.1k stars), agentroom (2.6k stars), and myvirtualoffice.ai all validate demand. Hermes integration is the gap — no existing solution visualizes Hermes Agent activity.

## Target Users

| User / Stakeholder | Role | What they need |
|---|---|---|
| **Dev Lead** (Ton/Bunditm) | Primary operator | At-a-glance team status, identify blockers, redirect agents |
| **Product Manager** | Observer | Watch progress without reading logs |
| **Developer** | Human collaborator | See which agent is working on what, coordinate hand-offs |

## Success Metrics

| Metric | Target | How to Measure |
|---|---|---|
| Agent status accuracy | >90% correct state within 2s | Compare canvas state vs actual agent state |
| Page load time | <3s on VPS | Performance monitoring |
| Team adoption | Used daily within 1 week | Usage observation |
| Zero confusion about agent status | No "which agent is doing what?" questions | Feedback from Ton/Bunditm |

## Constraints & Assumptions

**Constraints:**
- Must run on same VPS as Hermes (port 9443 subdomain or similar)
- Hermes plugin must not break existing agent functionality
- Real-time update latency < 2 seconds

**Assumptions:**
- Hermes exposes enough state to detect agent activity
- WebSocket/SSE is feasible from Hermes plugin
- Canvas 2D performance is sufficient for 6+ agents

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hermes doesn't expose enough state | Medium | High | Plugin approach: monitor same sources Hermes uses (memory, active tools, session logs) |
| Real-time sync complexity | Medium | Medium | Start with SSE (simpler), upgrade to WebSocket if needed |
| Pixel art asset licensing | Low | Low | Use MIT-licensed Metro City sprites + self-drawn furniture |
| Performance at scale | Low | Medium | Sprite caching + viewport culling (proven in agentroom) |

## Related Documents

- [PRD →](02-prd.md)
- [Architecture Design →](03-architecture.md)