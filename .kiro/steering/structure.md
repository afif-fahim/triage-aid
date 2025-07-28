# Project Structure & Organization

## Root Directory Structure
```
├── .kiro/              # Kiro AI assistant configuration
├── .github/            # GitHub workflows and templates
├── .vscode/            # VS Code workspace settings
├── public/             # Static assets and PWA manifest
├── src/                # Source code
├── dist/               # Production build output
├── dev-dist/           # Development build output
└── node_modules/       # Dependencies
```

## Source Code Organization (`src/`)
```
src/
├── components/         # React/Preact components
│   ├── ui/            # Reusable UI components (Button, Modal, etc.)
│   ├── PatientDashboard.tsx
│   ├── PatientIntakeForm.tsx
│   └── PatientDetailView.tsx
├── services/          # Business logic and data services
│   ├── DataService.ts      # Database operations (Dexie/IndexedDB)
│   ├── SecurityService.ts  # Encryption and security
│   ├── I18nService.ts      # Internationalization
│   ├── PWAService.ts       # Progressive Web App features
│   └── TriageEngine.ts     # START algorithm implementation
├── hooks/             # Custom React/Preact hooks
│   ├── useRouter.ts        # Custom routing logic
│   ├── useTranslation.ts   # i18n hook
│   └── usePatientData.ts   # Patient data management
├── types/             # TypeScript type definitions
├── utils/             # Utility functions and helpers
├── locales/           # Translation files (en.json, ar.json)
├── assets/            # Images, icons, and static resources
├── main.tsx           # Application entry point
├── app.tsx            # Main App component
├── app.css            # Global styles
└── index.css          # Base CSS and Tailwind imports
```

## Component Architecture
- **UI Components** (`src/components/ui/`): Reusable, styled components following design system
- **Feature Components**: Domain-specific components for patient management
- **Layout Components**: Navigation, headers, containers for responsive design

## Service Layer Pattern
- **DataService**: Handles all database operations with encryption
- **SecurityService**: Manages patient data encryption/decryption
- **I18nService**: Handles language switching and translations
- **PWAService**: Manages offline capabilities and app installation
- **TriageEngine**: Implements medical triage algorithms

## File Naming Conventions
- **Components**: PascalCase (e.g., `PatientDashboard.tsx`)
- **Services**: PascalCase with Service suffix (e.g., `DataService.ts`)
- **Hooks**: camelCase with use prefix (e.g., `useRouter.ts`)
- **Types**: PascalCase (e.g., `Patient.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)

## Import Organization
1. External libraries (preact, dexie)
2. Internal services
3. Internal components
4. Internal hooks and utilities
5. Type imports (with `type` keyword)

## Configuration Files
- **TypeScript**: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- **Tailwind**: `tailwind.config.js` with medical color palette
- **Vite**: `vite.config.ts` with PWA and optimization settings
- **ESLint**: `eslint.config.js` with medical app specific rules
- **Prettier**: `.prettierrc` for consistent formatting