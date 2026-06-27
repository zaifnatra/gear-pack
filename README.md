# GearPack

GearPack is a web application for hikers and backpackers to manage their gear closets, plan trips, and share lists with friends.

## Live Demo
gear-pack.vercel.app

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A [Supabase](https://supabase.com/) account
- A [PostgreSQL](https://postgresql.org/) database (provided by Supabase)

### Installation

DM Me if you are interested in helping me with the installation process. 
There are required steps to set up the project. 
Bucks, policies, etc. 

Video for an Idea 
[Supabase Setup Video](https://youtu.be/97MbHhQC2ZE)


## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: Supabase Auth

## Docker

This project is a Next.js full-stack app: the UI, route handlers, and server actions run from the same Next.js runtime. The Docker setup still gives you two local application containers named `frontend` and `backend`, but they both use the same codebase. A truly separate backend container would require extracting the server actions/API code into a separate backend app.

Start both app containers:

```bash
docker compose up --build
```

Open the app at:

```text
http://localhost:3000
```

The backend-flavored Next.js runtime is also exposed at:

```text
http://localhost:3001
```

Local code changes are bind-mounted into both containers, so changes to files in `src`, `public`, `prisma`, and config files should hot reload while `docker compose up` is running. On Windows, polling is enabled in `docker-compose.yml` to make file watching more reliable.

Use your normal local environment files for Supabase, Prisma, and Backboard values. Next.js will read mounted `.env.local` files from the project root at runtime.
