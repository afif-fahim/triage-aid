# Project Structure & Organization

## Root Directory Structure
```
├── src/                    # Source code
├── public/                 # Static assets and PWA files
├── dist/                   # Production build output
├── .kiro/                  # Kiro AI assistant configuration
├── .github/                # GitHub workflows and templates
├── node_modules/           # Dependencies
└── config files            # Build and tool configurations
```

## Source Code Organization (`src/`)

### Core Application Files
- `main.tsx` - Application entry point with service initialization
- `app.tsx` - Main app component with routing and layout
- `app.css` - Global application styles
- `index.css` - Base CSS imports and global styles

### Component Architecture (`src/components/`)
```
components/
├── ui/                     # Reusable UI components (buttons, cards, etc.)
├── PatientDashboard.tsx    # Main dashboard view
├── PatientIntakeForm.tsx   # Patient assessment form
├── PatientDetailView.tsx   # Individual patient details
├── PatientListItem.tsx     # Dashboard list item component
├── LanguageSwitcher.tsx    # Language selection component
├── PWAInstallBanner.tsx    # PWA installation prompt
├── PWAStatus.tsx           # PWA connection status
└── index.ts               # Component exports
```

### Business Logic (`src/services/`)
- `DataService.ts` - Patient data CRUD operations
- `DatabaseService.ts` - IndexedDB database management
- `SecurityService.ts` - Encryption and data security
- `TriageEngine.ts` - START algorithm implementation
- `I18nService.ts` - Internationalization and localization
- `PWAService.ts` - Progressive Web App functionality
- `RouterService.ts` - Client-side routing
- `ErrorHandlingService.ts` - Global error management

### Custom Hooks (`src/hooks/`)
- `useTranslation.ts` - Translation and RTL support
- `useRouter.ts` - Navigation and routing
- `useErrorHandler.ts` - Error handling utilities
- `useNavigationGuard.ts` - Route protection

### Type Definitions (`src/types/`)
- `PatientData.ts` - Patient record interfaces
- `TriagePriority.ts` - Triage classification types
- `AppState.ts` - Application state interfaces
- `ValidationSchemas.ts` - Form validation types

### Utilities (`src/utils/`)
- `performance.ts` - Performance optimization helpers
- `rtl.ts` - Right-to-left language utilities

### Localization (`src/locales/`)
- `en.json` - English translations
- `ar.json` - Arabic translations

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (e.g., `PatientDashboard.tsx`)
- **Services**: PascalCase with Service suffix (e.g., `DataService.ts`)
- **Hooks**: camelCase with use prefix (e.g., `useTranslation.ts`)
- **Types**: PascalCase (e.g., `PatientData.ts`)
- **Utilities**: camelCase (e.g., `performance.ts`)

### Code Conventions
- **React Components**: PascalCase function components
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **CSS Classes**: Tailwind utility classes with medical- prefix for custom colors
- **Database Fields**: camelCase matching TypeScript interfaces

## Architecture Patterns

### Component Structure
- Lazy loading for heavy components to improve initial load time
- Error boundaries around major component sections
- Suspense fallbacks with loading spinners
- Responsive design with mobile-first approach

### Data Flow
1. **Patient Assessment** → Form validation → Triage calculation
2. **Data Encryption** → Local storage → Dashboard display  
3. **Status Updates** → Re-encryption → Persistence

### Service Layer
- Services are singleton instances imported throughout the app
- Async initialization pattern for services requiring setup
- Error handling with user-friendly toast notifications
- Offline-first data persistence with IndexedDB

### Styling Architecture
- Tailwind CSS with custom medical theme colors
- RTL support through custom Tailwind plugin
- Responsive utilities with mobile-first breakpoints
- Component-scoped styles when needed