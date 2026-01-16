# Card Engine Guide

**Last Updated:** January 16, 2026
**Engine Version:** 1.0 (Safari-compatible ES5)
**Status:** Production-ready for Blackjack and War

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [State Machine](#state-machine)
4. [Terminal Check Gate](#terminal-check-gate)
5. [Data Structures](#data-structures)
6. [Creating a New Game](#creating-a-new-game)
7. [API Reference](#api-reference)
8. [Debugging Guide](#debugging-guide)
9. [Known Limitations](#known-limitations)
10. [Future Roadmap](#future-roadmap)

---

## Overview

The **Card Engine** is a game-agnostic state machine that orchestrates turn-based card games. It separates game logic (rulesets) from game flow (engine), allowing multiple card games to share the same core infrastructure.

### Design Philosophy

```
┌─────────────────────────────────────────────┐
│  UI Layer (index.html)                      │
│  - Renders cards, buttons, animations       │
│  - Subscribes to engine events              │
│  - Sends user actions to engine             │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Engine (engine.js)                         │
│  - State machine (BETTING → DEALING → etc.) │
│  - Turn management                          │
│  - Action validation                        │
│  - Terminal Check Gate                      │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Ruleset (ruleset.js)                       │
│  - Game-specific logic                      │
│  - Action resolution                        │
│  - Win conditions                           │
│  - Scoring/payout                           │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Data Structures (card.js, pile.js, etc.)  │
│  - Card, Deck, Pile, Player                │
│  - Immutable templates                      │
└─────────────────────────────────────────────┘
```

### Key Principles

1. **Engine is game-agnostic** - It knows nothing about Blackjack, War, or any specific game
2. **Ruleset defines game behavior** - All game logic lives in the ruleset
3. **Events drive UI** - UI listens to engine events and updates accordingly
4. **State machine enforces flow** - Invalid transitions are rejected
5. **Terminal Check Gate prevents unnecessary actions** - Game ends immediately when outcome is determined

---

## Architecture

### File Structure

```
/games/cards/shared/
├── enums.js           # Suit, Rank, GameState, ActionType enums
├── card.js            # Card data structure
├── deck.js            # Deck templates (Standard, Euchre, etc.)
├── pile.js            # Universal card container
├── player.js          # Player/Dealer structures
├── engine.js          # State machine + orchestration
└── card-assets.js     # Procedural card rendering (Canvas)

/games/cards/blackjack/
├── ruleset.js         # Blackjack-specific logic
└── index.html         # Blackjack UI

/games/cards/war/
├── ruleset.js         # War-specific logic
└── index.html         # War UI
```

### Component Responsibilities

| Component | Responsibilities | Does NOT Handle |
|-----------|------------------|-----------------|
| **Engine** | State transitions, turn order, action validation, events | Game rules, scoring, payout calculations |
| **Ruleset** | Win conditions, action effects, AI behavior, scoring | UI rendering, animations, user input |
| **UI** | Rendering cards, handling clicks, animations | Game logic, state management |
| **Data Structures** | Card manipulation, shuffling, hand evaluation | Game flow, turn logic |

---

## State Machine

### States

```javascript
GameState = {
    IDLE: 'IDLE',               // Not started
    BETTING: 'BETTING',         // Players place bets
    DEALING: 'DEALING',         // Cards being dealt
    PLAYER_TURN: 'PLAYER_TURN', // Human player's turn
    OPPONENT_TURN: 'OPPONENT_TURN', // AI/Dealer's turn
    RESOLUTION: 'RESOLUTION',   // Determining winner
    PAYOUT: 'PAYOUT',          // Distributing winnings
    GAME_OVER: 'GAME_OVER'     // Round complete
}
```

### Normal Flow (Blackjack)

```
IDLE
  ↓
[User clicks "Deal"]
  ↓
BETTING
  ↓
[User confirms bet]
  ↓
DEALING
  ↓
[Cards dealt: Player gets 15, Dealer shows 7]
  ↓
PLAYER_TURN
  ↓
[Player clicks "Hit" → gets 18]
  ↓
PLAYER_TURN (still player's turn)
  ↓
[Player clicks "Stand"]
  ↓
OPPONENT_TURN (Dealer's turn)
  ↓
[Dealer draws to 19]
  ↓
RESOLUTION
  ↓
[Compare hands: Dealer wins]
  ↓
PAYOUT
  ↓
GAME_OVER
```

### Fast-Exit Flow (Player Busts)

```
PLAYER_TURN
  ↓
[Player hits → gets 22 (BUST)]
  ↓
⚠️ TERMINAL CHECK GATE ⚠️
  ↓
[checkWinCondition() detects bust]
  ↓
RESOLUTION (SKIP OPPONENT_TURN!)
  ↓
PAYOUT
  ↓
GAME_OVER
```

---

## Terminal Check Gate

### What is it?

The **Terminal Check Gate** is a critical mechanism that prevents unnecessary game actions after a win/loss condition has already been determined.

### Problem Without It

```javascript
// WITHOUT Terminal Check Gate:
Player hits → Busts (22)
Player's turn ends
Dealer takes turn (WHY?! Player already lost!)
Dealer draws cards
Dealer finishes
THEN game resolves player loss

// Wastes time, confuses players, breaks immersion
```

### Solution With It

```javascript
// WITH Terminal Check Gate:
Player hits → Busts (22)
✅ _checkForImmediateWin() called
✅ Detects bust condition
✅ Transitions to RESOLUTION immediately
✅ Skips dealer turn entirely
Game resolves player loss

// Fast, correct, clear
```

### Implementation

#### Engine Side (engine.js)

```javascript
submitAction(actorId, action) {
    // ... validate action ...

    const result = this.ruleset.resolveAction(this.getGameState(), actorId, action, this);

    // Execute actions (deal cards, etc.)
    if (result.actions) {
        result.actions.forEach(a => this._executeAction(a));
    }

    // 🚨 TERMINAL CHECK GATE 🚨
    this._checkForImmediateWin();

    // Only continue if game didn't end
    if (this.state !== GameState.RESOLUTION && this.state !== GameState.GAME_OVER) {
        // Handle next actor...
    }
}

_checkForImmediateWin() {
    if (!this.ruleset.checkWinCondition) return;

    const winResult = this.ruleset.checkWinCondition(this.getGameState());

    if (winResult && winResult.immediate) {
        this._log('Immediate Win Condition Triggered', winResult);
        this.transitionTo(GameState.RESOLUTION);
    }
}
```

#### Ruleset Side (blackjack/ruleset.js)

```javascript
checkWinCondition: function(gameState) {
    // Check #1: Dealer Blackjack
    var dealer = gameState.dealer;
    if (dealer.hand.count === 2) {
        var dealerValue = this.evaluateHand(dealer.hand.contents);
        if (dealerValue.isBlackjack) {
            return {
                immediate: true,
                reason: 'Dealer Blackjack',
                skipPlayerTurns: true
            };
        }
    }

    // Check #2: All Players Busted
    var allBusted = true;
    for (var i = 0; i < gameState.players.length; i++) {
        var val = this.evaluateHand(gameState.players[i].hand.contents);
        if (val.best <= 21) {
            allBusted = false;
            break;
        }
    }

    if (allBusted) {
        return {
            immediate: true,
            reason: 'All Players Busted',
            skipDealerTurn: true
        };
    }

    return null; // No immediate win condition
}
```

### When It Fires

The Terminal Check Gate is called after:
1. ✅ Every card dealt (`_executeDeal`)
2. ✅ Every player action (`submitAction`)
3. ✅ State transitions that might change game outcome

### Testing the Terminal Check Gate

**Test Case 1: Player Busts**
```
1. Player has 15
2. Player hits, gets 10 (total: 25)
3. Expected: Game immediately goes to RESOLUTION
4. Expected: Dealer does NOT draw cards
5. Expected: Player loses bet
```

**Test Case 2: Dealer Blackjack**
```
1. Dealer dealt Ace + King
2. Expected: Game immediately goes to RESOLUTION
3. Expected: Player turn is skipped
4. Expected: Player loses (or pushes if also blackjack)
```

**Test Case 3: Player Stands (Normal Flow)**
```
1. Player has 18
2. Player stands
3. Expected: Game goes to OPPONENT_TURN
4. Expected: Dealer draws normally
5. Expected: Resolution after dealer finishes
```

---

## Data Structures

### Card

```javascript
{
    suit: 'HEARTS',      // HEARTS, DIAMONDS, CLUBS, SPADES
    rank: 'KING',        // ACE, TWO, ..., TEN, JACK, QUEEN, KING
    id: 'KH',            // Unique identifier (rank + suit)
    deckId: 'standard',  // Which deck template this came from
    uuid: 'card_42'      // UUID for animation tracking (REQUIRED)
}
```

**Important:** Every card MUST have a `uuid` for animation systems to track card movement across the DOM.

### Pile

Universal container for cards. Used for:
- Player hands
- Dealer hand
- Draw pile
- Discard pile
- War pot
- Graveyard (in War endless mode)

```javascript
{
    contents: [card1, card2, ...], // Array of Card objects
    template: null,                 // Original deck template (for reset)
    count: 2                        // Convenience property (contents.length)
}
```

**Methods:**
- `createFrom(deck, copies)` - Factory method from deck template
- `receive(card, position)` - Add card (0 = top, -1 = bottom)
- `give(position)` - Remove and return card
- `shuffle()` - Randomize order
- `reset()` - Restore from template
- `peek(position)` - View without removing
- `contains(card)` - Check if card exists
- `toJSON()` - Serialize for storage

### Player

```javascript
{
    id: 'player1',      // Unique identifier
    type: 'human',      // 'human' or 'ai'
    name: 'You',        // Display name
    hand: Pile,         // Player's cards
    balance: 1000,      // Currency (if PlayerWithCurrency)
    currentBet: 25,     // Current round bet
    totalWagered: 0,    // Lifetime wagers
    totalWon: 0         // Lifetime winnings
}
```

**Special Properties (set by ruleset):**
- `_hasStood: true` - Blackjack uses this to track if player stood
- `_isOut: true` - Multiplayer games use this to track elimination

### GameState

The engine's internal state, passed to rulesets:

```javascript
{
    state: 'PLAYER_TURN',     // Current GameState enum
    roundNumber: 3,           // Which round we're on
    players: [player1, ...],  // Array of Player objects
    dealer: dealerObj,        // Dealer object (or null)
    piles: {                  // Named piles
        shoe: Pile,
        discard: Pile,
        center: Pile
    },
    pot: 50,                  // Total currency in pot
    activeActorId: 'player1', // Who's acting now
    turnHistory: [...]        // Log of actions this round
}
```

---

## Creating a New Game

### Step 1: Create Ruleset File

`/games/cards/mygame/ruleset.js`

```javascript
var MyGameRuleset = {
    // ========================================================================
    // IDENTITY
    // ========================================================================

    gameId: 'mygame',
    displayName: 'My Game',
    minPlayers: 2,
    maxPlayers: 4,

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    usesCurrency: true,       // Does game use betting?
    hasDealer: false,         // Is there a dealer entity?
    resetPilesEachRound: true, // Rebuild piles every round?

    // ========================================================================
    // DECK BUILDING
    // ========================================================================

    buildPiles: function() {
        var deck = Pile.createFrom(StandardDeck, 1);
        deck.shuffle();

        return {
            draw: deck,
            discard: new Pile()
        };
    },

    // ========================================================================
    // GAME INITIALIZATION
    // ========================================================================

    initializeGame: function(gameState) {
        // Called once at game start
        // Deal initial hands, set up piles, etc.
    },

    getDealSequence: function(gameState) {
        // Return array of deal instructions
        return [
            { from: 'draw', to: 'player1', toPlayer: true, count: 5, faceUp: true },
            { from: 'draw', to: 'player2', toPlayer: true, count: 5, faceUp: true }
        ];
    },

    // ========================================================================
    // TURN LOGIC
    // ========================================================================

    getNextActor: function(gameState) {
        // Return player ID who should act next
        // Return null if round should end

        var current = gameState.activeActorId;

        if (!current) {
            return 'player1'; // First turn
        }

        if (current === 'player1') {
            return 'player2'; // Player 2's turn
        }

        return null; // Round over
    },

    getAvailableActions: function(gameState, actorId) {
        // Return array of valid actions for this actor
        return ['play_card', 'draw_card', 'pass'];
    },

    resolveAction: function(gameState, actorId, action, engine) {
        // Execute action and return result

        var result = {
            actions: [],      // Array of ActionType actions
            nextActor: null,  // Who goes next (or null)
            nextState: null   // Override state transition (optional)
        };

        if (action === 'draw_card') {
            result.actions.push({
                type: ActionType.DEAL,
                from: 'draw',
                to: actorId,
                toPlayer: true,
                count: 1,
                faceUp: true
            });

            result.nextActor = this.getNextActor(gameState);
        }

        return result;
    },

    // ========================================================================
    // WIN CONDITIONS
    // ========================================================================

    checkWinCondition: function(gameState) {
        // Check if game should end immediately
        // Return { immediate: true, reason: '...' } to trigger RESOLUTION
        // Return null to continue normally

        var player = gameState.players[0];

        if (player.hand.count === 0) {
            return {
                immediate: true,
                reason: 'Player out of cards'
            };
        }

        return null;
    },

    // ========================================================================
    // RESOLUTION & PAYOUT
    // ========================================================================

    resolveRound: function(gameState) {
        // Determine winner and calculate payouts

        return gameState.players.map(function(player) {
            return {
                playerId: player.id,
                outcome: 'win',  // 'win', 'lose', 'push'
                payout: 100      // Amount to pay out
            };
        });
    },

    // ========================================================================
    // AI BEHAVIOR
    // ========================================================================

    getAiAction: function(gameState, actor) {
        // AI decision logic
        // Return action string

        var actions = this.getAvailableActions(gameState, actor.id);
        return actions[0]; // Pick first available action
    }
};
```

### Step 2: Create UI File

`/games/cards/mygame/index.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Game</title>
    <!-- Load shared modules -->
    <script src="../shared/enums.js"></script>
    <script src="../shared/card.js"></script>
    <script src="../shared/deck.js"></script>
    <script src="../shared/pile.js"></script>
    <script src="../shared/player.js"></script>
    <script src="../shared/engine.js"></script>
    <script src="../shared/card-assets.js"></script>

    <!-- Load game ruleset -->
    <script src="ruleset.js"></script>
</head>
<body>
    <div id="game-container">
        <!-- Your UI here -->
    </div>

    <script>
        // Initialize engine
        var engine = new CardEngine(MyGameRuleset);

        // Subscribe to events
        engine.on('*', function(event) {
            console.log('[EVENT]', event.type, event);

            switch(event.type) {
                case 'DEAL':
                    // Render card being dealt
                    break;
                case 'TURN_START':
                    // Update UI for new turn
                    break;
                // ... handle other events
            }
        });

        // Start game
        engine.init([
            { id: 'player1', type: 'human', name: 'You' },
            { id: 'player2', type: 'ai', name: 'AI' }
        ]);

        engine.startRound();
    </script>
</body>
</html>
```

### Step 3: Test Your Game

Use browser console to verify:

```javascript
// Check current state
engine.getGameState()

// Submit action manually
engine.submitAction('player1', 'draw_card')

// Force state transition
engine.transitionTo(GameState.RESOLUTION)
```

---

## API Reference

### Engine Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `init(players)` | `players: Player[]` | `void` | Initialize game with players |
| `startRound()` | - | `void` | Begin new round |
| `placeBet(playerId, amount)` | `playerId: string, amount: number` | `boolean` | Place bet (if usesCurrency) |
| `confirmBets()` | - | `void` | Proceed from BETTING to DEALING |
| `submitAction(actorId, action)` | `actorId: string, action: string` | `boolean` | Submit player action |
| `transitionTo(newState)` | `newState: GameState` | `void` | Force state transition |
| `getGameState()` | - | `GameState` | Get current state snapshot |
| `on(eventType, callback)` | `eventType: string, callback: Function` | `void` | Subscribe to events |

### Ruleset Required Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `buildPiles()` | `{[name]: Pile}` | Create initial piles |
| `getDealSequence(gameState)` | `DealInstruction[]` | Define how cards are dealt |
| `getNextActor(gameState)` | `string \| null` | Return next actor ID or null |
| `getAvailableActions(gameState, actorId)` | `string[]` | Valid actions for actor |
| `resolveAction(gameState, actorId, action, engine)` | `ActionResult` | Execute action |
| `resolveRound(gameState)` | `RoundResult[]` | Determine winners/payouts |

### Ruleset Optional Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `checkWinCondition(gameState)` | `WinCondition \| null` | Check for immediate end |
| `initializeGame(gameState)` | `void` | One-time setup |
| `getAiAction(gameState, actor)` | `string` | AI decision logic |

### Event Types

| Event | When | Payload |
|-------|------|---------|
| `ROUND_START` | Round begins | `{roundNumber}` |
| `BET_PLACED` | Bet confirmed | `{playerId, amount, pot}` |
| `DEAL` | Card dealt | `{from, to, card, faceUp}` |
| `TURN_START` | Actor's turn | `{actorId, actorType, availableActions}` |
| `MESSAGE` | Game message | `{text}` |
| `ROUND_WIN` | Round winner | `{winner}` |
| `RESOLUTION` | Round resolving | `{results}` |
| `PAYOUT` | Currency paid | `{playerId, amount}` |
| `STATE_CHANGE` | State transition | `{from, to}` |

---

## Debugging Guide

### Enable Debug Logging

```javascript
// In browser console:
localStorage.setItem('debug_card_engine', 'true');

// Reload page to see detailed logs
```

### Common Issues

#### Issue: "Not this actor's turn"

**Cause:** Trying to submit action for wrong player

**Fix:**
```javascript
var state = engine.getGameState();
console.log('Active actor:', state.activeActorId);
// Submit action for correct actor
```

#### Issue: "Invalid action"

**Cause:** Action not in `getAvailableActions()` list

**Fix:**
```javascript
var actions = engine.ruleset.getAvailableActions(engine.getGameState(), 'player1');
console.log('Available:', actions);
// Use one of the available actions
```

#### Issue: Dealer takes turn after player busts

**Cause:** `checkWinCondition()` not returning `{immediate: true}`

**Fix:**
```javascript
// Add to ruleset:
checkWinCondition: function(gameState) {
    var player = gameState.players[0];
    var val = this.evaluateHand(player.hand.contents);

    if (val.best > 21) {
        return { immediate: true, reason: 'Player busted' };
    }

    return null;
}
```

#### Issue: Game stuck in infinite loop

**Cause:** `getNextActor()` never returns `null`

**Fix:**
```javascript
// Ensure getNextActor eventually returns null:
getNextActor: function(gameState) {
    // ... logic ...

    // Always have an exit condition:
    if (allPlayersFinished) {
        return null; // End round
    }

    return nextPlayerId;
}
```

---

## Known Limitations

### 1. Single Hand Per Player

**Current:** Each player has one `hand: Pile`

**Limitation:** Cannot handle:
- Blackjack splits (two hands from one player)
- Multiplayer with teams
- Side pots in poker

**Workaround:** Defer multi-hand support until v2.0

**Future Fix:** Multi-hand architecture (see Roadmap)

### 2. Safari Compatibility (ES5)

**Current:** Must use `var`, regular functions, no `?.` or `??`

**Limitation:**
- More verbose code
- Harder to read
- No modern JS features

**Workaround:** Use transpiler or wait for Safari updates

### 3. Synchronous Actions Only

**Current:** All actions resolve immediately

**Limitation:**
- No network multiplayer
- No async API calls during gameplay
- No animations that pause game flow

**Workaround:** Use `setTimeout` in UI layer for visual delays

---

## Future Roadmap

### Version 1.1 (Q2 2026)

- [ ] Multi-hand architecture
- [ ] Split action for Blackjack
- [ ] Surrender action
- [ ] Insurance bets
- [ ] Side bets framework

### Version 2.0 (Q3 2026)

- [ ] Multiplayer support (2-8 players)
- [ ] Network sync via WebSocket
- [ ] Persistent game state (localStorage/IndexedDB)
- [ ] Replay system
- [ ] Tournament mode

### Version 3.0 (Future)

- [ ] SQL database backend
- [ ] Server-side validation
- [ ] Real-time leaderboards
- [ ] Achievements system
- [ ] Custom deck themes

---

## Contributing

When modifying the Card Engine:

1. **Update this document** - Keep it in sync with code
2. **Test all games** - Verify War and Blackjack still work
3. **Add console logs** - Use `this._log()` for debugging
4. **Write test cases** - Document expected behavior
5. **Safari compatibility** - Test in Safari, use ES5 syntax

---

## Questions?

This is a **living document**. If you're confused about how something works:

1. Check this guide first
2. Read the source code (`engine.js`)
3. Look at existing rulesets (`blackjack/ruleset.js`, `war/ruleset.js`)
4. Add your question to this doc for future developers

**Last updated by:** Claude Sonnet 4.5
**Next review:** After next major engine update
