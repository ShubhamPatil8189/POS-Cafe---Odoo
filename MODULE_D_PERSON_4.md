# MODULE D — Person 4: Kitchen Display + Customer Display + Reports & Dashboard

## 🎯 Your Role
You own all **display screens** (Kitchen, Customer) and the **reporting/dashboard** system. You also set up **Socket.IO** for real-time communication across the entire app.

> You are the **real-time backbone** of the system. Without Socket.IO, the kitchen never gets orders and the customer never sees their bill update.

---

## Your Database Tables

| Table | Key Columns |
|---|---|
| `kitchen_orders` | id, order_id, status (to_cook / preparing / completed), updated_at |
| `kitchen_order_items` | id, kitchen_order_id, order_item_id, is_prepared, prepared_at |

> **Note:** Person 3 CREATES records in these tables when cashier clicks "Send to Kitchen". You READ and UPDATE them.

For reports, you READ from:
| Table | What For |
|---|---|
| `orders` | Sales data, order counts |
| `order_items` | Product-level analysis |
| `payments` | Payment method breakdown |
| `sessions` | Session-wise filtering |
| `users` | Staff/responsible filter |
| `products` | Product filter |

---

## Backend — Files You Create

```
backend/
├── socket/
│   └── index.js              ← Socket.IO setup and event handlers
├── routes/
│   ├── kitchen.js            ← Kitchen display endpoints
│   └── reports.js            ← Dashboard stats + report data + export
```

---

## Backend — Socket.IO Setup (socket/index.js)

This is the **most critical file** you create. It enables real-time communication.

### Setup Steps
```javascript
// 1. In backend/index.js, Person 1 creates the HTTP server
//    You modify it to attach Socket.IO:

const http = require('http');
const { Server } = require('socket.io');

// After creating Express app:
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',  // Vite dev server
    methods: ['GET', 'POST']
  }
});

// Attach io to app so other modules can use it
app.set('io', io);

// Socket connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Kitchen joins a room
  socket.on('join:kitchen', () => {
    socket.join('kitchen');
  });
  
  // Customer display joins a room for specific order
  socket.on('join:customer-display', (orderId) => {
    socket.join(`customer:${orderId}`);
  });
  
  // POS joins a room for table updates
  socket.on('join:pos', () => {
    socket.join('pos');
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Change app.listen() to server.listen()
server.listen(PORT, () => { ... });
```

### Socket Events (Reference for ALL modules)

| Event | Emitted By | Received By | Data |
|---|---|---|---|
| `kitchen:new-order` | Person 3 (orders.js) | Kitchen Display | `{ orderId, orderNumber, tableNumber, items }` |
| `kitchen:stage-updated` | You (kitchen.js) | POS, Kitchen | `{ kitchenOrderId, orderId, stage }` |
| `kitchen:item-prepared` | You (kitchen.js) | Kitchen Display | `{ kitchenOrderId, itemId, isPrepared }` |
| `table:status-changed` | Person 3 (orders.js) | Floor View | `{ tableId, status }` |
| `order:payment-completed` | Person 3 (payments.js) | Customer Display | `{ orderId, amount, method }` |

---

## Backend — Kitchen API Endpoints

### Kitchen Routes (`/api/kitchen`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| GET | `/api/kitchen/orders` | — | `[{ id, order_id, order_number, table_number, status, items: [...], created_at }]` |
| GET | `/api/kitchen/orders/active` | — | Only orders where status != 'completed' |
| PUT | `/api/kitchen/orders/:id/stage` | `{ status }` | `{ id, status, updated_at }` |
| PUT | `/api/kitchen/orders/:id/items/:itemId` | `{ is_prepared: true }` | `{ id, is_prepared, prepared_at }` |

#### GET Kitchen Orders — Response Format
```json
[
  {
    "id": 1,
    "order_id": 5,
    "order_number": "ORD-005",
    "table_number": "3",
    "status": "to_cook",
    "updated_at": "2026-04-04T10:30:00",
    "items": [
      {
        "id": 1,
        "product_name": "Margherita Pizza",
        "quantity": 2,
        "is_prepared": false,
        "special_instructions": "Extra cheese"
      },
      {
        "id": 2,
        "product_name": "Cappuccino",
        "quantity": 1,
        "is_prepared": false,
        "special_instructions": null
      }
    ]
  }
]
```

#### Stage Update Logic (`PUT /api/kitchen/orders/:id/stage`)
```
Valid transitions:
  to_cook    → preparing   ✅
  preparing  → completed   ✅
  completed  → to_cook     ❌ (no going back)

Logic:
1. Validate transition
2. Update kitchen_orders.status
3. If moving to 'completed':
   - Update order.status = 'completed' in orders table
4. Emit socket: 'kitchen:stage-updated' to 'kitchen' room
```

#### Mark Item Prepared (`PUT /api/kitchen/orders/:id/items/:itemId`)
```
1. Set kitchen_order_items.is_prepared = TRUE
2. Set kitchen_order_items.prepared_at = NOW()
3. Emit socket: 'kitchen:item-prepared'
4. Check: Are ALL items for this kitchen_order prepared?
   If yes → auto-move kitchen_order status to 'completed'
```

---

## Backend — Customer Display Endpoint

| Method | Endpoint | Auth | Response |
|---|---|---|---|
| GET | `/api/customer-display/:orderId` | ❌ NO AUTH | `{ order_number, table_number, items, total_amount, payment_status }` |

> **No auth required!** This runs on a customer-facing screen that isn't logged in.

#### Response Format
```json
{
  "order_number": "ORD-005",
  "table_number": "3",
  "items": [
    { "name": "Margherita Pizza", "quantity": 2, "price": 300, "subtotal": 600 },
    { "name": "Cappuccino", "quantity": 1, "price": 150, "subtotal": 150 }
  ],
  "total_amount": 787.50,
  "tax_amount": 37.50,
  "payment_status": "unpaid"   // or "paid"
}
```

---

## Backend — Reports & Dashboard API

### Report Routes (`/api/reports`)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/api/reports/dashboard` | — | `{ total_sales, total_orders, avg_order_value, top_products, payment_breakdown }` |
| GET | `/api/reports/sales` | `period`, `session_id`, `user_id`, `product_id`, `start_date`, `end_date` | `[{ order_id, order_number, date, total, payment_method, staff, items }]` |
| GET | `/api/reports/export/pdf` | same filters | PDF file download |
| GET | `/api/reports/export/xls` | same filters | Excel file download |

#### Dashboard Response Format
```json
{
  "total_sales": 25000.00,
  "total_orders": 45,
  "avg_order_value": 555.56,
  "orders_today": 12,
  "sales_today": 7500.00,
  "top_products": [
    { "name": "Margherita Pizza", "quantity_sold": 28, "revenue": 8400 },
    { "name": "Cappuccino", "quantity_sold": 45, "revenue": 6750 },
    { "name": "Classic Burger", "quantity_sold": 15, "revenue": 3750 }
  ],
  "payment_breakdown": [
    { "type": "cash", "total": 12000, "percentage": 48 },
    { "type": "digital", "total": 8000, "percentage": 32 },
    { "type": "upi", "total": 5000, "percentage": 20 }
  ],
  "sales_by_day": [
    { "date": "2026-04-01", "total": 5000 },
    { "date": "2026-04-02", "total": 7500 },
    { "date": "2026-04-03", "total": 6000 },
    { "date": "2026-04-04", "total": 6500 }
  ]
}
```

#### Sales Report Filters

| Filter | Query Param | SQL Logic |
|---|---|---|
| Period | `period=today` | `WHERE DATE(orders.created_at) = CURDATE()` |
| Period | `period=week` | `WHERE orders.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)` |
| Period | `start_date=...&end_date=...` | `WHERE orders.created_at BETWEEN ? AND ?` |
| Session | `session_id=5` | `WHERE orders.session_id = 5` |
| Staff | `user_id=2` | `WHERE orders.user_id = 2` |
| Product | `product_id=3` | `WHERE order_items.product_id = 3` |

#### PDF Export (use `pdfkit`)
```bash
npm install pdfkit
```
- Generate PDF with: title, date range, table of sales data, totals
- Set response headers: `Content-Type: application/pdf`
- Pipe PDF stream to response

#### Excel Export (use `exceljs`)
```bash
npm install exceljs
```
- Generate Excel with: headers, filtered sales rows, totals row
- Set response headers: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

## Frontend — Files You Create

```
frontend/vite-project/src/
├── context/
│   └── SocketContext.jsx            ← Socket.IO connection provider
│
├── components/
│   ├── OrderTicket.jsx              ← Kitchen ticket card
│   ├── StatsCard.jsx                ← Dashboard metric card
│   └── FilterBar.jsx                ← Report filter controls
│
├── pages/
│   ├── kitchen/
│   │   └── KitchenDisplay.jsx       ← 3-column kanban
│   ├── customer/
│   │   └── CustomerDisplay.jsx      ← Order + payment status
│   └── backend/
│       ├── Dashboard.jsx            ← Stats cards + charts
│       └── Reports.jsx              ← Filtered table + PDF/XLS export
```

---

## Frontend — SocketContext.jsx

```javascript
// Install: npm install socket.io-client
// Provides socket connection to all components

// Usage in any component:
// const socket = useSocket();
// socket.emit('join:kitchen');
// socket.on('kitchen:new-order', (data) => { ... });
```

---

## Frontend — Page Details

### KitchenDisplay.jsx (STANDALONE — NO sidebar, NO navbar)

**This opens in a separate browser tab on the kitchen screen.**

Route: `/kitchen` (no auth required for simplicity)

```
┌──────────────────────────────────────────────────────────────┐
│                    🍳 Kitchen Display                        │
├──────────────────┬──────────────────┬────────────────────────┤
│    TO COOK       │    PREPARING     │      COMPLETED         │
│                  │                  │                        │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────────┐  │
│ │ ORD-007      │ │ │ ORD-005      │ │ │ ORD-003          │  │
│ │ Table 3      │ │ │ Table 1      │ │ │ Table 6          │  │
│ │              │ │ │              │ │ │                  │  │
│ │ • Pizza x2   │ │ │ • Pasta x1   │ │ │ ̶•̶ ̶B̶u̶r̶g̶e̶r̶ ̶x̶1̶   │  │
│ │ • Coffee x1  │ │ │ • ̶C̶o̶f̶f̶e̶e̶ ̶x̶2̶ │ │ │ ̶•̶ ̶C̶o̶f̶f̶e̶e̶ ̶x̶2̶   │  │
│ │              │ │ │ • Burger x1  │ │ │                  │  │
│ │ [Click to    │ │ │              │ │ │                  │  │
│ │  start →]    │ │ │ [Click to    │ │ │                  │  │
│ │              │ │ │  complete →] │ │ │                  │  │
│ └──────────────┘ │ └──────────────┘ │ └──────────────────┘  │
│                  │                  │                        │
│ ┌──────────────┐ │                  │                        │
│ │ ORD-008      │ │                  │                        │
│ │ Table 5      │ │                  │                        │
│ │              │ │                  │                        │
│ │ • Latte x3   │ │                  │                        │
│ │              │ │                  │                        │
│ └──────────────┘ │                  │                        │
└──────────────────┴──────────────────┴────────────────────────┘
```

**Behavior:**
- On mount: `GET /api/kitchen/orders/active` + join socket room `kitchen`
- Listen for `kitchen:new-order` → add new ticket to "To Cook" column
- Click ticket card → calls `PUT /api/kitchen/orders/:id/stage` (moves to next column)
- Click individual item → calls `PUT /api/kitchen/orders/:id/items/:itemId` (strike-through)
- When all items prepared → ticket auto-moves to Completed
- Completed tickets can optionally fade out or stay for reference

**OrderTicket Component:**
```
┌─────────────────┐
│ ORD-007         │  ← Order number (= ticket number)
│ Table 3         │  ← Table number
│ ─────────────── │
│ • Pizza     x2  │  ← Item (click to strike-through)
│ • Coffee    x1  │
│ ─────────────── │
│ 2 min ago       │  ← Time since order received
└─────────────────┘
```

### CustomerDisplay.jsx (STANDALONE — separate tab)

Route: `/customer/:orderId` (no auth required)

```
┌──────────────────────────────────────┐
│                                      │
│        🏪 POS Cafe                   │
│                                      │
│   ┌──────────────────────────────┐   │
│   │  Order: ORD-005              │   │
│   │  Table: 3                    │   │
│   │                              │   │
│   │  Margherita Pizza x2  ₹600  │   │
│   │  Cappuccino x1        ₹150  │   │
│   │  ─────────────────────────  │   │
│   │  Subtotal:            ₹750  │   │
│   │  Tax:                  ₹38  │   │
│   │  Total:               ₹788  │   │
│   │                              │   │
│   │  Payment: ❌ Unpaid          │   │
│   │  (or)                        │   │
│   │  Payment: ✅ Paid — Cash     │   │
│   └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

**Behavior:**
- On mount: `GET /api/customer-display/:orderId` + join socket room `customer:{orderId}`
- Listen for `order:payment-completed` → update payment status to ✅ Paid
- Auto-refresh every 30 seconds as fallback

### Dashboard.jsx (Inside BackendLayout)

```
┌──────────────────────────────────────────────────────────┐
│ [Sidebar] │  📊 Dashboard                                │
│           │                                              │
│           │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│           │  │ ₹25,000 │ │   45    │ │  ₹556   │        │
│           │  │ Total   │ │ Total   │ │ Average │        │
│           │  │ Sales   │ │ Orders  │ │ Order   │        │
│           │  └─────────┘ └─────────┘ └─────────┘        │
│           │                                              │
│           │  ┌────────────────────────────────────┐      │
│           │  │    Sales by Day (Bar Chart)        │      │
│           │  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │      │
│           │  └────────────────────────────────────┘      │
│           │                                              │
│           │  ┌──────────────────┐ ┌──────────────────┐   │
│           │  │ Top Products     │ │ Payment Breakdown│   │
│           │  │ 1. Pizza   ₹8400│ │ 🟢 Cash    48%   │   │
│           │  │ 2. Coffee  ₹6750│ │ 🔵 Digital 32%   │   │
│           │  │ 3. Burger  ₹3750│ │ 🟣 UPI     20%   │   │
│           │  └──────────────────┘ └──────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Charts:** Use simple CSS bars/charts or install a library like `recharts`:
```bash
npm install recharts
```

### Reports.jsx (Inside BackendLayout)

```
┌──────────────────────────────────────────────────────────┐
│ [Sidebar] │  📋 Reports                                  │
│           │                                              │
│           │  Filters:                                    │
│           │  [Period ▼] [Session ▼] [Staff ▼] [Product ▼]│
│           │                                              │
│           │  [🔍 Apply Filters]  [📄 PDF] [📊 XLS]       │
│           │                                              │
│           │  ┌────┬──────────┬────────┬───────┬────────┐ │
│           │  │ #  │ Order    │ Date   │ Total │ Method │ │
│           │  ├────┼──────────┼────────┼───────┼────────┤ │
│           │  │ 1  │ ORD-001  │ Apr 4  │ ₹630  │ Cash   │ │
│           │  │ 2  │ ORD-002  │ Apr 4  │ ₹450  │ UPI    │ │
│           │  │ 3  │ ORD-003  │ Apr 4  │ ₹320  │ Digital│ │
│           │  └────┴──────────┴────────┴───────┴────────┘ │
│           │                                              │
│           │  Total: ₹1,400 | Orders: 3                   │
└──────────────────────────────────────────────────────────┘
```

**Filter Behavior:**
- Period: Dropdown → Today / This Week / This Month / Custom (date picker)
- Session: Dropdown → list of sessions from `GET /api/sessions`
- Staff: Dropdown → list of users from your query
- Product: Dropdown → list of products from `GET /api/products`
- Apply → calls `GET /api/reports/sales?period=...&session_id=...`
- PDF button → `GET /api/reports/export/pdf?...` → downloads file
- XLS button → `GET /api/reports/export/xls?...` → downloads file

---

## Frontend NPM Dependencies

```bash
npm install socket.io-client recharts
```

---

## What You Deliver (Checklist)

- [ ] Socket.IO server setup works (clients can connect)
- [ ] Kitchen API — list orders with items, grouped by stage
- [ ] Kitchen API — advance order stage (to_cook → preparing → completed)
- [ ] Kitchen API — mark individual item as prepared
- [ ] When all items prepared → auto-complete the order
- [ ] Customer display API — returns order + payment status (no auth)
- [ ] Dashboard API — returns total sales, order count, avg value, top products, payment breakdown
- [ ] Reports API — returns filtered sales data
- [ ] PDF export works (downloads valid PDF)
- [ ] XLS export works (downloads valid Excel)
- [ ] Kitchen Display page — 3-column kanban, real-time updates
- [ ] Click ticket → moves to next stage
- [ ] Click item → strike-through (prepared)
- [ ] Customer Display page — shows order info + payment status
- [ ] Customer Display updates in real-time when payment is made
- [ ] Dashboard page — stats cards + bar chart + pie chart
- [ ] Reports page — filters + data table + export buttons
- [ ] Socket rooms work (kitchen, customer, pos)

---

## Dependencies

| You Depend On | Module | What |
|---|---|---|
| `kitchen_orders` records | Module C (Person 3) | Person 3 INSERTs when "Send to Kitchen" is clicked |
| Orders + payments data | Module C (Person 3) | You read from orders/payments tables for reports |
| Session list | Module B (Person 2) | For session filter dropdown in reports |
| Product list | Module A (Person 1) | For product filter dropdown in reports |
| Auth middleware | Module A (Person 1) | Protect report routes (kitchen/customer don't need auth) |
| `index.js` modification | Module A (Person 1) | You need to modify the server setup for Socket.IO |

## Who Depends On You

| Module | They Need |
|---|---|
| Module C (Person 3) | Socket.IO instance (`req.app.get('io')`) to emit events |

---

## Important Notes

1. **Kitchen Display should NOT require login** — it runs on a separate screen in the kitchen
2. **Customer Display should NOT require login** — it faces the customer
3. **Reports SHOULD require login** — only admin/staff can see reports
4. **Socket.IO setup must happen early** — Person 3 needs `io` instance to emit events. Coordinate with Person 1 to modify `index.js`
