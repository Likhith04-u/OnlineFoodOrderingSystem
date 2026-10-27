# Online Food Ordering System (AAT)

A full-stack prototype using React + Vite, Node.js + Express, and MongoDB.

## Features
- Customer registration and login
- Food menu with search and category filters
- Shopping cart with quantity updates/removal
- Checkout and order placement
- Customer order history and order-status tracking
- Admin login, dashboard, food CRUD, and order status management
- MongoDB database integration

## Requirements
- Node.js 18+ (recommended current LTS)
- MongoDB running locally, or a MongoDB Atlas connection string

## 1. Configure the backend
Open PowerShell in this project folder:

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env` if needed. Default local MongoDB URL is:
`mongodb://127.0.0.1:27017/online_food_ordering`

Default admin credentials:
- Email: `admin@restaurant.com`
- Password: `RestaurantAdmin@123`

Change these before using outside a local demo.

## 2. Start backend
In the backend terminal:

```powershell
npm install
npm run seed:admin
npm run dev
```

API runs at `http://localhost:5000`.

## 3. Start frontend
Open a second PowerShell terminal:

```powershell
cd web
npm install
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`.

## Notes
- Keep the backend and frontend running in separate terminals.
- The app stores the customer's session token in browser localStorage.
- This is an educational prototype. For production, add stronger validation, rate limiting, secure cookie-based sessions, payment integration, and deployment configuration.
