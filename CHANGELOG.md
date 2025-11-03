# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-01

### Added
- Initial release of `claude-code-setup` automated installer
- Bash script that copies Claude Code infrastructure to your project
- Auto-detection for React, Express, and fullstack projects
- Interactive plugin selection prompts
- Support for `--yes` flag (auto-detect, no prompts)
- Support for `--force` flag (overwrite existing .claude)
- Support for `--help` flag
- Core infrastructure installation:
  - Essential hooks (skill-activation-prompt, post-tool-use-tracker)
  - skill-developer meta-skill
  - 6 framework-agnostic agents
  - 2 slash commands (dev-docs)
- Plugin system:
  - react-mui plugin (React 18+ with MUI v7)
  - express plugin (Express.js with TypeScript)
- Automatic skill-rules.json generation with detected paths
- Automatic settings.json creation with hook configuration
- Automatic .gitignore updates
- Hook dependency installation (npm install in .claude/hooks)
- Installation verification
- npm package distribution (installable via `npx claude-code-setup`)

### Technical Details
- 300 lines of bash (vs 18,000 lines of TypeScript that didn't run)
- Uses jq for JSON manipulation (graceful fallback if not available)
- Handles symlinks correctly for global npm installation
- Zero dependencies (bash + standard unix tools)
- Tested on React, Express, and fullstack projects
- Package size: 134 kB (64 files)

## [Unreleased]

### Added

- **Agent Auto-Activation System** - Agents now automatically suggest themselves based on user prompts
  - Added activation rules for all 7 core agents (code-architecture-reviewer, refactor-planner, code-refactor-master, documentation-architect, plan-reviewer, web-research-specialist, auto-error-resolver)
  - Extended `skill-activation-prompt.ts` hook to process both skills and agents
  - Installation script merges agent-rules fragments into `skill-rules.json`
  - Agents displayed separately from skills in hook output

- **auto-error-resolver Agent** - New agent for systematically fixing TypeScript and build errors
  - Detects and fixes type errors, module errors, compilation failures
  - Works with any build system (tsc, Vite, Next.js, webpack)
  - Provides structured progress reporting and verification

- **route-tester Skill** - Framework-agnostic HTTP API route testing skill (tech-agnostic)
  - REST API testing patterns for any backend framework
  - JWT cookie authentication support (as specified in Integration Guide)
  - HTTP testing fundamentals, authentication testing, integration testing guides
  - Works with Express, Next.js API Routes, FastAPI, Django, Flask, etc.

### Fixed

- **settings.json Overwrite Bug** - Installation now merges with existing `.claude/settings.json`
  - Creates backup before modifying (`settings.json.backup`)
  - Preserves existing hooks and configurations using jq
  - Fallback warning if jq not available

- **Stop Hooks Auto-Enabled** - Stop hooks now opt-in based on project detection
  - Detects monorepo (>3 package.json files) vs single-service projects
  - Only prompts for Stop hooks in monorepo environments
  - Warns about customization requirements (hardcoded service names)
  - Automatically skipped in `--yes` mode

- **Missing JSON Validation** - Installation now validates all generated JSON
  - Validates `settings.json` after creation/merge
  - Validates `skill-rules.json` after fragment merging
  - Exits with error if JSON validation fails

- **Broken dev/ Reference** - Fixed reference to deleted `dev/` directory in code-architecture-reviewer
  - Made reference optional with clear note about workflow pattern

### Removed

- **Duplicate skill-rules Fragments** - Removed 10 unused kit-level `skill-rules.fragment.json` files
  - Installation script only uses skill-level fragments (`skills/skill-name/skill-rules-fragment.json`)
  - Reduces confusion and maintenance burden
  - No functional impact (duplicates were unused)

### Technical Details

**Agent Activation Architecture:**
- Agents have `*-rules.json` files alongside `.md` definitions (flat structure, not in subdirectories)
- Follow same trigger structure as skills: keywords, intentPatterns, priority
- Hook displays agents separately: "💡 RECOMMENDED AGENTS" section
- Claude instructed to use Task tool (not Skill tool)

**Tech-Agnostic Skills (Integration Guide Compliance):**
- ✅ skill-developer - Exists in core
- ✅ route-tester - Created (JWT cookie auth, framework-agnostic)
- ⚠️ error-tracking - Replaced by auto-error-resolver agent (more powerful)

### Planned for Future
- Path customization flags (--frontend-dir, --backend-dir)
- Additional framework kits (Vue.js, Svelte, Angular)
- Windows support (if requested)
- Interactive path prompts (if requested)

[0.1.0]: https://github.com/blencorp/claude-code-infrastructure-showcase/releases/tag/v0.1.0
