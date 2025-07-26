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

- [ ] 4. Redesign header layout to prevent element overlapping
  - Restructure header component layout for proper spacing
  - Fix language switcher and New Assessment button positioning
  - Implement responsive header behavior for all screen sizes
  - Add RTL layout support without overlapping elements
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 5. Fix breadcrumb navigation functionality
  - Update BreadcrumbNavigation component to work with corrected routing
  - Ensure breadcrumb links navigate to correct base path URLs
  - Fix breadcrumb styling and accessibility
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Consolidate PWA install banner management
  - Identify and remove duplicate PWA install banners
  - Ensure only one install banner is displayed
  - Fix install banner functionality and user interaction
  - Separate install banner from update banner functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Standardize modal overlay styling
  - Create consistent modal overlay component
  - Fix data management modal background to use semi-transparent overlay
  - Ensure all modals use the same overlay styling approach
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 8. Fix patient intake form progress bar and button styling
  - Implement visual progress bar functionality in intake form
  - Fix save and cancel button opacity and overlay issues
  - Ensure form controls have proper styling without background bleed-through
  - Update progress indicator to work both visually and textually
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 9. Update all navigation calls throughout the application
  - Review and update all navigation calls to use corrected RouterService
  - Ensure all internal links use proper base path
  - Fix any hardcoded navigation paths
  - _Requirements: 1.1, 1.2_

- [ ] 10. Test and validate all fixes across different environments
  - Test routing functionality on GitHub Pages deployment
  - Validate UI components render correctly with Tailwind v4
  - Test responsive behavior and mobile compatibility
  - Verify PWA functionality works correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_