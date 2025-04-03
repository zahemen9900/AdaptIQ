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
- **Firebase**: Cloud-based state synchronization and real-time updates
- **ThemeContext**: Context API for theme management across the application

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

The collected data is used to generate an initial personalized schedule and is stored in both localStorage for persistence and Firebase for cloud synchronization.

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

### AI-Powered Course Learning Experience

The platform now features an enhanced course learning experience with Gemini AI integration:

- **Multi-Mode Learning Interface**: Implementation of three distinct learning modes (chat, quiz, resources) with specialized interfaces for each
- **Gemini-2.0-Flash Integration**: Full integration with Google's Gemini AI model for intelligent responses and personalized learning
- **Subject-Specific AI Tutors**: AI tutors customized for each course subject with specialized knowledge and teaching approaches
- **Course Progress Tracking**: Real-time progress tracking with visual indicators, animations, and Firebase synchronization
- **Activity History**: Comprehensive tracking of all learning activities with time stamps and performance metrics
- **Image Upload Capability**: Ability to attach images to questions for visual learning enhancement
- **Quiz Generation System**: Dynamic generation of subject-appropriate quiz questions with difficulty adaptation
- **Resource Recommendations**: AI-curated learning resource recommendations based on course content and assignments
- **Spaced Repetition**: Implementation of learning science principles with spaced repetition and knowledge reinforcement
- **Chat History Management**: Saving and retrieving past conversations for continuous learning

The Course Learning Page implements a sophisticated state machine approach with smooth transitions between learning modes and persistent state management across sessions.

### Current Assignment Integration

The course learning experience now includes current assignment integration:

- **Assignment Context Awareness**: The learning interface automatically loads and displays current pending assignments for the selected course
- **Assignment Status Tracking**: Real-time tracking of assignment progress with visual indicators
- **Due Date Warnings**: Smart warnings for approaching and overdue assignments
- **Assignment-Focused Learning**: Learning resources and quiz questions tailored to current assignment topics
- **Direct Assignment Access**: Quick access to assignment details and submission interface from the course learning page
- **Progress Integration**: Learning activities related to assignments contribute additional progress points

### Activity History and Progress System

A comprehensive activity tracking system has been implemented:

- **Activity Panel**: Dedicated panel showing all course-specific learning activities
- **Activity Types**: Tracking of different activity types (chat, quiz, resources) with appropriate icons
- **Activity Timestamps**: Precise tracking of when activities were completed
- **Progress Calculation**: Smart algorithm for calculating overall course progress based on activity completion
- **Progress Animations**: Satisfying visual feedback when progress is updated
- **Progress Popup**: Non-intrusive popup notifications when progress milestones are achieved
- **Firebase Synchronization**: Preparation for cloud-based activity history synchronization

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
- **Firebase Integration**: Full Firebase backend implementation for assignment data

### Animation Performance Optimization

The application's animations have been significantly optimized:

- **Faster Transition Speeds**: Reduced animation durations for a more responsive feel
- **Optimized Staggering Effects**: Refined staggered animations with shorter delay intervals
- **Spring Physics Tuning**: Adjusted spring animation parameters for smoother, more natural motion
- **Reduced Motion Option**: Framework for respecting user preferences for reduced motion
- **Conditional Animations**: Smart detection of device capabilities to adjust animation complexity
- **Exit Animations**: Proper implementation of exit animations for smooth component unmounting
- **Animation Variants**: Structured animation variants for consistent motion patterns

### Learning Resources Interface

The learning resources interface has been enhanced with:

- **Filterable Resource Grid**: Grid-based display of resources with filtering options
- **Resource Type Categories**: Organized resources by type (textbooks, videos, exercises, papers, courses)
- **Visual Resource Cards**: Attractive card-based UI with icons representing different resource types
- **Interactive Actions**: Download and external link actions for each resource
- **Animation Effects**: Subtle hover and tap animations for interactive elements
- **Responsive Grid Layout**: Resource grid that adapts to different screen sizes

### User Experience Improvements

Several user experience enhancements have been implemented:

- **Header Actions**: Quick access to activity history and profile from the course header
- **Mode Controls**: Easy navigation between different learning modes
- **Back to Menu Button**: Clear path back to the mode selection screen
- **Loading States**: Visual feedback during content loading with branded loading screens
- **Error Fallbacks**: Graceful error handling for AI response generation
- **Consistent Navigation**: Predictable navigation patterns throughout the learning interface
- **Visual Feedback**: Clear visual feedback for all user actions
- **Mode-Specific Styling**: Visual differentiation between chat, quiz, and resource modes

### Firebase Authentication Integration

Full Firebase authentication has been implemented with the following features:

- **User Registration**: Complete signup flow with email and password
- **User Login**: Secure authentication with Firebase Auth
- **User Data Storage**: Storage of user preferences and settings in Firestore
- **Data Synchronization**: Real-time updates between devices
- **Security Rules**: Proper security rules for data protection
- **User Session Management**: Persistent sessions with automatic renewal

## Future Development Considerations

### Backend Integration Expansion

The Firebase integration has been implemented with the following planned enhancements:

- Cloud Functions for automated assignment generation (planned for Q2 2025)
- Analytics integration for learning pattern analysis
- Advanced Gemini AI API integration for dynamic content generation
- Real-time collaborative features

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

## Last Updated: April 3, 2025