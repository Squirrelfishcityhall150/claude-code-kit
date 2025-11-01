# TanStack Router Kit

TanStack Router file-based routing with type-safe navigation and route loaders.

## What This Kit Provides

**Skill:** `tanstack-router`

Covers:
- File-based routing structure
- Route parameters and search params
- Route loaders for data fetching
- Type-safe navigation
- Lazy loading routes
- Layouts and nested routes
- Route guards and authentication

## Auto-Detection

This kit is automatically detected if your project has TanStack Router in `package.json`:

```json
{
  "dependencies": {
    "@tanstack/react-router": "^1.0.0"
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
npx claude-code-setup --kit tanstack-router,react
```

## Dependencies

**Requires:** `react` kit

TanStack Router is a React routing library.

Works well with:
- `tanstack-query` - Data fetching in route loaders

## Documentation

See [skills/tanstack-router/SKILL.md](skills/tanstack-router/SKILL.md) for complete patterns and examples.

## Tech Stack

- TanStack Router v1+
- React 18+
- TypeScript
- File-based routing
