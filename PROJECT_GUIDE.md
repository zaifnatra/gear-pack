# GearPack Project Guide for Beginners

## What is GearPack?

**GearPack** is a web application for hikers and backpackers to:
- Manage their gear closets (track all their outdoor equipment)
- Plan trips (create trip itineraries with gear lists)
- Share lists with friends (collaborate on trip planning)
- Social features (friends, messaging, notifications)

Think of it like a "social network for outdoor enthusiasts" combined with a "gear inventory management system."

---

## Project Type: Next.js Web Application

This is a **Next.js** application, which is a popular React framework for building web applications. Here's what that means:

- **Frontend**: The user interface (what users see and interact with)
- **Backend**: Server-side logic (authentication, database operations)
- **Full-stack**: Both frontend and backend in one codebase

---

## Technology Stack Overview

### Core Technologies

1. **Next.js 16** - The web framework (handles routing, server-side rendering)
2. **React 19** - UI library (builds interactive components)
3. **TypeScript** - JavaScript with type safety (catches errors before runtime)
4. **Tailwind CSS** - Styling framework (makes UI look good)

### Backend & Database

5. **Supabase** - Provides:
   - Authentication (user login/signup)
   - PostgreSQL database (stores all data)
   - File storage (for images)
6. **Prisma** - Database ORM (Object-Relational Mapping)
   - Makes database queries easier
   - Defines data models in `prisma/schema.prisma`

### Additional Features

7. **AI Integration** - Uses "Backboard" for AI chat features
8. **React Hook Form + Zod** - Form validation
9. **Sonner** - Toast notifications

---

## Project Structure

```
gear-pack/
├── prisma/
│   └── schema.prisma          # Database structure (tables, relationships)
│
├── public/                    # Static files (images, logos)
│   └── categories/            # Gear category images
│
├── src/
│   ├── app/                   # Next.js App Router (pages & routes)
│   │   ├── page.tsx           # Homepage (landing page)
│   │   ├── layout.tsx         # Root layout (wraps all pages)
│   │   ├── login/             # Login page
│   │   └── dashboard/         # Main app (requires login)
│   │       ├── page.tsx       # Dashboard home
│   │       ├── gear/          # Gear closet management
│   │       ├── trips/         # Trip planning
│   │       ├── social/        # Friends & social features
│   │       ├── messages/      # Messaging
│   │       ├── ai-chat/       # AI assistant
│   │       └── profile/       # User profile
│   │
│   ├── components/            # Reusable UI components
│   │   ├── gear/              # Gear-related components
│   │   ├── trips/             # Trip-related components
│   │   ├── social/            # Social features components
│   │   ├── layout/            # Layout components (nav, sidebar)
│   │   └── ui/                # Basic UI elements
│   │
│   ├── lib/                   # Utility functions & configurations
│   │   ├── prisma.ts          # Database client
│   │   ├── supabase/          # Supabase client setup
│   │   └── ai/                # AI integration
│   │
│   └── data/                  # Static data files
│
├── scripts/                   # Utility scripts
├── middleware.ts              # Route protection (auth checks)
├── next.config.ts             # Next.js configuration
└── package.json               # Dependencies & scripts
```

---

## Key Concepts to Understand

### 1. **Next.js App Router**

Next.js uses a file-based routing system:
- `src/app/page.tsx` → `/` (homepage)
- `src/app/login/page.tsx` → `/login`
- `src/app/dashboard/page.tsx` → `/dashboard`
- `src/app/dashboard/gear/page.tsx` → `/dashboard/gear`

### 2. **Database Schema (Prisma)**

The `prisma/schema.prisma` file defines all data models:

**Main Models:**
- **User** - User accounts (email, username, profile)
- **GearItem** - Individual pieces of gear (tent, sleeping bag, etc.)
- **Trip** - Planned hiking trips
- **Participant** - Users participating in trips
- **TripGear** - Gear items assigned to trips
- **Friendship** - Friend relationships
- **Message** - Chat messages
- **Conversation** - Chat conversations

**Relationships:**
- Users have many GearItems (gear closet)
- Users organize/participate in Trips
- Trips have many Participants
- Trips have many TripGear items
- Users can be friends with other Users

### 3. **Authentication Flow**

1. User visits `/login`
2. Supabase handles authentication
3. `middleware.ts` checks if user is logged in
4. Protected routes (like `/dashboard/*`) redirect to login if not authenticated
5. User data is stored in Supabase Auth

### 4. **Server Actions**

Located in `src/app/actions/` - these are server-side functions that:
- Handle form submissions
- Perform database operations
- Run on the server (secure, can access database directly)

---

## How to Start Understanding the Code

### Step 1: Start with the Landing Page
**File:** `src/app/page.tsx`
- Simple React component
- Shows the homepage with hero section
- Links to login/dashboard

### Step 2: Understand Authentication
**Files:**
- `middleware.ts` - Route protection
- `src/app/login/page.tsx` - Login UI
- `src/lib/supabase/` - Supabase client setup

### Step 3: Explore the Dashboard
**File:** `src/app/dashboard/page.tsx`
- Main app entry point after login
- See how it fetches user data
- Check the layout structure

### Step 4: Study a Feature (e.g., Gear Closet)
**Files:**
- `src/app/dashboard/gear/page.tsx` - Gear list page
- `src/components/gear/` - Gear-related components
- `src/app/actions/` - Look for gear-related actions
- `prisma/schema.prisma` - See `GearItem` model

### Step 5: Understand Data Flow
1. User interacts with UI (component)
2. Component calls a server action
3. Server action uses Prisma to query database
4. Data is returned and displayed

---

## Common Patterns You'll See

### 1. **Server Components vs Client Components**

```typescript
// Server Component (default) - can fetch data directly
export default async function Page() {
  const data = await prisma.gearItem.findMany()
  return <div>{/* render data */}</div>
}

// Client Component - for interactivity
'use client'
export default function Button() {
  return <button onClick={handleClick}>Click me</button>
}
```

### 2. **Form Handling**

Forms use React Hook Form + Zod validation:
- Define schema with Zod
- Use `react-hook-form` for form state
- Submit to server actions

### 3. **Database Queries**

```typescript
// Using Prisma
const gear = await prisma.gearItem.findMany({
  where: { userId: user.id },
  include: { category: true }
})
```

---

## Key Files to Read (In Order)

1. ✅ `README.md` - Project overview
2. ✅ `package.json` - Dependencies
3. ✅ `prisma/schema.prisma` - Database structure
4. ✅ `src/app/layout.tsx` - Root layout
5. ✅ `src/app/page.tsx` - Homepage
6. ✅ `middleware.ts` - Authentication
7. ✅ `src/app/dashboard/layout.tsx` - Dashboard layout
8. ✅ `src/app/dashboard/page.tsx` - Dashboard home
9. ✅ `src/lib/prisma.ts` - Database client
10. ✅ `src/lib/supabase/` - Auth setup

---

## Running the Project

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Create `.env.local` file
   - Add Supabase credentials (see README)

3. **Set up database:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:**
   - Visit `http://localhost:3000`

---

## Learning Resources

### Next.js
- [Next.js Docs](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

### React
- [React Docs](https://react.dev)

### Prisma
- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### Supabase
- [Supabase Docs](https://supabase.com/docs)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## Tips for Exploring

1. **Use your IDE's "Go to Definition"** - Click on imports/components to see their source
2. **Follow the data flow** - Start from UI → Action → Database
3. **Check the browser console** - See what errors/logs appear
4. **Use React DevTools** - Inspect component props and state
5. **Read error messages** - They often point to the exact issue

---

## Common Questions

**Q: Where is the API?**  
A: Next.js uses Server Actions (in `src/app/actions/`) instead of traditional REST APIs.

**Q: How does authentication work?**  
A: Supabase handles it. Check `middleware.ts` for route protection.

**Q: Where is the database?**  
A: PostgreSQL on Supabase. Prisma is the interface to it.

**Q: How do I add a new feature?**  
A: 1) Add model to `schema.prisma`, 2) Create page in `app/`, 3) Create components, 4) Add server actions.

---

## Next Steps

1. ✅ Read this guide
2. ✅ Explore the file structure
3. ✅ Run the project locally
4. ✅ Make a small change (e.g., change homepage text)
5. ✅ Add a console.log to see data flow
6. ✅ Read one feature end-to-end (e.g., gear closet)
7. ✅ Try adding a new field to a model

Good luck exploring! 🎒
