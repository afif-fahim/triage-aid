# Technology Stack

## Core Framework
- **Preact** - Lightweight React alternative for better performance on low-power devices
- **TypeScript** - Strict typing with comprehensive linting rules
- **Vite** - Fast build tool with optimized bundling for PWA

## Styling & UI
- **Tailwind CSS v4** - Utility-first CSS with medical-themed color palette
- **Custom medical color scheme** - Triage priority colors (red, yellow, green, black)
- **Responsive design** - Mobile-first approach with touch-friendly interfaces
- **RTL support** - Built-in right-to-left layout for Arabic language

## Data & Storage
- **Dexie.js** - IndexedDB wrapper for local data persistence
- **Web Crypto API** - Client-side encryption for patient data security
- **Anonymous UUIDs** - Patient identification without PII exposure

## PWA Features
- **Vite PWA Plugin** - Service worker generation and caching strategies
- **Workbox** - Advanced caching with runtime strategies
- **Web App Manifest** - Native app-like installation and shortcuts

## Code Quality
- **ESLint** - Strict linting with TypeScript and React hooks rules
- **Prettier** - Consistent code formatting
- **Strict TypeScript** - No implicit any, unused parameters/locals checks

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues automatically
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting

# TypeScript
tsc -b                  # Type check without emitting files
```

## Build Configuration
- **Code splitting** - Vendor, UI, services, and locale chunks
- **Terser minification** - Console removal in production
- **Bundle size limit** - 500KB warning threshold for mobile optimization
- **Dependency optimization** - Pre-bundled Preact and Dexie