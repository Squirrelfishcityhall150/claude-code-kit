# Claude Code CLI

A command-line tool to initialize and manage Claude Code infrastructure with framework-specific plugins.

## Features

- 🚀 **Quick Setup** - Initialize Claude Code in minutes with interactive prompts
- 🔌 **Plugin System** - Framework-specific skills and agents (React, Next.js, Express, etc.)
- 🎯 **Auto-Detection** - Automatically detects your project structure and framework
- 🛠️ **Modular** - Add only the components you need
- 📦 **Core Infrastructure** - Includes essential hooks and skill-developer skill

## Installation

```bash
npm install -g @claude-code/cli
```

## Quick Start

```bash
# Initialize in your project
cd your-project
claude-code-cli init

# Follow interactive prompts to select frameworks and plugins
```

## Commands

### `init` - Initialize Infrastructure

Initialize Claude Code infrastructure in your project with framework-specific plugins.

```bash
# Interactive mode (recommended)
claude-code-cli init

# With specific frameworks
claude-code-cli init --frontend react-mui --backend express

# Skip prompts, use defaults
claude-code-cli init --yes

# Only detect project structure
claude-code-cli init --detect-only
```

**Options:**
- `--frontend <framework>` - Frontend plugin (react-mui, nextjs, vue, svelte)
- `--backend <framework>` - Backend plugin (express, fastify, nextjs-api)
- `--plugins <plugins...>` - Additional plugins to install
- `--preset <name>` - Use preset configuration
- `-y, --yes` - Skip prompts, use defaults
- `-f, --force` - Overwrite existing .claude directory
- `--detect-only` - Only detect, don't install

### `add` - Add Components

Add individual skills, agents, commands, or hooks.

```bash
# Interactive mode
claude-code-cli add

# Add specific component
claude-code-cli add skill:frontend-dev-guidelines
claude-code-cli add agent:code-architecture-reviewer
claude-code-cli add command:dev-docs

# Add from plugin
claude-code-cli add --plugin react-mui
```

### `plugin` - Manage Plugins

List, install, uninstall, and create plugins.

```bash
# List available plugins
claude-code-cli plugin list

# List installed plugins
claude-code-cli plugin list --installed

# Install plugins
claude-code-cli plugin install react-mui express

# Uninstall plugin
claude-code-cli plugin uninstall react-mui

# Create new plugin scaffold
claude-code-cli plugin create my-framework

# Validate plugin
claude-code-cli plugin validate ./plugins/my-plugin
```

### `update` - Update Configuration

Update paths and configurations.

```bash
# Auto-detect and update paths
claude-code-cli update --detect

# Update path patterns only
claude-code-cli update --paths

# Upgrade plugins to latest
claude-code-cli update --upgrade
```

## Available Plugins

### Frontend

- **react-mui** - React 18+ with Material-UI v7
- **nextjs** - Next.js with App Router and Server Components
- **vue** - Vue 3 with Composition API
- **svelte** - Svelte and SvelteKit
- **shadcn** - shadcn/ui components

### Backend

- **express** - Express.js with TypeScript
- **fastify** - Fastify framework
- **nextjs-api** - Next.js API routes

### Tools

- **sentry** - Sentry error tracking integration
- **prisma** - Prisma ORM patterns

## Project Structure After Init

```
your-project/
├── .claude/
│   ├── settings.json                # Hook configuration
│   ├── settings.local.json          # Local overrides (gitignored)
│   │
│   ├── skills/
│   │   ├── skill-rules.json         # Skill trigger configuration
│   │   ├── skill-developer/         # Meta-skill for creating skills
│   │   ├── frontend-dev-guidelines/ # (if React/Next.js selected)
│   │   └── backend-dev-guidelines/  # (if Express selected)
│   │
│   ├── hooks/
│   │   ├── skill-activation-prompt.sh
│   │   ├── skill-activation-prompt.ts
│   │   ├── post-tool-use-tracker.sh
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── agents/
│   │   ├── code-architecture-reviewer.md
│   │   ├── frontend-error-fixer.md
│   │   └── ...
│   │
│   └── commands/
│       ├── dev-docs.md
│       └── ...
│
└── .claude-code-cli.json            # CLI configuration
```

## How It Works

### 1. Auto-Activation System

The CLI installs two essential hooks that make skills auto-activate:

- **skill-activation-prompt** - Reads `skill-rules.json` and suggests relevant skills based on:
  - Keywords in your prompt
  - Intent patterns (regex matching)
  - Files you're editing
  - Content patterns in files

- **post-tool-use-tracker** - Tracks file changes to maintain context awareness

### 2. Framework-Specific Skills

Each plugin provides:
- **Skills** - Domain knowledge (React patterns, Express best practices, etc.)
- **Agents** - Specialized autonomous tasks (error fixing, testing, etc.)
- **Trigger patterns** - When to activate for your framework

### 3. Progressive Disclosure

Skills follow the 500-line rule:
- Main `SKILL.md` - Quick reference and overview (<500 lines)
- `resources/` directory - Deep-dive documentation (<500 lines each)

Claude loads what it needs, when it needs it.

## Creating Custom Plugins

```bash
# Create plugin scaffold
claude-code-cli plugin create my-framework

# Edit plugin.json and add skills
cd plugins/my-framework

# Validate your plugin
claude-code-cli plugin validate
```

See [Plugin Development Guide](../docs/plugin-development.md) for details.

## Configuration

### CLI Config (`.claude-code-cli.json`)

Tracks installed plugins and custom paths:

```json
{
  "version": "1.0.0",
  "installedAt": "2025-11-01T00:00:00.000Z",
  "plugins": [
    {
      "name": "react-mui",
      "version": "1.0.0",
      "installedAt": "2025-11-01T00:00:00.000Z"
    }
  ],
  "customPaths": {
    "FRONTEND_DIR": "src",
    "BACKEND_DIR": "api"
  }
}
```

### Skill Rules (`.claude/skills/skill-rules.json`)

Controls when skills activate:

```json
{
  "skills": {
    "frontend-dev-guidelines": {
      "type": "guardrail",
      "enforcement": "block",
      "priority": "critical",
      "promptTriggers": {
        "keywords": ["component", "react", "mui"],
        "intentPatterns": ["(create|add).*(component|page)"]
      },
      "fileTriggers": {
        "pathPatterns": ["src/**/*.tsx"],
        "contentPatterns": ["from '@mui/material'"]
      }
    }
  }
}
```

## Troubleshooting

### Skills Not Activating

1. Check hook installation:
   ```bash
   cat .claude/settings.json
   ```

2. Verify hook permissions:
   ```bash
   ls -la .claude/hooks/*.sh
   chmod +x .claude/hooks/*.sh
   ```

3. Test skill-rules.json:
   ```bash
   cat .claude/skills/skill-rules.json | jq
   ```

### Plugin Conflicts

If two plugins provide the same skill:
```bash
# Uninstall one plugin
claude-code-cli plugin uninstall conflicting-plugin

# Or manually edit skill-rules.json
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md)

## License

MIT

## Links

- [Documentation](../docs)
- [Plugin Development Guide](../docs/plugin-development.md)
- [GitHub Repository](https://github.com/your-org/claude-code-infrastructure-showcase)
- [Issue Tracker](https://github.com/your-org/claude-code-infrastructure-showcase/issues)
