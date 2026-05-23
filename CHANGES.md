# South Diamond — Sub-Admin + Guest Chat Update

> **HOTFIX (after first deploy):** Earlier build had two bugs that made the
> sub-admin page loop on load and show the full admin UI. Both fixed:
>
> 1. `/api/admin/me` now accepts sub-admin sessions (was 401-ing → redirect loop).
> 2. `/api/admin/dashboard`, `/api/admin/activity`, `/api/admin/points` (GET)
>    now accept sub-admin sessions and return data scoped to their players.
> 3. Admin-only nav buttons + panels (Overview, Live Activity, VIP, Spin Wheel,
>    Slots Control, Sub-Admins) are now marked `data-admin-only` and hidden
>    from sub-admin view by `script.js`.
> 4. When a sub-admin lands on the panel, the active tab is auto-switched to
>    "All Players" (which is their players, scoped). A "Sub-admin" badge is
>    shown in the topbar so role is unambiguous.
>
> **What a sub-admin can do now (per Sri's spec):**
> create players, view their own players list, view those players' game
> + transaction history, add/redeem points (deducts/credits their wallet),
> chat with their own players, broadcast to their own players.
>
> **What a sub-admin still cannot do (deferred — needs separate work):**
> control slot RTP/payout per their players. The Slots Control panel is
> currently a GLOBAL config that would affect every sub-admin's players if
> a sub-admin edited it. Hidden from sub-admin until per-sub-admin slot
> overrides are built. The schema field (`subAdminSlotsConfig`) is reserved
> for this future work.


This change set adds the sub-admin hierarchy, removes public signup, allows
chat before login, and rebrands the slot reel frames. Apply by copying these
files into your git repo and committing.

## How to verify before deploying

```powershell
cd "C:\Users\syell\OneDrive\Documents\New project"
node --check server.js
node --check script.js
node --check slots-arcade.js
npm start
```

If any `node --check` reports an error, copy the line + error and tell me —
I'll fix it. The bash sandbox in this session has a stale-cache issue that
prevents me from verifying syntax here.

## How to make a zip of just the changed files

Run this in PowerShell from the project folder:

```powershell
$files = @(
  'server.js',
  'script.js',
  'index.html',
  'admin.html',
  'login.html',
  'sub-admin-login.html',
  'slots-arcade.js',
  'slots-arcade.css',
  'assets\branded\sd-wild.svg',
  'assets\branded\sd-bonus.svg',
  'CHANGES.md'
)
Compress-Archive -Path $files -DestinationPath south-diamond-update.zip -Force
```

The resulting `south-diamond-update.zip` is what you paste into git.

## What changed

### New files

| File | Purpose |
|------|---------|
| `sub-admin-login.html` | Sub-admin login page (served at `/admin`). Emerald-themed, distinct from main admin login. |
| `assets/branded/sd-wild.svg` | South Diamond branded WILD symbol (currently unused — left in repo for future). |
| `assets/branded/sd-bonus.svg` | South Diamond branded BONUS symbol (currently unused — left in repo for future). |

### Modified files

- `server.js` — Auth roles, sub-admin endpoints, guest chat, removed signup, scoped player/chat/points endpoints.
- `script.js` — Sub-admin login handler, role-aware admin panel JS, guest chat client.
- `index.html` — Stripped signup and reset forms; login accepts username-or-email.
- `admin.html` — Sub-Admins panel + New Player panel + nav buttons.
- `login.html` — Removed forgot-password link and reset form.
- `slots-arcade.js` — Reverted to per-game wild/bonus images.
- `slots-arcade.css` — Added gold-trim frame on every reel cell.

## Routes

| Route | Who | Purpose |
|-------|-----|---------|
| `/admin` | Sub-admins | Sub-admin login (no email code) and panel. |
| `/admin9493` | Main admin | Main admin login (with email code) and panel. |
| `/login9493` | Main admin | Existing admin login form. |

If you visit `/admin` as the main admin, you're bounced to `/admin9493`.
If you visit `/admin9493` as a sub-admin, you're bounced to `/admin`.

## New API endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/admin/sub-admin/login` | none (rate-limited) | Sub-admin login. |
| POST | `/api/admin/sub-admin/logout` | sub-admin | Sub-admin logout. |
| GET | `/api/admin/sub-admin/me` | admin or sub-admin | Returns current operator info (role, wallet). |
| GET | `/api/admin/sub-admins` | admin | List sub-admins with wallet + player count. |
| POST | `/api/admin/sub-admins` | admin | Create a sub-admin (username, password, optional starting wallet). |
| POST | `/api/admin/sub-admins/load-points` | admin | Top up a sub-admin's wallet. |
| POST | `/api/admin/sub-admins/disable` | admin | Enable/disable a sub-admin, kicks active sessions. |
| POST | `/api/admin/sub-admins/reset-password` | admin | Reset a sub-admin's password. |
| POST | `/api/admin/players` | admin or sub-admin | Create a new player. Sub-admins' players belong to them; starting points deduct from the sub-admin's wallet. |
| GET | `/api/chats/guest-message` | none (cookie) | Returns the current guest's chat thread for polling. |
| POST | `/api/chats/guest-message` | none (cookie) | Send a guest message. Lands on the main admin's chat desk. |

## Removed endpoints (return 410 Gone)

- `/api/player/signup` — public signup no longer available. Use `/api/admin/players`.
- `/api/player/reset-password` — players can't self-reset. Admin/sub-admin resets via `/api/admin/reset-player-password`.
- `/api/admin/forgot-password` — admin can't reset via email. Change `ADMIN_PASSWORD` env var instead.
- `/api/admin/reset-password` — same as above.

## Endpoints that changed behavior

These now accept both admin and sub-admin via `requireOperator`, and check
ownership via `operatorOwnsPlayer` (sub-admins only see/touch their own players):

- `GET /api/admin/users` — sub-admin gets filtered list.
- `POST /api/admin/points` — sub-admin's add/redeem debits/credits their wallet. Add is blocked if wallet is too low ("Contact the main admin to load more").
- `POST /api/admin/reset-player-password`
- `POST /api/admin/user-note`
- `POST /api/admin/player-vip`
- `GET /api/admin/player-game-history`
- `GET /api/admin/player-points-history`
- `GET /api/chats` — sub-admin sees only their players' chats; admin sees everything + guest chats.
- `POST /api/admin/chats/read`
- `POST /api/admin/payment-status`
- `POST /api/chats/operator-message`
- `POST /api/admin/broadcast` — sub-admin can only broadcast to their own players.
- `DELETE /api/chats` — sub-admin can delete only their players' chats; guest chats are admin-only.
- `POST /api/player/login` — now accepts username OR email; stitches guest chat into player thread on login.

## Schema additions to `data` (your Supabase `app_state` blob)

- `data.subAdmins = []` — array of `{ id, username, passwordHash, wallet, createdAt, createdBy, lastLoginAt, disabled }`.
- `data.subAdminSessions = []` — active sub-admin session tokens.
- `data.guestChats = []` — pre-login chat threads, keyed by `sd_guest_id` cookie.
- `data.subAdminSlotsConfig = {}` — reserved for future per-sub-admin slot overrides (endpoint NOT yet implemented — see "Not yet done" below).
- Each user gets `parentAdminId` (defaults to `"admin"` for existing users so nothing breaks).

## Spin/slot symbols

- WILD and BONUS on every game now have a soft gold/pink glow via CSS (`slots-arcade.css`).
- Every reel cell has a thin gold South Diamond frame around it.
- The actual symbol PNGs are unchanged — each game keeps its own themed artwork.

## NOT yet done

Flagging so you don't think it's broken — these were originally scoped but
not delivered in this update:

- **Per-sub-admin slot config overrides.** The schema field (`subAdminSlotsConfig`) is reserved but no endpoints read/write it, and the player spin endpoint uses the global config only. If you want sub-admins to control slot RTP per their players, this is the next chunk of work.
- **Real-time polling for guest chats from the operator desk.** Admin sees guest chats when they refresh, but no SSE/socket push.
- **`/api/admin/users.csv`** — CSV export is still main-admin-only. The dashboard, activity, points, player list, chats, and broadcast endpoints are now sub-admin-aware and scoped to that sub-admin's players.
- **Sub-admin player history view in the UI.** The endpoints work (`/api/admin/player-game-history`, `/api/admin/player-points-history`); the existing player-detail UI in admin.html will work for a sub-admin's players, but I didn't add a dedicated "your players" list view — the existing "All Players" panel filters to their players via the scoped `/api/admin/users` endpoint.

## Default admin credentials reminder

Default admin login is still `admin / southdiamond` unless you set
`ADMIN_USERNAME` and `ADMIN_PASSWORD` env vars. The sub-admins you create
get their own passwords (no email code).
