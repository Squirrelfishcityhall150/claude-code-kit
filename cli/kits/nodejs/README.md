# Node.js Kit

Core Node.js backend patterns including async/await, error handling, and layered architecture.

## What This Kit Provides

**Skill:** `nodejs`

Covers:
- Async/await error handling patterns
- Layered architecture (routes → controllers → services → repositories)
- TypeScript patterns for backend
- Configuration management
- Dependency injection
- Testing strategies
- Error handling and logging

## Auto-Detection

This kit is automatically detected if your project has TypeScript and a backend framework in `package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "typescript": "^5.0.0"
  }
}
```

## Installation

Auto-detected projects:
```bash
npx claude-code-setup --yes
```

Explicit installation:
```bash
npx claude-code-setup --kit nodejs
```

## Dependencies

**None** - Node.js kit is standalone.

Works well with:
- `express` - Express.js framework patterns
- `prisma` - Database access patterns

## Documentation

See [skills/nodejs/SKILL.md](skills/nodejs/SKILL.md) for complete patterns and examples.

## Tech Stack

- Node.js 18+
- TypeScript 5+
- Modern async patterns
- Layered architecture
