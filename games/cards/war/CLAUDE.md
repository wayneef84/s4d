# War Card Game - Claude Instructions

## Overview
Build a War card game using the shared Card Engine in `/games/cards/shared/`.

## Architecture
- **Ruleset:** `war/ruleset.js` - Game rules, win conditions, war logic
- **UI:** `war/index.html` - Single-file game with inline CSS/JS
- **Shared:** Uses `shared/engine.js`, `shared/card.js`, `shared/pile.js`, `shared/deck.js`, `shared/card-assets.js`

## Game Rules
1. Deck split evenly between 2 players
2. Both flip top card simultaneously
3. Higher card wins both cards (goes to winner's pile)
4. **Tie = War:** Each player places 3 cards face-down, then 1 face-up. Higher face-up wins all
5. Nested wars allowed (tie during war triggers another war)
6. Game ends when one player has all cards (or opponent has none)

## State Machine
```
DEALING → PLAYER_TURN (flip) → RESOLUTION
                ↓ (tie)
          WAR_DEALING → RESOLUTION
                ↓ (tie during war)
          WAR_DEALING (recursive)
```

## Ruleset Implementation
```javascript
// war/ruleset.js
var WarRuleset = {
    name: 'War',
    minPlayers: 2,
    maxPlayers: 2,

    getDealSequence: function(gameState) {
        // Split deck evenly
    },

    getAvailableActions: function(gameState, actorId) {
        return ['flip']; // Only action is flip
    },

    resolveAction: function(gameState, actorId, action) {
        // Compare cards, handle war
    },

    checkWinCondition: function(gameState) {
        // Check if either player has 0 cards
    }
};
```

## UI Layout
```
┌─────────────────────────────┐
│     Opponent (26 cards)     │
│         [face-down]         │
│                             │
│    [Card]    vs    [Card]   │
│                             │
│         [face-down]         │
│      Player (26 cards)      │
│                             │
│        [Flip Card]          │
└─────────────────────────────┘
```

## Key Features
- Auto-play option (fast forward)
- War animation (3 cards face-down, then flip)
- Card count display for each player
- Win/lose celebration

## ES5 Compatibility
- Use `var` not `const`/`let`
- Use `function()` not arrow functions
- Use `.indexOf()` not `.includes()`
