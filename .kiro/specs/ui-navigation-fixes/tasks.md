# Implementation Plan

- [x] 1. Fix RouterService for GitHub Pages base path support
  - Update RouterService to handle `/triage-aid/` base path correctly
  - Modify path matching, URL generation, and navigation methods
  - Add base path configuration and validation
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Update Tailwind CSS configuration for v4 compatibility
  - Migrate tailwind.config.js to v4 format
  - Update CSS imports to use new v4 syntax
  - Fix custom utility classes and plugins for v4
  - _Requirements: 2.4_

- [x] 3. Fix Button component styling for visibility issues
  - Update Button component to ensure proper visibility in all states
  - Fix hover state styling to maintain button visibility
  - Ensure Tailwind v4 classes render correctly in buttons
  - _Requirements: 2.1, 2.2_

- [x] 4. Redesign header layout to prevent element overlapping
  - Restructure header component layout for proper spacing
  - Fix language switcher and New Assessment button positioning
  - Implement responsive header behavior for all screen sizes
  - Add RTL layout support without overlapping elements
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Fix breadcrumb navigation functionality
  - Update BreadcrumbNavigation component to work with corrected routing
  - Ensure breadcrumb links navigate to correct base path URLs
  - Fix breadcrumb styling and accessibility
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Standardize modal overlay styling
  - Create consistent modal overlay component
  - Fix data management modal background to use semi-transparent overlay
  - Ensure all modals use the same overlay styling approach
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
  