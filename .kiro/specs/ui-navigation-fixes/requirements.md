# Requirements Document

## Introduction

This feature addresses critical UI and navigation issues in the TriageAid application that are preventing proper functionality. The issues stem from incorrect routing configuration for GitHub Pages deployment, Tailwind CSS v4 compatibility problems, layout conflicts, and broken UI components. These problems significantly impact user experience and application usability.

## Requirements

### Requirement 1

**User Story:** As a user accessing the application on GitHub Pages, I want the navigation to work correctly so that I can access all pages without broken routes.

#### Acceptance Criteria

1. WHEN the user navigates to any page THEN the URL SHALL include the correct base path `/triage-aid/`
2. WHEN the user clicks navigation buttons THEN the routing SHALL navigate to the correct GitHub Pages URLs
3. WHEN the user refreshes any page THEN the application SHALL load correctly without 404 errors
4. WHEN the user uses browser back/forward buttons THEN the navigation SHALL work correctly with the proper base path

### Requirement 2

**User Story:** As a user interacting with buttons and UI elements, I want them to be visible and properly styled so that I can use the application effectively.

#### Acceptance Criteria

1. WHEN the user views buttons (delete, start patient assessment) THEN they SHALL be visible without requiring hover to see them
2. WHEN the user hovers over visible buttons (view dashboard, refresh) THEN they SHALL remain visible and not disappear
3. WHEN the user interacts with form elements THEN they SHALL have proper styling and visual feedback
4. WHEN the user views the application THEN all Tailwind CSS classes SHALL render correctly with v4 compatibility

### Requirement 3

**User Story:** As a user navigating the application, I want the header layout to be properly organized so that I can access all controls without overlapping elements.

#### Acceptance Criteria

1. WHEN the user views the header THEN the language selector button SHALL NOT overlap the New Assessment button
2. WHEN the user views the header on mobile devices THEN all buttons SHALL be properly spaced and accessible
3. WHEN the user views the header in RTL mode THEN the layout SHALL be correctly mirrored without overlapping
4. WHEN the user resizes the browser window THEN the header layout SHALL remain functional at all screen sizes

### Requirement 4

**User Story:** As a user navigating through the application, I want the breadcrumb navigation to work correctly so that I can understand my current location and navigate efficiently.

#### Acceptance Criteria

1. WHEN the user navigates to any page THEN the breadcrumb SHALL display the correct navigation path
2. WHEN the user clicks on breadcrumb links THEN they SHALL navigate to the correct pages
3. WHEN the user views breadcrumbs THEN they SHALL be properly styled and accessible
4. WHEN the user is on the home page THEN the breadcrumb SHALL indicate the current location appropriately

### Requirement 5

**User Story:** As a user on the homepage, I want the PWA install functionality to work properly so that I can install the application without confusion from duplicate banners.

#### Acceptance Criteria

1. WHEN the user visits the homepage THEN there SHALL be only one install banner visible
2. WHEN the user interacts with the install banner THEN it SHALL function correctly for PWA installation
3. WHEN the user dismisses the install banner THEN it SHALL not reappear inappropriately
4. WHEN the user views the update banner THEN it SHALL be distinct from the install banner and function correctly

### Requirement 6

**User Story:** As a user opening modal dialogs, I want the background overlay to be properly styled so that I can focus on the modal content without visual issues.

#### Acceptance Criteria

1. WHEN the user opens the data management modal THEN the background SHALL have a semi-transparent overlay similar to other modals
2. WHEN the user opens any modal THEN the background SHALL NOT become completely dark
3. WHEN the user views modal overlays THEN they SHALL be consistent across all modal types
4. WHEN the user interacts with modals THEN the background SHALL provide appropriate visual separation

### Requirement 7

**User Story:** As a user filling out the patient intake form, I want the progress bar and form controls to work properly so that I can complete assessments efficiently.

#### Acceptance Criteria

1. WHEN the user progresses through the intake form THEN the progress bar SHALL visually indicate the current step
2. WHEN the user views the save and cancel buttons THEN they SHALL have proper opacity and not appear as glass overlays
3. WHEN the user interacts with form controls THEN the background SHALL not remain visible through button overlays
4. WHEN the user completes form steps THEN the progress indicator SHALL update correctly both visually and textually