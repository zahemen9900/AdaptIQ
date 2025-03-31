import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CoursesPage.css';
import Logo from '../assets/logo-white.png';
import { IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, IconClipboard, IconUsers, IconEye, IconPlayerPlay, IconSparkles } from '@tabler/icons-react';
import { getSubjectImageUrl } from '../utils/subjectImageUtils';
import { getAssignments } from '../utils/assignmentsUtils';
import { getProgressFromFirebase } from '../utils/progressTracker';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [activeCourseCount, setActiveCourseCount] = useState(0);
  const [completedCourseCount, setCompletedCourseCount] = useState(0);
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Track whether course data has been loaded from progress tracker
  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    // Load user data and extract courses
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const userData = JSON.parse(onboardingData);
      if (userData.nickname) setNickname(userData.nickname);
      
      // Extract courses and create course objects
      if (userData.courses && Array.isArray(userData.courses)) {
        setTimeout(() => {
          const userCourses = userData.courses.map((courseId, index) => {
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
                
                // Find the course in the coursesBySubject
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
              math: 'mathematics',
              science: 'science',
              history: 'history',
              language: 'language',
              foreign: 'language',
              computer: 'computer-science',
              engineering: 'engineering',
              economics: 'economics',
              psychology: 'psychology',
              art: 'arts',
              music: 'arts',
              physical: 'physical-education',
              other: 'other'
            };
            
            const displayCategory = categoryMapping[category] || 'other';
            
            // Initialize with zero progress - will be updated with actual progress after loading
            const progress = 0;
            const status = 'not-started';
            
            // Get image URL based on course name and category
            const imageUrl = getSubjectImageUrl(courseName, displayCategory);
            
            // Set a default last accessed date (today's date)
            const lastAccessed = new Date().toISOString().split('T')[0];
            
            return {
              id: `course-${index}`,
              courseId,
              name: courseName,
              category: displayCategory,
              progress,
              status,
              imageUrl,
              lastAccessed,
              difficulty: ['Easy', 'Moderate', 'Challenging'][Math.floor(Math.random() * 3)]
            };
          });
          
          setCourses(userCourses);
          
          // After setting initial course data, fetch actual progress
          fetchCourseProgress(userCourses);
        }, 1000); // Simulate loading time
      } else {
        // No courses found
        setLoading(false);
      }
    } else {
      // No user data found
      setLoading(false);
    }
  }, []);
  
  // Function to fetch actual course progress
  const fetchCourseProgress = async (initialCourses) => {
    try {
      // Create a copy of the courses array to update
      const updatedCourses = [...initialCourses];
      
      // For each course, fetch its actual progress
      for (let i = 0; i < updatedCourses.length; i++) {
        const course = updatedCourses[i];
        // Get progress from progress tracker
        const progress = await getProgressFromFirebase(course.name);
        
        // Update course with actual progress
        updatedCourses[i] = {
          ...course,
          progress,
          status: progress < 5 ? 'not-started' : progress >= 100 ? 'completed' : 'in-progress'
        };
      }
      
      // Update courses with actual progress data
      setCourses(updatedCourses);
      
      // Calculate course statistics based on actual progress
      const activeCourses = updatedCourses.filter(c => c.status === 'in-progress').length;
      const completedCourses = updatedCourses.filter(c => c.status === 'completed').length;
      
      setActiveCourseCount(activeCourses);
      setCompletedCourseCount(completedCourses);
      setProgressLoaded(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching course progress:', error);
      setLoading(false);
    }
  };
  
  // Filter courses by category
  const filteredCourses = filterCategory === 'all' 
    ? courses 
    : courses.filter(course => course.category === filterCategory);
  
  // Calculate user's overall progress
  const overallProgress = courses.length > 0
    ? Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length)
    : 0;
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src={Logo} alt="AdaptIQ Logo" className="dashboard-logo" />
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">
            <IconChartBar size={24} />
            <span>Overview</span>
          </Link>
          <Link to="/dashboard/courses" className="nav-item active">
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
          <h1>My Courses</h1>
          <div className="user-profile">
            <span className="user-name">{nickname || 'Guest'}</span>
            <div className="user-avatar">{nickname ? nickname.substring(0, 2).toUpperCase() : 'G'}</div>
          </div>
        </div>
        
        <div className="courses-page-content">
          <div className="courses-stats">
            <div className="stat-card">
              <h3>Overall Progress</h3>
              <div className="stat-progress-circle">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path className="circle"
                    strokeDasharray={`${overallProgress}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="percentage">{overallProgress}%</text>
                </svg>
              </div>
            </div>
            <div className="stat-card">
              <h3>Active Courses</h3>
              <div className="stat-value">{activeCourseCount}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card">
              <h3>Completed</h3>
              <div className="stat-value">{completedCourseCount}</div>
              <div className="stat-label">Courses</div>
            </div>
          </div>
          
          <div className="courses-filter">
            <h2>Course Categories</h2>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
                onClick={() => setFilterCategory('all')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${filterCategory === 'mathematics' ? 'active' : ''}`}
                onClick={() => setFilterCategory('mathematics')}
              >
                Mathematics
              </button>
              <button 
                className={`filter-btn ${filterCategory === 'science' ? 'active' : ''}`}
                onClick={() => setFilterCategory('science')}
              >
                Science
              </button>
              <button 
                className={`filter-btn ${filterCategory === 'language' ? 'active' : ''}`}
                onClick={() => setFilterCategory('language')}
              >
                Language
              </button>
              <button 
                className={`filter-btn ${filterCategory === 'history' ? 'active' : ''}`}
                onClick={() => setFilterCategory('history')}
              >
                History
              </button>
              <button 
                className={`filter-btn ${filterCategory === 'computer-science' ? 'active' : ''}`}
                onClick={() => setFilterCategory('computer-science')}
              >
                Computer Science
              </button>
              <button 
                className={`filter-btn ${filterCategory === 'engineering' ? 'active' : ''}`}
                onClick={() => setFilterCategory('engineering')}
              >
                Engineering
              </button>
              <button 
                className={`filter-btn ${filterCategory === 'economics' ? 'active' : ''}`}
                onClick={() => setFilterCategory('economics')}
              >
                Economics
              </button>
              <button 
                className={`filter-btn ${filterCategory === 'psychology' ? 'active' : ''}`}
                onClick={() => setFilterCategory('psychology')}
              >
                Psychology
              </button>
              <button 
                className={`filter-btn ${filterCategory === 'arts' ? 'active' : ''}`}
                onClick={() => setFilterCategory('arts')}
              >
                Arts
              </button>
              <button 
                className={`filter-btn ${filterCategory === 'physical-education' ? 'active' : ''}`}
                onClick={() => setFilterCategory('physical-education')}
              >
                Physical Education
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="courses-loading">
              <div className="loading-animation">
                <IconBook size={64} className="loading-icon" />
                <div className="loading-spinner"></div>
              </div>
              <h2>Loading your courses...</h2>
              <p>We're preparing your personalized learning content</p>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="adaptiq-courses-grid">
              {filteredCourses.map(course => (
                <div key={course.id} className={`adaptiq-course-card ${course.status}`}>
                  <div className="course-image-container">
                    <img src={course.imageUrl} alt={course.name} className="course-image" />
                    <div className="course-difficulty">{course.difficulty}</div>
                  </div>
                  <div className="course-details">
                    <h3 className="course-name">{course.name}</h3>
                    <div className="course-category">{course.category.replace('-', ' ')}</div>
                    <div className="course-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{course.progress}% complete</span>
                    </div>
                    <div className="course-last-accessed">
                      Last accessed: {course.lastAccessed}
                    </div>
                    <div className="course-actions">
                      <Link to={`/dashboard/schedule`} className="course-action-btn view-btn">
                        <IconEye size={18} />
                        <span>View in Schedule</span>
                      </Link>
                      <Link 
                        to={`/dashboard/course/${encodeURIComponent(course.name)}`} 
                        className="course-action-btn learn-btn"
                      >
                        <IconPlayerPlay size={18} />
                        <span>Start Learning</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="courses-empty">
              <IconBook size={64} />
              <h2>No Courses Found</h2>
              <p>You haven't enrolled in any courses yet or none match your current filter.</p>
              <div className="empty-actions">
                <Link to="/onboarding" className="onboarding-link">Update Course Selection</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;