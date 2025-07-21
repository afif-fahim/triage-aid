# Design Document

## Overview

This design addresses critical UI and navigation issues in the TriageAid application by implementing proper GitHub Pages routing, Tailwind CSS v4 compatibility fixes, responsive header layout improvements, functional breadcrumb navigation, streamlined PWA banner management, consistent modal styling, and enhanced form UI components.

The solution focuses on maintaining the existing architecture while fixing compatibility issues and improving user experience through systematic component updates and configuration adjustments.

## Architecture

### Routing Architecture

The routing system needs to be updated to properly handle GitHub Pages deployment with the `/triage-aid/` base path:

- **RouterService Enhancement**: Update path matching and URL generation to include base path
- **Navigation Integration**: Ensure all navigation calls use the correct base path
- **Browser History Management**: Handle base path in browser history operations
- **Route Validation**: Validate routes work correctly with the deployment base path

### CSS Architecture Updates

Tailwind CSS v4 introduces breaking changes that require configuration and usage updates:

- **Configuration Migration**: Update `tailwind.config.js` for v4 compatibility
- **Import Structure**: Modify CSS imports to use new v4 syntax
- **Custom Utilities**: Update custom utility classes for v4 compatibility
- **Component Styling**: Fix component styles affected by v4 changes

### Component Architecture Improvements

- **Header Layout System**: Implement flexible header layout with proper spacing
- **Modal System**: Standardize modal overlay styling across components
- **Form Components**: Enhance form styling with proper visual feedback
- **PWA Banner Management**: Consolidate PWA banner logic to prevent duplicates

## Components and Interfaces

### Updated RouterService Interface

```typescript
interface RouterService {
  // Enhanced with base path support
  getBasePath(): string;
  buildFullPath(path: string): string;
  navigateWithBasePath(path: string, replace?: boolean): Promise<boolean>;
  
  // Existing methods updated for base path compatibility
  navigate(path: string, replace?: boolean): Promise<boolean>;
  navigateToView(view: AppView, params?: RouteParams, replace?: boolean): Promise<boolean>;
  generateUrl(view: AppView, params?: RouteParams): string;
}
```

### Enhanced Header Component Interface

```typescript
interface HeaderLayoutProps {
  currentView: AppView;
  onNavigate: (path: string) => void;
  onStartAssessment: () => void;
  isRTL: boolean;
  showNewAssessment?: boolean;
}
```

### Standardized Modal Overlay Interface

```typescript
interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  overlayClassName?: string;
  contentClassName?: string;
  children: ComponentChildren;
}
```

### Enhanced Form Progress Interface

```typescript
interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  showProgressBar: boolean;
  showStepText: boolean;
}
```

## Data Models

### Router Configuration Model

```typescript
interface RouterConfig {
  basePath: string;
  routes: Route[];
  enableHistoryAPI: boolean;
  fallbackRoute: string;
}

interface Route {
  path: string;
  view: AppView;
  params?: RouteParams;
  title?: string;
  requiresPatient?: boolean;
  fullPath?: string; // Computed with base path
}
```

### UI Theme Configuration Model

```typescript
interface UIThemeConfig {
  colors: {
    medical: MedicalColorPalette;
    triage: TriageColorPalette;
  };
  spacing: SpacingScale;
  breakpoints: BreakpointConfig;
  animations: AnimationConfig;
}

interface MedicalColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: TextColorVariants;
  success: string;
  warning: string;
  error: string;
  info: string;
}
```

## Error Handling

### Routing Error Handling

- **Invalid Route Detection**: Detect and handle invalid routes gracefully
- **Base Path Validation**: Validate base path configuration on initialization
- **Fallback Navigation**: Provide fallback navigation for broken routes
- **Error Logging**: Log routing errors for debugging

### CSS Loading Error Handling

- **Tailwind Load Detection**: Detect if Tailwind CSS loads correctly
- **Fallback Styling**: Provide basic fallback styles if Tailwind fails
- **Style Validation**: Validate critical styles are applied correctly
- **Progressive Enhancement**: Ensure basic functionality without full styling

### Component Error Boundaries

- **Header Error Boundary**: Wrap header components in error boundaries
- **Modal Error Handling**: Handle modal rendering errors gracefully
- **Form Error Recovery**: Provide error recovery for form components
- **PWA Banner Error Handling**: Handle PWA banner errors without breaking the app

## Testing Strategy

### Routing Tests

- **Base Path Integration**: Test all routes work with GitHub Pages base path
- **Navigation Flow**: Test complete navigation flows between all views
- **Browser History**: Test back/forward navigation with base path
- **URL Generation**: Test URL generation includes correct base path

### UI Component Tests

- **Button Visibility**: Test button visibility in all states (normal, hover, active)
- **Header Layout**: Test header layout at different screen sizes and orientations
- **Modal Overlays**: Test modal overlay styling consistency
- **Form Progress**: Test form progress bar visual and functional behavior

### CSS Integration Tests

- **Tailwind v4 Compatibility**: Test all Tailwind classes render correctly
- **Custom Utilities**: Test custom utility classes work with v4
- **Responsive Design**: Test responsive behavior across breakpoints
- **RTL Support**: Test RTL layout and styling

### Cross-Browser Tests

- **GitHub Pages Deployment**: Test routing on actual GitHub Pages deployment
- **Mobile Browsers**: Test UI components on mobile browsers
- **PWA Functionality**: Test PWA installation and update banners
- **Accessibility**: Test keyboard navigation and screen reader compatibility

### Performance Tests

- **CSS Bundle Size**: Verify Tailwind v4 doesn't significantly increase bundle size
- **Route Navigation Speed**: Test navigation performance with base path
- **Component Rendering**: Test component rendering performance after fixes
- **Modal Animation**: Test modal animation performance

## Implementation Approach

### Phase 1: Routing Fixes
1. Update RouterService for base path support
2. Fix navigation calls throughout the application
3. Update route generation and URL building
4. Test routing on GitHub Pages

### Phase 2: Tailwind CSS v4 Migration
1. Update Tailwind configuration for v4
2. Fix CSS imports and custom utilities
3. Update component styles for v4 compatibility
4. Test all UI components render correctly

### Phase 3: Header Layout Improvements
1. Redesign header component layout
2. Fix language switcher positioning
3. Implement responsive header behavior
4. Test header across screen sizes

### Phase 4: Component Fixes
1. Fix breadcrumb navigation functionality
2. Consolidate PWA banner management
3. Standardize modal overlay styling
4. Enhance form progress components

### Phase 5: Testing and Validation
1. Comprehensive testing of all fixes
2. Cross-browser compatibility testing
3. Mobile device testing
4. Performance validation

## Technical Considerations

### Tailwind CSS v4 Breaking Changes
- New import syntax: `@import 'tailwindcss'` instead of individual imports
- Updated configuration format
- Changes to custom utility generation
- Modified plugin API

### GitHub Pages Routing Constraints
- Base path must be included in all routes
- Client-side routing requires proper fallback handling
- Static file serving limitations
- Cache considerations for updated routes

### Mobile and Accessibility Requirements
- Touch-friendly button sizes (minimum 44px)
- Proper focus management for keyboard navigation
- Screen reader compatibility
- High contrast mode support

### Performance Optimization
- Minimize CSS bundle size impact
- Optimize route navigation performance
- Reduce component re-rendering
- Efficient modal and overlay rendering