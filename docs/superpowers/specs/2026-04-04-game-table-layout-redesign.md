# Game Table Layout Redesign — CSS Grid

**Date:** 2026-04-04  
**Status:** Approved (v7)

## Problem

The game board uses absolute positioning which causes:
- Cards overlapping on mobile (bid buttons covering player's hand)
- Opponent card backs covering the trick area
- Elements cut off at bottom on iPhone
- No consistent spacing across screen sizes

## Solution: CSS Grid Layout

Replace all absolute positioning with a 5-row × 3-column CSS Grid. Each zone has guaranteed space — no overlapping.

### Grid Structure

```
┌──────────────────────────────────────────┐
│ Row 1: HEADER  (☰  TABLE | dist:7 ♥  ⛶) │
├──────────────────────────────────────────┤
│ Row 2: TOP PLAYER (avatar·name·bid/won·cards) │
├────────┬────────────────────┬────────────┤
│ Col 1  │     Col 2          │   Col 3    │
│ LEFT   │   TRICK ZONE       │   RIGHT    │
│ avatar │                    │   avatar   │
│ name   │  [deck] ←gap→ [K♠][7♥] │ name │
│ b:1 w:0│                    │   b:3 w:2  │
│ cards↕ │                    │   cards↕   │
│ 📋SCORE│                    │   👁LAST   │
├────────┴────────────────────┴────────────┤
│ Row 4: MY INFO + BID BUTTONS             │
│ bortqala · b:2 w:1 | [—][1][2][3][4]    │
├──────────────────────────────────────────┤
│ Row 5: MY CARDS                          │
│ [K♥][9♥][A♦][9♦][6♦][Q♣][8♠]           │
└──────────────────────────────────────────┘
```

### CSS Grid Definition

```css
.game-grid {
  display: grid;
  grid-template-rows: auto auto 1fr auto auto;
  grid-template-columns: 52px 1fr 52px;    /* mobile */
  height: 100dvh;
  overflow: hidden;
}

@media (min-width: 768px) {
  .game-grid { grid-template-columns: 90px 1fr 90px; }
}
```

### Trump Card Display

The trump (stuffing) card is shown as a **deck pile**: 2-3 card backs stacked with the trump card face-up on top. This sits in the trick zone with a clear gap (16px mobile, 28px desktop) from the played trick cards.

### Bid/Won Display

All 4 players show bid and won values:
- **Top player**: `bid: 2 · won: 1` (full text)
- **Left/Right**: `b:1 w:0` (compact)  
- **Bottom (me)**: `bid: 2 · won: 1` (full text)
- **Font size**: slightly larger than current — 8px mobile, 10px desktop (was 6-7px)

### Action Buttons

- **📋 SCORE** — bottom of left column
- **👁 LAST** — bottom of right column

### Trick Win Animation

When all 4 cards are played and the trick is resolved:
1. All 4 cards stay visible for **1.5 seconds** (already implemented)
2. Cards **animate toward the winner's position** (fly to top/left/right/bottom depending on who won)
3. Then clear the trick zone for next trick

Animation spec:
- Duration: 400ms
- Easing: ease-in
- Cards move to the winner's grid zone position
- Fade out as they arrive (opacity 1 → 0)
- Scale down slightly (1 → 0.7)

### Responsive Card Sizes

```
Mobile (<768px):  player cards 52×72px, opponent backs 16×22px
Tablet (768px+):  player cards 68×95px, opponent backs 24×34px  
Desktop (1280px+): player cards 80×112px, opponent backs 26×36px
```

### Files to Modify

1. `apps/web/src/app/globals.css` — add `.game-grid`, update card sizes, remove old `.game-no-scroll`
2. `apps/web/src/components/game/GameBoard.tsx` — complete rewrite using grid layout
3. `apps/web/src/components/game/TrickArea.tsx` — add win animation (cards fly to winner)
4. `apps/web/src/components/game/PlayerSlot.tsx` — bigger bid/won text
5. `apps/web/src/components/cards/Card.tsx` — add `tiny` size variant for opponent backs
6. `apps/web/src/components/cards/PlayerHand.tsx` — update `OpponentHand` to use tiny cards
7. `apps/web/src/components/game/TrumpIndicator.tsx` — move dist info to header, remove standalone component

### Verification

1. iPhone SE (375px): all zones visible, no overlap, cards not cut off
2. iPhone 14 (390px): same + safe area padding
3. iPad (768px): larger cards, comfortable spacing
4. Desktop (1440px): full-size cards, card backs visible on left/right
5. 9-card hand: cards overlap more but all visible and tappable
6. Bid phase: buttons in row 4, cards visible in row 5
7. Trick win: cards animate toward winner before clearing
