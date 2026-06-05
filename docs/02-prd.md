---
title: Product Requirements Document (PRD)
last_updated: 2026-06-05
status: draft
---

# Product Requirements Document

## Product Overview

Hell Factory is a web-based virtual office that visualizes Hermes Agent team activity as pixel art characters in real-time. It deploys alongside Hermes Agent on the VPS and provides a browser-accessible canvas showing agent status — what they're doing, where they are, and whether they need attention.

## User Stories

| # | User Story | Priority |
|---|-----------|----------|
| US-001 | As Dev Lead, I want to see all 5 agents at a glance so I can quickly assess team status | Must |
| US-002 | As Dev Lead, I want to see which agent is actively working vs idle so I know where work is happening | Must |
| US-003 | As Dev Lead, I want to see what task each agent is doing so I can coordinate without asking | Must |
| US-004 | As Dev Lead, I want agents to animate (typing, reading, walking) so I can trust the visual feedback | Must |
| US-005 | As Dev Lead, I want a speech bubble when agent is waiting for my approval so I notice quickly | Must |
| US-006 | As Dev Lead, I want to zoom in/out so I can see the office at different scales | Should |
| US-007 | As Observer, I want to see Work Room / Idle Room split so I understand agent workload distribution | Should |
| US-008 | As Dev Lead, I want sub-agents (spawned by Task tool) to appear as linked characters so I see full team | Could |

## Functional Requirements

### Core (MVP)

| ID | Requirement | Description | Priority |
|---|---|---|---|
| FR-001 | Agent Status API | Hermes plugin exposes agent state via internal HTTP endpoint | Must |
| FR-002 | Canvas Office | HTML5 Canvas rendering 2D office with floor, furniture, walls | Must |
| FR-003 | Agent Characters | Pixel art characters (32×32 sprites) for each Hermes profile | Must |
| FR-004 | State Animation | Characters animate based on state: idle (static), walk (4-frame), type/read (2-frame) | Must |
| FR-005 | BFS Pathfinding | Characters walk between seats using BFS on grid | Must |
| FR-006 | Work/Idle Rooms | Office split into Work Room (active agents) and Idle Room (inactive agents) | Must |
| FR-007 | Real-time Sync | SSE/WebSocket from Hermes plugin to web app for <2s latency | Must |
| FR-008 | Office Layout Editor | Drag-and-drop furniture placement, floor color customization | Should |
| FR-009 | Sub-agent Visuals | Spawn child characters linked to parent agent | Could |

### Non-Functional Requirements

| ID | Category | Requirement | Target |
|---|---|---|---|
| NFR-001 | Performance | Canvas renders at 60fps with 6 agents | 60fps |
| NFR-002 | Latency | Agent state updates appear within 2 seconds | <2s |
| NFR-003 | Availability | Runs on VPS alongside Hermes, accessible via subdomain | 99% |
| NFR-004 | Accessibility | Keyboard navigation for zoom, pan | WCAG 2.1 AA |

## Out of Scope (v1)

- Audio notifications (sound effects)
- Session search / transcript browsing (agentroom feature)
- 3D or VR rendering
- Mobile-responsive layout (desktop first)
- Authentication (internal VPS access only)

## Dependencies

| Dependency | Type | Status | Notes |
|---|---|---|---|
| Hermes Agent | Internal | Available | Plugin API surface TBD |
| Next.js | External | Available | npm install |
| Metro City sprites | External | Available | MIT license, included |
| VPS port 9443 | Internal | Available | Nginx already configured |

## Milestones / Phases

| Phase | Scope | Status |
|---|---|---|
| MVP | Agent status API + Canvas office + 4-6 characters + Work/Idle rooms | 🚧 In Progress |
| V2 | Office editor + speech bubbles + sub-agents | 📋 Planned |
| V3 | Multi-office support + session history | 📋 Future |

## Open Questions

- [ ] How does Hermes plugin detect agent state? (memory, tool hooks, session files?)
- [ ] Should the canvas be embedded in Hermes dashboard or separate subdomain?
- [ ] What port should the web app use on VPS?

## Related Documents

- [Business Case →](01-business-case.md)
- [Architecture Design →](03-architecture.md)
- [Breakdown & Design →](04-breakdown.md)