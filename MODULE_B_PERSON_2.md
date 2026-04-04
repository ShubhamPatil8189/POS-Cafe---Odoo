# MODULE B — Person 2: POS Configuration (Floors, Tables, Payments, Terminal, Sessions)

## 🎯 Your Role
You own everything about **setting up the café before it opens** — floors, tables, payment method toggles, POS terminal configuration, and session management (open/close shifts).

---

## Your Database Tables

| Table | Key Columns |
|---|---|
| `floors` | id, name |
| `floor_pos_terminal` | floor_id, terminal_id |
| `tables` | id, floor_id, table_number, seats, is_active, status, locked_by, last_activity |
| `payment_methods` | id, type, is_enabled, upi_id |
| `pos_terminal` | id, name, last_open_date, last_sell_amount, self_ordering_enabled, self_ordering_type, background_color |
| `sessions` | id, user_id, terminal_id, status, opening_balance, closing_balance, start_time, end_time |
| `reservations` | id, table_id, customer_name, phone, reserved_time, expiry_time, status |

---

## Backend — Files You Create

```
backend/routes/
├── floors.js                ← Floor CRUD
├── tables.js                ← Table CRUD + status management
├── paymentMethods.js        ← Payment method config
├── terminal.js              ← POS terminal config
├── sessions.js              ← Open/close sessions
└── reservations.js          ← Table reservations
```

> **Note:** Person 1 creates these files as empty stubs. You fill them with your routes.

---

## Backend — Your API Endpoints

### Floor Routes (`/api/floors`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| GET | `/api/floors` | — | `[{ id, name, tables: [...] }]` |
| POST | `/api/floors` | `{ name }` | `{ id, name }` |
| PUT | `/api/floors/:id` | `{ name }` | `{ id, name }` |
| DELETE | `/api/floors/:id` | — | `{ message: "Deleted" }` |

> When returning floors, **include the tables** for each floor (JOIN with tables table).

### Table Routes (`/api/tables`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| GET | `/api/tables` | — | `[{ id, table_number, seats, status, is_active, floor_id, floor_name }]` |
| GET | `/api/tables/floor/:floorId` | — | `[{ id, table_number, seats, status, ... }]` |
| POST | `/api/tables` | `{ floor_id, table_number, seats }` | `{ id, table_number, ... }` |
| PUT | `/api/tables/:id` | `{ table_number?, seats?, is_active? }` | `{ id, ... }` |
| PUT | `/api/tables/:id/status` | `{ status, locked_by? }` | `{ id, status, ... }` |
| PUT | `/api/tables/:id/clear` | — | `{ id, status: "available" }` |
| DELETE | `/api/tables/:id` | — | `{ message: "Deleted" }` |

#### Table Status Values
```
'available'    → 🟢 Green (free for use)
'reserved'     → 🔴 Red (pre-booked)
'self_order'   → 🟡 Yellow (customer scanning QR — NOT used for now)
'occupied'     → 🔵 Blue (active order in progress)
```

#### Status Change Rules (Enforce in API)
```
available  → occupied    ✅ (cashier assigns walk-in)
available  → reserved    ✅ (cashier creates reservation)
reserved   → occupied    ✅ (customer arrives — check-in)
reserved   → available   ✅ (no-show / cancel)
occupied   → available   ✅ (payment done / manual clear)
```

#### `PUT /api/tables/:id/clear` Logic
```
1. Set status = 'available'
2. Set locked_by = NULL
3. Set last_activity = NULL
```

### Payment Method Routes (`/api/payment-methods`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| GET | `/api/payment-methods` | — | `[{ id, type, is_enabled, upi_id }]` |
| PUT | `/api/payment-methods/:id` | `{ is_enabled?, upi_id? }` | `{ id, type, is_enabled, upi_id }` |

> **Important:** There are exactly 3 payment methods (cash, digital, upi). They are pre-seeded.
> Users can only **toggle** them on/off and set UPI ID. NO create/delete endpoints.

### Terminal Routes (`/api/terminal`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| GET | `/api/terminal` | — | `[{ id, name, last_open_date, last_sell_amount, ... }]` |
| POST | `/api/terminal` | `{ name }` | `{ id, name }` |
| PUT | `/api/terminal/:id` | `{ name?, self_ordering_enabled?, ... }` | `{ id, ... }` |

### Session Routes (`/api/sessions`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| POST | `/api/sessions/open` | `{ terminal_id, opening_balance }` | `{ id, user_id, terminal_id, status: "open", start_time }` |
| POST | `/api/sessions/close` | `{ session_id, closing_balance }` | `{ id, status: "closed", end_time }` |
| GET | `/api/sessions/current` | — | `{ id, user_id, terminal_id, status, start_time }` or `null` |
| GET | `/api/sessions` | — | `[{ id, user_id, status, start_time, end_time, ... }]` |

#### Open Session Logic
```
1. Check: Is there already an open session? If yes, return error "Session already open"
2. Create session with status = 'open', start_time = NOW()
3. Update pos_terminal.last_open_date = TODAY
4. Return session data
```

#### Close Session Logic
```
1. Find open session
2. Set status = 'closed', end_time = NOW(), closing_balance = provided amount
3. Update pos_terminal.last_sell_amount = closing_balance
4. Return session data
```

### Reservation Routes (`/api/reservations`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| POST | `/api/reservations` | `{ table_id, customer_name, phone, reserved_time, expiry_time }` | `{ id, ... }` |
| GET | `/api/reservations` | — | `[{ id, table_id, customer_name, status, reserved_time, ... }]` |
| GET | `/api/reservations/active` | — | Only status='active' reservations |
| PUT | `/api/reservations/:id/checkin` | — | `{ id, status: "completed" }` |
| PUT | `/api/reservations/:id/cancel` | — | `{ id, status: "expired" }` |

#### Create Reservation Logic
```
1. Check: Is table available? If not, return error
2. Create reservation with status = 'active'
3. Set table status = 'reserved'
4. Return reservation
```

#### Check-in Logic
```
1. Set reservation status = 'completed'
2. Set table status = 'occupied'
```

#### Cancel Logic
```
1. Set reservation status = 'expired'
2. Set table status = 'available'
```

---

## Frontend — Files You Create

```
frontend/vite-project/src/
├── components/
│   ├── TableCard.jsx            ← Color-coded table card
│   ├── ToggleSwitch.jsx         ← On/off toggle
│   └── StatusBadge.jsx          ← Colored status indicator
│
├── pages/backend/
│   ├── FloorPlan.jsx            ← Floor management + table grid
│   ├── PaymentMethods.jsx       ← Payment config (3 cards with toggles)
│   └── POSTerminal.jsx          ← Terminal config + session management
```

---

## Frontend — Page Details

### FloorPlan.jsx
**Layout:** Backend sidebar (use Person 1's `BackendLayout`) + main content
**Sections:**
1. **Floor Tabs** — Tab for each floor (e.g., "Ground Floor", "First Floor") + "Add Floor" button
2. **Table Grid** — Grid of `TableCard` components showing all tables for selected floor
3. **Add Table** — Button opens modal with: Table Number, Seats, Floor (auto-selected)
4. **Table Status Colors** — Each TableCard shows color based on status

**TableCard Component:**
```
┌─────────────┐
│   Table 3   │  ← Table number (large text)
│   4 seats   │  ← Seats count
│  🟢 Available │  ← Status badge with color
│             │
│ [Edit] [Delete] │  ← Action buttons (small, bottom)
└─────────────┘
```

### PaymentMethods.jsx
**Layout:** Backend sidebar + main content
**Design:** 3 cards side by side

```
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   💵 Cash       │  │   💳 Digital     │  │   📱 UPI QR      │
│                 │  │   (Bank/Card)    │  │                  │
│  [Toggle: ON]   │  │  [Toggle: ON]    │  │  [Toggle: ON]    │
│                 │  │                  │  │                  │
│                 │  │                  │  │  UPI ID:         │
│                 │  │                  │  │  [123@ybl.com]   │
│                 │  │                  │  │  [Save]          │
└─────────────────┘  └──────────────────┘  └──────────────────┘
```

### POSTerminal.jsx
**Layout:** Backend sidebar + main content
**Sections:**
1. **Terminal Info Card** — Shows terminal name, last open date, last sale amount
2. **Session Status** — If session open: show "Session Active since HH:MM" with Close button. If closed: show "Open Session" button with opening balance input
3. **Terminal Config** — Edit terminal name

---

## Seed Data You Insert

```sql
-- Payment methods (exactly 3, pre-seeded)
INSERT INTO payment_methods (type, is_enabled, upi_id) VALUES
('cash', TRUE, NULL),
('digital', TRUE, NULL),
('upi', TRUE, '123@ybl.com');

-- Default floor + tables
INSERT INTO floors (name) VALUES ('Ground Floor');

INSERT INTO tables (floor_id, table_number, seats, status) VALUES
(1, '1', 4, 'available'),
(1, '2', 4, 'available'),
(1, '3', 6, 'available'),
(1, '4', 2, 'available'),
(1, '5', 4, 'available'),
(1, '6', 8, 'available');

-- Default POS terminal
INSERT INTO pos_terminal (name) VALUES ('Main Counter');
```

---

## What You Deliver (Checklist)

- [ ] Floors CRUD — create, read, update, delete floors
- [ ] Tables CRUD — create, read, update, delete tables
- [ ] Table status management — change status via API with validation rules
- [ ] Manual "Clear Table" endpoint works
- [ ] Payment methods — list and toggle enable/disable
- [ ] UPI ID can be set and saved
- [ ] POS Terminal config — create/update terminal
- [ ] Sessions — open and close sessions with balance tracking
- [ ] Only one session can be open at a time
- [ ] Reservations — create, check-in, cancel
- [ ] FloorPlan page — shows floors with tabs, tables with colors
- [ ] PaymentMethods page — 3 cards with working toggles
- [ ] POSTerminal page — shows terminal info + open/close session UI

---

## Dependencies

| You Depend On | Module | What |
|---|---|---|
| Auth middleware | Module A | Import `auth.js` middleware to protect your routes |
| BackendLayout | Module A | Wrap your pages with shared layout |
| API service | Module A | Use shared `api.js` for frontend HTTP calls |

## Who Depends On You

| Module | They Need |
|---|---|
| Module C (Person 3) | `GET /api/tables`, `GET /api/sessions/current`, `GET /api/payment-methods` |
| Module C (Person 3) | `PUT /api/tables/:id/status` (to set table as occupied/available) |
| Module D (Person 4) | `GET /api/sessions` (for report filters) |
