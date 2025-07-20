# Technology Stack & Build System

## Core Technologies
- **Framework**: Preact (React-compatible, lightweight alternative)
- **Language**: TypeScript with strict configuration
- **Build Tool**: Vite with PWA plugin
- **Styling**: Tailwind CSS with custom medical theme
- **Database**: Dexie (IndexedDB wrapper) for offline storage
- **PWA**: Workbox for service worker and caching strategies

## Development Tools
- **Linting**: ESLint with TypeScript and React Hooks plugins
- **Formatting**: Prettier with consistent configuration
- **Type Checking**: Strict TypeScript with comprehensive compiler options

## Key Dependencies
- `preact`: Lightweight React alternative for better performance
- `dexie`: Client-side database for offline data persistence
- `vite-plugin-pwa`: PWA capabilities with automatic service worker generation
- `workbox-window`: Service worker management and updates

## Build Commands
```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
npm run format:check
```

## Architecture Patterns
- **Service-based architecture**: Separate services for data, PWA, i18n, security, and error handling
- **Component composition**: Reusable UI components with consistent API
- **Hook-based state management**: Custom hooks for translation, error handling
- **Error boundaries**: Comprehensive error handling with fallback UI
- **Offline-first design**: All features work without network connectivity

## Configuration Notes
- Uses Preact with React compatibility layer (`react` and `react-dom` aliased to `preact/compat`)
- Strict TypeScript configuration with comprehensive linting rules
- Custom Tailwind theme with medical-specific color palette
- PWA configuration optimized for offline medical use
- Service worker caches all assets and implements runtime caching strategies