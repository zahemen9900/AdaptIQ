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
  IconPalette, IconHeart, IconStar, IconCertificate, IconSparkles
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllCoursesProgress } from '../utils/progressTracker';

const ProfilePage = () => {
  // User data state
  const [userData, setUserData] = useState({
    nickname: '',
    email: '',
    firstName: '',
    lastName: '',
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
    totalStudyHours: 0,
    completedAssignments: 0,
    averageScore: 0,
    streakDays: 0,
    subjectsProgress: []
  });
  const [activityHistory, setActivityHistory] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user data and profile information
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Get user info from local storage (onboarding data)
        const onboardingData = localStorage.getItem('onboardingData');
        if (onboardingData) {
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
                'algebra': 'Algebra',
                'geometry': 'Geometry',
                'calculus': 'Calculus',
                'science': 'Science',
                'biology': 'Biology',
                'chemistry': 'Chemistry',
                'physics': 'Physics',
                'history': 'History',
                'worldHistory': 'World History',
                'language': 'Language',
                'english': 'English',
                'programming': 'Programming',
                'computerScience': 'Computer Science'
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
            firstName: parsedData.firstName || '',
            lastName: parsedData.lastName || '',
            bio: parsedData.bio || "I'm a student using AdaptIQ to improve my learning!",
            subjects: subjects,
            joinDate: parsedData.joinDate || new Date().toISOString(),
            studyPreference: parsedData.studyPreference || 'Balanced',
            learningStyle: parsedData.learningStyle || 'Visual',
            profilePicture: parsedData.profilePicture || null
          };
          
          setUserData(profileData);
          setEditData(profileData);
          
          // Fetch additional profile data
          await fetchProfileStatistics(subjects);
          generateAchievements(subjects);
          generateActivityHistory();
          generateBadges();
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Fetch user statistics
  const fetchProfileStatistics = async (subjects) => {
    try {
      // Get course progress data
      const coursesProgress = await getAllCoursesProgress();
      
      // Generate subject progress data
      const subjectsProgress = subjects.map(subject => {
        // Get progress value if it exists, otherwise generate a random value
        const progress = coursesProgress[subject] || 
                          coursesProgress[subject.toLowerCase()] || 
                          Math.floor(Math.random() * 100);
        
        return {
          name: subject,
          progress: progress,
          color: getSubjectColor(subject)
        };
      });
      
      // Generate random stats for demo purposes
      // In a real app, these would come from actual user data
      const totalStudyHours = Math.floor(Math.random() * 100) + 10;
      const completedAssignments = Math.floor(Math.random() * 50) + 5;
      const averageScore = Math.floor(Math.random() * 20) + 80; // 80-100 range
      const streakDays = Math.floor(Math.random() * 30) + 1;
      
      setStatistics({
        totalStudyHours,
        completedAssignments,
        averageScore,
        streakDays,
        subjectsProgress
      });
    } catch (error) {
      console.error('Error fetching profile statistics:', error);
    }
  };
  
  // Generate achievements based on subjects and activity
  const generateAchievements = (subjects) => {
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
        achieved: userData.firstName && userData.lastName && userData.bio
      },
      {
        id: 'streak-7',
        title: 'Weekly Warrior',
        description: 'Maintained a 7-day study streak',
        icon: <IconTrophy size={24} />,
        date: formatDate(new Date()),
        color: '#ff9800',
        achieved: statistics.streakDays >= 7
      },
      {
        id: 'assignments-10',
        title: 'Assignment Ace',
        description: 'Completed 10 assignments',
        icon: <IconClipboard size={24} />,
        date: formatDate(new Date()),
        color: '#9c27b0',
        achieved: statistics.completedAssignments >= 10
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
  
  // Generate activity history
  const generateActivityHistory = () => {
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
  
  // Save profile changes
  const handleSaveProfile = () => {
    // Update userData with editData
    setUserData({ ...editData });
    
    // Save to localStorage (in a real app, this would be an API call)
    try {
      const onboardingData = localStorage.getItem('onboardingData');
      if (onboardingData) {
        const parsedData = JSON.parse(onboardingData);
        const updatedData = {
          ...parsedData,
          nickname: editData.nickname,
          firstName: editData.firstName,
          lastName: editData.lastName,
          email: editData.email,
          bio: editData.bio,
          learningStyle: editData.learningStyle,
          studyPreference: editData.studyPreference
        };
        localStorage.setItem('onboardingData', JSON.stringify(updatedData));
      }
    } catch (error) {
      console.error('Error saving profile data:', error);
    }
    
    // Exit editing mode
    setIsEditing(false);
  };
  
  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Update profile picture in edit data
        setEditData({
          ...editData,
          profilePicture: reader.result
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
    if (userData.firstName && userData.lastName) {
      return `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`;
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
                <button className="cancel-edit-button" onClick={handleEditToggle}>
                  <IconX size={18} />
                  <span>Cancel</span>
                </button>
                <button className="save-profile-button" onClick={handleSaveProfile}>
                  <IconCheck size={18} />
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="profile-loading">
            <div className="loading-spinner-profile"></div>
            <p>Loading profile data...</p>
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
                    <label className="change-picture-button">
                      <IconCamera size={20} />
                      <input 
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
                      <div className="form-group">
                        <label>First Name</label>
                        <input 
                          type="text" 
                          name="firstName" 
                          value={editData.firstName} 
                          onChange={handleInputChange}
                          placeholder="First Name" 
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input 
                          type="text" 
                          name="lastName" 
                          value={editData.lastName} 
                          onChange={handleInputChange}
                          placeholder="Last Name" 
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
                      {userData.firstName && userData.lastName 
                        ? `${userData.firstName} ${userData.lastName}` 
                        : userData.nickname
                      }
                    </h2>
                    {userData.firstName && userData.lastName && (
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
                        <span>Prefers {userData.studyPreference} Study Sessions</span>
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
                          <h3>{statistics.totalStudyHours}</h3>
                          <p>Study Hours</p>
                        </div>
                      </div>
                      <div className="profile-stat-card">
                        <div className="stat-icon assignment-icon">
                          <IconClipboard size={24} />
                        </div>
                        <div className="stat-content">
                          <h3>{statistics.completedAssignments}</h3>
                          <p>Assignments</p>
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
      </div>
    </div>
  );
};

export default ProfilePage;