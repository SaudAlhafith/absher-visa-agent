# Visa Preparation Assistant - Absher

## Overview

This is a visa preparation assistant application built for the Saudi Arabian government platform Absher. The application streamlines the visa application process by automatically collecting required documents from existing government data and helping users book embassy appointments. It features a multi-step wizard interface for selecting destination countries, visa types, and travelers, reviewing requirements, and scheduling embassy appointments.

The application is built as a full-stack TypeScript application with a React frontend and Express backend, following the Absher design system with its characteristic clean, spacious interface and green accent colors.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- React Query (@tanstack/react-query) for server state management and API communication

**UI Component System**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens matching Absher brand
- Class Variance Authority (CVA) for component variant management
- Custom design system following Absher guidelines with specific color palette (#1E9B63 primary green)

**State Management Strategy**
- React Query for server state (countries, visa types, travelers, requirements)
- Local component state (useState) for UI interactions and form inputs
- No global state management library needed due to simple data flow

**Design System Implementation**
- Custom Tailwind configuration with Absher-specific colors and spacing
- Design guidelines documented in `design_guidelines.md`
- Arabic-friendly typography with Inter font family
- Spacious layout with 48-64px vertical spacing between sections
- Card-based interface with 12px rounded corners and subtle shadows

### Backend Architecture

**Server Framework**
- Express.js for HTTP server
- TypeScript with ES modules for type safety
- HTTP server creation for potential WebSocket support

**API Design Pattern**
- RESTful API endpoints under `/api` prefix
- Resource-based routing (countries, visa-types, travelers, requirements, embassies, requests)
- JSON request/response format
- Error handling with appropriate HTTP status codes

**Data Access Layer**
- Storage abstraction pattern via `server/storage.ts`
- Mock data implementation for development (no database required initially)
- Interface-based design allows easy database integration later
- Drizzle ORM configured for future PostgreSQL integration

**Request Logging**
- Custom logging middleware for API requests
- Timestamp formatting and duration tracking
- Request path and response status logging

### Database & Data Storage

**Current Implementation**
- In-memory mock data for all entities (countries, visa types, travelers, requirements)
- Type-safe data structures defined in shared schema

**Configured for Future Use**
- Drizzle ORM configuration for PostgreSQL
- Schema definitions in `shared/schema.ts` ready for database tables
- Migration support configured via `drizzle.config.ts`
- Connection string via DATABASE_URL environment variable

**Data Models**
- Countries with visa status (visa_required, e_visa, visa_free, not_allowed)
- Visa types (tourist, business, student, medical, transit)
- Travelers with passport and ID information
- Visa requirements with status tracking
- Embassy and appointment slot information
- Visa requests to track user applications

### Build & Deployment

**Development Mode**
- Vite dev server with HMR for frontend
- TSX for running TypeScript server directly
- Concurrent development of client and server

**Production Build**
- Custom build script using esbuild for server bundling
- Vite build for client static assets
- Dependency bundling with allowlist for performance
- Single compiled output in `dist/` directory

**Static File Serving**
- Express serves built client assets from `dist/public`
- SPA fallback routing to index.html
- Separate build verification to ensure client is built before serving

### Routing & Navigation

**Multi-Step Wizard Flow**
1. Landing page (`/`) - Introduction and previous requests
2. Step 1 (`/step-1`) - Country, visa type, and traveler selection
3. Step 2 (`/step-2`) - Requirements review and document preparation
4. Step 3 (`/step-3`) - Embassy appointment booking
5. Success page (`/success`) - Confirmation and document download

**Query Parameter Passing**
- Request ID passed via query parameters between steps
- State persistence through API calls rather than local storage

## External Dependencies

### UI Component Libraries
- **Radix UI**: Unstyled, accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Shadcn/ui**: Pre-built components built on Radix UI
- **Lucide React**: Icon library for consistent iconography
- **CMDK**: Command palette component
- **Embla Carousel**: Carousel/slider functionality

### Form Management
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### Data & API
- **TanStack React Query**: Server state management, caching, and data fetching
- **Drizzle ORM**: Type-safe ORM for PostgreSQL (configured but not yet used)
- **drizzle-zod**: Integration between Drizzle and Zod for schema validation

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **tailwindcss-animate**: Animation utilities
- **class-variance-authority**: Component variant management
- **clsx** & **tailwind-merge**: Conditional className utilities

### Date Handling
- **date-fns**: Date formatting and manipulation

### Development Tools
- **Vite**: Build tool and dev server with React plugin
- **TypeScript**: Type checking and compilation
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit-specific plugins**: Runtime error overlay, cartographer, dev banner

### Potential Future Integrations
- **PostgreSQL**: Database (configured via Drizzle but currently using mock data)
- **Session Store**: connect-pg-simple for PostgreSQL-backed sessions (installed but not used)
- Email service for notifications
- Payment processing for visa fees
- External embassy appointment APIs