# React + Material-UI Plugin

Claude Code plugin for React 18+ applications using Material-UI v7.

## Features

### Skills

**frontend-dev-guidelines** - Comprehensive React/TypeScript development patterns

Includes modern patterns:
- React.FC<Props> pattern with TypeScript
- Lazy loading with React.lazy() and Suspense
- useSuspenseQuery for data fetching (TanStack Query)
- MUI v7 Grid with size={{}} props (NOT xs/md properties)
- Inline styling with sx prop
- TanStack Router patterns
- Features directory structure
- Loading and error state handling
- Performance optimization patterns

### Agents

**frontend-error-fixer** - Debug and fix frontend/browser errors

Specializes in:
- TypeScript compilation errors
- React runtime errors
- Browser console errors
- MUI component issues
- Build-time errors

## Installation

```bash
claude-code-cli init --frontend react-mui
```

Or add to existing installation:

```bash
claude-code-cli plugin install react-mui
```

## Auto-Activation

This skill activates when:

**Keywords:** component, react, UI, MUI, Material-UI, Grid, styling, frontend, form, modal, dialog

**Intent Patterns:**
- "create a component"
- "add a page"
- "style this component"
- "implement routing"

**File Patterns:**
- Editing .tsx files in frontend directories
- Files importing from '@mui/material'
- Files using React.FC or useSuspenseQuery

## Tech Stack

- **React:** 18+
- **Material-UI:** v7
- **TypeScript:** 5+
- **TanStack Query:** For data fetching
- **TanStack Router:** For routing

## Key Patterns

### Components

```typescript
import React from 'react';

export const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  return <div>{title}</div>;
};
```

### Data Fetching

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';

export const DataComponent: React.FC = () => {
  const { data } = useSuspenseQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
  });

  return <div>{data.map(item => ...)}</div>;
};
```

### MUI v7 Grid

```typescript
import { Grid } from '@mui/material';

<Grid container spacing={2}>
  <Grid size={{ xs: 12, md: 6 }}>
    Content
  </Grid>
</Grid>
```

## Related Plugins

- **sentry** - Error tracking integration
- **shadcn** - Alternative UI component library

## Documentation

See `skills/frontend-dev-guidelines/SKILL.md` for complete documentation.
