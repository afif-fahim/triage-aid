# Project Structure

## Root Directory
```
├── src/                    # Source code
├── public/                 # Static assets and PWA files
├── .kiro/                  # Kiro configuration and specs
├── dist/                   # Production build output
├── node_modules/           # Dependencies
└── config files            # Vite, TypeScript, Tailwind, etc.
```

## Source Code Organization (`src/`)
```
src/
├── components/             # React/Preact components
│   ├── ui/                # Reusable UI components
│   ├── PatientDashboard.tsx
│   ├── PatientIntakeForm.tsx
│   └── ...
├── services/              # Business logic and data services
│   ├── DataService.ts     # Database operations
│   ├── SecurityService.ts # Encryption/decryption
│   ├── TriageEngine.ts    # START algorithm implementation
│   └── i18nService.ts     # Internationalization
├── types/                 # TypeScript type definitions
│   ├── PatientData.ts     # Patient and triage interfaces
│   └── AppState.ts        # Application state types
├── utils/                 # Utility functions
│   ├── performance.ts     # Performance optimization helpers
│   └── validation.ts      # Form validation utilities
├── hooks/                 # Custom React/Preact hooks
├── locales/               # Translation files (en, ar)
├── assets/                # Images, icons, fonts
├── app.tsx                # Main application component
├── main.tsx               # Application entry point
└── *.css                  # Global styles
```

## Public Assets (`public/`)
```
public/
├── icons/                 # PWA icons (various sizes)
├── manifest.json          # Web App Manifest
├── sw.js                  # Service Worker
├── offline.html           # Offline fallback page
└── browserconfig.xml      # Windows tile configuration
```

## Component Architecture
- **Page Components** - Top-level route components (Dashboard, Intake, Detail)
- **Feature Components** - Business logic components (PatientForm, TriageCard)
- **UI Components** - Reusable interface elements (Button, Input, Modal)
- **Layout Components** - Structure and navigation components

## Service Layer Pattern
- **DataService** - Handles all database operations with Dexie
- **SecurityService** - Manages encryption/decryption using Web Crypto API
- **TriageEngine** - Implements START algorithm logic
- **i18nService** - Handles translations and RTL layout

## File Naming Conventions
- **Components** - PascalCase (e.g., `PatientDashboard.tsx`)
- **Services** - PascalCase with Service suffix (e.g., `DataService.ts`)
- **Types** - PascalCase (e.g., `PatientData.ts`)
- **Utilities** - camelCase (e.g., `performance.ts`)
- **Hooks** - camelCase with use prefix (e.g., `usePatientData.ts`)

## Import Organization
1. External libraries (preact, dexie)
2. Internal services and utilities
3. Component imports
4. Type imports (with `type` keyword)
5. Relative imports last

## State Management
- **Local component state** - useState for component-specific data
- **Service layer** - Centralized business logic and data persistence
- **Context API** - Global app state (language, theme, user preferences)