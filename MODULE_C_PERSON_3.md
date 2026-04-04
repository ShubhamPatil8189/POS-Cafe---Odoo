# MODULE C — Person 3: POS Terminal Flow (Floor View + Orders + Payments)

## 🎯 Your Role
You own the **core POS experience** — the terminal that the cashier uses every day. Selecting tables, taking orders, adjusting quantities, sending to kitchen, and processing payments (Cash / Digital / UPI QR).

> This is the **most user-facing** module. The cashier spends 90% of their time on YOUR screens.

---

## Your Database Tables

| Table | Key Columns |
|---|---|
| `orders` | id, session_id, table_id, user_id, customer_id, order_number, order_type, status, total_amount, discount, notes, is_invoice |
| `order_items` | id, order_id, product_id, variant_id, quantity, price, tax, uom, subtotal, discount, special_instructions |
| `order_item_extras` | id, order_item_id, extra_name, extra_price |
| `payments` | id, order_id, payment_method_id, amount, status, transaction_id |
| `kitchen_orders` | id, order_id, status (you INSERT when "Send" is clicked) |
| `kitchen_order_items` | id, kitchen_order_id, order_item_id, is_prepared |

> **Note on kitchen tables:** You CREATE the records when cashier clicks "Send to Kitchen". Person 4 READS and UPDATES them.

---

## Backend — Files You Create

```
backend/routes/
├── orders.js                ← Order CRUD + lifecycle
└── payments.js              ← Payment processing + UPI QR
```

---

## Backend — Your API Endpoints

### Order Routes (`/api/orders`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| POST | `/api/orders` | `{ session_id, table_id, user_id, order_type }` | `{ id, order_number, ... }` |
| GET | `/api/orders/:id` | — | `{ id, order_number, items: [...], table: {...}, total_amount }` |
| GET | `/api/orders/table/:tableId` | — | Active order for that table (status != 'paid') |
| GET | `/api/orders/session/:sessionId` | — | `[{ id, order_number, status, total_amount, ... }]` |
| PUT | `/api/orders/:id/items` | `{ items: [{ product_id, variant_id?, quantity, price, extras?: [...] }] }` | Updated order with recalculated total |
| POST | `/api/orders/:id/items` | `{ product_id, variant_id?, quantity, price, tax, uom, special_instructions? }` | Added item |
| PUT | `/api/orders/:id/items/:itemId` | `{ quantity?, special_instructions? }` | Updated item |
| DELETE | `/api/orders/:id/items/:itemId` | — | `{ message: "Item removed" }` |
| PUT | `/api/orders/:id/send-to-kitchen` | — | `{ message: "Sent to kitchen" }` |
| PUT | `/api/orders/:id/status` | `{ status }` | `{ id, status }` |

#### Create Order Logic
```
1. Generate unique order_number (format: "ORD-001", "ORD-002", auto-increment)
2. Set status = 'draft'
3. Set table status = 'occupied' (call Table API)
4. Return new order
```

#### Add/Update Items Logic
```
1. Insert/update order_items
2. Calculate subtotal = price * quantity
3. If extras provided, insert into order_item_extras
4. Recalculate order total_amount (SUM of all item subtotals + extras - discount + tax)
5. Return updated order
```

#### Total Calculation Formula
```
For each item:
  item_subtotal = (price + extra_prices) * quantity
  item_tax = item_subtotal * (tax / 100)
  item_total = item_subtotal + item_tax

order.total_amount = SUM(item_totals) - order.discount
```

#### Send to Kitchen Logic (`PUT /api/orders/:id/send-to-kitchen`)
```
1. Set order status = 'preparing'
2. INSERT into kitchen_orders (order_id, status='to_cook')
3. For each order_item where product.send_to_kitchen = TRUE:
   INSERT into kitchen_order_items (kitchen_order_id, order_item_id, is_prepared=false)
4. Emit Socket.IO event: 'kitchen:new-order' with order data
   (Import socket instance from Person 4's socket/index.js)
5. Return success
```

### Payment Routes (`/api/payments`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| POST | `/api/payments` | `{ order_id, payment_method_id, amount }` | `{ id, status: "pending" }` |
| POST | `/api/payments/validate` | `{ payment_id }` | `{ id, status: "success", order_status: "paid" }` |
| GET | `/api/payments/upi-qr/:orderId` | — | `{ qr_data, amount, upi_id }` |

#### Create Payment Logic
```
1. Create payment with status = 'pending'
2. Generate transaction_id (use uuid)
3. Return payment record
```

#### Validate Payment Logic (`POST /api/payments/validate`)
```
1. Set payment status = 'success'
2. Set order status = 'paid'
3. Set table status = 'available' (free the table!)
4. Emit Socket.IO event: 'order:payment-completed'
5. Return success with order details
```

#### UPI QR Generation (`GET /api/payments/upi-qr/:orderId`)
```
1. Get order total_amount
2. Get UPI ID from payment_methods table (where type = 'upi')
3. Build UPI payment URL:
   upi://pay?pa={upi_id}&pn=POS Cafe&am={amount}&cu=INR&tn=Order-{order_number}
4. Generate QR code image/data from this URL (use 'qrcode' npm package)
5. Return { qr_data (base64 image), amount, upi_id }
```

---

## Frontend — Files You Create

```
frontend/vite-project/src/
├── components/
│   ├── POSNavbar.jsx                ← Top bar for POS pages
│   ├── POSLayout.jsx                ← Layout wrapper (navbar + content)
│   ├── ProductCard.jsx              ← Product grid item
│   ├── CartItem.jsx                 ← Cart line item with +/- buttons
│   ├── QRDisplay.jsx                ← UPI QR code renderer
│   └── PaymentConfirmation.jsx      ← Success overlay after payment
│
├── pages/pos/
│   ├── FloorView.jsx                ← Color-coded table selection
│   ├── OrderScreen.jsx              ← Products + Cart split view
│   └── PaymentScreen.jsx            ← Payment method selection + flows
```

---

## Frontend — Page Details

### POSNavbar.jsx
```
┌────────────────────────────────────────────────────────────┐
│  [🪑 Table]   [📋 Register]              [⋮ More Menu]   │
│                                            ├─ Reload Data  │
│                                            ├─ Go to Backend│
│                                            └─ Close Register│
└────────────────────────────────────────────────────────────┘
```

- **Table** button → navigates to `/pos/floor`
- **Register** button → navigates to `/pos/register` or shows current order
- **More Menu** → dropdown with:
  - Reload Data → calls `window.location.reload()` or re-fetch all data
  - Go to Back-end → navigates to `/backend/dashboard`
  - Close Register → calls `POST /api/sessions/close`, then navigates to `/backend/pos-terminal`

### FloorView.jsx
**Layout:** POSNavbar + full-screen grid of table cards

```
┌──────────────────────────────────────────────────┐
│  [POSNavbar]                                     │
├──────────────────────────────────────────────────┤
│  [Ground Floor ▼]  ← Floor selector/tabs         │
│                                                  │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │ Table 1│  │ Table 2│  │ Table 3│  │ Table 4│ │
│  │ 4 seats│  │ 4 seats│  │ 6 seats│  │ 2 seats│ │
│  │  🟢    │  │  🔵    │  │  🟢    │  │  🔴    │ │
│  └────────┘  └────────┘  └────────┘  └────────┘ │
│                                                  │
│  ┌────────┐  ┌────────┐                         │
│  │ Table 5│  │ Table 6│                         │
│  │ 4 seats│  │ 8 seats│                         │
│  │  🟢    │  │  🟢    │                         │
│  └────────┘  └────────┘                         │
└──────────────────────────────────────────────────┘
```

**Behavior:**
- Fetch tables from `GET /api/tables/floor/:floorId`
- Click a 🟢 Available table → navigate to `/pos/order/:tableId`
- Click a 🔵 Occupied table → open existing order for that table
- Click a 🔴 Reserved table → show message "Table is reserved"
- If no session is open → show error "Please open a session first"

### OrderScreen.jsx
**Layout:** POSNavbar + Split view (60% products, 40% cart)

```
┌────────────────────────────────────────────────────────────┐
│  [POSNavbar]                        Table 3 — Order       │
├──────────────────────────────┬─────────────────────────────┤
│ [All][Pizza][Coffee][Pasta]  │  🛒 Cart                   │
│ ← Category filter tabs       │                             │
│                              │  Margherita Pizza    ₹300   │
│ ┌──────┐ ┌──────┐ ┌──────┐  │  [−] 1 [+]                 │
│ │ 🍕   │ │ 🍕   │ │ ☕   │  │                             │
│ │Margh.│ │Pepper│ │Cappu.│  │  Cappuccino x2      ₹300   │
│ │ ₹300 │ │ ₹400 │ │ ₹150 │  │  [−] 2 [+]                 │
│ └──────┘ └──────┘ └──────┘  │                             │
│                              │  ─────────────────────      │
│ ┌──────┐ ┌──────┐ ┌──────┐  │  Subtotal:        ₹600     │
│ │ ☕   │ │ 🍝   │ │ 🍝   │  │  Tax (5%):         ₹30     │
│ │Latte │ │Alfr. │ │Arrab.│  │  Total:           ₹630     │
│ │ ₹180 │ │ ₹350 │ │ ₹320 │  │                             │
│ └──────┘ └──────┘ └──────┘  │  [📤 Send to Kitchen]       │
│                              │  [💳 Payment]               │
│ ┌──────┐ ┌──────┐ ┌──────┐  │                             │
│ │ 🍔   │ │ 🍔   │ │ 💧   │  │  [🗑️ Clear Cart]           │
│ │Class.│ │Cheese│ │Water │  │                             │
│ │ ₹250 │ │ ₹300 │ │  ₹20 │  │                             │
│ └──────┘ └──────┘ └──────┘  │                             │
├──────────────────────────────┴─────────────────────────────┤
```

**Behavior:**
- Fetch products from `GET /api/products`
- Fetch categories from `GET /api/categories` (for filter tabs)
- Click category tab → filter products
- Click product card → add to cart (quantity = 1)
- Click +/- on cart item → adjust quantity (0 removes item)
- **"Send to Kitchen"** → calls `PUT /api/orders/:id/send-to-kitchen`
- **"Payment"** → navigates to `/pos/payment/:orderId`
- Cart state: save items to order via `POST/PUT /api/orders/:id/items`

### PaymentScreen.jsx
**Layout:** Full-screen payment flow

**Step 1: Method Selection**
```
┌────────────────────────────────────────┐
│         Payment — Order ORD-003        │
│         Table 3 | Total: ₹630         │
│                                        │
│    ┌──────────┐ ┌──────────┐           │
│    │  💵      │ │  💳      │           │
│    │  Cash    │ │ Digital  │           │
│    └──────────┘ └──────────┘           │
│    ┌──────────┐                        │
│    │  📱      │                        │
│    │  UPI QR  │                        │
│    └──────────┘                        │
│                                        │
│    [← Back to Order]                   │
└────────────────────────────────────────┘
```

**Step 2a: Cash Flow**
```
┌────────────────────────────────────────┐
│         Cash Payment                   │
│                                        │
│    Total:    ₹630                      │
│    Received: [₹_______]  ← input      │
│    Change:   ₹70         ← calculated │
│                                        │
│    [✅ Validate Payment]               │
│    [← Back]                            │
└────────────────────────────────────────┘
```

**Step 2b: Digital Flow**
```
┌────────────────────────────────────────┐
│         Digital Payment                │
│                                        │
│    Total: ₹630                         │
│    Method: Card / Bank                 │
│                                        │
│    [✅ Confirm Payment]                │
│    [← Back]                            │
└────────────────────────────────────────┘
```

**Step 2c: UPI QR Flow**
```
┌────────────────────────────────────────┐
│         UPI QR Payment                 │
│                                        │
│    Total: ₹630                         │
│                                        │
│       ┌─────────────┐                  │
│       │             │                  │
│       │   QR CODE   │  ← generated    │
│       │             │                  │
│       └─────────────┘                  │
│    UPI ID: 123@ybl.com                 │
│                                        │
│    [✅ Confirmed]  [❌ Cancel]          │
└────────────────────────────────────────┘
```

**Step 3: Payment Confirmation (after validate)**
```
┌────────────────────────────────────────┐
│                                        │
│           ✅                           │
│    Payment Successful!                 │
│                                        │
│    Order: ORD-003                      │
│    Amount: ₹630                        │
│    Method: Cash                        │
│                                        │
│    (Click anywhere to continue)        │
│                                        │
└────────────────────────────────────────┘
```
→ After clicking, navigate back to `/pos/floor` (Floor View)

---

## UPI QR Component (QRDisplay.jsx)

```
// Use the 'qrcode' package on backend to generate QR
// Frontend receives base64 image data
// Display as <img src={`data:image/png;base64,${qrData}`} />
```

---

## APIs You CALL From Other Modules

| API | From Module | Purpose |
|---|---|---|
| `GET /api/products` | Module A | Show products in Order Screen |
| `GET /api/categories` | Module A | Category filter tabs |
| `GET /api/tables` | Module B | Show tables in Floor View |
| `GET /api/tables/floor/:floorId` | Module B | Tables for specific floor |
| `PUT /api/tables/:id/status` | Module B | Mark table as occupied/available |
| `GET /api/sessions/current` | Module B | Check if session is open, get session_id |
| `GET /api/payment-methods` | Module B | Show enabled payment methods |

> **If Module A/B APIs aren't ready yet**, use mock data in your frontend:
> ```javascript
> const mockProducts = [
>   { id: 1, name: 'Margherita Pizza', price: 300, category_id: 1 },
>   { id: 2, name: 'Cappuccino', price: 150, category_id: 2 },
>   // ...
> ];
> ```

---

## Socket.IO Events You EMIT

When you call "Send to Kitchen" or "Validate Payment", emit these events so Module D's Kitchen Display and Customer Display update in real-time:

| Event | When | Data |
|---|---|---|
| `kitchen:new-order` | After `send-to-kitchen` | `{ orderId, orderNumber, tableNumber, items: [...] }` |
| `order:payment-completed` | After `validate-payment` | `{ orderId, orderNumber, tableId, amount, method }` |
| `table:status-changed` | After table status update | `{ tableId, status }` |

**How to emit:**
```javascript
// In your route handler, get the io instance:
const io = req.app.get('io');  // Person 4 will attach io to app
io.emit('kitchen:new-order', { orderId, orderNumber, tableNumber, items });
```

---

## What You Deliver (Checklist)

- [ ] Create order for a table (auto-generates order number)
- [ ] Add/update/remove items in an order
- [ ] Order total recalculates correctly (with tax)
- [ ] "Send to Kitchen" creates kitchen_order records + emits socket event
- [ ] Payment creation and validation works
- [ ] After payment → order status = 'paid', table status = 'available'
- [ ] UPI QR code generates correctly from UPI ID + amount
- [ ] Floor View shows all tables with correct status colors
- [ ] Clicking available table opens order screen
- [ ] Order Screen shows products with category filters
- [ ] Cart works: add, remove, adjust quantity
- [ ] Payment Screen shows all enabled payment methods
- [ ] Cash flow: enter amount, see change, validate
- [ ] UPI flow: show QR, confirm/cancel
- [ ] Payment confirmation screen → auto-return to Floor View

---

## Dependencies

| You Depend On | Module | What |
|---|---|---|
| Products + Categories API | Module A | Product data for order screen |
| Tables + Sessions API | Module B | Table data for floor view, session for orders |
| Payment Methods API | Module B | Which methods are enabled |
| Auth middleware | Module A | Protect your routes |
| Socket.IO instance | Module D | Emit kitchen events (use `req.app.get('io')`) |

## Who Depends On You

| Module | They Need |
|---|---|
| Module D (Person 4) | `kitchen_orders` and `kitchen_order_items` records you create |
| Module D (Person 4) | Socket events you emit |
| Module D (Person 4) | Orders + payments data for reports |
