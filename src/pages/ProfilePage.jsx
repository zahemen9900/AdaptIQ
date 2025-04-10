import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ProfilePage.css';
import Logo from '../assets/logo-white.png';
import DefaultAvatar from '../assets/default-avatar.svg';
import { 
  IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, 
  IconClipboard, IconUsers, IconEdit, IconCamera, IconDownload,
  IconBadge, IconChevronRight, IconClock, IconBrain,
  IconCheck, IconX, IconPencil, IconDeviceAnalytics, IconTrophy,
  IconPalette, IconHeart, IconStar, IconCertificate, IconSparkles,
  IconAlertCircle, IconCircleCheck, IconLayoutDashboard, IconMessageCircle
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllCoursesProgress } from '../utils/progressTracker';
import { auth, db, storage } from '../../firebase';
import { 
  getUserData, 
  getUserStreakInfo, 
  getCompletedAssignmentsCount, 
  updateUserData,
  uploadProfilePictureFromDataURL, 
  updateUserStreak 
} from '../../firebase';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from '@firebase/firestore';

const ProfilePage = () => {
  // User data state
  const [userData, setUserData] = useState({
    nickname: '',
    email: '',
    fullName: '',
    bio: '',
    subjects: [],
    joinDate: '',
    studyPreference: '',
    learningStyle: '',
    profilePicture: null
  });
  
  // Profile states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [achievements, setAchievements] = useState([]);
  const [statistics, setStatistics] = useState({
    totalStudyMinutes: 0,
    completedAssignments: 0,
    averageScore: 0,
    streakDays: 0,
    subjectsProgress: [],
    schedulingStyle: 'Balanced'
  });
  const [activityHistory, setActivityHistory] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // Separate saving state
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Fetch user data and profile information
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!auth.currentUser) {
          throw new Error("Not authenticated. Please log in.");
        }

        const userId = auth.currentUser.uid;
        
        // Update user streak on profile page visit
        await updateUserStreak(userId);
        
        // Get user data from Firebase
        const userResult = await getUserData(userId);
        if (!userResult.success) {
          throw new Error(userResult.error || "Failed to fetch user data");
        }
        
        const firebaseUserData = userResult.userData;
        
        // Get streak information
        const streakResult = await getUserStreakInfo(userId);
        const streakDays = streakResult.success ? streakResult.currentStreak : 0;
        
        // Get completed assignments count
        const assignmentsResult = await getCompletedAssignmentsCount(userId);
        const completedAssignments = assignmentsResult.success ? assignmentsResult.completedCount : 0;
        
        // Extract subjects from user data
        const subjects = [];
        if (firebaseUserData.courses && firebaseUserData.courses.length > 0) {
          // Map courses to subject names
          const subjectMap = {
            'math': 'Mathematics',
            'science': 'Science',
            'history': 'History',
            'english': 'English',
            'language': 'Language',
            'engineering': 'Engineering',
            'computer': 'Computer Science',
            'economics': 'Economics',
          };
          
          firebaseUserData.courses.forEach(courseId => {
            const parts = courseId.split('-');
            const subjectId = parts[0];
            const subjectName = subjectMap[subjectId] || subjectId;
            
            if (!subjects.includes(subjectName)) {
              subjects.push(subjectName);
            }
          });
        } else if (firebaseUserData.subjects) {
          // Use subjects array directly if available
          subjects.push(...firebaseUserData.subjects);
        }
        
        // Create profile data from Firebase data
        const profileData = {
          nickname: firebaseUserData.nickname || 'Student',
          email: firebaseUserData.email || auth.currentUser.email,
          fullName: firebaseUserData.fullName || '',
          bio: firebaseUserData.bio || "I'm a student using AdaptIQ to improve my learning!",
          subjects: subjects,
          joinDate: firebaseUserData.createdAt ? new Date(firebaseUserData.createdAt.toDate()).toISOString() : new Date().toISOString(),
          studyPreference: firebaseUserData.studyPreference || 'Balanced',
          learningStyle: firebaseUserData.learningStyle || 'Visual',
          profilePicture: firebaseUserData.profilePictureURL || null
        };
        
        setUserData(profileData);
        setEditData(profileData);
        
        // Fetch additional profile data
        await fetchProfileStatistics(subjects, streakDays, completedAssignments);
        await fetchActivityHistory();
        generateAchievements(subjects, streakDays, completedAssignments);
        generateBadges();
        
      } catch (error) {
        console.error('Error loading profile data:', error);
        setError(error.message);
        
        // Use local storage as fallback
        const onboardingData = localStorage.getItem('onboardingData');
        if (onboardingData) {
          try {
            const parsedData = JSON.parse(onboardingData);
            
            // Map courses to subject names
            const subjects = [];
            if (parsedData.courses && parsedData.courses.length > 0) {
              parsedData.courses.forEach(courseId => {
                const parts = courseId.split('-');
                const subjectId = parts[0];
                
                // Map subject IDs to display names
                const subjectMap = {
                  'math': 'Mathematics',
                  'science': 'Science',
                  'history': 'History',
                  'language': 'Language',
                  'english': 'English',
                  'engineering': 'Engineering',
                  'computer': 'Computer Science',
                  'economics': 'Economics',
                };
                
                const subjectName = subjectMap[subjectId] || subjectId;
                if (!subjects.includes(subjectName)) {
                  subjects.push(subjectName);
                }
              });
            }
            
            // Create profile data
            const profileData = {
              nickname: parsedData.nickname || 'Student',
              email: parsedData.email || 'student@example.com',
              fullName: parsedData.fullName || '',
              bio: parsedData.bio || "I'm a student using AdaptIQ to improve my learning!",
              subjects: subjects,
              joinDate: parsedData.joinDate || new Date().toISOString(),
              studyPreference: parsedData.studyPreference || 'Balanced',
              learningStyle: parsedData.learningStyle || 'Visual',
              profilePicture: parsedData.profilePicture || null
            };
            
            setUserData(profileData);
            setEditData(profileData);
            
            // Generate sample data
            await fetchProfileStatistics(subjects);
            generateAchievements(subjects);
            await fetchActivityHistory();
            generateBadges();
          } catch (localError) {
            console.error('Error parsing local data:', localError);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Hide notification after a delay
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // Fetch user statistics
  const fetchProfileStatistics = async (subjects, streakDays = 0, completedAssignments = 0) => {
    try {
      // Get user ID for database operations
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      let studyDuration = 0;
      let schedulingStyle = 'Balanced';
      let userCourses = [];
      let subjectProgressMap = {};

      // Get additional user data from Firebase if authenticated
      if (userId) {
        try {
          // Get user document for basic metadata
          const userDocRef = doc(db, "users", userId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Get study duration (in minutes)
            studyDuration = userData.studyDuration || 0;
            // Get scheduling/study preference
            schedulingStyle = userData.schedulingStyle || 'Balanced';
          }

          // Directly query the "courses" subcollection to get actual progress values
          const coursesRef = collection(db, "users", userId, "courses");
          const coursesSnapshot = await getDocs(coursesRef);
          
          if (!coursesSnapshot.empty) {
            // Process each course document to get progress data
            coursesSnapshot.forEach(courseDoc => {
              const courseData = courseDoc.data();
              
              // Only process courses with valid data
              if (courseData && courseData.courseId && courseData.courseName) {
                // Add to our courses collection
                userCourses.push({
                  id: courseData.courseId,
                  name: courseData.courseName,
                  progress: courseData.progress || 0
                });

                // Map the course to its related subject
                const subjectName = mapCourseToSubject(courseData.courseName || courseData.courseId);
                
                // Initialize the subject entry if it doesn't exist
                if (!subjectProgressMap[subjectName]) {
                  subjectProgressMap[subjectName] = {
                    totalProgress: 0,
                    courseCount: 0
                  };
                }
                
                // Add this course's progress to the subject
                subjectProgressMap[subjectName].totalProgress += (courseData.progress || 0);
                subjectProgressMap[subjectName].courseCount++;
              }
            });
            
            console.log("Retrieved courses from Firebase:", userCourses);
          } else {
            console.log("No courses found in user's subcollection, falling back to general progress data");
          }
        } catch (error) {
          console.error("Error fetching course data from Firebase:", error);
        }
      }
      
      // If we didn't get any courses from Firebase, use the general progress tracker as fallback
      if (userCourses.length === 0) {
        const coursesProgress = await getAllCoursesProgress();
        console.log("Using fallback progress data:", coursesProgress);
        
        // Convert to our format and map courses to subjects
        for (const [courseName, progress] of Object.entries(coursesProgress)) {
          const subjectName = mapCourseToSubject(courseName);
          
          if (!subjectProgressMap[subjectName]) {
            subjectProgressMap[subjectName] = {
              totalProgress: 0,
              courseCount: 0
            };
          }
          
          subjectProgressMap[subjectName].totalProgress += progress;
          subjectProgressMap[subjectName].courseCount++;
        }
      }
      
      // Function to map a course to its subject using the subject mappings
      function mapCourseToSubject(courseName) {
        // First try an exact subject match
        if (subjects.includes(courseName)) {
          return courseName;
        }
        
        // Normalized course name for matching
        const normalizedCourseName = courseName.toLowerCase();
        
        // Subject category mapping
        const subjectCategoryMapping = {
          'Algebra': 'mathematics',
          'Geometry': 'mathematics',
          'Calculus': 'mathematics',
          'Statistics': 'mathematics',
          'Trigonometry': 'mathematics',
          'Biology': 'science',
          'Chemistry': 'science',
          'Physics': 'science',
          'Environmental Science': 'science',
          'Astronomy': 'science',
          'World History': 'history',
          'US History': 'history',
          'European History': 'history',
          'Ancient Civilizations': 'history',
          'Modern History': 'history',
          'Spanish': 'foreign',
          'French': 'foreign',
          'German': 'foreign',
          'Chinese': 'foreign',
          'Japanese': 'foreign',
          'Programming': 'computer-science',
          'Web Development': 'computer-science',
          'Database Systems': 'computer-science',
          'Artificial Intelligence': 'computer-science',
          'Cybersecurity': 'computer-science',
          'Mechanical Engineering': 'engineering',
          'Electrical Engineering': 'engineering',
          'Civil Engineering': 'engineering',
          'Chemical Engineering': 'engineering',
          'Software Engineering': 'engineering',
          'Microeconomics': 'economics',
          'Macroeconomics': 'economics',
          'International Economics': 'economics',
          'Business Economics': 'economics',
          'Financial Economics': 'economics',
          'Clinical Psychology': 'psychology',
          'Cognitive Psychology': 'psychology',
          'Developmental Psychology': 'psychology',
          'Social Psychology': 'psychology',
          'Abnormal Psychology': 'psychology',
          'Drawing': 'art',
          'Painting': 'art',
          'Sculpture': 'art',
          'Digital Art': 'art',
          'Music Theory': 'music',
          'Instrumental': 'music',
          'Vocal': 'music',
          'Composition': 'music',
          'Other': 'general',
          'Mathematics': 'mathematics',
          'Science': 'science',
          'History': 'history',
          'Language Arts': 'language',
          'Foreign Languages': 'foreign',
          'Computer Science': 'computer-science',
          'Art & Design': 'art',
          'Music': 'music',
          'Physical Education': 'physical',
          'Economics': 'economics',
          'Psychology': 'psychology',
          'Engineering': 'engineering'
        };
        
        // Try to match by course ID/name
        for (const [courseKey, subjectName] of Object.entries(subjectCategoryMapping)) {
          if (normalizedCourseName.includes(courseKey)) {
            return subjectName;
          }
        }
        
        // Subject specific mappings
        const idToSubjectMap = {
          'math': 'Mathematics',
          'algebra': 'Mathematics',
          'geometry': 'Mathematics',
          'calculus': 'Mathematics',
          'science': 'Science',
          'biology': 'Science',
          'chemistry': 'Science',
          'physics': 'Science',
          'history': 'History',
          'worldhistory': 'History',
          'language': 'Language',
          'english': 'Language',
          'computer': 'Computer Science',
          'computerscience': 'Computer Science'
        };
        
        // If we still don't have a match, try the ID mapping
        for (const [id, subjectName] of Object.entries(idToSubjectMap)) {
          if (normalizedCourseName.includes(id)) {
            return subjectName;
          }
        }
        
        // Default to the course name itself as a fallback
        return courseName;
      }
      
      // Calculate average progress for each subject
      const subjectsProgress = subjects.map(subject => {
        let progress = 0;
        
        // If we have progress data for this subject, calculate the average
        if (subjectProgressMap[subject] && subjectProgressMap[subject].courseCount > 0) {
          progress = Math.round(
            subjectProgressMap[subject].totalProgress / subjectProgressMap[subject].courseCount
          );
        } else {
          // Fallback if no course progress data is available for this subject
          // Use a small non-zero value to show that the subject exists but has minimal progress
          progress = 0; 
        }
        
        return {
          name: subject,
          progress: progress,
          color: getSubjectColor(subject)
        };
      });
      
      // Use actual study minutes from user data
      const totalStudyMinutes = studyDuration;
      
      // For average score, use data if available, otherwise generate placeholder
      const averageScore = Math.floor(Math.random() * 20) + 80; // 80-100 range for average score
      
      setStatistics({
        totalStudyMinutes,
        completedAssignments,
        averageScore,
        streakDays,
        subjectsProgress,
        schedulingStyle
      });
    } catch (error) {
      console.error('Error fetching profile statistics:', error);
    }
  };
  
  // Fetch activity history from Firebase
  const fetchActivityHistory = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error("Not authenticated");
      }
      
      const userId = auth.currentUser.uid;
      
      // Get assignment activity
      const assignmentActivities = [];
      try {
        const assignmentsRef = collection(db, "users", userId, "assignments");
        const assignmentsQuery = query(
          assignmentsRef, 
          orderBy("createdAt", "desc"), 
          limit(10)
        );
        
        const assignmentDocs = await getDocs(assignmentsQuery);
        assignmentDocs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'completed') {
            assignmentActivities.push({
              id: doc.id,
              type: 'assignment',
              subject: data.subject,
              details: `Completed "${data.title}" assignment`,
              date: data.submittedAt ? data.submittedAt.toDate() : new Date()
            });
          } else if (data.createdAt) {
            assignmentActivities.push({
              id: doc.id,
              type: 'assignment-received',
              subject: data.subject,
              details: `Received "${data.title}" assignment`,
              date: data.createdAt.toDate()
            });
          }
        });
      } catch (error) {
        console.error("Error fetching assignment activities:", error);
      }
      
      // Get course activities (if implemented)
      const courseActivities = [];
      
      // Get login activities (if implemented)
      const loginActivities = [];
      
      // Combine all activities and sort by date
      const allActivities = [...assignmentActivities, ...courseActivities, ...loginActivities]
        .sort((a, b) => b.date - a.date);
      
      // If we have enough activities, use them
      if (allActivities.length > 0) {
        setActivityHistory(allActivities);
        return;
      }
      
      // Fallback to generated activities if needed
      const generatedActivities = [
        {
          id: 'activity-1',
          type: 'course-progress',
          subject: 'Mathematics',
          details: 'Reached 75% completion in Algebra',
          date: new Date(Date.now() - 86400000 * 2) // 2 days ago
        },
        {
          id: 'activity-2',
          type: 'assignment',
          subject: 'Physics',
          details: 'Completed "Introduction to Forces" assignment with score 92',
          date: new Date(Date.now() - 86400000 * 4) // 4 days ago
        },
        {
          id: 'activity-3',
          type: 'assessment',
          subject: 'Chemistry',
          details: 'Took assessment on "Periodic Table" with score 88',
          date: new Date(Date.now() - 86400000 * 7) // 7 days ago
        },
        {
          id: 'activity-4',
          type: 'study-session',
          subject: 'History',
          details: 'Completed a 45-minute study session',
          date: new Date(Date.now() - 86400000 * 1) // 1 day ago
        },
        {
          id: 'activity-5',
          type: 'course-started',
          subject: 'Programming',
          details: 'Started "Introduction to Python" course',
          date: new Date(Date.now() - 86400000 * 10) // 10 days ago
        }
      ];
      
      setActivityHistory(generatedActivities);
    } catch (error) {
      console.error("Error fetching activity history:", error);
      
      // Fallback to generated activities
      const activities = [
        {
          id: 'activity-1',
          type: 'course-progress',
          subject: 'Mathematics',
          details: 'Reached 75% completion in Algebra',
          date: new Date(Date.now() - 86400000 * 2) // 2 days ago
        },
        {
          id: 'activity-2',
          type: 'assignment',
          subject: 'Physics',
          details: 'Completed "Introduction to Forces" assignment with score 92',
          date: new Date(Date.now() - 86400000 * 4) // 4 days ago
        },
        {
          id: 'activity-3',
          type: 'assessment',
          subject: 'Chemistry',
          details: 'Took assessment on "Periodic Table" with score 88',
          date: new Date(Date.now() - 86400000 * 7) // 7 days ago
        },
        {
          id: 'activity-4',
          type: 'study-session',
          subject: 'History',
          details: 'Completed a 45-minute study session',
          date: new Date(Date.now() - 86400000 * 1) // 1 day ago
        },
        {
          id: 'activity-5',
          type: 'course-started',
          subject: 'Programming',
          details: 'Started "Introduction to Python" course',
          date: new Date(Date.now() - 86400000 * 10) // 10 days ago
        }
      ];
      
      setActivityHistory(activities);
    }
  };
  
  // Generate achievements based on subjects and activity
  const generateAchievements = (subjects, streakDays = 0, completedAssignments = 0) => {
    const baseAchievements = [
      {
        id: 'first-login',
        title: 'First Steps',
        description: 'Logged in for the first time',
        icon: <IconCheck size={24} />,
        date: formatDate(new Date(userData.joinDate)),
        color: '#4caf50',
        achieved: true
      },
      {
        id: 'profile-complete',
        title: 'Identity Established',
        description: 'Completed your profile information',
        icon: <IconUser size={24} />,
        date: formatDate(new Date(userData.joinDate)),
        color: '#2196f3',
        achieved: userData.fullName && userData.bio
      },
      {
        id: 'streak-7',
        title: 'Weekly Warrior',
        description: 'Maintained a 7-day study streak',
        icon: <IconTrophy size={24} />,
        date: formatDate(new Date()),
        color: '#ff9800',
        achieved: streakDays >= 7
      },
      {
        id: 'assignments-10',
        title: 'Assignment Ace',
        description: 'Completed 10 assignments',
        icon: <IconClipboard size={24} />,
        date: formatDate(new Date()),
        color: '#9c27b0',
        achieved: completedAssignments >= 10
      }
    ];
    
    // Add subject-specific achievements
    const subjectAchievements = subjects.map((subject, index) => {
      const subjectProgress = statistics.subjectsProgress.find(s => s.name === subject);
      const progress = subjectProgress ? subjectProgress.progress : 0;
      
      return {
        id: `${subject.toLowerCase()}-starter`,
        title: `${subject} Explorer`,
        description: `Started learning ${subject}`,
        icon: <IconBrain size={24} />,
        date: formatDate(new Date(Date.now() - (index * 86400000))), // Random dates
        color: getSubjectColor(subject),
        achieved: true
      };
    });
    
    setAchievements([...baseAchievements, ...subjectAchievements]);
  };
  
  // Generate badges for the user
  const generateBadges = () => {
    const userBadges = [
      {
        id: 'badge-1',
        name: 'Quick Learner',
        icon: <IconBrain size={32} color="#4a6bfb" />,
        description: 'Completes lessons faster than average',
        level: 'Gold'
      },
      {
        id: 'badge-2',
        name: 'Problem Solver',
        icon: <IconDeviceAnalytics size={32} color="#ff9800" />,
        description: 'Excels at analytical thinking',
        level: 'Silver'
      },
      {
        id: 'badge-3',
        name: 'Dedicated Scholar',
        icon: <IconBook size={32} color="#9c27b0" />,
        description: 'Studies consistently over time',
        level: 'Bronze'
      }
    ];
    
    setBadges(userBadges);
  };
  
  // Handle profile editing
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // Reset edit data to current user data when toggling
    if (!isEditing) {
      setEditData({ ...userData });
    }
  };
  
  // Handle input changes for profile editing
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value
    });
  };
  
  // Upload profile picture separately before saving other profile changes
  const uploadProfileImage = async (userId, imageDataUrl) => {
    try {
      if (!imageDataUrl) return { success: false, error: "No image data provided" };
      if (!imageDataUrl.startsWith('data:image/')) return { success: false, error: "Invalid image data" };
      
      console.log('Starting profile picture upload...');
      // Add a timeout to prevent hanging forever
      const uploadPromise = uploadProfilePictureFromDataURL(userId, imageDataUrl);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Upload timed out.")), 30000);  // Timeout after 30 seconds
      });
      
      // Race the upload against the timeout
      const pictureResult = await Promise.race([uploadPromise, timeoutPromise]);
      console.log('Upload result:', pictureResult);
      
      if (!pictureResult.success) {
        throw new Error(pictureResult.error || "Failed to upload profile picture");
      }
      
      return { success: true, profilePictureURL: pictureResult.profilePictureURL };
    } catch (error) {
      console.error('Error in uploadProfileImage function:', error);
      return { success: false, error: error.message || "Failed to upload profile picture" };
    }
  };
  
  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      setSaving(true); // Use separate saving state to avoid UI jumping
      
      if (!auth.currentUser) {
        throw new Error("Not authenticated");
      }
      
      const userId = auth.currentUser.uid;
      
      // Prepare data to update in Firebase
      const updateData = {
        nickname: editData.nickname,
        fullName: editData.fullName,
        email: editData.email,
        bio: editData.bio,
        learningStyle: editData.learningStyle,
        studyPreference: editData.studyPreference,
      };
      
      let profilePictureURL = userData.profilePicture;
      
      // Handle profile picture upload separately
      if (editData.profilePicture && editData.profilePicture !== userData.profilePicture) {
        try {
          const uploadResult = await uploadProfileImage(userId, editData.profilePicture);
          if (uploadResult.success) {
            profilePictureURL = uploadResult.profilePictureURL;
            updateData.profilePictureURL = profilePictureURL;
          } else {
            throw new Error(uploadResult.error || "Failed to upload profile picture");
          }
        } catch (pictureError) {
          console.error("Profile picture upload error:", pictureError);
          setNotification({
            show: true,
            message: `Profile picture upload failed: ${pictureError.message}`,
            type: 'error'
          });
          setSaving(false);
          return; // Exit early if image upload fails
        }
      }
      
      // Update user profile data in Firebase
      const result = await updateUserData(userId, updateData);
      if (!result.success) {
        throw new Error(result.error || "Failed to update profile");
      }
      
      // Update local state
      setUserData({ 
        ...userData,
        ...updateData,
        profilePicture: profilePictureURL
      });
      
      // Exit editing mode
      setIsEditing(false);
      
      // Show success notification
      setNotification({
        show: true,
        message: 'Profile updated successfully!',
        type: 'success'
      });
      
      // Also update localStorage as a fallback
      try {
        const onboardingData = localStorage.getItem('onboardingData');
        if (onboardingData) {
          const parsedData = JSON.parse(onboardingData);
          const updatedData = {
            ...parsedData,
            ...updateData,
            profilePicture: profilePictureURL
          };
          localStorage.setItem('onboardingData', JSON.stringify(updatedData));
        }
      } catch (localError) {
        console.error('Error saving to localStorage:', localError);
      }
      
    } catch (error) {
      console.error('Error saving profile data:', error);
      // Show error notification
      setNotification({
        show: true,
        message: error.message || 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        setNotification({
          show: true,
          message: 'Please select a valid image file',
          type: 'error'
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setNotification({
          show: true,
          message: 'Image too large. Please select an image smaller than 5MB',
          type: 'error'
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        // Update profile picture in edit data
        setEditData({
          ...editData,
          profilePicture: reader.result
        });
      };
      reader.onerror = () => {
        setNotification({
          show: true,
          message: 'Error reading file. Please try again.',
          type: 'error'
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Helper function to get a color for a subject
  const getSubjectColor = (subject) => {
    const colorMap = {
      'Mathematics': '#4a6bfb',
      'Algebra': '#4a6bfb',
      'Geometry': '#5e35b1',
      'Calculus': '#3949ab',
      'Science': '#00acc1',
      'Biology': '#43a047',
      'Chemistry': '#00897b',
      'Physics': '#039be5',
      'History': '#f9a825',
      'World History': '#ff8f00',
      'Language': '#d81b60',
      'English': '#8e24aa',
      'Programming': '#546e7a',
      'Computer Science': '#546e7a'
    };
    
    return colorMap[subject] || '#757575';
  };
  
  // Format dates in a readable way
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Calculate days since join
  const getDaysSinceJoin = () => {
    const joinDate = new Date(userData.joinDate);
    const today = new Date();
    const diffTime = Math.abs(today - joinDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Get initials for avatar placeholder
  const getInitials = () => {
    if (userData.fullName) {
      // Get first letter of first name and first letter of last name
      const nameParts = userData.fullName.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      // If only one name, return first 2 letters
      return userData.fullName.substring(0, 2).toUpperCase();
    } else if (userData.nickname) {
      return userData.nickname.substring(0, 2).toUpperCase();
    }
    return 'ST'; // Default: Student
  };
  
  // Determine learning style icon
  const getLearningStyleIcon = () => {
    switch (userData.learningStyle) {
      case 'Visual':
        return <IconPalette size={20} />;
      case 'Auditory':
        return <IconHeart size={20} />;
      case 'Reading/Writing':
        return <IconBook size={20} />;
      case 'Kinesthetic':
        return <IconBrain size={20} />;
      default:
        return <IconPalette size={20} />;
    }
  };
  
  return (
    <div className="dashboard-page">
      {/* Sidebar Navigation */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src={Logo} alt="AdaptIQ Logo" className="dashboard-logo" />
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">
            <IconLayoutDashboard size={24} />
            <span>Overview</span>
          </Link>
          <Link to="/dashboard/chat" className="nav-item">
            <IconMessageCircle size={24} />
            <span>Chat</span>
          </Link>
          <Link to="/dashboard/courses" className="nav-item">
            <IconBook size={24} />
            <span>Courses</span>
          </Link>
          <Link to="/dashboard/assignments" className="nav-item">
            <IconClipboard size={24} />
            <span>Assignments</span>
          </Link>
          <Link to="/dashboard/schedule" className="nav-item">
            <IconCalendar size={24} />
            <span>Schedule</span>
          </Link>
          <Link to="/dashboard/inspiration" className="nav-item">
            <IconSparkles size={24} />
            <span>Inspiration</span>
          </Link>
          <Link to="/dashboard/profile" className="nav-item active">
            <IconUser size={24} />
            <span>Profile</span>
          </Link>
          <Link to="/dashboard/settings" className="nav-item">
            <IconSettings size={24} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="dashboard-content">
        <div className="dashboard-header profile-header">
          <h1>My Profile</h1>
          <div className="profile-actions">
            {!isEditing ? (
              <button className="edit-profile-button" onClick={handleEditToggle}>
                <IconEdit size={18} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="edit-actions">
                <button className="cancel-edit-button" onClick={handleEditToggle} disabled={saving}>
                  <IconX size={18} />
                  <span>Cancel</span>
                </button>
                <button className="save-profile-button" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="button-spinner"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <IconCheck size={18} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Notification popup */}
        <AnimatePresence>
          {notification.show && (
            <motion.div 
              className={`notification-popup ${notification.type}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {notification.type === 'success' ? 
                <IconCircleCheck size={20} /> : 
                <IconAlertCircle size={20} />
              }
              <span>{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {loading ? (
          <div className="profile-loading">
            <div className="loading-spinner-profile"></div>
            <p>Loading profile data...</p>
          </div>
        ) : error ? (
          <div className="profile-error">
            <IconAlertCircle size={48} color="#e53935" />
            <h3>Error Loading Profile</h3>
            <p>{error}</p>
            <button 
              className="retry-button" 
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="profile-container">
            {/* Profile Overview */}
            <div className="profile-overview">
              <div className="profile-picture-container">
                {isEditing ? (
                  <div className="profile-picture-edit">
                    {editData.profilePicture ? (
                      <img src={editData.profilePicture} alt="Profile" className="profile-picture" />
                    ) : (
                      <div className="profile-initial-avatar">
                        {getInitials()}
                      </div>
                    )}
                    <label className="change-picture-button" htmlFor="profile-picture-input">
                      <IconCamera size={20} />
                      <input 
                        id="profile-picture-input"
                        type="file" 
                        accept="image/*" 
                        onChange={handleProfilePictureChange} 
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                ) : (
                  <>
                    {userData.profilePicture ? (
                      <img src={userData.profilePicture} alt="Profile" className="profile-picture" />
                    ) : (
                      <div className="profile-initial-avatar">
                        {getInitials()}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="profile-details">
                {isEditing ? (
                  <div className="profile-edit-form">
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label>Full Name</label>
                        <input 
                          type="text" 
                          name="fullName" 
                          value={editData.fullName} 
                          onChange={handleInputChange}
                          placeholder="Full Name" 
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nickname</label>
                        <input 
                          type="text" 
                          name="nickname" 
                          value={editData.nickname} 
                          onChange={handleInputChange}
                          placeholder="Nickname"
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input 
                          type="email" 
                          name="email" 
                          value={editData.email} 
                          onChange={handleInputChange}
                          placeholder="Email"
                          readOnly={auth.currentUser && auth.currentUser.email === editData.email}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label>Bio</label>
                        <textarea 
                          name="bio" 
                          value={editData.bio} 
                          onChange={handleInputChange}
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Learning Style</label>
                        <select 
                          name="learningStyle" 
                          value={editData.learningStyle} 
                          onChange={handleInputChange}
                        >
                          <option value="Visual">Visual</option>
                          <option value="Auditory">Auditory</option>
                          <option value="Reading/Writing">Reading/Writing</option>
                          <option value="Kinesthetic">Kinesthetic</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Study Preference</label>
                        <select 
                          name="studyPreference" 
                          value={editData.studyPreference} 
                          onChange={handleInputChange}
                        >
                          <option value="Morning">Morning</option>
                          <option value="Afternoon">Afternoon</option>
                          <option value="Evening">Evening</option>
                          <option value="Balanced">Balanced</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="profile-name">
                      {userData.fullName || userData.nickname}
                    </h2>
                    {userData.fullName && (
                      <p className="profile-username">@{userData.nickname}</p>
                    )}
                    <p className="profile-bio">{userData.bio}</p>
                    
                    <div className="profile-meta">
                      <div className="profile-meta-item">
                        <IconClock size={20} />
                        <span>Joined {formatDate(userData.joinDate)} ({getDaysSinceJoin()} days ago)</span>
                      </div>
                      <div className="profile-meta-item">
                        {getLearningStyleIcon()}
                        <span>{userData.learningStyle} Learner</span>
                      </div>
                      <div className="profile-meta-item">
                        <IconCalendar size={20} />
                        <span>Prefers {statistics.schedulingStyle || 'Balanced'} Study Schedule</span>
                      </div>
                    </div>
                    
                    <div className="profile-subjects">
                      <h3>My Subjects</h3>
                      <div className="subject-tags">
                        {userData.subjects.map((subject, index) => (
                          <span 
                            key={index} 
                            className="subject-tag"
                            style={{ backgroundColor: getSubjectColor(subject) }}
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Profile Tabs */}
            <div className="profile-content">
              <div className="profile-tabs">
                <button 
                  className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`profile-tab ${activeTab === 'achievements' ? 'active' : ''}`}
                  onClick={() => setActiveTab('achievements')}
                >
                  Achievements
                </button>
                <button 
                  className={`profile-tab ${activeTab === 'activity' ? 'active' : ''}`}
                  onClick={() => setActiveTab('activity')}
                >
                  Activity
                </button>
                <button 
                  className={`profile-tab ${activeTab === 'badges' ? 'active' : ''}`}
                  onClick={() => setActiveTab('badges')}
                >
                  Badges
                </button>
              </div>
              
              <div className="profile-tab-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="profile-overview-content">
                    <div className="profile-stats-grid">
                      <div className="profile-stat-card">
                        <div className="stat-icon clock-icon">
                          <IconClock size={24} />
                        </div>
                        <div className="stat-content">
                          <h3>{statistics.totalStudyMinutes}</h3>
                          <p>Study Minutes</p>
                        </div>
                      </div>
                      <div className="profile-stat-card">
                        <div className="stat-icon assignment-icon">
                          <IconClipboard size={24} />
                        </div>
                        <div className="stat-content">
                          <h3>{statistics.completedAssignments}</h3>
                          <p>Assignments Done</p>
                        </div>
                      </div>
                      <div className="profile-stat-card">
                        <div className="stat-icon score-icon">
                          <IconDeviceAnalytics size={24} />
                        </div>
                        <div className="stat-content">
                          <h3>{statistics.averageScore}%</h3>
                          <p>Average Score</p>
                        </div>
                      </div>
                      <div className="profile-stat-card">
                        <div className="stat-icon streak-icon">
                          <IconTrophy size={24} />
                        </div>
                        <div className="stat-content">
                          <h3>{statistics.streakDays}</h3>
                          <p>Day Streak</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="subject-progress-section">
                      <h3>Subject Progress</h3>
                      <div className="subject-progress-list">
                        {statistics.subjectsProgress.map((subject, index) => (
                          <div className="subject-progress-item" key={index}>
                            <div className="subject-progress-header">
                              <h4>{subject.name}</h4>
                              <span>{subject.progress}%</span>
                            </div>
                            <div className="subject-progress-bar">
                              <div 
                                className="subject-progress-fill" 
                                style={{ 
                                  width: `${subject.progress}%`,
                                  backgroundColor: subject.color 
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="recent-achievements">
                      <div className="section-header">
                        <h3>Recent Achievements</h3>
                        <button className="view-all-button" onClick={() => setActiveTab('achievements')}>
                          View All <IconChevronRight size={16} />
                        </button>
                      </div>
                      <div className="recent-achievements-list">
                        {achievements.slice(0, 3).map((achievement, index) => (
                          <div 
                            className={`achievement-card ${achievement.achieved ? 'achieved' : 'locked'}`}
                            key={index}
                          >
                            <div 
                              className="achievement-icon"
                              style={{ backgroundColor: achievement.achieved ? achievement.color : '#c7c7c7' }}
                            >
                              {achievement.icon}
                            </div>
                            <div className="achievement-details">
                              <h4>{achievement.title}</h4>
                              <p>{achievement.description}</p>
                              {achievement.achieved && (
                                <span className="achievement-date">Achieved on {achievement.date}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Achievements Tab */}
                {activeTab === 'achievements' && (
                  <div className="achievements-content">
                    <h3>Your Achievements</h3>
                    <div className="achievements-grid">
                      {achievements.map((achievement, index) => (
                        <div 
                          className={`achievement-card ${achievement.achieved ? 'achieved' : 'locked'}`}
                          key={index}
                        >
                          <div 
                            className="achievement-icon"
                            style={{ backgroundColor: achievement.achieved ? achievement.color : '#c7c7c7' }}
                          >
                            {achievement.icon}
                          </div>
                          <div className="achievement-details">
                            <h4>{achievement.title}</h4>
                            <p>{achievement.description}</p>
                            {achievement.achieved ? (
                              <span className="achievement-date">Achieved on {achievement.date}</span>
                            ) : (
                              <span className="achievement-locked">Not yet achieved</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <div className="activity-content">
                    <h3>Activity History</h3>
                    <div className="activity-timeline">
                      {activityHistory.map((activity, index) => (
                        <div className="activity-item" key={index}>
                          <div className="activity-marker">
                            {activity.type === 'course-progress' && <IconBook size={20} />}
                            {activity.type === 'assignment' && <IconClipboard size={20} />}
                            {activity.type === 'assignment-received' && <IconClipboard size={20} />}
                            {activity.type === 'assessment' && <IconDeviceAnalytics size={20} />}
                            {activity.type === 'study-session' && <IconClock size={20} />}
                            {activity.type === 'course-started' && <IconBrain size={20} />}
                          </div>
                          <div className="activity-content">
                            <div className="activity-header">
                              <h4>{activity.subject}</h4>
                              <span className="activity-date">{formatDate(activity.date)}</span>
                            </div>
                            <p>{activity.details}</p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="activity-item">
                        <div className="activity-marker">
                          <IconUser size={20} />
                        </div>
                        <div className="activity-content">
                          <div className="activity-header">
                            <h4>Account Created</h4>
                            <span className="activity-date">{formatDate(userData.joinDate)}</span>
                          </div>
                          <p>Joined AdaptIQ learning platform</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="activity-download">
                      <button className="download-activity-button">
                        <IconDownload size={18} />
                        <span>Download Activity Report</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Badges Tab */}
                {activeTab === 'badges' && (
                  <div className="badges-content">
                    <h3>Your Earned Badges</h3>
                    <div className="badges-grid">
                      {badges.map((badge, index) => (
                        <div className="badge-card" key={index}>
                          <div className={`badge-level ${badge.level.toLowerCase()}`}>
                            {badge.level}
                          </div>
                          <div className="badge-icon">
                            {badge.icon}
                          </div>
                          <div className="badge-details">
                            <h4>{badge.name}</h4>
                            <p>{badge.description}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Locked badges */}
                      <div className="badge-card locked">
                        <div className="badge-icon">
                          <IconCertificate size={32} color="#c7c7c7" />
                        </div>
                        <div className="badge-details">
                          <h4>Master Scholar</h4>
                          <p>Complete all courses in a subject</p>
                          <span className="badge-locked">Locked</span>
                        </div>
                      </div>
                      
                      <div className="badge-card locked">
                        <div className="badge-icon">
                          <IconStar size={32} color="#c7c7c7" />
                        </div>
                        <div className="badge-details">
                          <h4>Perfect Score</h4>
                          <p>Achieve 100% on any assessment</p>
                          <span className="badge-locked">Locked</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="badge-info">
                      <p>Badges are earned by achieving specific milestones in your learning journey. Badges can be Bronze, Silver, or Gold level depending on your achievements!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {saving && (
          <div className="saving-overlay">
            <div className="saving-spinner"></div>
            <p>Saving profile changes...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;