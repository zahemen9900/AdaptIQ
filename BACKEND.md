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
  averageSessionDuration: number // in minutes
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
      
      // User subcollections - courses, schedule, activities, assignments
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

### Phase 2: Progress Tracking & Schedule Management
- Implement activity tracking
- Set up progress calculation functions
- Complete schedule data storage

### Phase 3: Assignment Management System
- Implement assignment generation and storage
- Set up priority calculation and status management
- Create assignment submission handling
- Configure weekly assignment generation

### Phase 4: Advanced Features & Analytics
- Implement chat image storage
- Set up analytics events
- Deploy cloud functions for advanced features
- Integrate Gemini API for assignment generation

## Data Migration Strategy

For migrating from the current localStorage implementation:

1. Create Firebase user accounts for existing users
2. Transfer onboarding preferences to Firestore
3. Migrate locally stored schedules to Firestore
4. Migrate locally stored assignments to Firestore
5. Update application to read/write to Firebase instead of localStorage
6. Implement data validation and cleanup processes

## Testing & Security Considerations

1. **Test Security Rules**: Validate all security rules with the Firebase emulator suite
2. **Data Validation**: Implement server-side validation in Cloud Functions
3. **Error Handling**: Implement robust error handling and logging
4. **Backup Strategy**: Set up regular Firestore backups
5. **Monitoring**: Configure Firebase alerts for abnormal usage patterns