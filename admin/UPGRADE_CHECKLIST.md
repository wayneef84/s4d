# Library Upgrade Checklist

**Version:** 1.0
**Created:** 2026-01-17
**Purpose:** Step-by-step procedure for upgrading a game's library dependency

---

## Before You Start

### Prerequisites
- [ ] You have a specific game you want to upgrade
- [ ] You know which library needs upgrading
- [ ] You have time to test thoroughly after upgrade

### Information Gathering
- [ ] Current library version (from game's `INFO.md`)
- [ ] Latest library version (from root `INFO.md`)
- [ ] Changelog (from library's `INFO.md`)
- [ ] Breaking changes (if major version bump)

---

## Phase 1: Pre-Upgrade Assessment

### Step 1: Read the Changelog
Location: `[library-path]/INFO.md` → Changelog section

**Check for:**
- [ ] New features added
- [ ] Bug fixes
- [ ] Breaking changes (API changes)
- [ ] Deprecations
- [ ] Performance improvements

**Questions to ask:**
- Does this game use any changed APIs?
- Will this game benefit from new features?
- Are there any deprecation warnings to address?

---

### Step 2: Determine Upgrade Type

| Type | Version Change | Risk Level | Time Estimate |
|------|----------------|------------|---------------|
| Patch | x.y.Z | Low | 5-10 min |
| Minor | x.Y.0 | Low-Medium | 15-30 min |
| Major | X.0.0 | High | 1-4 hours |

---

### Step 3: Check for Migration Plan

**If Major Version Upgrade:**
- [ ] Migration plan exists in `admin/migrations/`
- [ ] Read migration plan thoroughly
- [ ] Understand all breaking changes
- [ ] Estimate effort per game

**If No Migration Plan:**
- [ ] Alert user: "Major version upgrade needs migration plan"
- [ ] Offer to create migration plan first
- [ ] Don't proceed without plan

---

## Phase 2: Backup & Branching

### Step 4: Create Safety Branch (Recommended)

```bash
# Create branch for this upgrade
git checkout -b upgrade/[game]-[library]-v[X.Y.Z]

# Example:
git checkout -b upgrade/war-shared-v1.1.0
```

**Why branch?**
- Easy rollback if upgrade fails
- Can test without affecting main branch
- Safe to experiment

---

### Step 5: Document Current State

**Take notes:**
- [ ] Current library version: vX.Y.Z
- [ ] Game is currently working: Yes/No
- [ ] Any known issues: [List]
- [ ] Date started: YYYY-MM-DD

---

## Phase 3: Code Changes

### Step 6: Update Game's INFO.md

**File:** `[game-path]/INFO.md`

**Changes:**
1. **Dependencies Table:**
   ```markdown
   | Library | Version | Status | Notes |
   |---------|---------|--------|-------|
   | path/to/library | vA.B.C | ✅ Updated | Brief note |
   ```
   Change version from old → new

2. **Upgrade Notes:**
   ```markdown
   ### Upgrade History
   - **2026-01-17:** Upgraded Shared from v1.0.0 → v1.1.0 - [reason]
   ```

3. **Last Updated:**
   ```markdown
   **Last Updated:** 2026-01-17
   ```

**Checklist:**
- [ ] Version number updated in dependencies table
- [ ] Upgrade history entry added
- [ ] Last updated date changed
- [ ] Status indicator correct (✅)

---

### Step 7: Update Code (If Needed)

**For Patch Upgrades:**
- [ ] Usually no code changes needed
- [ ] Just update INFO.md

**For Minor Upgrades:**
- [ ] Check if new features are useful
- [ ] Optionally refactor to use new features
- [ ] No API changes to worry about

**For Major Upgrades:**
- [ ] Follow migration plan checklist
- [ ] Find/replace old APIs with new APIs
- [ ] Update method signatures if changed
- [ ] Remove usage of removed features
- [ ] Add usage of new required features

**Example (Major Upgrade):**
```javascript
// BEFORE (v1.x API)
var card = pile.give(0); // Old method name

// AFTER (v2.x API)
var card = pile.take(0); // New method name
```

**Checklist:**
- [ ] All breaking changes addressed
- [ ] Deprecated APIs replaced (if time)
- [ ] New required APIs implemented
- [ ] Code still readable and maintainable

---

## Phase 4: Testing

### Step 8: Smoke Test (Quick Verification)

**Time: 2-5 minutes**

- [ ] Open game in browser
- [ ] Check console for errors (none expected)
- [ ] Click through main menu
- [ ] Start a new game
- [ ] Play for 30 seconds
- [ ] Verify core functionality works

**If smoke test fails:**
- [ ] Note the error
- [ ] Check console logs
- [ ] Review code changes
- [ ] Fix issue or rollback

---

### Step 9: Functional Test (Thorough)

**Time: 10-30 minutes**

**Test all major features:**
- [ ] Feature 1: [Game-specific feature]
- [ ] Feature 2: [Game-specific feature]
- [ ] Feature 3: [Game-specific feature]
- [ ] Settings modal (if applicable)
- [ ] localStorage persistence (if applicable)
- [ ] Reset/restart functionality
- [ ] Win/lose conditions
- [ ] Edge cases (empty deck, max score, etc.)

**Check for regressions:**
- [ ] Old features still work
- [ ] No new bugs introduced
- [ ] Performance is same or better
- [ ] UI looks correct
- [ ] Animations work (if applicable)

---

### Step 10: New Features Test (If Minor/Major)

**If library added new features:**
- [ ] Identify new features in changelog
- [ ] Test new features work in library
- [ ] Consider using new features in game (optional)

**Example:**
- Library added `Pile.peek()` method
- Test: Call `pile.peek()` and verify it returns top card without removing it

---

## Phase 5: Commit & Finalize

### Step 11: Commit Changes

**If all tests pass:**

```bash
# Stage changes
git add [game-path]/INFO.md [game-path]/[other-files-if-any]

# Commit with clear message
git commit -m "chore([game]): Upgrade [Library] v[Old] → v[New]

- Update INFO.md dependencies
- [Any code changes made]

Tested:
- [Feature 1] ✅
- [Feature 2] ✅
- [Feature 3] ✅

No regressions found."
```

**Checklist:**
- [ ] All changed files staged
- [ ] Commit message follows convention
- [ ] Commit message lists tests performed
- [ ] Commit message documents outcome

---

### Step 12: Update Root INFO.md (If Last Game)

**If this is the last game to upgrade:**

Update `/INFO.md` project dependencies table to show all games are up-to-date:

```markdown
| Project | Shared Version | Status | Notes |
|---------|----------------|--------|-------|
| War | v1.1.0 | ✅ Up-to-date | Upgraded 2026-01-17 |
```

Change status from ⚠️ → ✅

---

### Step 13: Merge Branch (If Used)

```bash
# Switch to main
git checkout main

# Merge upgrade branch
git merge upgrade/[game]-[library]-v[X.Y.Z]

# Delete branch (optional)
git branch -d upgrade/[game]-[library]-v[X.Y.Z]
```

---

## Phase 6: Rollback (If Needed)

### If Upgrade Failed

**Step 14: Revert Changes**

```bash
# Option A: Revert last commit
git revert HEAD

# Option B: Hard reset to before upgrade
git reset --hard HEAD~1

# Option C: If on branch, just switch back
git checkout main
git branch -D upgrade/[game]-[library]-v[X.Y.Z]
```

---

### Step 15: Document Failure

**Add note to game's INFO.md:**

```markdown
### Upgrade Notes
**Last Checked:** 2026-01-17
**Available:** [Library] v1.1.0
**Reason for Deferring:** Upgrade caused [specific issue]. Will retry after [condition].
```

**Report issue:**
- [ ] Document error message
- [ ] Note what broke
- [ ] File issue with library maintainer (if library bug)
- [ ] Add TODO to retry upgrade later

---

## Quick Reference

### Patch Upgrade (x.y.Z)
1. Update INFO.md version
2. Smoke test (5 min)
3. Commit
**Total time: ~10 minutes**

### Minor Upgrade (x.Y.0)
1. Read changelog
2. Update INFO.md version
3. Optionally use new features
4. Functional test (15 min)
5. Commit
**Total time: ~30 minutes**

### Major Upgrade (X.0.0)
1. Read migration plan
2. Create safety branch
3. Update INFO.md version
4. Update code per migration checklist
5. Full functional test (30+ min)
6. Commit
7. Merge branch
**Total time: 1-4 hours**

---

## Troubleshooting

### Issue: Console errors after upgrade

**Diagnosis:**
- Check error message
- Look for undefined methods (API changed?)
- Look for wrong parameters (signature changed?)

**Fix:**
- Review breaking changes in changelog
- Update code to use new API
- Test again

---

### Issue: Tests pass but game behaves differently

**Diagnosis:**
- Behavior change may be intentional (check changelog)
- Or may be library bug (check issue tracker)

**Fix:**
- Read changelog for intentional changes
- If bug, revert and report issue
- If intentional, update game to match new behavior

---

### Issue: Performance degraded

**Diagnosis:**
- Profile with browser DevTools
- Check if library introduced expensive operations

**Fix:**
- Report performance regression to library maintainer
- Consider deferring upgrade until fixed
- Or optimize game code to compensate

---

## Tips & Best Practices

### Do's ✅
- ✅ Read changelog before upgrading
- ✅ Create safety branch for major upgrades
- ✅ Test thoroughly before committing
- ✅ Document upgrade in INFO.md
- ✅ Update root INFO.md when all games upgraded

### Don'ts ❌
- ❌ Upgrade without reading changelog
- ❌ Skip testing after upgrade
- ❌ Forget to update INFO.md
- ❌ Upgrade multiple games simultaneously (do one at a time)
- ❌ Commit failed upgrades

---

## Checklist Summary

**Pre-Upgrade:**
- [ ] Read changelog
- [ ] Determine upgrade type (patch/minor/major)
- [ ] Check for migration plan (if major)
- [ ] Create safety branch

**Upgrade:**
- [ ] Update game's INFO.md
- [ ] Update code (if needed)
- [ ] Run tests
- [ ] Verify no regressions

**Post-Upgrade:**
- [ ] Commit changes
- [ ] Update root INFO.md
- [ ] Merge branch (if used)
- [ ] Document any issues

---

**Checklist Version:** 1.0
**Last Updated:** 2026-01-17
**Related Docs:** DEPENDENCY_POLICY.md, MIGRATION_PLAN_TEMPLATE.md
