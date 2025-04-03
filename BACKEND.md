# AdaptIQ Backend Firebase Implementation

This document outlines the Firebase database structure and implementation for the AdaptIQ learning platform.

## Overview

AdaptIQ currently uses Firebase as its backend solution with the following services:

- **Firebase Authentication**: For user management and authentication
- **Cloud Firestore**: For NoSQL database storage of user data and learning content
- **Firebase Hosting**: For deployment of the web application

## Current Implementation

The project currently has the following Firebase functionality implemented:

### User Management
- Email/password authentication with Firebase Auth
- User data storage in Firestore with onboarding preferences
- User settings and profile information management

### Learning Progress Tracking
- Course progress tracking with percentage completion
- Activity history recording for learning sessions
- Learning mode usage statistics

### Course Learning Experience
- Storage of chat history with AI tutors
- Progress updates when completing learning activities
- Personalized learning preferences by subject

### Assignment Management
- Create and store course-specific assignments
- Track assignment status (pending, in-progress, completed)
- Store due dates and priority levels
- Assignment completion tracking

## Database Structure

The Cloud Firestore database uses the following collection and document structure:

### Users Collection

**Collection**: `users`  
**Document ID**: `{uid}` (Firebase Authentication UID)

```javascript
{
  // User profile information
  nickname: "string",
  dateOfBirth: "string", // Optional ISO date string
  goals: "string",
  
  // User settings and preferences from onboarding
  learningStyle: "string", // "visual", "auditory", "reading", "kinesthetic"
  studyEnvironment: "string",
  preferredTime: "string",
  subjects: ["string"], // Array of subject IDs
  gradeLevel: "string",
  courses: ["string"], // Array of course IDs (format: "subject-course")
  customCourses: { // Custom courses mapped by subject
    "subjectId": "courseName"
  },
  availableDays: ["string"], // Array of day names
  studyDuration: "string", // Duration in minutes
  breakFrequency: "string", // Break frequency in minutes
  schedulingStyle: "string", // "casual" or "focused"
  
  // User schedule data
  schedule: {
    // Schedule data organized by day
    monday: [
      {
        course: "string",
        startTime: "string",
        endTime: "string",
        duration: "number"
      }
    ],
    // ... other days
  },
  scheduleLastUpdated: "string" // ISO date string
}
```

### Assignments Collection

**Collection**: `assignments`  
**Document ID**: Auto-generated

```javascript
{
  title: "string",
  description: "string", 
  course: "string",
  subject: "string",
  dueDate: "string", // ISO date string
  status: "string", // "pending", "in-progress", "completed", "overdue"
  priority: "string", // "low", "medium", "high"
  userId: "string", // User ID reference
  createdAt: "string", // ISO date string
  lastUpdated: "string", // ISO date string
}
```

### Course Progress Collection

**Collection**: `courseProgress`  
**Document ID**: Auto-generated

```javascript
{
  userId: "string", // User ID reference
  courseName: "string",
  progress: "number", // Percentage (0-100)
  lastUpdated: "string", // ISO date string
}
```

### Activity History Collection

**Collection**: `activityHistory`  
**Document ID**: Auto-generated

```javascript
{
  userId: "string", // User ID reference
  courseName: "string",
  type: "string", // "chat", "quiz", "resources"
  name: "string", // Description of the activity
  date: "string", // ISO date string
  score: "number", // Optional score for quiz activities
  duration: "number" // Optional duration in minutes
}
```

### Chat History Collection

**Collection**: `chatHistory`  
**Document ID**: Auto-generated

```javascript
{
  userId: "string", // User ID reference
  courseName: "string",
  timestamp: "string", // ISO date string
  userMessage: "string",
  botResponse: "string" // Or object for complex responses
}
```

## Firebase Functions

The following functions are currently implemented for interacting with Firebase:

### User Authentication and Data
- `signUp(email, password)`: Register a new user
- `signIn(email, password)`: Authenticate an existing user
- `signOut()`: Sign out the current user
- `updateUserData(userId, userData)`: Update user data in Firestore
- `getUserData(userId)`: Get user data from Firestore

### Course Progress Tracking
- `updateCourseProgress(userId, courseName, progress)`: Update course completion percentage
- `getCourseProgress(userId, courseName)`: Get progress for a specific course
- `saveActivityHistory(userId, activityData)`: Record a learning activity
- `getActivityHistory(userId, courseName)`: Get activity history for a course

### Assignment Management
- `createAssignment(assignmentData)`: Create a new assignment
- `getUserAssignments(userId)`: Get all assignments for a user
- `getAssignmentsBySubject(userId, subject)`: Get assignments for a specific subject
- `getAssignmentsByCourse(userId, course)`: Get assignments for a specific course
- `updateAssignmentStatus(assignmentId, status)`: Update assignment status

### Chat and Learning History
- `saveChatHistory(userId, courseName, chatData)`: Save a chat conversation
- `getChatHistory(userId, courseName)`: Get chat history for a course

## Current Limitations

The current Firebase implementation has the following limitations:

- No real-time synchronization for multi-device use cases
- Limited offline support
- Basic security rules implementation
- No cloud functions for server-side processing

## Future Development

Planned extensions to the Firebase implementation include:

- Firebase Storage for user-uploaded files and assignment submissions
- Firebase Analytics for tracking user behavior and learning patterns
- Firebase Cloud Functions for:
  - AI integration with Gemini Pro via secure API endpoints
  - Automated assignment generation and grading
  - Scheduled notifications and reminders
- Enhanced real-time synchronization for collaborative features
- Advanced security rules with role-based access control

## Last Updated: April 3, 2025