# Technology Stack & Build System

## Core Technologies
- **Frontend Framework**: Preact (lightweight React alternative)
- **Language**: TypeScript with strict configuration
- **Styling**: Tailwind CSS with medical-themed color palette
- **Build System**: Vite with optimized bundling for mobile devices
- **PWA**: Vite PWA plugin with Workbox for advanced caching

## Key Libraries
- **Database**: Dexie.js (IndexedDB wrapper) with Web Crypto API encryption
- **Routing**: Custom router implementation in `src/hooks/useRouter.ts`
- **Internationalization**: Custom i18n service with English/Arabic support
- **State Management**: Preact hooks (useState, useEffect, useContext)

## Development Tools
- **Linting**: ESLint with TypeScript and React Hooks plugins
- **Formatting**: Prettier with consistent code style
- **Type Checking**: TypeScript with strict mode enabled
- **Package Manager**: npm

## Build Configuration
- **Target**: ES2022 with modern browser support
- **Bundle Optimization**: Manual chunks for vendor, UI, services, and locales
- **PWA Features**: Service worker with offline caching strategies
- **Deployment**: GitHub Pages with automated deployment

## Common Commands

### Development
```bash
npm run dev              # Start development server (Vite)
npm run build           # Build for production (TypeScript + Vite)
npm run preview         # Preview production build locally
```

### Code Quality
```bash
npm run lint            # Run ESLint checks
npm run lint:fix        # Auto-fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check Prettier formatting
```

### Deployment
```bash
npm run predeploy       # Runs build automatically
npm run deploy          # Deploy to GitHub Pages
```

## Architecture Patterns
- **Service-based architecture** with dedicated services for data, security, i18n, PWA
- **Component composition** with reusable UI components in `src/components/ui/`
- **Custom hooks** for shared logic (router, translation, data fetching)
- **Error boundaries** for graceful error handling
- **Lazy loading** for performance optimization