import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CoursesPage.css';
import Logo from '../assets/logo-white.png';
import { IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, IconClipboard, IconUsers, IconEye, IconPlayerPlay, IconSparkles } from '@tabler/icons-react';
import { getSubjectImageUrl } from '../utils/subjectImageUtils';
// import { getAssignments } from '../utils/assignmentsUtils';
import { getProgressFromFirebase } from '../utils/progressTracker';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCourseCount, setActiveCourseCount] = useState(0);
  const [completedCourseCount, setCompletedCourseCount] = useState(0);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { isDarkMode } = useTheme();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    if (!user.loadingUser) {
      loadCourses();
    }
  }, [user.loadingUser, user.courses]);
  
  const loadCourses = () => {
    setLoading(true);
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      try {
        const userData = JSON.parse(onboardingData);
        if (userData.courses && Array.isArray(userData.courses)) {
          setTimeout(() => {
            processUserCourses(userData);
          }, 1000);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error parsing onboarding data:", error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };
  
  const processUserCourses = (userData) => {
    const userCourses = userData.courses.map((courseId, index) => {
      let courseName, category;
      if (courseId.includes('-')) {
        const [subjectId, courseCode] = courseId.split('-');
        if (courseCode === 'other' && userData.customCourses && userData.customCourses[subjectId]) {
          courseName = userData.customCourses[subjectId];
          category = subjectId;
        } else {
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
        courseName = courseId;
        category = 'other';
      }
      
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
      const progress = 0;
      const status = 'not-started';
      const imageUrl = getSubjectImageUrl(courseName, displayCategory);
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
    if (userCourses.length > 0) {
      fetchCourseProgress(userCourses);
    } else {
      setLoading(false);
    }
  };
  
  const fetchCourseProgress = async (initialCourses) => {
    try {
      const updatedCourses = [...initialCourses];
      for (let i = 0; i < updatedCourses.length; i++) {
        const course = updatedCourses[i];
        const progress = await getProgressFromFirebase(course.name);
        updatedCourses[i] = {
          ...course,
          progress,
          status: progress < 5 ? 'not-started' : progress >= 100 ? 'completed' : 'in-progress'
        };
      }
      
      setCourses(updatedCourses);
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
  
  const filteredCourses = filterCategory === 'all' 
    ? courses 
    : courses.filter(course => course.category === filterCategory);
  
  const overallProgress = courses.length > 0
    ? Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length)
    : 0;

  const handleUpdateCourses = () => {
    navigate('/onboarding');
  };

  const renderEmptyCourses = () => (
    <div className="courses-empty">
      <IconBook size={64} />
      <h2>No Courses Found</h2>
      <p>You haven't enrolled in any courses yet or none match your current filter.</p>
      <div className="empty-actions">
        <button 
          onClick={() => setShowUpdateModal(true)} 
          className="onboarding-link"
        >
          Update Course Selection
        </button>
      </div>
    </div>
  );

  return (
    <div className={`dashboard-page ${isDarkMode ? 'dark-theme' : ''}`}>
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
            <span className="user-name">{user.nickname || 'Student'}</span>
            <div className="user-avatar">
              {user.nickname ? user.nickname.substring(0, 2).toUpperCase() : 'ST'}
            </div>
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
                <div className="loading-spinner-courses"></div>
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
            renderEmptyCourses()
          )}
        </div>
      </div>
      
      <ConfirmationModal 
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={handleUpdateCourses}
        title="Update Your Course Selection"
        message="This will take you to the onboarding process where you can update all your account information, including your subjects, courses, and schedule preferences."
        subMessage="Note: You may need to regenerate your assignments after updating your courses."
      />
    </div>
  );
};

export default CoursesPage;