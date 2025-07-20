# Project Structure & Organization

## Root Directory Structure
```
├── src/                    # Source code
├── public/                 # Static assets and PWA files
├── dist/                   # Production build output
├── .kiro/                  # Kiro configuration and specs
├── .vscode/                # VS Code settings
└── node_modules/           # Dependencies
```

## Source Code Organization (`src/`)
```
src/
├── components/             # React/Preact components
│   ├── ui/                # Reusable UI components
│   ├── index.ts           # Component exports
│   ├── PatientIntakeForm.tsx
│   ├── PatientDashboard.tsx
│   ├── PatientDetailView.tsx
│   ├── PatientListItem.tsx
│   ├── LanguageSwitcher.tsx
│   └── PWAStatus.tsx
├── services/              # Business logic and data services
│   ├── DatabaseService.ts
│   ├── DataService.ts
│   ├── ErrorHandlingService.ts
│   ├── I18nService.ts
│   ├── PWAService.ts
│   ├── SecurityService.ts
│   ├── TriageEngine.ts
│   └── index.ts
├── hooks/                 # Custom React hooks
│   ├── useTranslation.ts
│   ├── useErrorHandler.ts
│   └── index.ts
├── types/                 # TypeScript type definitions
│   ├── AppState.ts
│   ├── PatientData.ts
│   ├── TriagePriority.ts
│   ├── ValidationSchemas.ts
│   └── index.ts
├── utils/                 # Utility functions
│   ├── rtl.ts
│   └── index.ts
├── locales/               # Internationalization files
│   ├── en.json
│   └── ar.json
├── assets/                # Static assets
├── app.tsx                # Main application component
├── main.tsx               # Application entry point
├── app.css                # Global styles
└── index.css              # Base styles
```

## Naming Conventions
- **Components**: PascalCase (e.g., `PatientIntakeForm.tsx`)
- **Services**: PascalCase with "Service" suffix (e.g., `DatabaseService.ts`)
- **Hooks**: camelCase with "use" prefix (e.g., `useTranslation.ts`)
- **Types**: PascalCase (e.g., `PatientData.ts`)
- **Utils**: camelCase (e.g., `rtl.ts`)
- **Files**: Use descriptive names that clearly indicate purpose

## Import/Export Patterns
- Each directory has an `index.ts` file for clean imports
- Use named exports for components and services
- Import from directory index files: `import { Component } from './components'`
- Absolute imports configured for `src/` directory

## Component Organization
- **UI Components**: Generic, reusable components in `components/ui/`
- **Feature Components**: Domain-specific components in `components/`
- **Component Structure**: Each component file contains only one main component
- **Props Interface**: Define props interface above component definition

## Service Layer Architecture
- **Single Responsibility**: Each service handles one domain area
- **Dependency Injection**: Services can depend on other services
- **Error Handling**: All services use centralized error handling
- **Async/Await**: Consistent async patterns throughout

## File Organization Rules
- Keep related files together (component + styles + tests)
- Use descriptive file names that indicate functionality
- Separate concerns: UI, business logic, data, utilities
- Group by feature when appropriate, by type when not