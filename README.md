# ☕ POS Cafe — Real-Time Cafe Management System

An interactive, real-time cafe management and Point of Sale (POS) platform styled after Odoo's module-based architecture. Built on a modern tech stack utilizing React, Node.js, Socket.io, and MySQL (with native TiDB Cloud support), the application offers seamless coordination between front-of-house cashiers, kitchen staff, customers, and administrators.

---

## 🌟 Key Features

*   **👥 Role-Based Authentication:** Secure signup and login for Admins and Staff, with JWT-secured endpoints and protected route guards.
*   **📦 Rich Catalog Management:** Full CRUD on categories (with visual color-coding and order routing) and products, supporting complex attributes, price-adjusting variants, and custom add-ons/extras.
*   **🗺️ Interactive Floor Plan & Table Booking:** A real-time visual grid of tables. Tracks states dynamically (🟢 *Available*, 🔴 *Reserved*, 🟡 *Self-Order*, 🔵 *Occupied*), logs active session locking, and includes an auto-release background worker for expired QR sessions.
*   **🛒 Unified cashier POS Terminal:** A high-speed order interface allowing cashier staff to build orders, select item variants/extras, apply discounts, automatically calculate tax/totals, and dispatch tickets directly to the kitchen.
*   **🍳 Real-Time Kitchen Display System (KDS):** A live ticket monitor for kitchen staff. Kitchen orders sync instantly via WebSockets, allowing chefs to tick off items as they are prepared, automatically updating the cashier's dashboard.
*   **📺 Live Customer-Facing Display (CFD):** A dedicated, socket-powered screen showing order items and live checkout statuses (including QR code generation) to customers.
*   **💳 Dual-Payment Integration:** 
    *   **UPI QR Codes:** Instant, client-side QR generation using configured UPI IDs and exact totals.
    *   **Razorpay Sandbox Gateway:** Full digital payment flow with automatic order confirmation and signature verification via Razorpay Node SDK. Includes a testing UI at `/test-pay`.
*   **📊 Analytics Dashboard & Exports:** Visual reporting with interactive sales charts, average order size, peak hours, and downloadable reports in **PDF** (via PDFKit) and **Excel** (via ExcelJS).

---

## 🏗️ System Architecture & Collaborative Modules

The project is structured collaboratively into four modules. Each directory and route maps cleanly to specific functional areas:

```
pos-cafe-odoo/
├── backend/
│   ├── config/              # Database pool setup (TiDB/MySQL with SSL)
│   ├── controllers/         # Request handling logic
│   ├── middleware/          # JWT authentication checks
│   ├── routes/              # Modular API endpoints (A, B, C, D)
│   ├── socket/              # Socket.io connection and room configurations
│   ├── seed.js              # Database structure and basic seed data
│   ├── seed_analytics.js    # Dummy historical sales data generator
│   └── index.js             # Server entry point (HTTP + WebSockets)
├── public/                  # Static assets for the React app
├── src/
│   ├── assets/              # Shared styles, icons, and logo assets
│   ├── components/
│   │   ├── auth/            # Auth screens (Login, Signup)
│   │   ├── pos/             # POS layouts, floors, dashboards, and sessions
│   │   ├── restaurant/      # Analytics charts, reports
│   │   ├── self_order/      # Self-ordering catalog and order flow
│   │   └── ui/              # Reusable design system component library (shadcn style)
│   ├── context/             # Global states (Auth, Catalog, Order contexts)
│   ├── index.css            # Base Tailwind v4 configuration and HSL color variables
│   ├── App.jsx              # Main routing and dashboard coordinator
│   └── main.jsx             # React entry point
└── package.json             # Root-level Vite config and dependencies
```

### Module Breakdown
*   **Module A (Foundation):** Handles the DB pool, JWT middleware, `/api/auth` (signup, login, profiles), and `/api/products` / `/api/categories` along with product variants/extras.
*   **Module B (POS Configuration):** Manages `/api/floors`, `/api/tables` (status changes & release schedules), `/api/payment-methods`, `/api/terminal`, `/api/sessions` (shift cash drawers), and `/api/reservations`.
*   **Module C (POS Terminal Flow):** Implements order item additions, complex total math, and transaction management via `/api/orders` and `/api/payments` (Razorpay order placement & signature verification).
*   **Module D (Sync & Dashboard):** Configures Socket.io connections, live rooms (`kitchen`, `pos`, `customer`), `/api/kitchen` (KDS controls), and `/api/reports` (PDF/Excel layout builders and statistics queries).

---

## 🛠️ Technology Stack

*   **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React, Framer Motion, Socket.io-client.
*   **Backend:** Node.js, Express, Socket.io, MySQL (compatible with local MySQL & TiDB Cloud), JWT (`jsonwebtoken`), `bcryptjs`.
*   **Utilities & Services:**
    *   `pdfkit` for generating layout-rich PDF invoices and sales reports.
    *   `exceljs` for compiled sales spreadsheets.
    *   `qrcode` for UPI dynamic QR code representation.
    *   `razorpay` Node SDK for sandbox checkout hooks.

---

## ⚙️ Installation & Setup

Follow these steps to configure your environment and run the application locally.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   A running [MySQL](https://www.mysql.com/) server or [TiDB Cloud](https://pingcap.com/products/tidb-cloud/) cluster

### 1. Database Configuration
Create a database named `pos_cafe` in your database engine. In the `backend` directory, create a `.env` file referencing the credentials:

```ini
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pos_cafe
DB_PORT=3306
DB_SSL=false          # Set to true if using TiDB Cloud with SSL enforcement
JWT_SECRET=your_super_secure_jwt_secret_key
PORT=5001

# Razorpay sandbox settings (Replace with your keys if testing live checkouts)
RAZORPAY_KEY_ID=rzp_test_yourKeyID
RAZORPAY_KEY_SECRET=yourKeySecret
```

### 2. Initialize Database & Seed Data
Install the backend dependencies and run the seed script to structure the tables and load starting products/configurations:

```bash
cd backend
npm install
npm run seed
```

*(Optional)* If you want to populate the analytics dashboard with historical mock data (sales graphs, payment method shares, top categories), run the analytic seeder:
```bash
node seed_analytics.js
```

### 3. Start the Backend Server
Run the Express API in watch/development mode:
```bash
npm run dev
```
The server will boot up and start listening on `http://localhost:5001`.

### 4. Start the Frontend Application
Navigate back to the project root, install frontend packages, and spin up the Vite development server:

```bash
cd ..
npm install
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 💡 Running the Workflows

### 🏪 Shift Session Setup (Open/Close Drawer)
To access the POS, an Admin or Staff member must open a session with an opening balance. 
1. Log in (Default Admin: `admin@cafe.com` / Password: `admin123` or create a new user).
2. Go to **POS** view. If no session is open, you will be prompted to enter the opening balance.
3. Once active, the POS terminal floor plan unlocks, allowing order takers to access tables.
4. When closing, the terminal calculates the expected closing balance (Opening Drawer + Cash Sales) vs. the actual cash counted, prompting users to sign off.

### 🛒 Ordering & Kitchen Processing
1. Select any **Available** (green) table on the floor plan.
2. Build the order: select products, configure size/extra options, and append notes.
3. Click **Send to Kitchen**. 
    *   This emits a websocket packet to the **Kitchen Display**.
    *   The kitchen screen instantly displays the new order ticket detailing items to cook.
4. On the kitchen screen, chefs click **Prepare** and **Complete** on items. The cashier sees the status update in real-time.

### 💳 Digital Checkout & Razorpay
1. From the POS order sidebar, select **Pay**.
2. Select your payment method:
    *   **Cash:** Input customer cash to compute the exact change.
    *   **UPI:** Generates a real-time dynamic QR code targeting your configured UPI ID.
    *   **Digital:** Triggers a checkout modal.
3. To test the Razorpay payment gateway callback without checking out on the client, navigate to `http://localhost:5001/test-pay` in your browser. This endpoint simulates a secure sandbox payment and runs verification.

---

## 📊 Real-Time WebSocket Events

The application uses Socket.io to keep screens in sync. The events include:
*   `join:kitchen` / `join:pos` / `join:customer-display` (room grouping)
*   `kitchen:new-order` — Sent by cashier POS to alert kitchen of pending tickets.
*   `kitchen:item-prepared` / `kitchen:order-ready` — Dispatched by kitchen KDS to alert cashiers when orders are ready for pickup.
*   `pos:table-locked` / `pos:table-unlocked` — Prevents multiple cashiers from opening the same table checkout simultaneously.
*   `customer:order-update` — Pushes invoice line changes directly to the customer display.
*   `customer:payment-success` — Automatically redirects or clears the customer screen once checkout is completed.

---

## 📄 Generating Reports

Go to the **Analytics & Reports** tab on the Admin dashboard to:
1. Select date ranges and filters (terminal, cashier, payment type).
2. Export **Excel Sales Log:** Contains sheets for sales summary, transaction logs, and payment method details.
3. Export **PDF Sales Digest:** A beautiful layout including summary grids, top-selling items list, and visual status charts ready for printing or email distribution.
