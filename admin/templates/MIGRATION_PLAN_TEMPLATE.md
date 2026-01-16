# [Library Name] vX.0.0 → vY.0.0 Migration Guide

**Created:** YYYY-MM-DD
**Library:** [Library Name]
**Old Version:** vX.Y.Z
**New Version:** vA.B.C
**Migration Type:** Major / Minor / Patch

---

## Overview

**Summary of Changes:**
[Brief description of what changed and why]

**Affected Projects:**
- [Game 1] - Currently on vX.Y.Z
- [Game 2] - Currently on vX.Y.Z
- [Game 3] - Currently on vX.Y.Z

**Estimated Effort:** [Low/Medium/High per game]

---

## Breaking Changes

### 1. [Breaking Change Title]

**What Changed:**
- Old behavior: [Description]
- New behavior: [Description]

**Why It Changed:**
[Rationale for the breaking change]

**Migration Steps:**
1. Step 1: [Specific action]
2. Step 2: [Specific action]
3. Step 3: [Specific action]

**Example:**
```javascript
// BEFORE (Old API)
pile.give(0); // Remove top card

// AFTER (New API)
pile.take(0); // Remove top card
```

---

### 2. [Another Breaking Change]

[Same structure as above]

---

## New Features (Optional Upgrades)

### Feature 1: [Feature Name]

**What It Does:**
[Description of new feature]

**How to Use:**
```javascript
// Example code
```

**Do You Need It?**
- ✅ Use if: [Condition]
- ❌ Skip if: [Condition]

---

## Deprecations

| Old API | Status | Replacement | Removed In |
|---------|--------|-------------|------------|
| `oldMethod()` | Deprecated | `newMethod()` | vZ.0.0 |

**Action Required:**
- If you use these APIs, plan to migrate before vZ.0.0

---

## Per-Game Migration Checklist

### [Game 1] Migration

**Pre-Migration:**
- [ ] Read full changelog
- [ ] Review breaking changes
- [ ] Backup current state (git branch)

**Code Changes:**
- [ ] Update `INFO.md` dependency: vX.Y.Z → vA.B.C
- [ ] Find/replace: `oldAPI()` → `newAPI()` (X occurrences)
- [ ] Update [specific file]: [specific change]
- [ ] Update [another file]: [another change]

**Testing:**
- [ ] Test: [Critical path 1]
- [ ] Test: [Critical path 2]
- [ ] Test: [Critical path 3]
- [ ] Verify: No console errors
- [ ] Verify: All features work

**Commit:**
- [ ] Commit: `chore([game]): Migrate to [Library] vA.B.C`

---

### [Game 2] Migration

[Same structure as above]

---

### [Game 3] Migration

[Same structure as above]

---

## Rollback Plan

**If Migration Fails:**

1. **Revert Code Changes:**
   ```bash
   git checkout [branch-name]
   ```

2. **Restore INFO.md:**
   - Change dependency back to vX.Y.Z

3. **Test:**
   - Verify game works on old version

4. **Report Issue:**
   - Document what went wrong
   - File issue in project tracker

---

## Testing Strategy

### Critical Paths to Test

**[Game 1]:**
- [ ] Path 1: [Description]
- [ ] Path 2: [Description]

**[Game 2]:**
- [ ] Path 1: [Description]
- [ ] Path 2: [Description]

**[Game 3]:**
- [ ] Path 1: [Description]
- [ ] Path 2: [Description]

---

## Migration Order

**Recommended order:**
1. **[Game with lowest risk]** - Simplest game, easiest to test
2. **[Game with medium risk]** - More complex, but well-tested
3. **[Game with highest risk]** - Most complex, migrate last

**Rationale:**
- Start with low-risk to validate migration process
- Learn from first migration before tackling complex games
- If issues arise, most critical games are still working

---

## Timeline

| Date | Milestone | Status |
|------|-----------|--------|
| YYYY-MM-DD | Library vA.B.C released | ✅ Done |
| YYYY-MM-DD | Migration guide created | ✅ Done |
| YYYY-MM-DD | [Game 1] migrated | ⏳ Pending |
| YYYY-MM-DD | [Game 2] migrated | ⏳ Pending |
| YYYY-MM-DD | [Game 3] migrated | ⏳ Pending |
| YYYY-MM-DD | All games on vA.B.C | ⏳ Pending |

---

## Common Issues

### Issue 1: [Common Problem]

**Symptoms:**
- [What you'll see]

**Cause:**
- [Why it happens]

**Fix:**
- [How to resolve]

---

### Issue 2: [Another Problem]

[Same structure as above]

---

## Questions & Answers

**Q: Can I skip this migration?**
A: Yes, but [consequences]. Recommended to migrate by [date].

**Q: What if I don't use the changed APIs?**
A: Check the breaking changes list. If none affect your game, migration may be trivial.

**Q: Can I migrate incrementally?**
A: [Yes/No and explanation]

---

## Resources

- **Full Changelog:** `[Library]/INFO.md`
- **Library Docs:** `[Library]/README.md`
- **Migration Issues:** [Link to issue tracker]
- **Questions:** [Contact info]

---

**Migration Plan Version:** v1.0
**Created By:** [Claude/Gemini/Human]
**Last Updated:** YYYY-MM-DD
