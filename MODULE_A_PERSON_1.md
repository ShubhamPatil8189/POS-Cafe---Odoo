# MODULE A — Person 1: Foundation + Auth + Products

## 🎯 Your Role
You build the **skeleton that everyone else plugs into**, plus complete Auth and Product/Category management.

> ⚠️ You are the **first to push code**. Everyone depends on your project structure, auth middleware, and shared components.

---

## Your Database Tables

You don't create tables (schema is shared), but you **own the logic** for these tables:

| Table | Key Columns |
|---|---|
| `users` | id, name, email, password, role |
| `categories` | id, name, description, color, sequence, send_to_kitchen |
| `products` | id, name, category_id, price, tax, uom, description, is_active, send_to_kitchen |
| `product_attributes` | id, product_id, attribute_name |
| `product_variants` | id, product_id, attribute_id, value, unit, extra_price |
| `product_extras` | id, product_id, name, extra_price, is_active |

---

## Backend — Files You Create

```
backend/
├── index.js                     ← Express app entry point
├── .env                         ← Environment variables
├── config/
│   └── database.js              ← MySQL connection pool
├── middleware/
│   └── auth.js                  ← JWT verify middleware
├── routes/
│   ├── auth.js                  ← Login / Signup / Me
│   ├── products.js              ← Product CRUD + variants + extras
│   ├── categories.js            ← Category CRUD
│   │
│   ├── floors.js                ← EMPTY (Person 2 fills)
│   ├── tables.js                ← EMPTY (Person 2 fills)
│   ├── paymentMethods.js        ← EMPTY (Person 2 fills)
│   ├── terminal.js              ← EMPTY (Person 2 fills)
│   ├── sessions.js              ← EMPTY (Person 2 fills)
│   ├── reservations.js          ← EMPTY (Person 2 fills)
│   ├── orders.js                ← EMPTY (Person 3 fills)
│   ├── payments.js              ← EMPTY (Person 3 fills)
│   ├── kitchen.js               ← EMPTY (Person 4 fills)
│   └── reports.js               ← EMPTY (Person 4 fills)
├── socket/
│   └── index.js                 ← EMPTY (Person 4 fills)
└── seed.js                      ← Seed data script
```

### .env file
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pos_cafe
DB_PORT=3306
JWT_SECRET=your_secret_key_here
PORT=5000
```

---

## Backend — Your API Endpoints

### Auth Routes (`/api/auth`)

| Method | Endpoint | Request Body | Response | Notes |
|---|---|---|---|---|
| POST | `/api/auth/signup` | `{ name, email, password, role? }` | `{ token, user }` | Hash password with bcryptjs, return JWT |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` | Verify password, return JWT |
| GET | `/api/auth/me` | — (JWT in header) | `{ user }` | Protected route, returns current user |

**JWT Token Format:**
```json
{
  "id": 1,
  "email": "admin@cafe.com",
  "role": "admin"
}
```

**Auth Header (all protected routes use this):**
```
Authorization: Bearer <jwt_token>
```

### Category Routes (`/api/categories`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| GET | `/api/categories` | — | `[{ id, name, description, color, sequence, send_to_kitchen }]` |
| POST | `/api/categories` | `{ name, description?, color?, sequence?, send_to_kitchen? }` | `{ id, name, ... }` |
| PUT | `/api/categories/:id` | `{ name?, description?, color?, sequence?, send_to_kitchen? }` | `{ id, name, ... }` |
| DELETE | `/api/categories/:id` | — | `{ message: "Deleted" }` |

### Product Routes (`/api/products`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| GET | `/api/products` | — | `[{ id, name, price, ..., category: {...}, variants: [...], extras: [...] }]` |
| GET | `/api/products/:id` | — | `{ id, name, ..., category, variants, extras }` |
| POST | `/api/products` | `{ name, category_id, price, tax, uom, description, send_to_kitchen }` | `{ id, name, ... }` |
| PUT | `/api/products/:id` | `{ name?, price?, ... }` | `{ id, name, ... }` |
| DELETE | `/api/products/:id` | — | `{ message: "Deleted" }` |

### Product Variants (`/api/products/:id/variants`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| POST | `/api/products/:id/attributes` | `{ attribute_name }` | `{ id, product_id, attribute_name }` |
| POST | `/api/products/:id/variants` | `{ attribute_id, value, unit, extra_price }` | `{ id, ... }` |
| DELETE | `/api/products/variants/:id` | — | `{ message: "Deleted" }` |

### Product Extras (`/api/products/:id/extras`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| POST | `/api/products/:id/extras` | `{ name, extra_price }` | `{ id, ... }` |
| DELETE | `/api/products/extras/:id` | — | `{ message: "Deleted" }` |

---

## Backend — index.js Structure

```javascript
// Your index.js should:
// 1. Load env vars (dotenv)
// 2. Create Express app
// 3. Add middleware: cors(), express.json()
// 4. Import and use all route files:
//    app.use('/api/auth', authRoutes)
//    app.use('/api/products', productRoutes)
//    app.use('/api/categories', categoryRoutes)
//    app.use('/api/floors', floorRoutes)          // Person 2
//    app.use('/api/tables', tableRoutes)           // Person 2
//    app.use('/api/payment-methods', paymentMethodRoutes) // Person 2
//    app.use('/api/terminal', terminalRoutes)      // Person 2
//    app.use('/api/sessions', sessionRoutes)       // Person 2
//    app.use('/api/reservations', reservationRoutes) // Person 2
//    app.use('/api/orders', orderRoutes)           // Person 3
//    app.use('/api/payments', paymentRoutes)       // Person 3
//    app.use('/api/kitchen', kitchenRoutes)        // Person 4
//    app.use('/api/reports', reportRoutes)         // Person 4
// 5. Set up HTTP server + Socket.IO (Person 4 will add socket handlers)
// 6. Listen on PORT
```

### Empty Route File Template (for other modules)
Create these so other modules don't break the server:
```javascript
// routes/floors.js (Person 2 will fill this)
const express = require('express');
const router = express.Router();

// Person 2: Add your routes here

module.exports = router;
```

---

## Backend — NPM Dependencies You Install

```bash
npm install express mysql2 bcryptjs jsonwebtoken cors socket.io dotenv uuid
```

---

## Frontend — Files You Create

```
frontend/vite-project/src/
├── App.jsx                          ← Router with ALL routes
├── index.css                        ← Global design system
├── main.jsx                         ← App entry (wrap with AuthContext)
│
├── services/
│   └── api.js                       ← Fetch/axios wrapper with JWT
│
├── context/
│   └── AuthContext.jsx              ← Login, logout, user state, token
│
├── components/
│   ├── ProtectedRoute.jsx           ← Redirect to login if not authenticated
│   ├── Sidebar.jsx                  ← Backend navigation sidebar
│   ├── BackendLayout.jsx            ← Sidebar + content area wrapper
│   ├── Modal.jsx                    ← Reusable modal dialog
│   └── Toast.jsx                    ← Notification popup
│
├── pages/
│   ├── auth/
│   │   ├── Login.jsx                ← Login form
│   │   └── Signup.jsx               ← Registration form
│   │
│   └── backend/
│       ├── Products.jsx             ← Product list + add/edit modal
│       └── Categories.jsx           ← Category management
```

---

## Frontend — React Router Setup (App.jsx)

Define ALL routes (even for pages other people build). Use placeholder components for pages that don't exist yet:

```
/login                    → Login.jsx
/signup                   → Signup.jsx

/backend/dashboard        → Dashboard.jsx         (Person 4 — placeholder for now)
/backend/products         → Products.jsx           (YOU)
/backend/categories       → Categories.jsx         (YOU)
/backend/payment-methods  → PaymentMethods.jsx     (Person 2 — placeholder)
/backend/floor-plan       → FloorPlan.jsx          (Person 2 — placeholder)
/backend/pos-terminal     → POSTerminal.jsx        (Person 2 — placeholder)
/backend/reports          → Reports.jsx            (Person 4 — placeholder)

/pos/floor                → FloorView.jsx          (Person 3 — placeholder)
/pos/order/:tableId       → OrderScreen.jsx        (Person 3 — placeholder)
/pos/payment/:orderId     → PaymentScreen.jsx      (Person 3 — placeholder)

/kitchen                  → KitchenDisplay.jsx     (Person 4 — placeholder)
/customer/:orderId        → CustomerDisplay.jsx    (Person 4 — placeholder)
```

**Placeholder component:**
```jsx
const Placeholder = ({ name }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>{name}</h2>
    <p>Coming soon — assigned to another team member</p>
  </div>
);
```

---

## Frontend — Design System (index.css)

Set up CSS variables that EVERYONE uses:

```css
:root {
  /* Background */
  --bg-primary: #0f0f12;
  --bg-secondary: #1a1a24;
  --bg-card: #22222e;
  --bg-hover: #2a2a38;

  /* Accent */
  --accent: #ff6b35;
  --accent-hover: #ff8c5a;

  /* Status Colors */
  --status-available: #22c55e;
  --status-reserved: #ef4444;
  --status-self-order: #eab308;
  --status-occupied: #3b82f6;

  /* Text */
  --text-primary: #f1f1f1;
  --text-secondary: #a0a0b0;
  --text-muted: #666680;

  /* Borders */
  --border: #2e2e3e;
  --border-focus: #ff6b35;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.3);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.4);

  /* Typography */
  --font-family: 'Inter', sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;

  /* Spacing */
  --sidebar-width: 260px;
  --navbar-height: 60px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 50%;
}
```

---

## Frontend — API Service (services/api.js)

Create a wrapper that:
1. Sets base URL (`http://localhost:5000/api`)
2. Auto-attaches JWT token from localStorage
3. Handles errors globally
4. Exports functions: `api.get()`, `api.post()`, `api.put()`, `api.delete()`

This is imported by ALL team members.

---

## Frontend — AuthContext

Must provide:
```javascript
{
  user,          // Current user object or null
  token,         // JWT token string or null
  isLoading,     // Boolean — still checking auth?
  login(email, password),    // Calls API, stores token
  signup(name, email, password),  // Calls API, stores token
  logout(),      // Clears token, redirects to login
}
```

---

## Frontend NPM Dependencies You Install

```bash
cd frontend/vite-project
npm install react-router-dom axios
```

---

## Seed Data You Insert

```sql
-- Default user (password: admin123 — hash it with bcryptjs)
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@cafe.com', '<bcrypt_hash_of_admin123>', 'admin');

-- Categories
INSERT INTO categories (name, color, sequence, send_to_kitchen) VALUES
('Pizza', '#FF6B35', 1, TRUE),
('Coffee', '#8B4513', 2, TRUE),
('Pasta', '#FFD700', 3, TRUE),
('Burger', '#DC143C', 4, TRUE),
('Drinks', '#4169E1', 5, FALSE),
('Desserts', '#FF69B4', 6, TRUE);

-- Products
INSERT INTO products (name, category_id, price, tax, uom, description, send_to_kitchen) VALUES
('Margherita Pizza', 1, 300.00, 5.00, 'piece', 'Classic tomato and mozzarella', TRUE),
('Pepperoni Pizza', 1, 400.00, 5.00, 'piece', 'Loaded with pepperoni', TRUE),
('Farmhouse Pizza', 1, 450.00, 5.00, 'piece', 'Fresh vegetables', TRUE),
('Cappuccino', 2, 150.00, 5.00, 'cup', 'Frothy Italian coffee', TRUE),
('Latte', 2, 180.00, 5.00, 'cup', 'Smooth and creamy', TRUE),
('Espresso', 2, 120.00, 5.00, 'cup', 'Strong and bold', TRUE),
('Alfredo Pasta', 3, 350.00, 5.00, 'plate', 'Creamy white sauce', TRUE),
('Arrabbiata Pasta', 3, 320.00, 5.00, 'plate', 'Spicy red sauce', TRUE),
('Classic Burger', 4, 250.00, 5.00, 'piece', 'Juicy beef patty', TRUE),
('Cheese Burger', 4, 300.00, 5.00, 'piece', 'Double cheese', TRUE),
('Water Bottle', 5, 20.00, 0.00, 'bottle', '500ml', FALSE),
('Cold Coffee', 5, 200.00, 5.00, 'glass', 'Iced cold coffee', FALSE),
('Lemon Soda', 5, 80.00, 5.00, 'glass', 'Fresh lemon soda', FALSE),
('Chocolate Brownie', 6, 180.00, 5.00, 'piece', 'Warm chocolate brownie', TRUE);
```

---

## What You Deliver (Checklist)

- [ ] Backend server starts without errors on `npm start`
- [ ] MySQL connection works
- [ ] All empty route files created (no import errors)
- [ ] Signup creates user with hashed password
- [ ] Login returns JWT token
- [ ] Auth middleware protects routes
- [ ] Products CRUD works (create, read, update, delete)
- [ ] Products include variants and extras in GET response
- [ ] Categories CRUD works
- [ ] Frontend Login/Signup pages work and store JWT
- [ ] AuthContext provides user state globally
- [ ] Protected routes redirect to login when not authenticated
- [ ] Sidebar navigation renders with all menu items
- [ ] Products page shows list and allows add/edit/delete
- [ ] Categories page shows list and allows add/edit/delete
- [ ] Design system CSS variables are defined
- [ ] All placeholder routes/pages exist for other modules
- [ ] Seed data is inserted

---

## Dependencies On Other Modules: NONE
## Other Modules That Depend On You: ALL (B, C, D)

> ⚡ You should push your code FIRST so everyone can pull and start working.
