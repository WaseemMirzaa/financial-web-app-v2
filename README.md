# Alkhaij Tamweel

A professional, premium-quality loan management web application built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Three Role-Based Portals

1. **Admin Portal** (`/admin`)
   - System analytics and overview
   - Employee management (create, edit, deactivate)
   - Customer management and assignment
   - Loan management (view/edit all loans)
   - Monitor all chats (customer-employee and internal)
   - Broadcast announcements
   - Language settings

2. **Employee Portal** (`/employee`)
   - View assigned customers only
   - Create and update loans (manual entry)
   - Update loan status
   - Chat with assigned customers
   - Participate in internal chat rooms
   - File sharing support

3. **Customer Portal** (`/customer`)
   - Read-only loan details view
   - Real-time loan status tracking
   - Chat with assigned employee
   - File upload capability
   - Notifications

### Key Features

- ✅ **Premium Design System** - Complete ReserveHub-inspired design with exact color codes, 8px grid system, Inter font
- ✅ **Bilingual Support** - English and Arabic with RTL support
- ✅ **Mock Data** - Fully functional with local mock data (ready for backend integration)
- ✅ **Real-time Chat** - Simulated real-time messaging with file support
- ✅ **Notifications** - In-app notification system
- ✅ **Responsive Design** - Mobile-first, works on all devices
- ✅ **Role-Based Access** - Secure role-based routing and permissions

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL (local or remote)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
# Copy example env (edit DB_* if needed)
cp .env.local.example .env.local
```

3. Database setup (creates DB, tables, and seed data including admin):
```bash
npm run db:setup
```
Or step by step: `npm run db:migrate` then `npm run db:seed`.

4. Run the development server (frontend + API):
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) and log in.

### Demo Accounts (after seed)

Passwords are never in the repo: set `ADMIN_EMAIL` / `ADMIN_PASSWORD` and `SEED_DEMO_PASSWORD` in `.env` before `db:seed`.

| Role     | Email               |
|----------|---------------------|
| Admin    | your `ADMIN_EMAIL`  |
| Employee | `john@demo.com`     |
| Employee | `sarah@demo.com`    |
| Customer | `ahmed@demo.com`    |
| Customer | `fatima@demo.com`   |
| Customer | `mohammed@demo.com` |

Admin uses `ADMIN_PASSWORD`; employees and customers use `SEED_DEMO_PASSWORD`.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Dashboard routes (protected)
│   │   ├── admin/         # Admin portal
│   │   ├── employee/      # Employee portal
│   │   └── customer/      # Customer portal
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/           # Layout components (Header, Sidebar)
│   └── chat/             # Chat components
├── contexts/             # React contexts (Auth, Locale, Notifications)
├── lib/                  # Utilities and mock data
└── types/                # TypeScript type definitions
```

## Design System

The application uses a strict design system based on ReserveHub:

- **Colors**: Primary green (#1A9E6F), Accent gold, Neutral grays
- **Typography**: Inter font family
- **Spacing**: 8px grid system (strict)
- **Components**: Buttons, Cards, Inputs, Modals with consistent styling
- **Responsive**: Mobile-first with breakpoints at 768px and 1024px

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **Mock Data**: Local state (ready for API integration)

## Backend Integration

The application is structured to easily integrate with a backend:

- API route stubs ready in `src/app/api/` (to be created)
- Mock data can be replaced with API calls
- Context providers can be extended with real authentication
- File uploads currently use browser storage (ready for cloud storage)

## Development

```bash
# Development server (frontend + API)
npm run dev

# Database: migrate only
npm run db:migrate

# Database: seed only (admin + dummy data)
npm run db:seed

# Database: full setup (migrate + seed)
npm run db:setup

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## License

This project is for demonstration purposes.
