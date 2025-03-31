# AdaptIQ Backend Firebase Implementation

This document outlines the Firebase database structure and implementation guidelines for the AdaptIQ learning platform.

## Overview

AdaptIQ uses Firebase as its backend solution with the following services:

- **Firebase Authentication**: For user management and authentication
- **Cloud Firestore**: For NoSQL database storage of user data and learning content
- **Firebase Storage**: For storing user-uploaded files such as images
- **Firebase Analytics**: For tracking user behavior and application performance
- **Firebase Cloud Functions**: For server-side logic and API integrations

## Database Structure

The Cloud Firestore database will use the following collection and document structure:

### Users Collection

**Collection**: `users`  
**Document ID**: `{uid}` (Firebase Authentication UID)

```javascript
{
  uid: "string", // Firebase Authentication UID
  email: "string",
  displayName: "string",
  photoURL: "string", // URL to profile image
  createdAt: Timestamp,
  lastLogin: Timestamp,
  role: "string", // "student", "parent", "admin"
  
  // User preferences from onboarding
  preferences: {
    learningStyle: "string", // "visual", "auditory", "reading", "kinesthetic"
    studyEnvironment: "string",
    preferredTime: "string",
    gradeLevel: "string",
    schedulingStyle: "string", // "casual", "focused"
    studyDuration: number, // in minutes
    breakFrequency: number,
    goals: "string"
  },
  
  // Available days for studying
  availableDays: ["string"], // Array of day names
  
  // Dashboard statistics
  dashboardStats: {
    activeCourses: number,
    totalCourses: number,
    overallProgress: number, // 0-100 percentage
    studyStreak: number, // consecutive days of study activity
    lastStudyDate: Timestamp,
    totalStudyTime: number, // in minutes
    todayStudyTime: number, // in minutes
  },
  
  // Today's goals
  dailyGoals: [
    {
      id: "string",
      text: "string",
      completed: boolean,
      createdAt: Timestamp,
      completedAt: Timestamp
    }
  ],
  
  // Recent activity tracking
  recentActivity: [
    {
      id: "string",
      type: "string", // "chat", "quiz", "progress-update", "assignment"
      name: "string", // activity name
      date: Timestamp,
      courseId: "string", // reference to course if applicable
      details: {
        // Type-specific details
        // For progress updates
        newProgress: number, // if type is "progress-update"
        // For quiz activities
        quizScore: number, // if type is "quiz"
        // For assignments
        assignmentId: "string" // if type is "assignment"
      }
    }
  ],
  
  // Metadata for app functionality
  settings: {
    notifications: boolean,
    darkMode: boolean,
    emailNotifications: boolean
  }
}
```

### User Courses Subcollection

**Collection**: `users/{uid}/courses`  
**Document ID**: `{courseId}` (Generated ID or slug)

```javascript
{
  courseId: "string",
  name: "string",
  category: "string", // "mathematics", "science", etc.
  subject: "string", // "math", "physics", etc.
  subjectDetail: "string", // "algebra", "geometry", etc.
  enrolledAt: Timestamp,
  lastAccessed: Timestamp,
  isCustom: boolean,
  customDetails: {
    description: "string",
    difficulty: "string" // "easy", "medium", "hard"
  },
  
  // Progress tracking
  progress: number, // 0-100 percentage
  lastProgressUpdate: Timestamp,
  progressHistory: [
    {
      date: Timestamp,
      value: number // progress value at this date
    }
  ],
  completedActivities: [
    {
      activityId: "string",
      type: "string", // "quiz", "chat", "resource"
      completedAt: Timestamp,
      score: number // for quizzes
    }
  ],
  
  // Quiz scores for this course
  quizScores: [
    {
      quizId: "string",
      score: number,
      maxScore: number,
      completedAt: Timestamp
    }
  ],
  
  // Course metadata
  lastActivityType: "string",
  totalTimeSpent: number, // in minutes
  averageSessionDuration: number, // in minutes
  
  // Suggested topics based on progress
  suggestedTopics: [
    {
      id: "string",
      title: "string",
      description: "string",
      moduleId: "string", // reference to course module
      difficulty: "string" // "easy", "medium", "hard"
    }
  ]
}
```

### User Schedule Subcollection

**Collection**: `users/{uid}/schedule`  
**Document ID**: `{dayId}_{timeSlotId}` (e.g., "monday_morning")

```javascript
{
  dayId: "string", // day of the week
  timeSlotId: "string", // "morning", "afternoon", "evening"
  timeSlot: {
    start: "string", // "09:00"
    end: "string" // "10:30"
  },
  courseId: "string", // reference to course
  courseName: "string",
  duration: number, // in minutes
  activityType: "string", // "study", "practice", "review"
  difficulty: "string", // "easy", "medium", "hard"
  isCompleted: boolean,
  completedAt: Timestamp,
  notes: "string"
}
```

### User Assignments Subcollection

**Collection**: `users/{uid}/assignments`  
**Document ID**: `{assignmentId}` (Generated UUID)

```javascript
{
  assignmentId: "string", // unique identifier
  title: "string", // assignment title
  subject: "string", // subject name
  category: "string", // "mathematics", "science", etc.
  description: "string", // detailed instructions
  courseId: "string", // reference to course
  dueDate: Timestamp, // deadline
  createdDate: Timestamp, // when assignment was generated
  estimatedMinutes: number, // estimated completion time
  imageUrl: "string", // subject-related image
  status: "string", // "pending", "in-progress", "completed", "overdue"
  priority: number, // 0-5 scale with 5 being highest priority
  completedDate: Timestamp, // when assignment was marked complete
  
  // Generated content information (for AI-generated assignments)
  generationInfo: {
    generatedBy: "string", // "system", "gemini", "teacher"
    generationPrompt: "string", // prompt used for generation
    modelVersion: "string", // AI model version if applicable
    generationDate: Timestamp
  },
  
  // Related resources
  resources: [
    {
      resourceId: "string",
      title: "string",
      type: "string", // "reading", "video", "practice"
      url: "string",
      label: "string"
    }
  ],
  
  // Submission data
  submission: {
    submittedAt: Timestamp,
    content: "string", // text submission
    fileUrls: ["string"], // array of uploaded file URLs
    feedback: "string", // teacher/AI feedback
    grade: number, // if graded
    isGraded: boolean
  }
}
```

### User Events Subcollection

**Collection**: `users/{uid}/events`  
**Document ID**: `{eventId}` (Generated UUID)

```javascript
{
  eventId: "string",
  title: "string",
  type: "string", // "study", "quiz", "meeting", "assignment", "other"
  date: Timestamp,
  endDate: Timestamp, // for events with duration
  courseId: "string", // reference to course if applicable
  description: "string",
  location: "string", // physical or virtual location
  isCompleted: boolean,
  completedAt: Timestamp,
  isRecurring: boolean,
  recurringPattern: {
    frequency: "string", // "daily", "weekly", "monthly"
    interval: number, // e.g., every 2 weeks
    endDate: Timestamp
  },
  reminderTime: number, // minutes before event to send reminder
  color: "string" // for UI display
}
```

### User Activities Subcollection

**Collection**: `users/{uid}/activities`  
**Document ID**: `{activityId}` (Generated UUID)

```javascript
{
  activityId: "string",
  type: "string", // "chat", "quiz", "resource", "assignment"
  courseId: "string", // reference to course
  courseName: "string",
  timestamp: Timestamp,
  duration: number, // in minutes
  
  // For chat activities
  chatData: {
    messages: [
      {
        role: "string", // "user" or "system"
        content: "string",
        timestamp: Timestamp,
        hasImage: boolean,
        imageURL: "string" // if hasImage is true
      }
    ]
  },
  
  // For quiz activities
  quizData: {
    score: number,
    maxScore: number,
    questions: [
      {
        question: "string",
        userAnswer: "string",
        correctAnswer: "string",
        isCorrect: boolean
      }
    ]
  },
  
  // For resource activities
  resourceData: {
    resourceId: "string",
    resourceType: "string", // "textbook", "video", "exercise", etc.
    timeSpent: number, // in minutes
    completionPercentage: number
  },
  
  // For assignment activities
  assignmentData: {
    assignmentId: "string", // reference to the assignment
    status: "string", // "started", "submitted", "completed"
    timeSpent: number, // in minutes
    submissionDate: Timestamp
  }
}
```

### Courses Collection (Global)

**Collection**: `courses`  
**Document ID**: `{courseId}` (Generated ID or slug)

```javascript
{
  courseId: "string",
  name: "string",
  subject: "string",
  subjectDetail: "string",
  category: "string",
  description: "string",
  difficulty: "string", // "easy", "medium", "hard"
  imageURL: "string",
  isPublic: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Course content structure
  contentModules: [
    {
      moduleId: "string",
      title: "string",
      description: "string",
      order: number
    }
  ]
}
```

### Course Modules Subcollection

**Collection**: `courses/{courseId}/modules`  
**Document ID**: `{moduleId}` (Generated ID)

```javascript
{
  moduleId: "string",
  title: "string",
  description: "string",
  order: number,
  
  // Module content
  resources: [
    {
      resourceId: "string",
      type: "string", // "textbook", "video", "exercise", etc.
      title: "string",
      description: "string",
      url: "string",
      fileType: "string", // "pdf", "mp4", etc.
      isExternal: boolean
    }
  ],
  
  quizzes: [
    {
      quizId: "string",
      title: "string",
      description: "string",
      questionCount: number,
      estimatedDuration: number // in minutes
    }
  ]
}
```

### Quizzes Collection

**Collection**: `quizzes`  
**Document ID**: `{quizId}` (Generated ID)

```javascript
{
  quizId: "string",
  courseId: "string",
  moduleId: "string",
  title: "string",
  description: "string",
  difficulty: "string",
  timeLimit: number, // in minutes
  passingScore: number, // percentage
  
  questions: [
    {
      questionId: "string",
      text: "string",
      type: "string", // "multiple-choice", "true-false", "short-answer"
      options: ["string"], // for multiple-choice
      correctAnswer: "string" or ["string"], // depends on question type
      explanation: "string",
      points: number
    }
  ]
}
```

### Assignments Templates Collection

**Collection**: `assignmentTemplates`  
**Document ID**: `{templateId}` (Generated ID)

```javascript
{
  templateId: "string",
  subject: "string",
  category: "string", // "mathematics", "science", etc.
  title: "string", // template title
  description: "string", // template description
  
  // Template content - can be customized for specific students
  content: "string", // markdown or HTML content
  
  // Metadata
  difficulty: "string", // "beginner", "intermediate", "advanced"
  estimatedMinutes: number,
  tags: ["string"],
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Resources included with this template
  resources: [
    {
      resourceId: "string",
      title: "string",
      type: "string", // "reading", "video", "practice"
      url: "string"
    }
  ]
}
```

## Firebase Storage Structure

Firebase Storage will organize files in the following structure:

```
/users/{uid}/
  /profile/
    - profile_picture.jpg
  /course_uploads/{courseId}/
    - {timestamp}_{filename}.jpg
    - {timestamp}_{filename}.pdf
  /chat_images/
    - {chatId}_{timestamp}.jpg
  /assignment_submissions/{assignmentId}/
    - {timestamp}_{filename}.pdf
    - {timestamp}_{filename}.jpg

/courses/{courseId}/
  /resources/
    - {resourceId}.pdf
    - {resourceId}.mp4
  /thumbnails/
    - thumbnail.jpg
    
/assignments/templates/
  /{templateId}/
    - template_resource.pdf
    - instructions.pdf
```

## Firebase Authentication

AdaptIQ will use Firebase Authentication with the following sign-in methods:

- Email/Password
- Google Sign-In
- Apple Sign-In (for iOS users)

Custom claims will be used to assign user roles:

```javascript
{
  "admin": true, // For administrative users
  "parent": true, // For parent accounts
  "student": true, // For student accounts
  "premium": true // For premium subscriptions
}
```

## Security Rules

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - accessible only by the user or admins
    match /users/{userId} {
      allow read: if request.auth.uid == userId || request.auth.token.admin == true;
      allow write: if request.auth.uid == userId || request.auth.token.admin == true;
      
      // User subcollections - courses, schedule, activities, assignments, events
      match /courses/{courseId} {
        allow read: if request.auth.uid == userId || request.auth.token.admin == true;
        allow write: if request.auth.uid == userId || request.auth.token.admin == true;
      }
      
      match /schedule/{entryId} {
        allow read: if request.auth.uid == userId || 
                     request.auth.token.admin == true || 
                     request.auth.token.parent == true && 
                     get(/databases/$(database)/documents/users/$(userId)).data.parentAccess == request.auth.uid;
        allow write: if request.auth.uid == userId || request.auth.token.admin == true;
      }
      
      match /activities/{activityId} {
        allow read: if request.auth.uid == userId || 
                     request.auth.token.admin == true || 
                     request.auth.token.parent == true && 
                     get(/databases/$(database)/documents/users/$(userId)).data.parentAccess == request.auth.uid;
        allow write: if request.auth.uid == userId || request.auth.token.admin == true;
      }
      
      match /assignments/{assignmentId} {
        allow read: if request.auth.uid == userId || 
                     request.auth.token.admin == true || 
                     request.auth.token.parent == true && 
                     get(/databases/$(database)/documents/users/$(userId)).data.parentAccess == request.auth.uid;
        allow write: if request.auth.uid == userId || request.auth.token.admin == true;
      }
      
      match /events/{eventId} {
        allow read: if request.auth.uid == userId || 
                     request.auth.token.admin == true || 
                     request.auth.token.parent == true && 
                     get(/databases/$(database)/documents/users/$(userId)).data.parentAccess == request.auth.uid;
        allow write: if request.auth.uid == userId || request.auth.token.admin == true;
      }
    }
    
    // Global courses - readable by anyone, writable by admins
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
      
      // Course modules
      match /modules/{moduleId} {
        allow read: if true;
        allow write: if request.auth.token.admin == true;
      }
    }
    
    // Assignment templates - readable by authenticated users, writable by admins
    match /assignmentTemplates/{templateId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
    
    // Quizzes - accessible by authenticated users, writable by admins
    match /quizzes/{quizId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### Storage Security Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User profile images
    match /users/{userId}/profile/{fileName} {
      allow read: if true;
      allow write: if request.auth.uid == userId || request.auth.token.admin == true;
    }
    
    // User course uploads
    match /users/{userId}/course_uploads/{courseId}/{fileName} {
      allow read: if request.auth.uid == userId || 
                   request.auth.token.admin == true || 
                   request.auth.token.parent == true && 
                   firestore.get(/databases/(default)/documents/users/$(userId)).data.parentAccess == request.auth.uid;
      allow write: if request.auth.uid == userId || request.auth.token.admin == true;
    }
    
    // Chat images
    match /users/{userId}/chat_images/{fileName} {
      allow read: if request.auth.uid == userId || 
                   request.auth.token.admin == true || 
                   request.auth.token.parent == true && 
                   firestore.get(/databases/(default)/documents/users/$(userId)).data.parentAccess == request.auth.uid;
      allow write: if request.auth.uid == userId || request.auth.token.admin == true;
    }
    
    // Assignment submissions
    match /users/{userId}/assignment_submissions/{assignmentId}/{fileName} {
      allow read: if request.auth.uid == userId || 
                   request.auth.token.admin == true || 
                   request.auth.token.parent == true && 
                   firestore.get(/databases/(default)/documents/users/$(userId)).data.parentAccess == request.auth.uid;
      allow write: if request.auth.uid == userId || request.auth.token.admin == true;
    }
    
    // Course resources - readable by anyone, writable by admins
    match /courses/{courseId}/{fileName} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
    
    // Assignment templates
    match /assignments/templates/{templateId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

## API Integration Points

### Firebase Cloud Functions

The following Cloud Functions will be implemented:

1. **User Registration Processing**
   - Trigger: `onCreate` for new user accounts
   - Actions: Set up default courses, initialize progress tracking

2. **Course Progress Calculation**
   - Trigger: `onWrite` for user activity documents
   - Actions: Recalculate course progress, update user dashboard stats

3. **Schedule Generation**
   - Trigger: HTTP callable function
   - Actions: Generate optimized study schedule based on user preferences

4. **Weekly Assignment Generation**
   - Trigger: Scheduled function (weekly)
   - Actions: Generate new assignments for each subject the student is enrolled in
   - Implementation: Uses Gemini API to create contextually relevant assignments

5. **Assignment Due Date Monitoring**
   - Trigger: Scheduled function (daily)
   - Actions: Check for upcoming and overdue assignments, update status, send notifications

6. **Assignment Submission Processing**
   - Trigger: `onCreate` for assignment submission documents
   - Actions: Process submission, update assignment status, calculate progress impact

7. **PDF/ODF Export**
   - Trigger: HTTP callable function
   - Actions: Generate formatted schedule documents for download

8. **Parent Invitation**
   - Trigger: HTTP callable function
   - Actions: Send invitation to parent, set up access permissions

9. **Activity Analytics**
   - Trigger: Scheduled function (daily)
   - Actions: Generate user activity reports, learning pattern insights

10. **Daily Goals Generator**
    - Trigger: Scheduled function (daily)
    - Actions: Generate new daily goals based on user courses and progress

11. **Study Streak Calculator**
    - Trigger: `onWrite` for user activity documents
    - Actions: Calculate consecutive days of learning activity, update streak counter in user profile

12. **Dashboard Data Aggregator**
    - Trigger: HTTP callable function
    - Actions: Aggregate all dashboard-related data into a single response for efficient loading

13. **Course Recommendations**
    - Trigger: Scheduled function (weekly)
    - Actions: Generate personalized course and topic recommendations based on progress and learning patterns

## Implementation Guidelines

### User Progress Tracking

1. **Track Granular Activities**: Record all learning interactions (quizzes, resource access, chat sessions)

2. **Calculate Progress**: Use weighted scoring system:
   - Quiz scores: 35% of course progress
   - Resource completion: 25% of course progress
   - Tutor interactions: 15% of course progress 
   - Time spent: 10% of course progress
   - Assignment completion: 15% of course progress

3. **Progress Updates**: Update in real-time when activities are completed

4. **Progress History**: Maintain a historical record of progress changes for trend analysis and visualization

5. **Study Streak**: Calculate and update consecutive days of activity to encourage consistent learning

### Dashboard Data Integration

1. **Centralized Stats Collection**:
   - Store aggregated dashboard statistics in the user document for efficient retrieval
   - Update statistics in real-time when activities are completed

2. **Recent Activity Feed**:
   - Store the most recent 10-15 activities in the user document
   - Include activity type, timestamp, and relevant details
   - Use this for dashboard activity feed display

3. **Daily Goals Management**:
   - Generate personalized daily goals based on course progress and scheduled activities
   - Automatically mark goals as complete when relevant activities are finished
   - Allow manual completion tracking via the UI

4. **Event Management**:
   - Store upcoming events in a dedicated subcollection
   - Include study sessions, quiz deadlines, and assignments
   - Update dashboard display with the next 3-5 upcoming events

5. **Suggested Topics Generation**:
   - Analyze course progress to identify areas needing attention
   - Generate personalized topic suggestions for each course
   - Include in dashboard recommendations section

### Assignment Management

1. **Weekly Generation**: Automatically generate new assignments weekly for each enrolled subject

2. **Priority Calculation**: Calculate and update assignment priority based on due dates:
   - Overdue: Priority 5
   - Due today: Priority 4
   - Due tomorrow: Priority 3
   - Due within 3 days: Priority 2
   - Due within a week: Priority 1
   - Due later: Priority 0

3. **Status Management**:
   - Automatically update status to "overdue" when due date passes
   - Allow students to manually update status to "in-progress" or "completed"
   - Record completion date when status changes to "completed"

4. **Gemini API Integration**:
   - Prepare detailed prompts based on subject, recent topics, and student level
   - Process API responses to extract assignment content, resources, and metadata
   - Store generated content in the assignments collection
   - Include fallback templates for when API is unavailable

5. **Activity Synchronization**:
   - Record assignment interactions in the activities collection
   - Update course progress when assignments are completed
   - Include assignment completion in activity history for each course

### Data Synchronization

1. Use Firebase offline persistence for seamless offline/online transitions
2. Implement optimistic UI updates with proper error handling
3. Use transaction operations for critical data updates

### Performance Considerations

1. Keep document sizes small (under 1MB)
2. Use subcollections for one-to-many relationships
3. Denormalize data where appropriate for read optimization
4. Use composite indexes for complex queries
5. Implement pagination for large collections

## Firebase Services Integration Plan

### Phase 1: Authentication & Basic Data Storage
- Implement Firebase Authentication
- Set up Firestore basic collections 
- Implement basic security rules

### Phase 2: Progress Tracking & Dashboard Integration
- Implement activity tracking
- Set up progress calculation functions
- Create dashboard data aggregation
- Implement study streak calculation
- Set up real-time progress updates

### Phase 3: Schedule & Event Management
- Complete schedule data storage
- Implement event tracking and management
- Set up calendar integration
- Create notification system for upcoming events

### Phase 4: Assignment Management System
- Implement assignment generation and storage
- Set up priority calculation and status management
- Create assignment submission handling
- Configure weekly assignment generation

### Phase 5: Advanced Features & Analytics
- Implement chat image storage
- Set up analytics events
- Deploy cloud functions for advanced features
- Integrate Gemini API for assignment generation
- Implement dashboard recommendation engine

## Data Migration Strategy

For migrating from the current localStorage implementation:

1. Create Firebase user accounts for existing users
2. Transfer onboarding preferences to Firestore
3. Migrate localStorage progress tracking data to Firestore
4. Migrate locally stored schedules to Firestore
5. Migrate locally stored assignments to Firestore
6. Create initial dashboard statistics based on migrated data
7. Generate course progress history from available data points
8. Update application to read/write to Firebase instead of localStorage
9. Implement data validation and cleanup processes

## Testing & Security Considerations

1. **Test Security Rules**: Validate all security rules with the Firebase emulator suite
2. **Data Validation**: Implement server-side validation in Cloud Functions
3. **Error Handling**: Implement robust error handling and logging
4. **Backup Strategy**: Set up regular Firestore backups
5. **Monitoring**: Configure Firebase alerts for abnormal usage patterns
6. **Load Testing**: Test dashboard data retrieval performance under various conditions