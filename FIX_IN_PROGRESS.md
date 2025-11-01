# Fix In Progress: Progressive Disclosure Resources

**Status:** PARTIAL - React complete, MUI/Node.js/TanStack Router in progress
**Started:** 2025-11-01
**Issue:** SKILL.md files reference non-existent resources/ files

## The Real Problem (User Was Correct)

I initially thought empty resources/ directories were "sloppy placeholders" to delete. **WRONG**.

The Reddit post and Claude docs state:
1. **SKILL.md files MUST be under 500 lines**
2. **Detailed content goes in resources/** (progressive disclosure)
3. **All referenced resources MUST exist**

## Current State

### Over 500-Line Limit:
- Node.js: 571 lines (71 over)
- TanStack Router: 520 lines (20 over)
- MUI: 515 lines (15 over)

### Under Limit But References Resources:
- React: 459 lines - References 4 resource files
- MUI: 515 lines - References 3 resource files

## What I've Completed

### ✅ React Kit (459 lines → stays under 500)
Created all 4 referenced resource files:
- `resources/component-patterns.md` - Compound components, render props, HOCs, custom hooks
- `resources/performance.md` - React.memo, useMemo, useCallback, code splitting, virtualization
- `resources/typescript-patterns.md` - Props typing, generics, discriminated unions, utility types
- `resources/hooks-patterns.md` - 15+ custom hooks (useToggle, useDebounce, useAsync, etc.)

### 🔄 MUI Kit (515 lines → need to get under 500)
Created 1 of 3 resources:
- ✅ `resources/styling-guide.md` - sx prop patterns, theme integration, responsive styles

**Still TODO:**
- `resources/component-library.md` - Component examples and patterns
- `resources/theme-customization.md` - Theme setup and customization
- **Trim SKILL.md by 15+ lines** to get under 500

## What Still Needs Doing

### Node.js Kit (571 lines → need <500)
**Need to create resources/ and move 71+ lines**

Candidates for extraction:
- Detailed async patterns
- Stream processing examples
- Error handling patterns
- Performance optimization techniques

### TanStack Router Kit (520 lines → need <500)
**Need to create resources/ and move 20+ lines**

Candidates for extraction:
- Advanced routing patterns
- Route guards and middleware
- Search params patterns

### Other Kits
Express (448), Prisma (485), TanStack Query (469) are all under 500 lines.
Should still create resources/ directories for future expansion but not urgent.

## Lessons Learned

1. **Progressive disclosure is NOT optional** - It's a core principle
2. **500-line limit is HARD** - Not a suggestion
3. **All promises must be kept** - If SKILL.md references a file, that file MUST exist
4. **Test end-to-end** - Should have installed and verified all links work

## Next Steps

1. Complete MUI (2 more resources + trim SKILL.md)
2. Handle Node.js (create resources, move 71 lines)
3. Handle TanStack Router (create resources, move 20 lines)
4. Verify all links work
5. Test installation end-to-end
6. Commit with detailed explanation

## Why This Matters

When a user installs the kits and Claude activates a skill:
- If resources don't exist → broken links → loss of credibility
- If SKILL.md > 500 lines → context pollution → poor performance
- Progressive disclosure ensures skills are **lean** and **complete**

---

**Current Commit:** Includes React resources (complete), MUI styling-guide (1/3)
**Next Commit:** Will include complete MUI, Node.js, and TanStack Router resources
