# Testing the Atomic Kit System

## Quick Test (Recommended)

### Test 1: React Project

```bash
# Create test React project
cd /tmp
mkdir test-react && cd test-react
echo '{"dependencies": {"react": "^18.0.0", "@mui/material": "^7.0.0", "@tanstack/react-query": "^5.0.0"}}' > package.json

# Run installer
npx github:blencorp/claude-code-infrastructure-showcase --yes

# Verify installed skills
ls .claude/skills/
# Expected: skill-developer, react, mui, tanstack-query
```

### Test 2: Express Project

```bash
# Create test Express project
cd /tmp
mkdir test-express && cd test-express
echo '{"dependencies": {"express": "^4.18.0", "@prisma/client": "^5.0.0", "typescript": "^5.0.0"}}' > package.json

# Run installer
npx github:blencorp/claude-code-infrastructure-showcase --yes

# Verify installed skills
ls .claude/skills/
# Expected: skill-developer, nodejs, express, prisma
```

### Test 3: Mixed Stack Project

```bash
# Create fullstack project
cd /tmp
mkdir test-fullstack && cd test-fullstack
echo '{"dependencies": {"react": "^18.0.0", "express": "^4.18.0", "@prisma/client": "^5.0.0"}}' > package.json

# Run installer
npx github:blencorp/claude-code-infrastructure-showcase --yes

# Verify installed skills
ls .claude/skills/
# Expected: skill-developer, react, nodejs, express, prisma
```

### Test 4: Interactive Mode

```bash
cd /tmp
mkdir test-interactive && cd test-interactive
echo '{"dependencies": {"react": "^18.0.0"}}' > package.json

# Run without --yes flag to see interactive prompts
npx github:blencorp/claude-code-infrastructure-showcase

# Should show:
# - Detected kits with Y/n prompts
# - Additional kits with y/N prompts
```

## Local Testing (Faster)

If you're in the repo directory:

```bash
# Test locally without npm
cd /tmp/test-react
/path/to/claude-code-infrastructure-showcase/claude-setup --yes
```

## Verification Checklist

After running installer, verify:

- [ ] `.claude/` directory created
- [ ] `.claude/skills/` contains expected skills
- [ ] Each skill has `SKILL.md` file
- [ ] `.claude/settings.json` exists
- [ ] `.claude/skills/skill-rules.json` exists
- [ ] `.claude/hooks/` contains 2 hook files
- [ ] `.claude/agents/` contains agent files
- [ ] No errors in output

## Check Skill Content

```bash
# Verify React skill exists and has content
cat .claude/skills/react/SKILL.md | head -20

# Should show YAML frontmatter with:
# name: react
# description: Core React 18+ patterns...
```
