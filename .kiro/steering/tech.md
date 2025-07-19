# Technology Stack

## Core Framework & Build System
- **Frontend Framework**: Preact (React-compatible, lightweight alternative)
- **Build Tool**: Vite with TypeScript support
- **Language**: TypeScript with strict configuration
- **Styling**: Tailwind CSS v4 with custom medical color palette
- **PWA**: Service Worker with Workbox for offline functionality

## Development Tools
- **Linting**: ESLint with TypeScript and React Hooks plugins
- **Formatting**: Prettier with consistent code style
- **Type Checking**: TypeScript with strict mode enabled
- **Package Manager**: npm with package-lock.json

## Key Dependencies
- **Preact**: Lightweight React alternative for better performance
- **Tailwind CSS**: Utility-first CSS framework with medical-specific color system
- **TypeScript**: Static typing for better code quality and medical app reliability

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run type-check   # Run TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### Build & Deploy
```bash
npm run build        # Build for production (TypeScript compile + Vite build)
npm run preview      # Preview production build locally
```

## Configuration Files
- **TypeScript**: Composite project setup with separate app and node configs
- **ESLint**: Flat config with medical app-specific rules (strict equality, error handling)
- **Prettier**: Consistent formatting with single quotes and trailing commas
- **Tailwind**: Custom medical color palette with triage priority colors
- **Vite**: Preact preset with standard configuration

## Code Quality Standards
- Strict TypeScript configuration with no implicit any
- ESLint rules enforcing medical app reliability (no console logs, strict equality)
- Prettier formatting for consistent code style
- React Hooks rules for proper component lifecycle management