# AdaptIQ Development Updates

This document provides technical details about the AdaptIQ learning platform implementation, serving as a reference for future development sessions.

## Architecture Overview

AdaptIQ is built as a single-page application (SPA) using React 19 with Vite as the build tool. The application follows a component-based architecture with clear separation of concerns.

## Frontend Technologies

- **React 19**: Latest version of React with improved performance and features
- **Vite 6.2.0**: Modern build tool for faster development experience
- **React Router 7.4.0**: For client-side routing with the latest features
- **Mantine UI 7.17.2**: Component library for consistent UI design
- **Tabler Icons & FontAwesome**: Icon libraries for visual elements
- **Framer Motion**: Animation library for smooth transitions and UI interactions

## Component Structure

The application is organized into the following structure:

- **Pages**: High-level components that represent entire routes
  - `DashboardPage`: User dashboard with progress tracking and course access
  - `LoginPage` & `SignupPage`: Authentication screens
  - `OnboardingPage`: Multi-step user preference collection
  - `CoursesPage`: Overview of enrolled courses with progress tracking
  - `CourseLearningPage`: Interactive learning interface with multiple learning modes
  - `AssignmentsPage`: Weekly assignments management with calendar and list views
  - `SchedulePage`: Schedule management and visualization
  - `FAQPage`: Frequently asked questions
  - `ContactUs`: Contact form and information

- **Components**: Reusable UI elements organized by feature
  - `Hero`: Landing page hero section
  - `Platform`: Platform features overview
  - `Technology`: Technology showcase
  - `MCMSystem`: Multi-Channel Methodology system explanation
  - `ParentAccess`: Parent portal features
  - `ScheduleGenerator`: Core algorithm-based schedule creation

## State Management

The application uses React's built-in state management solutions:

- **useState**: For component-level state
- **useEffect**: For side effects and lifecycle management
- **localStorage**: For persisting user preferences and authentication state
- **Firebase** (future integration): For cloud-based state synchronization and real-time updates

## Key Features Implementation

### Intelligent Schedule Generator

The schedule generation system is implemented through two main utility files:

1. **scheduleAlgorithm.js**: Contains the main `generateOptimizedSchedule` function that creates personalized study schedules based on user preferences, learning styles, and course selections.

2. **scheduleOptimizer.js**: Provides optimization functions including:
   - `applySpacedRepetition`: Distributes learning sessions to maximize retention
   - `optimizeForEnergyLevels`: Schedules difficult subjects during peak energy times
   - `adaptToLearningStyle`: Tailors activities based on learning preferences
   - `calculateOptimalDuration`: Determines ideal session length

The algorithm takes into account:
- Learning style preferences (visual, auditory, reading/writing, kinesthetic)
- Available study days and times
- Course difficulty and priority
- Break frequency preferences

### Onboarding Flow

The onboarding process is implemented as a multi-step form in `OnboardingPage.jsx` that collects:

1. Learning style preferences
2. Subject and grade level information
3. Course selections
4. Schedule preferences
5. Personal information and goals

The collected data is used to generate an initial personalized schedule and is stored in localStorage for persistence.

### Dashboard Interface

The dashboard (`DashboardPage.jsx`) provides:

- Overview of course progress
- Upcoming assignments
- Performance statistics
- Access to course materials
- Schedule visualization

The sidebar navigation allows users to access different sections of their learning experience.

## Routing Structure

Routing is handled by React Router v7 with the following main routes:

- `/`: Homepage with marketing content
- `/about`: About page with platform information
- `/login` & `/signup`: Authentication pages
- `/onboarding`: User preference collection
- `/dashboard/*`: Nested routes for the user dashboard
- `/pages`: FAQ page
- `/contactUs`: Contact information

## Recent Updates

### Unified Dark Theme Implementation

A comprehensive dark theme has been implemented across all pages with the following features:

- **CSS Variable System**: Centralized theme variables for consistent styling across all components
- **Global Theme Toggle**: Accessible theme toggle in the settings page that affects all application components
- **Persistent Theme Preference**: User theme preferences saved and restored between sessions
- **Seamless Transitions**: Smooth transitions between light and dark modes with animation support
- **Context-Aware Styling**: Components that adapt their styling based on the current theme
- **Accessibility Considerations**: Proper contrast ratios maintained in both themes
- **ThemeContext Integration**: React context for theme state management across the application

The dark theme implementation follows these key principles:
- All color values are now defined as CSS variables instead of hardcoded values
- Background colors, text colors, and border colors all adapt based on the selected theme
- Card elements, form inputs, and interactive elements all respect the theme context
- Visual elements such as charts, progress indicators, and buttons maintain proper contrast in both themes

### Assignments Management System

A comprehensive assignments management system has been implemented with the following features:

- **Weekly Subject Assignments**: Automated generation of weekly assignments for each subject
- **Priority System**: Visual indicators for assignment urgency based on due dates
- **Google Calendar-Style Interface**: Modern calendar view with day cells showing assignments
- **List View**: Detailed list of all assignments with filtering and sorting capabilities
- **Assignment Details Panel**: Sliding panel with comprehensive assignment information
- **Status Tracking**: Ability to mark assignments as pending, in-progress, or completed
- **Resource Links**: Access to related learning materials for each assignment
- **Gemini AI Integration**: Foundation for generating AI-powered assignment content
- **Activity Synchronization**: Integration with course activity tracking
- **Firebase Ready**: Designed for seamless transition to Firebase backend

### Enhanced Course Learning Pages

The course learning pages have been significantly improved with the following features:

- **Distinct Learning Interfaces**: Separate interfaces for different learning modes (chat, quiz, resources)
- **Progress Tracking System**: Real-time progress tracking with visual indicators and animations
- **Image Upload Capability**: Image attachment functionality for the Q&A interface to enhance learning
- **Animated Transitions**: Smooth animations between different states and sections
- **Activity History Panel**: Comprehensive history of learning activities with filtering options
- **Quiz-Specific Interface**: Specialized quiz layout with blue accent colors and improved question formatting
- **Resource Library**: Grid-based resource library with filtering capabilities for different content types
- **Firebase Integration**: Preparation for backend progress tracking with proper placeholders
- **Progress Calculations**: Smart algorithms for calculating progress based on different activity types
- **Visual Feedback**: Success popups and progress notifications when completing activities

### Schedule Page Implementation

A dedicated schedule page has been implemented with the following features:

- Interactive calendar view with drag-and-drop functionality for rearranging study sessions
- Edit mode for manual schedule adjustments
- Visual indicators for session difficulty and type
- Responsive design that works across all device sizes

### Export Functionality

Users can now export their schedules in multiple formats:

- **PDF Export**: High-quality PDF documents with AdaptIQ branding, complete schedule details, and metadata
- **ODF Export**: Open Document Format support for compatibility with office suites like LibreOffice and OpenOffice
- **Firebase Integration**: Backend preparation for cloud storage and sharing capabilities

### Loading Screen Transition

A new loading screen has been implemented with the following features:

- Animated transitions between pages for a smoother user experience
- Progress indicators with dynamic loading text
- Background schedule generation during loading to optimize perceived performance
- Branded visual elements consistent with the AdaptIQ design system

### Learning Style Enhancements

- Added "Casual" vs "Focused" scheduling style options in the onboarding process
- Enhanced algorithm to account for user's preferred intensity level
- More granular customization of study session duration and frequency
- Improved adaptation to individual learning preferences

### Custom Course Functionality

- Users can now add custom courses beyond the predefined options
- Custom difficulty settings for user-defined courses
- Integration of custom courses into the schedule generation algorithm
- Persistent storage of custom course data

### Subject Popup System Enhancements

- Implemented a new popup system for subjects in the schedule.
- Added unique image URLs for each subject to enhance visual representation.
- Introduced handling for 'Other' subjects with a default image.
- Resized image containers for improved visual appeal.
- Prepared for Firebase compatibility for future image storage and retrieval.

### Page Transition System

- Implemented smooth animated transitions between pages for a more polished user experience
- Added a dedicated PageTransition component for consistent transition effects across the application
- Incorporated fade and slide animations with configurable timing and easing functions
- Optimized transition performance to prevent layout shifts and maintain accessibility
- Added route-specific transition effects based on navigation direction and context

### Progress Tracking System with Firebase Integration

- Designed and implemented a comprehensive subject progress tracking system
- Added Firebase integration for real-time progress data synchronization across devices
- Created visual progress indicators with percentage completion for each subject
- Implemented automated progress updates based on completed learning activities and quizzes
- Added analytics capability to track learning patterns and suggest optimizations
- Integrated progress data with the schedule generation algorithm for adaptive learning paths
- Implemented data persistence for offline access to progress information

### Settings Page Improvements

- **Complete Settings Interface**: Implemented a comprehensive settings page with multiple sections
- **Theme Preferences**: Added light/dark mode toggle with real-time preview
- **Font Size Control**: Introduced adjustable font size settings for better accessibility
- **Notification Preferences**: Added toggles for various notification types
- **Account Management**: Implemented account information display and editing capabilities
- **Save Animations**: Added satisfying visual feedback when settings are saved
- **Responsive Design**: Ensured settings page works well across all device sizes
- **AnimatePresence Integration**: Used Framer Motion's AnimatePresence for smooth transitions between settings states

## Future Development Considerations

### Backend Integration

The current implementation is frontend-only with Firebase integration prepared. Future development includes:

- Complete Firebase Authentication integration (planned for Q2 2025)
- Real-time synchronization of assignments and progress data
- Cloud Functions for automated assignment generation
- Analytics integration for learning pattern analysis
- Gemini AI API integration for dynamic content generation

### Performance Optimizations

- Implement code splitting for larger components (in progress)
- Add service worker for offline capabilities (planned for Q3 2025)
- Optimize image loading with lazy loading
- Reduce bundle size through tree shaking and module optimization

### Additional Features

- AI-powered learning recommendations
- Expanded analytics dashboard
- Integration with third-party learning resources
- Mobile application development (planned for Q4 2025)
- Collaborative learning features (planned for Q1 2026)

## Development Workflow

1. Run development server: `npm run dev`
2. Build for production: `npm run build`
3. Preview production build: `npm run preview`

ESLint is configured for code quality with React-specific rules.

## Last Updated: March 31, 2025