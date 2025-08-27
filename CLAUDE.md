# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-stack Cloudflare-based monorepo with three main components:

- **user-application**: React frontend with Vite + Cloudflare Workers backend using tRPC
- **data-service**: Cloudflare Worker service for data operations
- **@repo/data-ops**: Shared package for database operations, queries, and auth using Drizzle ORM

### Key Technologies
- **Frontend**: React 19, TanStack Router, TailwindCSS 4, Radix UI components
- **Backend**: Cloudflare Workers with Hono framework, tRPC for API layer
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Auth**: better-auth with Stripe integration
- **Package Manager**: pnpm with workspaces

### Architecture Patterns
- The user-application serves both frontend assets and handles tRPC API calls via a single worker
- Database initialization happens in the worker's fetch handler using `initDatabase(env.DB)`
- Shared database operations are centralized in the @repo/data-ops package
- Components use shadcn/ui patterns with Radix primitives

## Development Commands

### Root Level Commands
```bash
# Build the data-ops package (required before running apps)
pnpm build-package

# Start frontend development server
pnpm dev-frontend

# Start data service development server  
pnpm dev-data-service
```

### User Application Commands
```bash
cd apps/user-application

# Development server (port 3000)
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Deploy to Cloudflare
pnpm deploy

# Generate Cloudflare types
pnpm cf-typegen
```

### Data Service Commands
```bash
cd apps/data-service

# Development with remote bindings
pnpm dev

# Deploy to Cloudflare
pnpm deploy

# Run tests
pnpm test

# Generate Cloudflare types
pnpm cf-typegen
```

### Data Operations Package Commands
```bash
cd packages/data-ops

# Build the package
pnpm build

# Database operations
pnpm pull        # Pull schema from remote
pnpm generate    # Generate migrations
pnpm migrate     # Run migrations
pnpm studio      # Open Drizzle Studio

# Generate better-auth schemas
pnpm better-auth-generate
```

## Project Structure Notes

### Service Bindings
Both applications use service bindings defined in `service-bindings.d.ts` and `worker-configuration.d.ts` files for Cloudflare-specific integrations.

### Database Integration
- Database connection is initialized in worker fetch handlers via `initDatabase(env.DB)`
- The @repo/data-ops package exports database instance through `getDb()`
- D1 database binding is configured in wrangler.jsonc files

### Frontend Architecture
- Uses TanStack Router with file-based routing in `src/routes/`
- Components organized by feature in `src/components/`
- Custom hooks in `src/hooks/` for state management and WebSocket connections
- Auth integration with better-auth client setup

### Testing
- Frontend uses Vitest with React Testing Library and jsdom
- Data service uses Vitest with Cloudflare Workers testing utilities

### Build Process
1. Always build @repo/data-ops package first with `pnpm build-package`
2. Frontend build includes TypeScript compilation: `vite build && tsc`
3. Workers are deployed using `wrangler deploy`

## Important Files
- `pnpm-workspace.yaml`: Defines workspace structure
- `apps/user-application/worker/index.ts`: Main worker entry point with tRPC handler
- `packages/data-ops/src/db/database.ts`: Database initialization and connection management