# React Kit

Core React 18+ patterns including hooks, Suspense, lazy loading, and TypeScript.

## What This Kit Provides

**Skill:** `react`

Covers:
- React hooks (useState, useEffect, useCallback, useMemo)
- Suspense and lazy loading patterns
- Component structure and TypeScript patterns
- Performance optimization (React.memo, avoiding re-renders)
- Error boundaries
- Best practices and common mistakes

## Auto-Detection

This kit is automatically detected if your project has React in `package.json`:

```json
{
  "dependencies": {
    "react": "^18.0.0"
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
npx claude-code-setup --kit react
```

## Dependencies

**None** - React kit is standalone.

Works well with:
- `mui` - Material-UI components
- `tanstack-query` - Data fetching
- `tanstack-router` - Routing

## Documentation

See [skills/react/SKILL.md](skills/react/SKILL.md) for complete patterns and examples.

## Tech Stack

- React 18+
- TypeScript
- Modern patterns (Suspense, hooks, lazy loading)
