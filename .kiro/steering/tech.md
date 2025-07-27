# Technology Stack & Build System

## Core Technologies
- **Frontend Framework**: Preact + TypeScript for lightweight, performant UI
- **Styling**: Tailwind CSS with custom medical-themed color palette
- **Build System**: Vite with optimized bundling for mobile devices
- **Data Storage**: Dexie.js (IndexedDB) with Web Crypto API encryption
- **PWA Features**: Vite PWA plugin with Workbox for advanced caching

## Key Dependencies
- **preact**: Lightweight React alternative for better performance
- **dexie**: Modern IndexedDB wrapper for client-side database operations
- **vite-plugin-pwa**: PWA capabilities with service worker management
- **tailwindcss**: Utility-first CSS framework with custom medical theme

## Development Tools
- **ESLint**: Code linting with TypeScript and React hooks rules
- **Prettier**: Code formatting with consistent style
- **TypeScript**: Static type checking with strict configuration
- **PostCSS**: CSS processing with Tailwind and autoprefixer

## Common Commands

### Development
```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
```

### Code Quality
```bash
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues automatically
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
```

### Deployment
```bash
npm run predeploy       # Pre-deployment build
npm run deploy          # Deploy to GitHub Pages
```

### NEVER CREATE THESE unless specified explicitly
- Any type of test files
- Markdown files

## Build Configuration
- **Base Path**: `/triage-aid` for GitHub Pages deployment
- **Chunk Optimization**: Manual chunking for vendor, UI, services, and locales
- **PWA Caching**: Comprehensive caching strategy for offline functionality
- **Bundle Size**: Optimized for mobile devices with 500KB chunk size warning limit
- **Minification**: Terser with console removal for production builds

## Performance Optimizations
- Lazy loading for heavy components (Dashboard, Intake Form, Patient Detail)
- Service worker caching with runtime strategies
- Optimized dependency bundling
- Image and font caching strategies