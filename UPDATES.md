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

## Component Structure

The application is organized into the following structure:

- **Pages**: High-level components that represent entire routes
  - `DashboardPage`: User dashboard with progress tracking and course access
  - `LoginPage` & `SignupPage`: Authentication screens
  - `OnboardingPage`: Multi-step user preference collection
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

## Future Development Considerations

### Backend Integration

The current implementation is frontend-only. Future development should include:

- User authentication API integration
- Course content management system
- Progress tracking and analytics backend
- Real-time collaboration features

### Performance Optimizations

- Implement code splitting for larger components
- Add service worker for offline capabilities
- Optimize image loading with lazy loading

### Additional Features

- AI-powered learning recommendations
- Expanded analytics dashboard
- Integration with third-party learning resources
- Mobile application development

## Development Workflow

1. Run development server: `npm run dev`
2. Build for production: `npm run build`
3. Preview production build: `npm run preview`

ESLint is configured for code quality with React-specific rules.