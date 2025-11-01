# TanStack Query Kit

TanStack Query v5 data fetching patterns with useSuspenseQuery and cache management.

## What This Kit Provides

**Skill:** `tanstack-query`

Covers:
- useSuspenseQuery (primary pattern)
- useQuery (legacy pattern)
- Mutations and cache updates
- Query keys and organization
- API service patterns
- Error handling with Suspense
- Optimistic updates

## Auto-Detection

This kit is automatically detected if your project has TanStack Query in `package.json`:

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0"
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
npx claude-code-setup --kit tanstack-query,react
```

## Dependencies

**Requires:** `react` kit

TanStack Query is a React data fetching library.

## Documentation

See [skills/tanstack-query/SKILL.md](skills/tanstack-query/SKILL.md) for complete patterns and examples.

## Tech Stack

- TanStack Query v5+
- React 18+
- TypeScript
- Suspense-first patterns
