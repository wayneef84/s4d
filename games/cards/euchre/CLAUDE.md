# Euchre Card Game - Claude Instructions

## Overview
Build a Euchre card game using the shared Card Engine in `/games/cards/shared/`.

## Architecture
- **Ruleset:** `euchre/ruleset.js` - Game rules, trump, tricks, scoring
- **UI:** `euchre/index.html` - Single-file game with inline CSS/JS
- **Shared:** Uses `shared/engine.js`, `shared/card.js`, `shared/pile.js`, `shared/deck.js`, `shared/card-assets.js`

## Game Rules
1. **Players:** 4 players in 2 teams (partners sit across)
2. **Deck:** 24 cards (9, 10, J, Q, K, A of each suit)
3. **Deal:** 5 cards each, remaining card turned up for trump proposal
4. **Trump Selection:**
   - Dealer turns up top card
   - Players in turn can "order up" (accept trump) or pass
   - If all pass, dealer picks up card and discards one
   - Second round: players can name different trump or pass
   - If all pass again, dealer must name trump (stick the dealer)
5. **Play:**
   - Must follow suit if able
   - Trump beats non-trump
   - Left bower (Jack of same color as trump) is 2nd highest trump
   - Right bower (Jack of trump suit) is highest trump
6. **Scoring:**
   - 3-4 tricks = 1 point
   - 5 tricks (march) = 2 points
   - Going alone and winning 5 = 4 points
   - Euchre (defenders win) = 2 points to defenders

## Card Rankings (Trump Suit)
1. Right Bower (Jack of trump)
2. Left Bower (Jack of same color)
3. Ace of trump
4. King of trump
5. Queen of trump
6. 10 of trump
7. 9 of trump

## State Machine
```
DEALING → TRUMP_PROPOSAL → TRUMP_SELECTION → PLAYER_TURN → TRICK_RESOLUTION
                                                    ↓
                                              (5 tricks)
                                                    ↓
                                              ROUND_SCORING → GAME_CHECK
```

## Ruleset Implementation
```javascript
// euchre/ruleset.js
var EuchreRuleset = {
    name: 'Euchre',
    minPlayers: 4,
    maxPlayers: 4,

    config: {
        winningScore: 10,
        stickTheDealer: true
    },

    createDeck: function() {
        // Only 9-A of each suit (24 cards)
    },

    getDealSequence: function(gameState) {
        // 5 cards each, 1 turned up
    },

    getTrumpRank: function(card, trumpSuit) {
        // Handle bower logic
    },

    getAvailableActions: function(gameState, actorId) {
        // order_up, pass, name_trump, play_card, go_alone
    },

    resolveAction: function(gameState, actorId, action) {
        // Handle all actions
    },

    determineTrickWinner: function(trick, trumpSuit, leadSuit) {
        // Compare cards with trump/bower logic
    }
};
```

## UI Layout
```
┌─────────────────────────────────────┐
│           Partner (AI)              │
│         [5 cards face-down]         │
│                                     │
│  Left      [Trick Area]      Right  │
│  (AI)      [4 played]        (AI)   │
│                                     │
│         [Your 5 cards]              │
│            Player                   │
│                                     │
│  Score: Us 0 - Them 0   Trump: ♠    │
│  [Order Up] [Pass] [Go Alone]       │
└─────────────────────────────────────┘
```

## Key Features
- AI opponents (basic strategy)
- Trump indicator
- Trick animation
- Score tracking (first to 10)
- "Going alone" option
- Bower highlighting

## AI Strategy (Basic)
1. Lead highest trump if have it
2. Follow suit with lowest winning card
3. Trump if can't follow and have trump
4. Discard lowest non-trump

## ES5 Compatibility
- Use `var` not `const`/`let`
- Use `function()` not arrow functions
- Use `.indexOf()` not `.includes()`

## Complexity Notes
Euchre is more complex than Blackjack/War due to:
- Partnership play (AI needs team awareness)
- Trump selection phase
- Bower cards (special ranking)
- Going alone mechanic

Consider implementing in phases:
1. Phase 1: Basic 4-player with trump selection
2. Phase 2: Add going alone
3. Phase 3: Improve AI strategy
