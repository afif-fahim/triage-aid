# Project Structure

## Root Directory
```
├── src/                    # Source code
├── public/                 # Static assets and PWA manifest
├── dist/                   # Build output
├── .kiro/                  # Kiro configuration and specs
├── node_modules/           # Dependencies
└── [config files]          # Various configuration files
```

## Source Code Organization (`src/`)
```
src/
├── components/             # Reusable UI components
├── services/              # Business logic and data services
├── types/                 # TypeScript type definitions
├── assets/                # Images, icons, and other assets
├── main.tsx               # Application entry point
├── app.tsx                # Root application component
├── app.css                # Component-specific styles
├── index.css              # Global styles with Tailwind imports
└── vite-env.d.ts          # Vite environment types
```

## Component Architecture
- **Functional Components**: Use Preact functional components with hooks
- **Component Naming**: PascalCase for components (e.g., `PatientIntakeForm`)
- **File Extensions**: `.tsx` for components, `.ts` for utilities/services
- **Component Structure**: One component per file, named exports preferred

## Service Layer (`src/services/`)
Expected services based on project requirements:
- **DataService**: Local storage and encryption operations
- **TriageEngine**: START algorithm implementation
- **SecurityService**: Client-side encryption using Web Crypto API
- **i18nService**: Internationalization support

## Type Definitions (`src/types/`)
Expected interfaces:
- **PatientData**: Complete patient information structure
- **TriagePriority**: Priority levels and constants
- **AppState**: Application state management types

## Styling Conventions
- **Tailwind Classes**: Use utility classes with medical color palette
- **Custom Colors**: Defined in `tailwind.config.js` under `triage` and `medical` namespaces
- **Component Styles**: Minimal custom CSS, prefer Tailwind utilities
- **Responsive Design**: Mobile-first approach with tablet/desktop breakpoints

## File Naming Conventions
- **Components**: PascalCase (e.g., `PatientDashboard.tsx`)
- **Services**: PascalCase with Service suffix (e.g., `DataService.ts`)
- **Types**: PascalCase (e.g., `PatientData.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)

## Import/Export Patterns
- **Named Exports**: Preferred for components and services
- **Barrel Exports**: Use index files for clean imports from directories
- **Relative Imports**: Use relative paths for local files
- **Preact Imports**: Use `preact` instead of `react` (configured via path mapping)