# Hell Factory

> Pixel art virtual office for AI agents — visualize Hermes Agent team activity in real-time.

## Quick Links

| Document | Purpose |
|----------|---------|
| [docs/README.md](docs/README.md) | Project wiki index |
| [docs/01-business-case.md](docs/01-business-case.md) | Why this project exists |
| [docs/02-prd.md](docs/02-prd.md) | What we're building |
| [docs/03-architecture.md](docs/03-architecture.md) | System design |
| [docs/04-breakdown.md](docs/04-breakdown.md) | Module design |
| [docs/05-code-structure.md](docs/05-code-structure.md) | Code layout |

## Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind + Canvas 2D
- **Backend**: Hermes Agent plugin (Node.js)
- **Rendering**: HTML5 Canvas 2D (pixel-perfect, integer zoom)
- **Real-time**: WebSocket / SSE (Hermes → web app)

## Project Status

**Phase 0 — Planning & Research** ✅ Complete
- Market analysis: pixel-agents, agentroom, myvirtualoffice.ai
- Canvas 2D rendering deep dive
- Integration strategy defined

**Phase 1 — MVP** 🚧 In Progress
- Hermes plugin (agent status API)
- Next.js web app skeleton
- Canvas game engine (game loop, sprites, BFS pathfinding)
- Basic office layout (Work Room + Idle Room)
- 4-6 agent character visualization

## Wiki (Local)

```bash
# Start wiki server
cd docs && npm install && node server.js

# Access via SSH tunnel
ssh -L 9130:localhost:9130 atto@157.254.192.79 -N
# Then open: http://localhost:9130
```

## License

MIT