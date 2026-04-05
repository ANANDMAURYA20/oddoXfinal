# OddoX POS — Multi-Tenant Restaurant Point of Sale System

A full-stack, cloud-enabled **Point of Sale (POS)** and **Kitchen Display System (KDS)** built for restaurants. Supports multi-tenant architecture, real-time kitchen coordination, QR-based customer ordering, inventory management, and business analytics.

**Live Demo:** [https://odoo.clipearn.fun](https://odoo.clipearn.fun)

---

## Features

### Point of Sale (POS)
- Product search & category filtering
- Dine-in table management with hold/resume
- Takeaway order support
- Discount code application
- Tax calculation
- Multiple payment methods (Cash, Card, UPI, Split)
- Bill printing & receipt generation
- Register session management (open/close with cash reconciliation)

### Kitchen Display System (KDS)
- Real-time order display via Socket.IO
- Kanban-style board (Pending → Preparing → Ready → Completed)
- Multi-station support with category-based routing
- Order time tracking with color-coded alerts

### Customer QR Ordering
- Scan-to-order via table QR codes — no login required
- Browse menu, customize with addons, place order
- Real-time order tracking
- Optional geofence validation

### Inventory & Products
- Full product CRUD with stock tracking
- Low stock alerts
- Product addons (e.g., Extra Cheese)
- Veg/Non-veg categorization
- Category management

### Reports & Analytics
- Daily revenue breakdown
- Payment method distribution
- Top selling products
- Category-wise sales
- Cashier performance metrics
- Time-based analytics with charts

### Multi-Tenant Architecture
- Complete data isolation per tenant
- Role-based access: Super Admin, Tenant Admin, Cashier, KDS Staff
- Tenant plans: Trial, Basic, Pro
- Super Admin dashboard for tenant management

### Additional
- Dark/light theme toggle
- Staff management with role assignment
- Customer database
- Supplier management
- OTP-based password reset via email
- Real-time notifications

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, Tailwind CSS, Zustand, React Query, React Router, Framer Motion, Recharts, Socket.IO Client |
| **Backend** | Node.js, Express.js, Prisma ORM, Socket.IO, Redis, JWT, Zod, Winston, Helmet |
| **Database** | PostgreSQL |
| **Caching** | Redis |
| **Real-time** | Socket.IO (WebSocket + polling fallback) |

---

## Project Structure

```
oddoXfinal/
├── server/                     # Express.js backend
│   ├── src/
│   │   ├── config/             # DB, Redis, Socket.IO, env configs
│   │   ├── features/           # Feature modules
│   │   │   ├── auth/           # Authentication & login
│   │   │   ├── category/       # Product categories
│   │   │   ├── customer/       # Customer management
│   │   │   ├── customer-order/ # Public QR ordering API
│   │   │   ├── discount/       # Discount codes
│   │   │   ├── kds/            # Kitchen Display Stations
│   │   │   ├── order/          # Order CRUD & status
│   │   │   ├── product/        # Product inventory
│   │   │   ├── register/       # Register sessions
│   │   │   ├── report/         # Business analytics
│   │   │   ├── settings/       # Tenant settings
│   │   │   ├── supplier/       # Supplier management
│   │   │   ├── table/          # Dine-in tables
│   │   │   ├── tenant/         # Multi-tenant admin
│   │   │   └── user/           # Staff management
│   │   ├── middleware/         # Auth, RBAC, tenant isolation
│   │   ├── utils/              # Logger, email, API helpers
│   │   └── routes/             # Route registry
│   └── prisma/                 # Schema & migrations
│
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── customer/       # Public QR ordering pages
│   │   │   └── ...             # POS, KDS, Dashboard, etc.
│   │   ├── components/         # Reusable UI components
│   │   ├── stores/             # Zustand state management
│   │   ├── hooks/              # Custom React hooks
│   │   ├── config/             # API & Socket config
│   │   └── utils/              # Utilities
│   └── ...
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 16+
- **PostgreSQL** 13+
- **Redis** 6+

### Backend Setup

```bash
cd oddoXfinal/server
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL, Redis URL, JWT secret, and SMTP credentials

# Database setup
npx prisma generate       # Generate Prisma client
npx prisma db push        # Create tables
npx prisma db seed        # Seed demo data

# Start server
npm run dev               # http://localhost:5000
```

### Frontend Setup

```bash
cd oddoXfinal/client
npm install

# Configure environment — create .env with:
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000

# Start dev server
npm run dev               # http://localhost:5173
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | Token expiry (e.g., `7d`) |
| `PORT` | Server port (default: `5000`) |
| `NODE_ENV` | `development` or `production` |
| `REDIS_URL` | Redis connection string |
| `SMTP_HOST` | Email SMTP host |
| `SMTP_PORT` | Email SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `EMAIL_FROM` | Sender email address |
| `SUPER_ADMIN_EMAIL` | Default super admin email |
| `SUPER_ADMIN_PASSWORD` | Default super admin password |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_SOCKET_URL` | Socket.IO server URL |

---

## Available Scripts

### Server

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Production start |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Sync schema to database |
| `npm run db:migrate` | Create a new migration |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

### Client

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## API Overview

All endpoints are prefixed with `/api/`.

| Module | Key Endpoints |
|--------|--------------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/change-password` |
| **Products** | `GET /products`, `POST /products`, `PATCH /products/:id`, `DELETE /products/:id` |
| **Categories** | `GET /categories`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id` |
| **Orders** | `GET /orders`, `POST /orders`, `PATCH /orders/:id/status`, `POST /orders/:id/refund` |
| **Reports** | `GET /reports/summary`, `GET /reports/daily`, `GET /reports/payment-breakdown` |
| **Settings** | `GET /settings`, `PATCH /settings` |
| **Register** | `POST /register/open`, `POST /register/:id/close`, `GET /register/:id/summary` |
| **Customer Order** | `POST /customer-order/:tenantId/table/:tableNumber/session`, `GET /customer-order/:tenantId/menu`, `POST /customer-order/:tenantId/order` |
| **Tenants** | `GET /tenants`, `PATCH /tenants/:id`, `DELETE /tenants/:id` |
| **Users** | `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id` |

---

## Real-time Events (Socket.IO)

| Event | Description |
|-------|-------------|
| `order:new` | New order placed |
| `order:updated` | Order status changed |
| `order:ready` | Order ready for pickup |
| `order:completed` | Order completed |
| `kot:send` | Kitchen Order Ticket sent |
| `kot:new` | New KOT received at KDS |
| `customer:track-order` | Customer joins order tracking |

---

## Security

- JWT authentication with 7-day token expiry
- bcrypt password hashing (salt rounds: 12)
- Rate limiting (100 req/15min global, 5 req/15min for auth)
- Helmet security headers
- CORS configuration
- Tenant-level data isolation (DB + Socket.IO rooms)
- Role-based access control middleware

---

## License

This project is proprietary. All rights reserved.
