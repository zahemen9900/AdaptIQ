import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import Logo from '../assets/logo-white.png';
import { 
  IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, 
  IconClipboard, IconUsers, IconAward, IconBell, IconArrowUpRight,
  IconBrandZoom, IconNotebook, IconClock, IconCheck, IconRefresh,
  IconArrowRight, IconEye, IconActivity, IconBulb, IconTrophy, 
  IconTargetArrow, IconMessageCircle, IconX, IconPlus, IconSparkles,
  IconLogout, IconAlertCircle, IconRobot, IconBrain
} from '@tabler/icons-react';
import { getAssignmentsFromFirestore, formatAssignmentDate, sortAssignments } from '../utils/assignmentsUtils';
import { 
  getProgressFromFirebase, 
  getAllCoursesProgress, 
  getActivityHistory 
} from '../utils/progressTracker';
import AILearningRecommendation from '../components/AILearningRecommendation/AILearningRecommendation';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from '@firebase/auth';
import { auth, db, getUserData } from '../../firebase';
import { useUser } from '../context/UserContext';
// import { doc, getDoc } from 'firebase/firestore';

// SignOut Confirmation Modal Component
const SignOutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="confirmation-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <div className="modal-header">
          <IconAlertCircle size={24} className="warning-icon" />
          <h3>Sign Out</h3>
          <button className="close-modal-button" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>
        
        <div className="modal-content">
          <p>Are you sure you want to sign out from AdaptIQ?</p>
        </div>
        
        <div className="modal-actions">
          <button className="modal-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-button primary" onClick={onConfirm}>
            Sign Out
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, updateUserData } = useUser(); // Use the global user context
  
  const [courseData, setCourseData] = useState({
    totalCourses: 0,
    activeCourses: 0,
    completedCourses: 0,
    overallProgress: 0,
    courses: []
  });
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [courseProgress, setCourseProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for goals modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const goalInputRef = useRef(null);

  // State for sign out confirmation modal
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // State for additional dashboard features
  const [recentActivity, setRecentActivity] = useState([]);
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [studyStreakDays, setStudyStreakDays] = useState(0);
  const [todayGoals, setTodayGoals] = useState([
    { id: 1, text: 'Complete 30 minutes of study', completed: false },
    { id: 2, text: 'Finish assignment #3', completed: false },
    { id: 3, text: 'Review last week\'s material', completed: false },
  ]);
  const [upcomingEvents, setUpcomingEvents] = useState([
    { id: 1, title: 'Study Session', date: new Date(Date.now() + 86400000), type: 'study' },
    { id: 2, title: 'Math Quiz', date: new Date(Date.now() + 259200000), type: 'quiz' }
  ]);

  // State for user data to be passed to AI recommendations
  const [completeUserData, setCompleteUserData] = useState(null);


  // Toggle goal completion
  const toggleGoalCompletion = (goalId) => {
    setTodayGoals(todayGoals.map(goal => 
      goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
    ));
  };

  // Add a new goal
  const handleAddGoal = () => {
    if (newGoalText.trim() === '') return;
    
    const newGoal = {
      id: Date.now(), // Generate unique ID using timestamp
      text: newGoalText.trim(),
      completed: false
    };
    
    setTodayGoals([...todayGoals, newGoal]);
    setNewGoalText('');
    
    // Save goals to localStorage
    try {
      const storedGoals = JSON.parse(localStorage.getItem('adaptiq-goals') || '[]');
      localStorage.setItem('adaptiq-goals', JSON.stringify([...storedGoals, newGoal]));
    } catch (error) {
      console.error("Error saving goals to localStorage:", error);
    }
    
    // Focus the input field again for adding another goal
    if (goalInputRef.current) {
      goalInputRef.current.focus();
    }
  };
  
  // Handle opening the goal modal
  const handleOpenGoalModal = () => {
    setShowGoalModal(true);
    // Focus the input field after modal opens
    setTimeout(() => {
      if (goalInputRef.current) {
        goalInputRef.current.focus();
      }
    }, 100);
  };
  
  // Handle closing the goal modal
  const handleCloseGoalModal = () => {
    setShowGoalModal(false);
    setNewGoalText('');
  };
  
  // Refresh dashboard data
  const handleRefreshDashboard = async () => {
    if (refreshing) return; // Prevent multiple refreshes
    
    setRefreshing(true);
    
    try {
      // Refresh all dashboard data
      const courseInfo = await fetchCourseData({
        courses: user.courses,
        nickname: user.nickname
      });
      setCourseData(courseInfo);
      
      // Filter top courses for progress display
      const topCourses = courseInfo.courses
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 4);
      setCourseProgress(topCourses);
      
      // Get upcoming assignments
      const assignments = await fetchAssignments();
      setUpcomingAssignments(assignments);
      
      // Use the actual study streak from user data
      if (user && user.studyStreak !== undefined) {
        setStudyStreakDays(user.studyStreak);
      }
      
      // Show success message (could add a toast notification here)
      console.log("Dashboard refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle key press in the goal input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddGoal();
    }
  };

  // Get user's study streak
  useEffect(() => {
    const calculateStudyStreak = () => {
      // Use the actual study streak from user data instead of random value
      if (user && user.studyStreak !== undefined) {
        setStudyStreakDays(user.studyStreak);
      }
    };

    calculateStudyStreak();
  }, [user]);

  // Generate greeting based on time of day and add variety
  const getGreeting = () => {
    const hour = new Date().getHours();
    const nickname = user?.nickname || 'Student';
    
    // Different greeting variations
    const morningGreetings = [
      `Good Morning, ${nickname}!`,
      `Rise and Shine, ${nickname}!`,
      `Hello ${nickname}, Ready for a productive day?`,
      `Morning Study Time with ${nickname}`,
      `Fresh Day, Fresh Mind, ${nickname}`,
    ];
    
    const afternoonGreetings = [
      `Good Afternoon, ${nickname}!`,
      `Keep Going Strong, ${nickname}!`,
      `Study Break with ${nickname}`,
      `Halfway There, ${nickname}!`,
      `Learning and Growing with ${nickname}`,
    ];
    
    const eveningGreetings = [
      `Good Evening, ${nickname}!`,
      `Wrapping Up Today, ${nickname}?`,
      `Evening Study Session with ${nickname}`,
      `Final Push, ${nickname}!`,
      `Reflect and Review with ${nickname}`,
    ];

    const specialGreetings = [
      `AdaptIQ and ${nickname} Time`,
      `Let's Crush Some Goals, ${nickname}!`,
      `${nickname}'s Learning Dashboard`,
      `Ready to Learn Something New, ${nickname}?`,
      `${studyStreakDays} Day Streak! Amazing, ${nickname}!`,
      `Today's Insights for ${nickname}`,
    ];
    
    // Select greeting based on time of day
    let greetings;
    if (hour < 12) {
      greetings = morningGreetings;
    } else if (hour < 17) {
      greetings = afternoonGreetings;
    } else {
      greetings = eveningGreetings;
    }
    
    // 30% chance of showing a special greeting instead of time-based one
    if (Math.random() < 0.3) {
      return specialGreetings[Math.floor(Math.random() * specialGreetings.length)];
    }
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  // Load suggested topics based on courses
  useEffect(() => {
    const loadSuggestedTopics = () => {
      if (courseData && courseData.courses && courseData.courses.length > 0) {
        // In a real app, these would be algorithmically determined based on learning patterns
        const topicsFromCourses = courseData.courses.map(course => {
          return {
            id: `topic-${course.id}`,
            title: `Advanced ${course.name}`,
            description: `Deepen your understanding of ${course.name} concepts`,
            course: course.name,
            progress: course.progress
          };
        });
        
        // Sort by progress (suggest topics from courses with lower progress first)
        const sortedTopics = topicsFromCourses
          .sort((a, b) => a.progress - b.progress)
          .slice(0, 3);
          
        setSuggestedTopics(sortedTopics);
      }
    };
    
    loadSuggestedTopics();
  }, [courseData]);

  // Load recent activity
  useEffect(() => {
    const loadRecentActivity = async () => {
      // Get activity from the first course (in a real app, would aggregate all courses)
      if (courseData && courseData.courses && courseData.courses.length > 0) {
        const firstCourse = courseData.courses[0];
        const activity = await getActivityHistory(firstCourse.name);
        
        // Set recent activity (up to 5 items)
        setRecentActivity(activity.slice(0, 5));
      }
    };
    
    loadRecentActivity();
  }, [courseData]);

  useEffect(() => {
    // Load user data and courses/assignments
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Get course data using the user data from context
        const courseInfo = await fetchCourseData({
          courses: user.courses,
          nickname: user.nickname
        });
        
        setCourseData(courseInfo);
        
        // Filter top courses for progress display
        const topCourses = courseInfo.courses
          .sort((a, b) => b.progress - a.progress)
          .slice(0, 4);
        setCourseProgress(topCourses);
        
        // Get upcoming assignments
        const assignments = await fetchAssignments();
        setUpcomingAssignments(assignments);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Only load data if user is authenticated and not loading
    if (!user.loadingUser) {
      loadData();
    }
  }, [user.loadingUser, user.courses, user.nickname]);
  
  // Prepare complete user data for AI recommendations
  useEffect(() => {
    if (user && !user.loadingUser && courseData) {
      const enrichedUserData = {
        ...user,
        studyStreak: studyStreakDays,
        schedule: upcomingEvents.reduce((acc, event) => {
          const dateStr = event.date.toISOString().split('T')[0];
          if (!acc[dateStr]) acc[dateStr] = [];
          acc[dateStr].push(event);
          return acc;
        }, {}),
        overallProgress: courseData.overallProgress,
        courseDetails: courseData.courses
      };
      
      setCompleteUserData(enrichedUserData);
    }
  }, [user, courseData, studyStreakDays, upcomingEvents]);

  // Function to fetch course data
  const fetchCourseData = async (userData) => {
    // Extract courses from user data
    const userCourses = [];
    let overallProgress = 0;
    let activeCourseCount = 0;
    let completedCourseCount = 0;
    
    // Get all courses progress from localStorage
    const allCoursesProgress = await getAllCoursesProgress();
    
    if (userData && userData.courses && Array.isArray(userData.courses)) {
      // Process course data similar to CoursesPage
      for (let index = 0; index < userData.courses.length; index++) {
        const courseId = userData.courses[index];
        
        // Parse course ID (format: subject-course)
        let courseName, category;
        if (courseId.includes('-')) {
          const [subjectId, courseCode] = courseId.split('-');
          
          // Handle custom courses
          if (courseCode === 'other' && userData.customCourses && userData.customCourses[subjectId]) {
            courseName = userData.customCourses[subjectId];
            category = subjectId;
          } else {
            // Get course name from predefined courses
            const coursesBySubject = {
              math: [
                { id: 'algebra', label: 'Algebra' },
                { id: 'geometry', label: 'Geometry' },
                { id: 'calculus', label: 'Calculus' },
                { id: 'statistics', label: 'Statistics' },
                { id: 'trigonometry', label: 'Trigonometry' }
              ],
              science: [
                { id: 'biology', label: 'Biology' },
                { id: 'chemistry', label: 'Chemistry' },
                { id: 'physics', label: 'Physics' },
                { id: 'environmental', label: 'Environmental Science' },
                { id: 'astronomy', label: 'Astronomy' }
              ],
              history: [
                { id: 'world', label: 'World History' },
                { id: 'us', label: 'US History' },
                { id: 'european', label: 'European History' },
                { id: 'ancient', label: 'Ancient Civilizations' },
                { id: 'modern', label: 'Modern History' }
              ],
              language: [
                { id: 'composition', label: 'Composition' },
                { id: 'literature', label: 'Literature' },
                { id: 'grammar', label: 'Grammar' },
                { id: 'creative', label: 'Creative Writing' },
                { id: 'speech', label: 'Speech & Debate' }
              ],
              foreign: [
                { id: 'spanish', label: 'Spanish' },
                { id: 'french', label: 'French' },
                { id: 'german', label: 'German' },
                { id: 'chinese', label: 'Chinese' },
                { id: 'japanese', label: 'Japanese' }
              ],
              computer: [
                { id: 'programming', label: 'Programming' },
                { id: 'webdev', label: 'Web Development' },
                { id: 'database', label: 'Database Systems' },
                { id: 'ai', label: 'Artificial Intelligence' },
                { id: 'cybersecurity', label: 'Cybersecurity' }
              ],
              engineering: [
                { id: 'mechanical', label: 'Mechanical Engineering' },
                { id: 'electrical', label: 'Electrical Engineering' },
                { id: 'civil', label: 'Civil Engineering' },
                { id: 'chemical', label: 'Chemical Engineering' },
                { id: 'software', label: 'Software Engineering' }
              ],
              economics: [
                { id: 'micro', label: 'Microeconomics' },
                { id: 'macro', label: 'Macroeconomics' },
                { id: 'international', label: 'International Economics' },
                { id: 'business', label: 'Business Economics' },
                { id: 'finance', label: 'Finance' }
              ],
              psychology: [
                { id: 'general', label: 'General Psychology' },
                { id: 'developmental', label: 'Developmental Psychology' },
                { id: 'cognitive', label: 'Cognitive Psychology' },
                { id: 'abnormal', label: 'Abnormal Psychology' },
                { id: 'social', label: 'Social Psychology' }
              ],
              art: [
                { id: 'drawing', label: 'Drawing' },
                { id: 'painting', label: 'Painting' },
                { id: 'sculpture', label: 'Sculpture' },
                { id: 'digital', label: 'Digital Art' }
              ],
              music: [
                { id: 'theory', label: 'Music Theory' },
                { id: 'instrumental', label: 'Instrumental' },
                { id: 'vocal', label: 'Vocal' },
                { id: 'composition', label: 'Composition' }
              ],
              physical: [
                { id: 'fitness', label: 'Fitness' },
                { id: 'sports', label: 'Sports' },
                { id: 'nutrition', label: 'Nutrition' },
                { id: 'wellness', label: 'Wellness' }
              ]
            };
            
            if (coursesBySubject[subjectId]) {
              const courseObj = coursesBySubject[subjectId].find(c => c.id === courseCode);
              if (courseObj) {
                courseName = courseObj.label;
                category = subjectId;
              } else {
                courseName = 'Unknown Course';
                category = 'other';
              }
            } else {
              courseName = 'Unknown Course';
              category = 'other';
            }
          }
        } else {
          // Handle legacy format or malformed course IDs
          courseName = courseId;
          category = 'other';
        }
        
        // Map category IDs to display categories
        const categoryMapping = {
          math: 'Mathematics',
          science: 'Science',
          history: 'History',
          language: 'Language',
          foreign: 'Language',
          computer: 'Computer Science',
          engineering: 'Engineering',
          economics: 'Economics',
          psychology: 'Psychology',
          art: 'Arts',
          music: 'Arts',
          physical: 'Physical Education',
          other: 'Other'
        };
        
        const displayCategory = categoryMapping[category] || 'Other';
        
        // Use real progress data from progressTracker instead of random values
        // First check if there's a specific course progress in our allCoursesProgress
        let progress = 0;
        
        // Try different ways the course name might be stored
        if (allCoursesProgress[courseName]) {
          progress = allCoursesProgress[courseName];
        } else if (allCoursesProgress[courseName.toLowerCase()]) {
          progress = allCoursesProgress[courseName.toLowerCase()];
        } else {
          // If no progress found, try to fetch directly (might be stored with different format)
          progress = await getProgressFromFirebase(courseName);
        }
        
        // If still no progress, default to 0
        progress = progress || 0;
        
        const status = progress < 5 ? 'not-started' : progress >= 100 ? 'completed' : 'in-progress';
        
        // Update counters based on status
        if (status === 'in-progress') activeCourseCount++;
        if (status === 'completed') completedCourseCount++;
        
        userCourses.push({
          id: `course-${index}`,
          courseId,
          name: courseName,
          category: displayCategory,
          progress,
          status
        });
        
        // Add to overall progress calculation
        overallProgress += progress;
      }
      
      // Calculate overall progress percentage
      if (userCourses.length > 0) {
        overallProgress = Math.round(overallProgress / userCourses.length);
      }
    }
    
    return {
      totalCourses: userCourses.length,
      activeCourses: activeCourseCount,
      completedCourses: completedCourseCount,
      overallProgress,
      courses: userCourses
    };
  };
  
  // Function to fetch upcoming assignments
  const fetchAssignments = async () => {
    try {
      // Get assignments from Firebase instead of localStorage
      let assignments = await getAssignmentsFromFirestore();
      
      // Sort by due date
      assignments = sortAssignments(assignments, 'dueDate');
      
      // Get only pending and in-progress assignments
      const activeAssignments = assignments.filter(a => 
        a.status === 'pending' || a.status === 'in-progress'
      );
      
      // Return the 5 most upcoming assignments
      return activeAssignments.slice(0, 5);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      return [];
    }
  };  

  const handleSignOutClick = () => {
    setShowSignOutModal(true);
  };

  const handleSignOut = async() => {
    try {
      await signOut(auth);
      navigate('/login');
      console.log("User signed out successfully!");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src={Logo} alt="AdaptIQ Logo" className="dashboard-logo" />
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            <IconChartBar size={24} />
            <span>Overview</span>
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
          <Link to="/dashboard/profile" className="nav-item">
            <IconUser size={24} />
            <span>Profile</span>
          </Link>
          <Link to="/dashboard/settings" className="nav-item">
            <IconSettings size={24} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <div className="user-profile">
            <span className="user-name">{user.nickname || 'Student'}</span>
            <div className="user-avatar">
              {user.nickname ? user.nickname.substring(0, 2).toUpperCase() : 'ST'}
            </div>
            <button className="sign-out-button" onClick={handleSignOutClick}>
              <IconLogout size={18} />
            </button>
          </div>
        </div>
        
        <div className="dashboard-main">
          {loading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner-dashboard"></div>
              <p>Loading your dashboard...</p>
            </div>
          ) : (
            <>
              <div className="welcome-greeting">
                <h1 data-text={getGreeting()}>{getGreeting()}</h1>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Active Courses</h3>
                  <div className="stat-value">{courseData.activeCourses}</div>
                  <div className="stat-label">In Progress</div>
                </div>
                <div className="stat-card">
                  <h3>Total Courses</h3>
                  <div className="stat-value">{courseData.totalCourses}</div>
                  <div className="stat-label">Enrolled</div>
                </div>
                <div className="stat-card">
                  <h3>Completion Rate</h3>
                  <div className="stat-value">{courseData.overallProgress}%</div>
                  <div className="stat-label">Overall Progress</div>
                </div>
                <div className="stat-card">
                  <h3>Study Streak</h3>
                  <div className="stat-value">{studyStreakDays}</div>
                  <div className="stat-label">Days in a row</div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="dashboard-card assignments-card">
                  <h2>Upcoming Assignments</h2>
                  {upcomingAssignments.length > 0 ? (
                    <>
                      <div className="assignments-list">
                        {upcomingAssignments.map(assignment => (
                          <div key={assignment.id} className="assignment-item">
                            <div className="assignment-info">
                              <h4>{assignment.title}</h4>
                              <p>{assignment.subject}</p>
                            </div>
                            <div className="assignment-due">Due: {formatAssignmentDate(assignment.dueDate)}</div>
                          </div>
                        ))}
                      </div>
                      <div className="view-all-assignments">
                        <Link to="/dashboard/assignments" className="view-all-button">
                          <span>View All Assignments</span>
                          <IconArrowRight size={16} />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">
                      <IconClipboard size={32} />
                      <p>No upcoming assignments</p>
                      <Link to="/dashboard/assignments" className="dashboard-link">Create new assignment</Link>
                    </div>
                  )}
                </div>

                <div className="dashboard-card progress-card">
                  <h2>Course Progress</h2>
                  {courseProgress.length > 0 ? (
                    <div className="progress-list">
                      {courseProgress.map(course => (
                        <div key={course.id} className="progress-item">
                          <div className="progress-info">
                            <h4>{course.name}</h4>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                      <div className="view-all-link-container">
                        <Link to="/dashboard/courses" className="view-all-link">
                          <span>View All Courses</span>
                          <IconArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <IconBook size={32} />
                      <p>No course progress to show</p>
                      <Link to="/dashboard/courses" className="dashboard-link">View courses</Link>
                    </div>
                  )}
                </div>
              </div>

              {/* New Additional Utilities */}
              <div className="dashboard-grid">
                {/* Daily Goals Card */}
                <div className="dashboard-card goals-card">
                  <h2>Today's Goals</h2>
                  <div className="goals-list">
                    {todayGoals.map(goal => (
                      <div 
                        key={goal.id} 
                        className={`goal-item ${goal.completed ? 'completed' : ''}`}
                        onClick={() => toggleGoalCompletion(goal.id)}
                      >
                        <div className="goal-checkbox">
                          {goal.completed ? <IconCheck size={18} /> : null}
                        </div>
                        <span className="goal-text">{goal.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card-footer">
                    <button className="link-button" onClick={handleRefreshDashboard}>
                      <IconRefresh size={16} />
                      <span>Refresh Goals</span>
                    </button>
                  </div>
                </div>

                {/* Calendar Events Card */}
                <div className="dashboard-card events-card">
                  <h2>Upcoming Events</h2>
                  <div className="events-list">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className={`event-item ${event.type}`}>
                        <div className="event-icon">
                          {event.type === 'study' ? <IconBrandZoom size={20} /> : 
                           event.type === 'quiz' ? <IconNotebook size={20} /> : 
                           <IconCalendar size={20} />}
                        </div>
                        <div className="event-details">
                          <h4>{event.title}</h4>
                          <p>{event.date.toLocaleDateString()} - {event.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <div className="event-action">
                          <button>
                            <IconArrowRight size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="card-footer">
                    <Link to="/dashboard/schedule" className="link-button">
                      <IconEye size={16} />
                      <span>View Full Schedule</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Third Row - Activity and Recommended Topics */}
              <div className="dashboard-grid">
                {/* Recent Activity */}
                <div className="dashboard-card activity-card">
                  <h2>Recent Activity</h2>
                  {recentActivity.length > 0 ? (
                    <div className="activity-list">
                      {recentActivity.map((activity, index) => (
                        <div key={activity.id || index} className="activity-item">
                          <div className="activity-icon">
                            {activity.type === 'chat' ? <IconMessageCircle size={20} /> : 
                             activity.type === 'quiz' ? <IconNotebook size={20} /> : 
                             activity.type === 'progress-update' ? <IconActivity size={20} /> : 
                             <IconBook size={20} />}
                          </div>
                          <div className="activity-details">
                            <h4>{activity.name || (activity.type === 'progress-update' ? 
                                 `Progress updated to ${activity.newProgress}%` : 
                                 `Activity: ${activity.type}`)}</h4>
                            <p>{activity.date instanceof Date ? 
                               activity.date.toLocaleString() : 
                               new Date(activity.date).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <IconActivity size={32} />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>

                {/* Suggested Topics */}
                <div className="dashboard-card suggested-card">
                  <h2>Recommended for You</h2>
                  {suggestedTopics.length > 0 ? (
                    <div className="suggested-list">
                      {suggestedTopics.map(topic => (
                        <div key={topic.id} className="suggested-item">
                          <div className="suggested-icon">
                            <IconBulb size={24} />
                          </div>
                          <div className="suggested-details">
                            <h4>{topic.title}</h4>
                            <p>{topic.description}</p>
                            <span className="suggested-course">{topic.course}</span>
                          </div>
                          <div className="suggested-action">
                            <button className="suggested-button">
                              <span>Explore</span>
                              <IconArrowUpRight size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <IconBulb size={32} />
                      <p>No suggestions yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Learning Recommendations */}
              <AILearningRecommendation userData={completeUserData} />

              {/* All Caught Up Section */}
              <motion.div 
                className="caught-up-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="caught-up-icon">
                  <IconTrophy size={48} color="#FFD700" />
                </div>
                <h2>You're all caught up!</h2>
                <p>You've checked all your notifications and recent activity.</p>
                <div className="caught-up-actions">
                  <button className="primary-button" onClick={handleOpenGoalModal}>
                    <IconTargetArrow size={18} />
                    <span>Set New Goals</span>
                  </button>
                  <button 
                    className={`secondary-button ${refreshing ? 'refreshing' : ''}`} 
                    onClick={handleRefreshDashboard}
                    disabled={refreshing}
                  >
                    <IconRefresh size={18} className={refreshing ? 'spin' : ''} />
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Dashboard'}</span>
                  </button>
                </div>
              </motion.div>
              
              {/* Goal Setting Modal */}
              <AnimatePresence>
                {showGoalModal && (
                  <motion.div 
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div 
                      className="goal-modal"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <div className="goal-modal-header">
                        <h2>Set New Goals</h2>
                        <button className="close-button" onClick={handleCloseGoalModal}>
                          <IconX size={20} />
                        </button>
                      </div>
                      
                      <div className="goal-modal-content">
                        <p>Add goals to track your daily progress. Click on a goal to mark it as completed.</p>
                        
                        <div className="goal-input-container">
                          <input 
                            type="text" 
                            className="goal-input"
                            placeholder="Enter a new goal..."
                            value={newGoalText}
                            onChange={(e) => setNewGoalText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            ref={goalInputRef}
                          />
                          <button 
                            className="add-goal-button"
                            onClick={handleAddGoal}
                            disabled={!newGoalText.trim()}
                          >
                            <IconPlus size={20} />
                            <span>Add</span>
                          </button>
                        </div>
                        
                        <div className="goals-list-modal">
                          {todayGoals.length > 0 ? (
                            todayGoals.map(goal => (
                              <div 
                                key={goal.id} 
                                className={`goal-item ${goal.completed ? 'completed' : ''}`}
                                onClick={() => toggleGoalCompletion(goal.id)}
                              >
                                <div className="goal-checkbox">
                                  {goal.completed ? <IconCheck size={18} /> : null}
                                </div>
                                <span className="goal-text">{goal.text}</span>
                              </div>
                            ))
                          ) : (
                            <div className="no-goals-message">
                              <p>You haven't set any goals yet. Add your first goal above!</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="goal-modal-footer">
                        <button className="close-modal-button" onClick={handleCloseGoalModal}>
                          Done
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmationModal 
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
      />
    </div>
  );
};

export default DashboardPage;