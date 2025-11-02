# Prisma Kit

Prisma ORM patterns for type-safe database access with TypeScript.

## What This Kit Provides

**Skill:** `prisma`

Covers:
- Prisma Client usage patterns
- Repository pattern for data access
- Transaction patterns (simple and interactive)
- Query optimization (select, include)
- N+1 query prevention
- Relations and nested writes
- Error handling (P2002, P2003, P2025)
- TypeScript patterns with Prisma types

## Auto-Detection

This kit is automatically detected if your project has Prisma in `package.json` or has a Prisma schema:

```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0"
  }
}
```

Or:
```
prisma/schema.prisma exists
```

## Installation

Auto-detected projects:
```bash
npx claude-code-setup --yes
```

Explicit installation:
```bash
npx claude-code-setup --kit prisma,nodejs
```

## Dependencies

**Recommended:** `nodejs` kit

Prisma works best with Node.js backend architecture patterns.

Works well with:
- `express` - Express.js API endpoints

## Documentation

See [skills/prisma/SKILL.md](skills/prisma/SKILL.md) for complete patterns and examples.

## Tech Stack

- Prisma 5+
- TypeScript
- PostgreSQL/MySQL/SQLite/etc.
- Type-safe database access
