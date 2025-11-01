# MUI Kit

Material-UI v7 component library patterns including sx prop styling and theme integration.

## What This Kit Provides

**Skill:** `mui`

Covers:
- MUI component usage (Box, Grid, Typography, Button, etc.)
- sx prop styling patterns
- Theme integration and customization
- Responsive design with breakpoints
- Forms and validation
- Common MUI patterns and utilities

## Auto-Detection

This kit is automatically detected if your project has MUI in `package.json`:

```json
{
  "dependencies": {
    "@mui/material": "^7.0.0"
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
npx claude-code-setup --kit mui,react
```

## Dependencies

**Requires:** `react` kit

MUI is a React component library, so React patterns are needed.

## Documentation

See [skills/mui/SKILL.md](skills/mui/SKILL.md) for complete patterns and examples.

## Tech Stack

- Material-UI v7+
- React 18+
- TypeScript
- sx prop styling system
