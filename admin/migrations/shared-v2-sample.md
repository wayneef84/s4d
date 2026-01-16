# Shared Card Engine v1.x → v2.0 Migration Guide (SAMPLE)

**Created:** 2026-01-17
**Status:** SAMPLE ONLY - Not a real migration
**Library:** games/cards/shared
**Old Version:** v1.5.0
**New Version:** v2.0.0

---

## ⚠️ THIS IS A SAMPLE MIGRATION GUIDE

This file demonstrates what a real migration guide would look like when the Shared Card Engine releases a v2.0 with breaking changes.

**Use this as a template when creating real migration guides.**

---

## Overview

**Summary of Changes:**
This hypothetical v2.0 release refactors the Pile API for better clarity and adds required deck IDs to prevent card mixing.

**Affected Projects:**
- War - Currently on v1.0.0
- Blackjack - Currently on v1.0.0
- (Future games will start on v2.0)

**Estimated Effort:** Medium (1-2 hours per game)

---

## Breaking Changes

### 1. Pile.give() Renamed to Pile.take()

**What Changed:**
- Old: `pile.give(position)` - Awkward phrasing (pile "gives" a card)
- New: `pile.take(position)` - Clearer intent (you "take" a card from pile)

**Why It Changed:**
The verb "give" implied the pile was an actor. "Take" better represents the caller's action.

**Migration Steps:**
1. Find all occurrences of `.give(`
2. Replace with `.take(`
3. Verify parameters remain the same (position index)

**Example:**
```javascript
// BEFORE (v1.x API)
var card = playerHand.give(0); // Remove top card

// AFTER (v2.0 API)
var card = playerHand.take(0); // Remove top card
```

**Automated Find/Replace:**
```bash
# In game directory:
grep -r "\.give(" *.html *.js
# Then manually replace each occurrence
```

---

### 2. Deck.createFrom() Requires deckId Parameter

**What Changed:**
- Old: `Deck.createFrom(template, copies)` - deckId was optional
- New: `Deck.createFrom(template, copies, deckId)` - deckId is required

**Why It Changed:**
Prevents accidental card mixing between games/sessions. Every deck must have a unique ID.

**Migration Steps:**
1. Find all calls to `Deck.createFrom(`
2. Add third parameter: unique string ID
3. Use format: `[game-name]-deck-[instance]`

**Example:**
```javascript
// BEFORE (v1.x API)
var deck = Deck.createFrom(standardDeck, 1);

// AFTER (v2.0 API)
var deck = Deck.createFrom(standardDeck, 1, 'war-main-deck');
```

**Recommended deckId Format:**
- War: `'war-main-deck'`
- Blackjack: `'blackjack-shoe-1'`
- Multi-deck games: `'game-shoe-N'` where N = instance number

---

### 3. Player.hand is Now Player.hands[] Array

**What Changed:**
- Old: `player.hand` - Single Pile object
- New: `player.hands` - Array of Pile objects (multi-hand support)

**Why It Changed:**
Enables future features like Blackjack split hands, multi-player modes.

**Migration Steps:**
1. Find all references to `player.hand`
2. Replace with `player.hands[0]` (first hand)
3. If game needs multi-hand, use array iteration

**Example:**
```javascript
// BEFORE (v1.x API)
player.hand.receive(card);
var value = evaluateHand(player.hand.contents);

// AFTER (v2.0 API) - Single hand games
player.hands[0].receive(card);
var value = evaluateHand(player.hands[0].contents);

// AFTER (v2.0 API) - Multi-hand games
for (var i = 0; i < player.hands.length; i++) {
    var hand = player.hands[i];
    var value = evaluateHand(hand.contents);
    // ... process each hand
}
```

**Note:** Single-hand games just use `hands[0]` everywhere. Future multi-hand support requires game logic changes.

---

## New Features (Optional Upgrades)

### Feature 1: Pile.peek() Method

**What It Does:**
Returns the card at a position without removing it (read-only).

**How to Use:**
```javascript
var topCard = pile.peek(0); // Look at top card
// Card stays in pile
```

**Do You Need It?**
- ✅ Use if: You show cards without removing them (preview, opponent's visible cards)
- ❌ Skip if: You always remove cards when checking them

---

### Feature 2: Deck.stats() Method

**What It Does:**
Returns statistics about the deck (card count, suit distribution).

**How to Use:**
```javascript
var stats = deck.stats();
console.log(stats.totalCards); // 52
console.log(stats.suitCounts); // {HEARTS: 13, DIAMONDS: 13, ...}
```

**Do You Need It?**
- ✅ Use if: You display deck statistics, debug card counts
- ❌ Skip if: You only need basic card operations

---

## Deprecations

| Old API | Status | Replacement | Removed In |
|---------|--------|-------------|------------|
| `Pile.size` | Deprecated | `Pile.count` | v3.0.0 |
| `Deck.rebuild()` | Deprecated | `Deck.reset()` | v3.0.0 |

**Action Required:**
- Update now to avoid issues in v3.0
- Or wait until v3.0 migration

---

## Per-Game Migration Checklist

### War Game Migration

**Pre-Migration:**
- [ ] Read full changelog
- [ ] Review breaking changes above
- [ ] Create branch: `git checkout -b upgrade/war-shared-v2`

**Code Changes:**
- [ ] Update `games/cards/war/INFO.md` dependency: v1.0.0 → v2.0.0
- [ ] Find/replace: `pile.give(` → `pile.take(` (~6 occurrences expected)
- [ ] Update `WarRuleset.initializeGame()`:
  - Add deckId: `Deck.createFrom(template, 2, 'war-main-deck')`
- [ ] Update player references:
  - `player1.hand` → `player1.hands[0]` (~12 occurrences)
  - `player2.hand` → `player2.hands[0]` (~12 occurrences)
- [ ] Optional: Use `Pile.peek()` for card preview (if desired)

**Testing:**
- [ ] Smoke test: Start game, play 5 rounds
- [ ] Test: Win a round (cards go to graveyard)
- [ ] Test: War scenario (multiple cards played)
- [ ] Test: Endless mode (graveyard reshuffles)
- [ ] Test: Non-endless mode (game ends)
- [ ] Verify: No console errors
- [ ] Verify: localStorage persistence works

**Commit:**
- [ ] `git add games/cards/war/`
- [ ] `git commit -m "chore(war): Migrate to Shared v2.0.0"`
- [ ] `git checkout main && git merge upgrade/war-shared-v2`

---

### Blackjack Game Migration

**Pre-Migration:**
- [ ] Read full changelog
- [ ] Review breaking changes above
- [ ] Create branch: `git checkout -b upgrade/blackjack-shared-v2`

**Code Changes:**
- [ ] Update `games/cards/blackjack/INFO.md` dependency: v1.0.0 → v2.0.0
- [ ] Find/replace: `pile.give(` → `pile.take(` (~4 occurrences expected)
- [ ] Update `BlackjackRuleset.initializeGame()`:
  - Add deckId: `Deck.createFrom(template, 6, 'blackjack-shoe-1')`
- [ ] Update player references:
  - `player.hand` → `player.hands[0]` (~8 occurrences)
  - `dealer.hand` → `dealer.hands[0]` (~8 occurrences)
- [ ] Optional: Use `Pile.peek()` for dealer's face-up card

**Testing:**
- [ ] Smoke test: Place bet, deal hand, play round
- [ ] Test: Hit, Stand, Double Down
- [ ] Test: Player bust (dealer doesn't play)
- [ ] Test: Player blackjack
- [ ] Test: Push (tie)
- [ ] Test: Reshuffle when shoe depletes
- [ ] Verify: Bet calculations correct
- [ ] Verify: Balance updates correctly

**Commit:**
- [ ] `git add games/cards/blackjack/`
- [ ] `git commit -m "chore(blackjack): Migrate to Shared v2.0.0"`
- [ ] `git checkout main && git merge upgrade/blackjack-shared-v2`

---

## Rollback Plan

**If Migration Fails:**

1. **Revert Branch:**
   ```bash
   git checkout main
   git branch -D upgrade/[game]-shared-v2
   ```

2. **Restore INFO.md:**
   - Game stays on v1.5.0
   - Add note: "Upgrade to v2.0 attempted YYYY-MM-DD, failed due to [reason]"

3. **Report Issue:**
   - Document error in GitHub issue
   - Include console logs
   - Include steps to reproduce

---

## Testing Strategy

### Critical Paths (War)

- [ ] **Round Play**: Click Draw, cards flip, winner determined
- [ ] **War Scenario**: Tie triggers war, multiple cards dealt
- [ ] **Graveyard**: Won cards accumulate in graveyard
- [ ] **Reshuffle**: Graveyard returns to deck in endless mode
- [ ] **Game End**: Deck depletion triggers match end (non-endless)

### Critical Paths (Blackjack)

- [ ] **Betting**: Place bet, Deal button enabled
- [ ] **Dealing**: 2 cards to player, 2 to dealer (1 hidden)
- [ ] **Player Turn**: Hit/Stand/Double Down work correctly
- [ ] **Dealer Turn**: Dealer plays after player stands
- [ ] **Payout**: Win/lose/push handled correctly
- [ ] **Reshuffle**: Shoe reshuffles when low

---

## Migration Order

**Recommended:**
1. **War** - Simpler game, fewer code paths
2. **Blackjack** - More complex, bet after War validates migration

**Rationale:**
- War has fewer edge cases, easier to verify
- If War migration succeeds, Blackjack should be straightforward
- If issues found in War, fix before attempting Blackjack

---

## Timeline

| Date | Milestone | Status |
|------|-----------|--------|
| 2026-01-17 | Migration guide created | ✅ Done |
| TBD | War migrated | ⏳ Pending |
| TBD | Blackjack migrated | ⏳ Pending |
| TBD | All games on v2.0.0 | ⏳ Pending |

---

## Common Issues

### Issue 1: "pile.give is not a function"

**Symptoms:**
- Console error after upgrade
- Game crashes when trying to draw cards

**Cause:**
- Missed one or more `.give(` references
- Not all replaced with `.take(`

**Fix:**
```bash
# Find remaining occurrences:
grep -n "\.give(" games/cards/[game]/*.html

# Replace each one with .take(
```

---

### Issue 2: "Cannot read property 'contents' of undefined"

**Symptoms:**
- Error when accessing player.hand.contents

**Cause:**
- Forgot to change `player.hand` → `player.hands[0]`

**Fix:**
```bash
# Find all player.hand references:
grep -n "player\.hand\." games/cards/[game]/*.html

# Replace with player.hands[0].
```

---

### Issue 3: "deckId is required"

**Symptoms:**
- Error during Deck.createFrom()

**Cause:**
- Forgot to add deckId parameter

**Fix:**
```javascript
// Add third parameter:
Deck.createFrom(template, copies, 'game-unique-id')
```

---

## Questions & Answers

**Q: Can I skip this migration?**
A: Yes, v1.x will remain stable. But v2.0 enables future multi-hand features.

**Q: What if I don't need multi-hand support?**
A: Just use `player.hands[0]` everywhere. Single-hand games work fine.

**Q: Will v1.x get security updates?**
A: Critical security fixes only. New features only in v2.x.

**Q: Can I migrate incrementally?**
A: No. All breaking changes must be applied together (pile.give, deckId, hands array).

---

## Resources

- **Shared v2.0 Changelog:** `games/cards/shared/INFO.md`
- **Upgrade Checklist:** `admin/UPGRADE_CHECKLIST.md`
- **Dependency Policy:** `admin/DEPENDENCY_POLICY.md`

---

**Migration Plan Version:** 1.0 (SAMPLE)
**Created By:** Claude Sonnet 4.5
**Last Updated:** 2026-01-17

---

## Remember: This is a SAMPLE

This migration does NOT reflect real changes to the Shared library.

Use this as a **template** when:
- Shared library releases v2.0 with real breaking changes
- Any other library releases a major version
- You need to document a complex upgrade path
