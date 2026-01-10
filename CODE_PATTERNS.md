# Recurring Code Patterns in Next.js/React Projects

## Navigation Flow Clarification

**You asked:** "When you click something on the login page, it calls this home component?"

**Actually, it's the opposite!** Here's the flow:

1. **User visits homepage** (`/`) → Sees `src/app/page.tsx` (Home component)
2. **User clicks "Log In" or "Get Started"** → Goes to `/login` → Shows `src/app/login/page.tsx`
3. **User logs in successfully** → Redirects to `/dashboard` → Shows `src/app/dashboard/page.tsx`

**Navigation in Next.js:**
- `<Link href="/login">` creates a link that navigates to that route
- `router.push('/dashboard')` programmatically navigates (used after login)
- Each route has its own component file

---

## Pattern 1: Server Components vs Client Components

### Server Component (Default - No 'use client')
```typescript
// src/app/dashboard/page.tsx
export default async function DashboardPage() {
    // Can directly fetch data from database
    const user = await supabase.auth.getUser()
    const trips = await prisma.trip.findMany()
    
    return <div>{/* render data */}</div>
}
```

**Characteristics:**
- ✅ Can directly access database
- ✅ Runs on server (faster, more secure)
- ❌ Cannot use React hooks (useState, useEffect)
- ❌ Cannot handle user interactions (onClick, onChange)

### Client Component (Has 'use client')
```typescript
// src/app/login/page.tsx
'use client'  // ← This makes it a client component

import { useState } from 'react'

export default function LoginPage() {
    const [view, setView] = useState('login')  // ← Can use hooks
    
    return (
        <button onClick={() => setView('signup')}>  {/* ← Can handle clicks */}
            Sign Up
        </button>
    )
}
```

**Characteristics:**
- ✅ Can use React hooks
- ✅ Can handle user interactions
- ❌ Cannot directly access database
- ❌ Must call server actions to get data

**When to use which:**
- **Server Component**: Displaying data, fetching from database
- **Client Component**: Forms, buttons, interactive UI

---

## Pattern 2: Server Actions

**Location:** `src/app/actions/*.ts`

Server actions are functions that run on the server. They handle:
- Form submissions
- Database operations
- Authentication
- Any server-side logic

### Example Pattern:
```typescript
// src/app/actions/auth.ts
'use server'  // ← Marks this as a server action

export async function signIn(formData: FormData) {
    // 1. Get data from form
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    // 2. Validate/process
    const supabase = createServerClient(...)
    
    // 3. Perform action
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
    
    // 4. Return result
    if (error) {
        return { success: false, error: error.message }
    }
    return { success: true }
}
```

### Calling from Client Component:
```typescript
// In a client component
import { signIn } from '@/app/actions/auth'

const handleSubmit = async (formData: FormData) => {
    const result = await signIn(formData)  // ← Calls server action
    
    if (result.success) {
        router.push('/dashboard')
    } else {
        setError(result.error)
    }
}
```

**Common Pattern:**
1. Server action receives `FormData` or parameters
2. Performs database/auth operation
3. Returns `{ success: boolean, error?: string, data?: any }`

---

## Pattern 3: Form Handling

### Pattern A: Using FormData (Simple Forms)
```typescript
'use client'

export default function LoginForm() {
    const handleSubmit = async (formData: FormData) => {
        const result = await signIn(formData)  // Pass FormData directly
        // Handle result...
    }
    
    return (
        <form action={handleSubmit}>  {/* ← action prop */}
            <input name="email" type="email" />
            <input name="password" type="password" />
            <button type="submit">Submit</button>
        </form>
    )
}
```

### Pattern B: Using React Hook Form (Complex Forms)
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
})

export default function ProfileForm() {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),  // ← Validation
    })
    
    const onSubmit = async (data) => {
        const result = await updateProfile(data)
        // Handle result...
    }
    
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <input {...register('name')} />
            {errors.name && <span>{errors.name.message}</span>}
            <button type="submit">Submit</button>
        </form>
    )
}
```

**Common Pattern:**
1. Define form schema (with Zod for validation)
2. Use `useForm` hook
3. Register inputs with `{...register('fieldName')}`
4. Handle submit with `handleSubmit(onSubmit)`

---

## Pattern 4: Loading States with useTransition

**Why:** Shows loading state while server action runs

```typescript
'use client'

import { useTransition } from 'react'

export default function MyForm() {
    const [isPending, startTransition] = useTransition()
    
    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {  // ← Wrap async operation
            const result = await signIn(formData)
            // Handle result...
        })
    }
    
    return (
        <form action={handleSubmit}>
            <button type="submit" disabled={isPending}>
                {isPending ? 'Loading...' : 'Submit'}
            </button>
        </form>
    )
}
```

**Pattern:**
- `isPending` = true while action is running
- `startTransition()` wraps the async operation
- Disable button/show spinner while pending

---

## Pattern 5: Navigation

### Using Link Component (Declarative)
```typescript
import Link from 'next/link'

<Link href="/dashboard">Go to Dashboard</Link>
```

### Using useRouter (Programmatic)
```typescript
'use client'

import { useRouter } from 'next/navigation'

export default function MyComponent() {
    const router = useRouter()
    
    const handleSuccess = () => {
        router.push('/dashboard')      // Navigate to route
        router.refresh()              // Refresh server data
    }
}
```

**When to use:**
- **Link**: User clicks a link/navigation
- **router.push()**: After form submission, after login, etc.

---

## Pattern 6: Data Fetching in Server Components

```typescript
// Server Component (no 'use client')
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    // 1. Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null  // ← Early return if not authenticated
    
    // 2. Fetch data from database
    const trips = await prisma.trip.findMany({
        where: { userId: user.id },
        include: { participants: true }
    })
    
    // 3. Render with data
    return (
        <div>
            {trips.map(trip => (
                <div key={trip.id}>{trip.name}</div>
            ))}
        </div>
    )
}
```

**Pattern:**
1. Get user (if needed)
2. Fetch data with Prisma
3. Render directly (no loading states needed - server handles it)

---

## Pattern 7: Conditional Rendering

```typescript
// Pattern A: Ternary operator
{user ? (
    <div>Welcome, {user.name}</div>
) : (
    <div>Please log in</div>
)}

// Pattern B: Logical AND
{error && (
    <div className="text-red-500">{error}</div>
)}

// Pattern C: Multiple conditions
{view === 'login' && <LoginForm />}
{view === 'signup' && <SignupForm />}
{view === 'forgot' && <ForgotForm />}
```

---

## Pattern 8: State Management

### Local State (useState)
```typescript
'use client'

import { useState } from 'react'

export default function MyComponent() {
    const [count, setCount] = useState(0)
    const [name, setName] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    
    return (
        <button onClick={() => setCount(count + 1)}>
            Count: {count}
        </button>
    )
}
```

### Form State (useForm from react-hook-form)
```typescript
const { register, watch, setValue, formState } = useForm({
    defaultValues: { name: '', email: '' }
})
```

---

## Pattern 9: Error Handling

```typescript
// In Server Action
export async function createItem(data: FormData) {
    try {
        // Operation
        const result = await prisma.item.create({...})
        return { success: true, data: result }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// In Client Component
const handleSubmit = async () => {
    const result = await createItem(formData)
    
    if (result.success) {
        toast.success('Item created!')
        router.push('/dashboard')
    } else {
        setError(result.error)  // Show error to user
    }
}
```

**Pattern:**
- Server actions return `{ success: boolean, error?: string }`
- Client components check `success` and handle accordingly

---

## Pattern 10: Styling with Tailwind CSS

### Common Class Patterns:
```typescript
// Layout
className="flex items-center justify-between"  // Flexbox
className="grid grid-cols-3 gap-4"            // Grid
className="space-y-4"                          // Vertical spacing

// Responsive
className="text-sm sm:text-base md:text-lg"   // Responsive text
className="flex-col sm:flex-row"              // Responsive direction

// Colors
className="bg-emerald-600 text-white"         // Background + text
className="border-neutral-200"                // Border color

// States
className="hover:bg-emerald-700"              // Hover state
className="disabled:opacity-50"                // Disabled state
className="focus:ring-2 focus:ring-emerald-500" // Focus state

// Dark mode
className="dark:bg-neutral-900 dark:text-white" // Dark mode styles
```

---

## Pattern 11: Component Composition

```typescript
// Parent Component
export default function GearPage() {
    const items = await getGearItems()
    
    return (
        <div>
            <GearGrid items={items} />  {/* ← Pass data as props */}
        </div>
    )
}

// Child Component
export function GearGrid({ items }) {
    return (
        <div className="grid grid-cols-3 gap-4">
            {items.map(item => (
                <GearCard key={item.id} item={item} />  {/* ← Reusable component */}
            ))}
        </div>
    )
}
```

**Pattern:**
- Break UI into small, reusable components
- Pass data down via props
- Each component has a single responsibility

---

## Pattern 12: TypeScript Interfaces

```typescript
// Define shape of data
interface GearItem {
    id: string
    name: string
    brand: string | null  // ← Can be string or null
    weightGrams: number
    category: { id: string; name: string } | null
}

// Use in component
export function GearCard({ item }: { item: GearItem }) {
    return <div>{item.name}</div>
}
```

**Pattern:**
- Define interfaces for data structures
- Use `| null` for optional fields
- Use nested objects for relationships

---

## Pattern 13: Authentication Check

```typescript
// In Server Component
export default async function ProtectedPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        redirect('/login')  // ← Redirect if not authenticated
    }
    
    // User is authenticated, continue...
}
```

---

## Pattern 14: File Structure Conventions

```
src/app/
├── page.tsx              # Homepage (/)
├── login/
│   └── page.tsx          # Login page (/login)
├── dashboard/
│   ├── page.tsx          # Dashboard (/dashboard)
│   ├── gear/
│   │   └── page.tsx      # Gear page (/dashboard/gear)
│   └── layout.tsx        # Layout for all /dashboard/* pages
└── actions/
    ├── auth.ts           # Auth-related server actions
    ├── gear.ts           # Gear-related server actions
    └── trips.ts          # Trip-related server actions

src/components/
├── gear/
│   ├── GearCard.tsx      # Reusable gear card
│   └── GearForm.tsx      # Gear form component
└── ui/
    └── Modal.tsx         # Reusable modal
```

**Pattern:**
- Pages in `app/` directory (file-based routing)
- Server actions in `app/actions/`
- Reusable components in `components/`

---

## Pattern 15: Async/Await Pattern

```typescript
// Always use async/await for async operations
const handleSubmit = async () => {
    try {
        const result = await serverAction()  // ← Wait for result
        if (result.success) {
            // Handle success
        }
    } catch (error) {
        // Handle error
    }
}
```

---

## Summary: Most Common Patterns

1. **Server Component** → Fetch data → Render
2. **Client Component** → Handle interaction → Call server action → Update UI
3. **Form** → `handleSubmit` → `startTransition` → Server action → Handle result
4. **Navigation** → `Link` for links, `router.push()` for programmatic
5. **Styling** → Tailwind classes in `className`
6. **State** → `useState` for local, `useForm` for forms
7. **Error Handling** → Try/catch in server, check `success` in client

---

## Quick Reference

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Server Component | Displaying data | `export default async function Page()` |
| Client Component | Interactive UI | `'use client'` + hooks |
| Server Action | Form submit, DB ops | `'use server'` + `export async function` |
| useTransition | Loading states | `const [isPending, startTransition] = useTransition()` |
| useRouter | Navigate after action | `router.push('/dashboard')` |
| Link | Navigation links | `<Link href="/login">` |
| useState | Local component state | `const [value, setValue] = useState('')` |
| useForm | Form with validation | `useForm({ resolver: zodResolver(schema) })` |

---

These patterns appear throughout the codebase. Once you recognize them, reading and writing code becomes much easier! 🚀
