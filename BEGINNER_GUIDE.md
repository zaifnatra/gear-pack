# Complete Beginner's Guide to GearPack

This guide explains the **why** and **how** of everything in this project. If you're a total beginner, start here!

---

## Table of Contents
1. [Server Actions (Instead of REST APIs)](#1-server-actions-instead-of-rest-apis)
2. [Authentication with Supabase](#2-authentication-with-supabase)
3. [Database: PostgreSQL + Prisma](#3-database-postgresql--prisma)
4. [Adding a New Feature (Step-by-Step)](#4-adding-a-new-feature-step-by-step)

---

## 1. Server Actions (Instead of REST APIs)

### What is a REST API?
**Traditional approach:** Your frontend (React) makes HTTP requests to separate backend endpoints:
- `GET /api/gear` - Get all gear items
- `POST /api/gear` - Create a new gear item
- `PUT /api/gear/123` - Update gear item #123
- `DELETE /api/gear/123` - Delete gear item #123

This requires:
- A separate API server (Express.js, FastAPI, etc.)
- Writing route handlers for each endpoint
- Managing CORS (Cross-Origin Resource Sharing)
- More files and complexity

### What are Server Actions?
**Next.js approach:** Functions that run on the server but can be called directly from your React components, like regular functions!

**Why use Server Actions?**
- ✅ **Simpler**: No need for separate API routes
- ✅ **Type-safe**: TypeScript knows the exact types
- ✅ **Secure**: Code runs on the server, not exposed to the browser
- ✅ **Less code**: One file instead of multiple route handlers

### How They Work in This Project

#### Example: Creating a Gear Item

**1. The Server Action** (`src/app/actions/gear.ts`):
```typescript
'use server'  // ← This tells Next.js: "This runs on the server!"

export async function createGearItem(userId: string, data: {
    name: string
    brand?: string
    // ... other fields
}) {
    // This code runs on the SERVER, not in the browser
    const newItem = await prisma.gearItem.create({
        data: {
            user: { connect: { id: userId } },
            name: data.name,
            // ...
        }
    })
    return { success: true, data: newItem }
}
```

**Key Points:**
- `'use server'` at the top = server-only code
- Can use database directly (Prisma)
- Can access environment variables safely
- Returns data that gets sent to the browser

**2. Using It in a Component** (`src/components/gear/GearForm.tsx`):
```typescript
'use client'  // ← This runs in the browser

import { createGearItem } from '@/app/actions/gear'

export function GearForm({ userId }: Props) {
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Call the server action like a normal function!
        const result = await createGearItem(userId, {
            name: "Zpacks Duplex",
            brand: "Zpacks",
            // ...
        })
        
        if (result.success) {
            // Success! Update the UI
        }
    }
    
    return <form onSubmit={handleSubmit}>...</form>
}
```

**What Happens Behind the Scenes:**
1. User fills out the form and clicks "Submit"
2. `handleSubmit` calls `createGearItem()`
3. Next.js automatically sends a request to the server
4. Server runs the function, saves to database
5. Result comes back to the browser
6. Component updates the UI

**Why This is Better:**
- No need to write `fetch('/api/gear', { method: 'POST', ... })`
- TypeScript knows the exact return type
- If you change the function signature, TypeScript will catch errors everywhere it's used

---

## 2. Authentication with Supabase

### What is Authentication?
Authentication = "Who are you?" (login/signup)
Authorization = "What can you do?" (permissions)

### What is Supabase?
Supabase is like Firebase, but open-source. It provides:
- **Auth**: User signup, login, password reset
- **Database**: PostgreSQL database
- **Storage**: File uploads
- **Real-time**: Live updates

**Why use Supabase?**
- ✅ Handles all the complex auth stuff (password hashing, JWT tokens, etc.)
- ✅ Free tier is generous
- ✅ Works great with Next.js

### How Authentication Works in This Project

#### Step 1: User Signs Up/Logs In
**File:** `src/app/login/page.tsx`

```typescript
import { signIn, signUp } from '@/app/actions/auth'

// When user submits the form:
const result = await signIn(formData)
```

**What happens:**
1. User enters email/password
2. `signIn()` calls Supabase's auth API
3. Supabase checks credentials
4. If valid, Supabase creates a **session** (like a temporary ID card)
5. Session is stored in a **cookie** (small file saved in the browser)

#### Step 2: Protecting Routes with Middleware
**File:** `middleware.ts`

**What is Middleware?**
Middleware = Code that runs **before** every page request. It's like a security guard checking IDs at the door.

```typescript
export async function middleware(request: NextRequest) {
    // 1. Get the Supabase client
    const supabase = createServerClient(...)
    
    // 2. Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    
    // 3. Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
        // User not logged in? Redirect to login!
        return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // 4. If logged in and trying to access /login, redirect to dashboard
    if (request.nextUrl.pathname === '/login' && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
}
```

**How It Works:**
1. User tries to visit `/dashboard/gear`
2. Middleware runs **first** (before the page loads)
3. Checks the cookie for a valid session
4. If no session → redirect to `/login`
5. If session exists → allow access

**Why This is Secure:**
- Runs on the server (can't be bypassed by client-side code)
- Checks every request automatically
- No need to add auth checks to every page

#### Step 3: Getting User Info in Pages
**File:** `src/app/dashboard/gear/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function GearPage() {
    // Get Supabase client (server-side)
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        redirect('/login')  // Safety check (middleware should catch this, but just in case)
    }
    
    // Now we know who the user is!
    const gear = await getGearItems(user.id)
    
    return <GearClosetView userId={user.id} ... />
}
```

**Key Concepts:**
- **Server Component**: This page runs on the server (no `'use client'`)
- **Server-side auth**: We check auth on the server, not in the browser
- **User ID**: Once authenticated, we have `user.id` to filter data

#### The Two Supabase Clients

**1. Server Client** (`src/lib/supabase/server.ts`):
- Used in Server Components and Server Actions
- Reads cookies to get the session
- Secure (runs on server)

**2. Client Client** (`src/lib/supabase/client.ts`):
- Used in Client Components (`'use client'`)
- For real-time features, client-side auth checks
- Less secure (runs in browser)

**When to Use Which:**
- **Server Client**: Most of the time (pages, server actions)
- **Client Client**: Only when you need real-time updates or client-side auth checks

---

## 3. Database: PostgreSQL + Prisma

### What is a Database?
A database = organized storage for your app's data. Like a spreadsheet, but much more powerful.

**Why not just use files?**
- ✅ Handles millions of records efficiently
- ✅ Multiple users can access simultaneously
- ✅ Prevents data corruption
- ✅ Can search/filter quickly

### What is PostgreSQL?
PostgreSQL = A type of database (like MySQL, MongoDB, etc.). It's:
- **Relational**: Data is organized in tables with relationships
- **SQL-based**: Uses SQL language to query data
- **Open-source**: Free and widely used

### What is Prisma?
Prisma = A tool that makes databases easier to use from JavaScript/TypeScript.

**Without Prisma:**
```javascript
// Raw SQL - hard to read, easy to make mistakes
const result = await db.query(
    'SELECT * FROM gear_items WHERE user_id = $1',
    [userId]
)
```

**With Prisma:**
```typescript
// Clean, type-safe, easy to understand
const gear = await prisma.gearItem.findMany({
    where: { userId: userId }
})
```

**Why Prisma?**
- ✅ **Type-safe**: TypeScript knows the exact shape of your data
- ✅ **Auto-complete**: Your editor suggests fields
- ✅ **Migrations**: Easy to update database structure
- ✅ **Relations**: Easy to work with connected data

### How the Database Works in This Project

#### Step 1: Define Your Data Structure (Schema)
**File:** `prisma/schema.prisma`

This file describes what your database tables look like:

```prisma
model GearItem {
  id          String    @id @default(uuid())  // Unique ID
  name        String                          // Required field
  brand       String?                         // Optional (the ? means nullable)
  weightGrams Int?                            // Optional number
  
  // Relationship: Each gear item belongs to one user
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  
  createdAt   DateTime  @default(now())       // Auto-filled timestamp
}
```

**Key Concepts:**
- **Model** = A table in the database
- **Field** = A column (like `name`, `brand`)
- **@id** = Primary key (unique identifier)
- **@default(uuid())** = Auto-generate a unique ID
- **Relation** = Link to another table (like `user`)

**Relationships Explained:**
```prisma
model User {
  id        String      @id
  gearCloset GearItem[]  // One user has many gear items
}

model GearItem {
  userId    String
  user      User        // Each gear item belongs to one user
}
```

This creates a **one-to-many** relationship:
- One User → Many GearItems
- Each GearItem → One User

#### Step 2: Prisma Generates the Database
After you write the schema, run:
```bash
npx prisma migrate dev
```

**What this does:**
1. Reads your `schema.prisma`
2. Creates SQL commands to build the tables
3. Runs them on your database
4. Generates TypeScript types for your code

#### Step 3: Using Prisma in Your Code
**File:** `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()
```

This creates a connection to your database.

**File:** `src/app/actions/gear.ts`

```typescript
import { prisma } from '@/lib/prisma'

export async function getGearItems(userId: string) {
    // Find all gear items where userId matches
    const gear = await prisma.gearItem.findMany({
        where: {
            userId: userId,  // Filter by user
        },
        include: {
            category: true,  // Also get the related category data
        },
        orderBy: {
            createdAt: 'desc',  // Newest first
        },
    })
    return { success: true, data: gear }
}
```

**Common Prisma Operations:**

**Create:**
```typescript
await prisma.gearItem.create({
    data: {
        name: "Zpacks Duplex",
        userId: "user-123",
        // ...
    }
})
```

**Read:**
```typescript
// Get one item
await prisma.gearItem.findUnique({ where: { id: "item-123" } })

// Get many items
await prisma.gearItem.findMany({ where: { userId: "user-123" } })
```

**Update:**
```typescript
await prisma.gearItem.update({
    where: { id: "item-123" },
    data: { name: "New Name" }
})
```

**Delete:**
```typescript
await prisma.gearItem.delete({ where: { id: "item-123" } })
```

### Where is the Database?
**Answer:** On Supabase's servers!

When you set up Supabase:
1. They give you a PostgreSQL database
2. You get a connection string (like `postgresql://user:pass@host:5432/dbname`)
3. You put it in `.env` as `DATABASE_URL`
4. Prisma uses it to connect

**Why Supabase?**
- ✅ Free tier includes a database
- ✅ Easy to set up
- ✅ Web interface to view/edit data
- ✅ Automatic backups

---

## 4. Adding a New Feature (Step-by-Step)

Let's say you want to add a **"Reviews"** feature where users can review gear items.

### Step 1: Add Model to `schema.prisma`

**What is a model?** A model = a table in your database.

**File:** `prisma/schema.prisma`

Add this to the end of the file:

```prisma
model Review {
  id        String   @id @default(uuid())
  rating    Int      // 1-5 stars
  comment   String?  // Optional text review
  
  // Who wrote this review?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Which gear item is this for?
  gearId    String
  gear      GearItem @relation(fields: [gearId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([gearId])  // Makes queries faster
  @@index([userId])
}
```

**Then update the related models:**

```prisma
model User {
  // ... existing fields ...
  reviews    Review[]  // Add this line
}

model GearItem {
  // ... existing fields ...
  reviews    Review[]  // Add this line
}
```

**What This Does:**
- Creates a `Review` table
- Links reviews to users and gear items
- `onDelete: Cascade` = If gear item is deleted, delete its reviews too
- `@@index` = Makes database queries faster

**Next:** Run the migration:
```bash
npx prisma migrate dev --name add_reviews
```

This creates the table in your database!

### Step 2: Create Server Actions

**File:** `src/app/actions/reviews.ts` (create new file)

```typescript
'use server'  // ← Important! This runs on the server

import { prisma } from '@/lib/prisma'

// Get all reviews for a gear item
export async function getReviews(gearId: string) {
    try {
        const reviews = await prisma.review.findMany({
            where: {
                gearId: gearId,
            },
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })
        return { success: true, data: reviews }
    } catch (error) {
        console.error('Failed to fetch reviews:', error)
        return { success: false, error: 'Failed to fetch reviews' }
    }
}

// Create a new review
export async function createReview(
    userId: string,
    gearId: string,
    data: {
        rating: number
        comment?: string
    }
) {
    try {
        // Check if user already reviewed this item
        const existing = await prisma.review.findFirst({
            where: {
                userId: userId,
                gearId: gearId,
            },
        })
        
        if (existing) {
            return { success: false, error: 'You already reviewed this item' }
        }
        
        const review = await prisma.review.create({
            data: {
                userId: userId,
                gearId: gearId,
                rating: data.rating,
                comment: data.comment || null,
            },
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        })
        
        return { success: true, data: review }
    } catch (error) {
        console.error('Failed to create review:', error)
        return { success: false, error: 'Failed to create review' }
    }
}
```

**Key Points:**
- `'use server'` = Server-only code
- Always check `userId` to prevent unauthorized access
- Return `{ success, data/error }` for consistent error handling
- Use `try/catch` to handle database errors gracefully

### Step 3: Create Components

**File:** `src/components/reviews/ReviewForm.tsx` (create new file)

```typescript
'use client'  // ← Runs in the browser

import { useState, useTransition } from 'react'
import { createReview } from '@/app/actions/reviews'

interface ReviewFormProps {
    userId: string
    gearId: string
    onSuccess: () => void
}

export function ReviewForm({ userId, gearId, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isPending, startTransition] = useTransition()
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (rating === 0) {
            alert('Please select a rating')
            return
        }
        
        startTransition(async () => {
            const result = await createReview(userId, gearId, {
                rating,
                comment: comment || undefined,
            })
            
            if (result.success) {
                setRating(0)
                setComment('')
                onSuccess()  // Refresh the reviews list
            } else {
                alert(result.error || 'Failed to create review')
            }
        })
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label>Rating</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={rating >= star ? 'text-yellow-400' : 'text-gray-300'}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                <label>Comment (optional)</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border rounded p-2"
                    rows={3}
                />
            </div>
            
            <button
                type="submit"
                disabled={isPending}
                className="bg-emerald-600 text-white px-4 py-2 rounded"
            >
                {isPending ? 'Submitting...' : 'Submit Review'}
            </button>
        </form>
    )
}
```

**File:** `src/components/reviews/ReviewList.tsx` (create new file)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getReviews } from '@/app/actions/reviews'

interface ReviewListProps {
    gearId: string
}

export function ReviewList({ gearId }: ReviewListProps) {
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
        async function loadReviews() {
            const result = await getReviews(gearId)
            if (result.success && result.data) {
                setReviews(result.data)
            }
            setLoading(false)
        }
        loadReviews()
    }, [gearId])
    
    if (loading) return <div>Loading reviews...</div>
    
    return (
        <div className="space-y-4">
            <h3>Reviews ({reviews.length})</h3>
            {reviews.map((review) => (
                <div key={review.id} className="border rounded p-4">
                    <div className="flex items-center gap-2">
                        <span>{review.user.username}</span>
                        <span>{'★'.repeat(review.rating)}</span>
                    </div>
                    {review.comment && <p>{review.comment}</p>}
                </div>
            ))}
        </div>
    )
}
```

**Key Concepts:**
- **Client Component** (`'use client'`) = Runs in browser, can use React hooks
- **useState** = Store data that changes (like form inputs)
- **useEffect** = Run code when component loads
- **useTransition** = Handle loading states for server actions

### Step 4: Create a Page (Optional)

If you want a dedicated reviews page:

**File:** `src/app/dashboard/reviews/[gearId]/page.tsx` (create new file)

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReviewList } from '@/components/reviews/ReviewList'
import { ReviewForm } from '@/components/reviews/ReviewForm'

export default async function ReviewsPage({
    params,
}: {
    params: { gearId: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        redirect('/login')
    }
    
    return (
        <div className="container mx-auto p-6">
            <h1>Gear Reviews</h1>
            <ReviewForm userId={user.id} gearId={params.gearId} onSuccess={() => {}} />
            <ReviewList gearId={params.gearId} />
        </div>
    )
}
```

**Or integrate into existing page:**

**File:** `src/app/dashboard/gear/page.tsx` (modify existing)

```typescript
// ... existing code ...
import { ReviewList } from '@/components/reviews/ReviewList'
import { ReviewForm } from '@/components/reviews/ReviewForm'

export default async function GearPage() {
    // ... existing code ...
    
    return (
        <div>
            <GearClosetView ... />
            
            {/* Add reviews section */}
            <div className="mt-8">
                <ReviewForm userId={user.id} gearId={someGearId} onSuccess={() => {}} />
                <ReviewList gearId={someGearId} />
            </div>
        </div>
    )
}
```

### Step 5: Test It!

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the page** in your browser

3. **Try creating a review:**
   - Fill out the form
   - Submit it
   - Check if it appears in the list

4. **Check the database:**
   - Go to Supabase dashboard
   - Look at the `Review` table
   - You should see your new review!

### Common Issues & Solutions

**Issue:** "Cannot find module '@/app/actions/reviews'"
- **Solution:** Make sure the file exists and you've saved it

**Issue:** "Prisma error: Table 'Review' does not exist"
- **Solution:** Run `npx prisma migrate dev` to create the table

**Issue:** "Type error: Property 'reviews' does not exist"
- **Solution:** Run `npx prisma generate` to update TypeScript types

**Issue:** Reviews not showing up
- **Solution:** Check browser console for errors, check server logs

---

## Summary: The Flow of Data

Here's how everything connects:

```
1. User visits page
   ↓
2. Middleware checks authentication
   ↓
3. Page (Server Component) loads
   ↓
4. Page calls Server Action
   ↓
5. Server Action uses Prisma to query database
   ↓
6. Database (PostgreSQL on Supabase) returns data
   ↓
7. Server Action returns data to page
   ↓
8. Page renders with data
   ↓
9. User interacts with Client Component
   ↓
10. Client Component calls Server Action
   ↓
11. (Repeat steps 5-8)
```

---

## Key Takeaways

1. **Server Actions** = Functions that run on the server, called from components
2. **Supabase Auth** = Handles login/signup, middleware protects routes
3. **Prisma** = Easy way to work with PostgreSQL database
4. **Schema** = Defines your database structure
5. **Components** = UI pieces (Server Components for data, Client Components for interactivity)

---

## Next Steps

- Read the code in `src/app/actions/` to see more examples
- Check `prisma/schema.prisma` to understand the data model
- Look at existing components to see patterns
- Try adding a small feature yourself!

**Remember:** When in doubt, look at existing code. The patterns are consistent throughout the project!
