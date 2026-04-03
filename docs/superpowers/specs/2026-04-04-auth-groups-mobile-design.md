# Georgian Joker — Auth, Groups, Mobile & Performance Spec

**Date:** 2026-04-04
**Status:** Approved

---

## 1. Auth: Signup-First App

### Requirements
- The app's first page is a **signup/login screen** — no access to any feature without authentication
- **Signup fields:** nickname (unique, 3-15 chars, immutable), display name, avatar (emoji picker), 4-digit PIN
- **Login fields:** nickname + 4-digit PIN
- PIN is hashed before storage (bcrypt or SHA-256 + salt)
- User profile stored in Supabase `players` table
- Session persisted in localStorage (auto-login on return)
- Layout wraps all routes in an auth guard — redirects to `/auth` if not logged in

### Auth Guard Logic
```
On every page load:
  1. Check localStorage for session token
  2. If exists → verify against Supabase → allow access
  3. If not exists → redirect to /auth
  4. /auth page has two tabs: Sign Up | Log In
```

### Supabase Integration
- `players` table already created (from migration)
- On signup: INSERT into `players` with hashed PIN
- On login: SELECT by nickname, verify PIN hash
- On success: store `{ id, nickname, name, avatar }` in localStorage + Zustand store

---

## 2. Groups System

### Concept
A Group is a private club where friends gather. It replaces the individual friend system.

### Data Model
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,        -- 6-char invite code
  created_by UUID REFERENCES players(id),
  max_members INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, player_id)
);
```

### Features
- **Create group:** User names the group → gets a 6-char invite code + shareable link
- **Join group:** Enter code or open link → added to group automatically
- **Max 20 members** per group
- **Multiple groups** per user allowed
- **Group leaderboard:** Rankings computed from all games where group members played together
- **Joining a group = friends with everyone:** All group members can:
  - Invite each other by @nickname to online rooms
  - Select each other by @nickname in offline calculator
- **Group page:** Shows members, leaderboard, recent games

### Friend Resolution
- "Friends" = all players who share at least one group with you
- No separate friend list needed — groups handle relationships
- PlayerPicker searches across all group members
- Remove old `friends` table and `lib/user-system.ts` friend functions

---

## 3. Mobile: PWA Fullscreen Portrait

### PWA Manifest
```json
{
  "name": "Royal Joker",
  "short_name": "Joker",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#001430",
  "background_color": "#001430",
  "start_url": "/",
  "icons": [...]
}
```

### Implementation
- Create `apps/web/public/manifest.json` with above config
- Create PWA icons (192x192 and 512x512) from the Chicken Banana card back
- Add `<link rel="manifest">` to layout.tsx `<head>`
- Add `<meta name="apple-mobile-web-app-capable" content="yes">`
- Add `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- Add `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">`

### Mobile Layout Fixes
- Add `env(safe-area-inset-*)` padding for iPhone notch/home bar
- Bottom nav: add `pb-[env(safe-area-inset-bottom)]`
- Game board: ensure no element is clipped by safe areas
- Touch targets: minimum 44x44px for all interactive elements
- Prevent pull-to-refresh during gameplay: `overscroll-behavior: none`

---

## 4. Card Performance: Optimize + Preload

### Optimization
- Convert all 55 SVG card files to optimized WebP (lossy, quality 85)
- Fallback to PNG for browsers without WebP support
- Target: ~5KB per card (down from 30-50KB SVG)
- Keep SVGs as source, generate optimized versions at build time

### Preloading
- On app startup (after auth), preload all card images in background
- Use `<link rel="preload" as="image">` for critical cards (card back, aces)
- Use JavaScript `Image()` constructor to cache remaining cards
- Show a subtle loading indicator if cards aren't ready when game starts
- Cache via service worker for subsequent visits

### Card Component Update
- Change `getCardImagePath()` to return WebP paths
- Add `loading="eager"` to cards in hand, `loading="lazy"` to opponent cards
- Use Next.js `<Image>` component with `priority` for player's hand cards

---

## 5. Unchanged Systems
- **Room codes:** Share externally (WhatsApp, text). No in-app invite notifications.
- **Online status:** Skipped for now. No live presence tracking.
- **Game engine:** No changes to rules, scoring, AI, or game logic.
- **Sound effects:** No changes.

---

## 6. New Pages / Routes

| Route | Purpose |
|-------|---------|
| `/auth` | Signup + Login (first page) |
| `/groups` | List my groups, create new group |
| `/groups/[code]` | Group detail: members, leaderboard, games |
| `/groups/join/[code]` | Join group via invite link |

### Modified Pages
| Route | Changes |
|-------|---------|
| `/` (Home) | Remove signup-related CTAs, add "Groups" button |
| `/profile` | Remove friend management (replaced by groups), show groups list |
| `/play/online` | PlayerPicker searches group members |
| `/play/calculator` | PlayerPicker searches group members |
| `layout.tsx` | Auth guard, PWA meta tags, viewport config |

---

## 7. Migration Plan

### Database
- Add `groups` and `group_members` tables to Supabase
- Remove `friends` table (replaced by groups)
- Add RLS policies for groups

### Code
- Remove: `lib/user-system.ts` friend functions
- Add: `lib/groups.ts` for group CRUD
- Update: `stores/game-store.ts` to include groups
- Update: `PlayerPicker` to search group members
- Add: auth guard middleware in layout
- Add: PWA manifest + service worker
- Add: card optimization pipeline
