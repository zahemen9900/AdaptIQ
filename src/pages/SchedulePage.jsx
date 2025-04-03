import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SchedulePage.css';
import Logo from '../assets/logo-white.png';
import { IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, IconClipboard, IconEdit, IconCheck, IconDragDrop, IconDownload, IconRefresh, IconFileText, IconFile, IconSparkles, IconAlertCircle } from '@tabler/icons-react';
import SubjectPopup from '../components/SubjectPopup/SubjectPopup';
import { exportScheduleToPDF } from '../utils/scheduleExporter';
import { exportScheduleToODF } from '../utils/odfExporter';
import { generateOptimizedSchedule } from '../utils/scheduleAlgorithm';
import { useTheme } from '../context/ThemeContext';
import { auth, getUserLearningPreferences, getUserSchedule, saveUserSchedule, getUserData } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';

// Toast notification component
const Toast = ({ message, type, onClose }) => (
  <motion.div 
    className={`toast-notification ${type}`}
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
  >
    {type === 'error' && <IconAlertCircle size={20} />}
    {type === 'success' && <IconCheck size={20} />}
    <span className="toast-message">{message}</span>
    <button className="toast-close" onClick={onClose}>×</button>
  </motion.div>
);

const SchedulePage = () => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverDay, setDraggedOverDay] = useState(null);
  const [draggedOverTime, setDraggedOverTime] = useState(null);
  const [nickname, setNickname] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Added useTheme hook to get the current theme state
  const { isDarkMode } = useTheme();

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 5000); // Hide after 5 seconds
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        if (!auth.currentUser) {
          showToast('User not authenticated. Please log in.', 'error');
          setLoading(false);
          return;
        }
        
        const userId = auth.currentUser.uid;
        
        // Get user data to retrieve nickname
        const userDataResponse = await getUserData(userId);
        
        if (userDataResponse.success && userDataResponse.userData) {
          // Set nickname from Firebase user data
          if (userDataResponse.userData.nickname) {
            setNickname(userDataResponse.userData.nickname);
          } else {
            console.log("No nickname found in user data");
          }
        } else {
          console.error("Failed to get user data:", userDataResponse.error);
        }
        
        // Try to get existing schedule from Firebase first
        const scheduleResponse = await getUserSchedule(userId);
        
        if (scheduleResponse.success) {
          console.log('Loaded schedule from Firebase:', scheduleResponse.schedule);
          setSchedule(scheduleResponse.schedule);
          setLoading(false);
          
          // If we have a lastUpdated timestamp, show when the schedule was last updated
          if (scheduleResponse.lastUpdated) {
            const lastUpdatedDate = new Date(scheduleResponse.lastUpdated);
            console.log(`Schedule last updated: ${lastUpdatedDate.toLocaleString()}`);
          }
        } else {
          console.log('No existing schedule found, generating new schedule');
          
          // Get user preferences from Firebase to generate schedule
          const prefsResponse = await getUserLearningPreferences(userId);
          
          if (prefsResponse.success) {
            const userData = prefsResponse.preferences;
            // Also set nickname from preferences if available
            if (userData.nickname && !nickname) {
              setNickname(userData.nickname);
            }
            
            // Generate a new schedule
            setTimeout(() => {
              const generatedSchedule = generateOptimizedSchedule(userData);
              setSchedule(generatedSchedule);
              
              // Save the generated schedule to Firebase
              saveUserSchedule(userId, generatedSchedule)
                .then(response => {
                  if (response.success) {
                    console.log('Schedule saved to Firebase');
                  } else {
                    console.error('Failed to save schedule to Firebase:', response.error);
                    showToast('Failed to save schedule to Firebase', 'error');
                  }
                })
                .catch(error => {
                  console.error('Error saving schedule to Firebase:', error);
                  showToast('Error saving schedule to Firebase', 'error');
                });
                
              setLoading(false);
            }, 2000); // Simulate loading time
          } else {
            // If we can't get user preferences, show error
            console.error('Failed to load user preferences:', prefsResponse.error);
            showToast('Failed to load your learning preferences', 'error');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing schedule page:', error);
        showToast('An error occurred while loading your schedule', 'error');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Helper function to parse course IDs and return proper display labels
  const getFormattedCourseName = (courseString) => {
    // Check if this is a course ID in the format "subject-course"
    if (courseString && courseString.includes('-')) {
      const [subjectId, courseId] = courseString.split('-');
      
      // Define the mapping of course IDs to proper display names
      const coursesBySubject = {
        math: {
          'algebra': 'Algebra',
          'geometry': 'Geometry', 
          'calculus': 'Calculus',
          'statistics': 'Statistics',
          'trigonometry': 'Trigonometry'
        },
        science: {
          'biology': 'Biology',
          'chemistry': 'Chemistry',
          'physics': 'Physics',
          'environmental': 'Environmental Science',
          'astronomy': 'Astronomy'
        },
        history: {
          'world': 'World History',
          'us': 'US History',
          'european': 'European History',
          'ancient': 'Ancient Civilizations',
          'modern': 'Modern History'
        },
        language: {
          'composition': 'Composition',
          'literature': 'Literature',
          'grammar': 'Grammar',
          'creative': 'Creative Writing',
          'speech': 'Speech & Debate'
        },
        foreign: {
          'spanish': 'Spanish',
          'french': 'French',
          'german': 'German',
          'chinese': 'Chinese',
          'japanese': 'Japanese'
        },
        computer: {
          'programming': 'Programming',
          'webdev': 'Web Development',
          'database': 'Database Systems',
          'ai': 'Artificial Intelligence',
          'cybersecurity': 'Cybersecurity'
        },
        engineering: {
          'mechanical': 'Mechanical Engineering',
          'electrical': 'Electrical Engineering',
          'civil': 'Civil Engineering',
          'chemical': 'Chemical Engineering',
          'software': 'Software Engineering'
        },
        economics: {
          'micro': 'Microeconomics',
          'macro': 'Macroeconomics',
          'international': 'International Economics',
          'business': 'Business Economics',
          'finance': 'Finance'
        },
        psychology: {
          'general': 'General Psychology',
          'developmental': 'Developmental Psychology',
          'cognitive': 'Cognitive Psychology',
          'abnormal': 'Abnormal Psychology',
          'social': 'Social Psychology'
        },
        art: {
          'drawing': 'Drawing',
          'painting': 'Painting',
          'sculpture': 'Sculpture',
          'digital': 'Digital Art'
        },
        music: {
          'theory': 'Music Theory',
          'instrumental': 'Instrumental',
          'vocal': 'Vocal',
          'composition': 'Composition'
        },
        physical: {
          'fitness': 'Fitness',
          'sports': 'Sports',
          'nutrition': 'Nutrition',
          'wellness': 'Wellness'
        }
      };
      
      // Check if we have a mapping for this subject and course
      if (coursesBySubject[subjectId] && coursesBySubject[subjectId][courseId]) {
        return coursesBySubject[subjectId][courseId];
      }
      
      // For custom courses or if mapping not found, return the original string
      return courseString;
    }
    
    // If not in subject-course format, return the original string
    return courseString;
  };

  // Handle drag start
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
  };

  // Handle drag over
  const handleDragOver = (e, day, timeSlot) => {
    e.preventDefault();
    setDraggedOverDay(day);
    setDraggedOverTime(timeSlot);
  };

  // Handle drop
  const handleDrop = async (e, day, timeIndex) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    // Create a deep copy of the schedule
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    
    // Find the day and index of the dragged item
    let draggedDay, draggedIndex;
    
    Object.keys(newSchedule).forEach(d => {
      const index = newSchedule[d].findIndex(item => item.id === draggedItem.id);
      if (index !== -1) {
        draggedDay = d;
        draggedIndex = index;
      }
    });
    
    if (draggedDay && draggedIndex !== undefined) {
      // Get the item to move
      const itemToMove = newSchedule[draggedDay][draggedIndex];
      
      // Remove from original position
      newSchedule[draggedDay].splice(draggedIndex, 1);
      
      // Add to new position
      newSchedule[day].splice(timeIndex, 0, itemToMove);
      
      // Update local state
      setSchedule(newSchedule);
      
      // Save to Firebase
      try {
        if (auth.currentUser) {
          const userId = auth.currentUser.uid;
          const saveResponse = await saveUserSchedule(userId, newSchedule);
          
          if (!saveResponse.success) {
            console.error('Failed to save updated schedule to Firebase:', saveResponse.error);
            showToast('Failed to update schedule in cloud', 'error');
          }
        }
      } catch (error) {
        console.error('Error saving updated schedule to Firebase:', error);
        showToast('Error saving schedule to cloud', 'error');
      }
    }
    
    // Reset drag state
    setDraggedItem(null);
    setDraggedOverDay(null);
    setDraggedOverTime(null);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    
    if (editMode) {
      // When exiting edit mode, ensure schedule is saved to Firebase
      try {
        if (auth.currentUser && schedule) {
          const userId = auth.currentUser.uid;
          saveUserSchedule(userId, schedule)
            .then(response => {
              if (response.success) {
                showToast('Schedule saved successfully', 'success');
              } else {
                showToast('Failed to save schedule changes', 'error');
              }
            })
            .catch(error => {
              console.error('Error saving schedule:', error);
              showToast('Error saving schedule changes', 'error');
            });
        }
      } catch (error) {
        console.error('Error saving schedule when exiting edit mode:', error);
      }
    }
  };
  
  // Handle subject click to show popup
  const handleSubjectClick = (subject) => {
    if (!editMode) {
      setSelectedSubject(subject);
      setShowPopup(true);
    }
  };
  
  // Close popup
  const closePopup = () => {
    setShowPopup(false);
    setSelectedSubject(null);
  };

  // Regenerate schedule
  const regenerateSchedule = async () => {
    try {
      setLoading(true);
      
      if (!auth.currentUser) {
        showToast('User not authenticated. Please log in.', 'error');
        setLoading(false);
        return;
      }
      
      const userId = auth.currentUser.uid;
      
      // Get user preferences from Firebase
      const prefsResponse = await getUserLearningPreferences(userId);
      
      if (prefsResponse.success) {
        const userData = prefsResponse.preferences;
        
        setTimeout(() => {
          // Generate new schedule
          const generatedSchedule = generateOptimizedSchedule(userData);
          setSchedule(generatedSchedule);
          
          // Save to Firebase
          saveUserSchedule(userId, generatedSchedule)
            .then(response => {
              if (response.success) {
                showToast('New schedule generated and saved', 'success');
              } else {
                showToast('Schedule generated but not saved to cloud', 'error');
              }
              setLoading(false);
            })
            .catch(error => {
              console.error('Error saving regenerated schedule:', error);
              showToast('Error saving schedule to cloud', 'error');
              setLoading(false);
            });
        }, 2000); // Simulate loading time
      } else {
        console.error('Failed to load user preferences for regenerating schedule:', prefsResponse.error);
        showToast('Failed to load your learning preferences', 'error');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error regenerating schedule:', error);
      showToast('An error occurred while regenerating schedule', 'error');
      setLoading(false);
    }
  };

  // State for export dropdown
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Toggle export options dropdown
  const toggleExportOptions = () => {
    setShowExportOptions(!showExportOptions);
  };

  // Export schedule as PDF
  const exportScheduleAsPDF = async () => {
    if (!schedule) return;
    
    try {
      // Get user name
      let userName = nickname || 'Student';
      
      // If we don't have nickname in state, try to get from Firebase
      if (!nickname && auth.currentUser) {
        const userId = auth.currentUser.uid;
        const prefsResponse = await getUserLearningPreferences(userId);
        if (prefsResponse.success && prefsResponse.preferences.nickname) {
          userName = prefsResponse.preferences.nickname;
        }
      }
      
      // Generate PDF
      console.log('Generating PDF for', userName);
      const pdfBlob = exportScheduleToPDF(schedule, userName);
      
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF: No blob returned');
      }
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AdaptIQ_Schedule_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      // Hide export options after export
      setShowExportOptions(false);
      showToast('Schedule exported as PDF', 'success');
    } catch (error) {
      console.error('Error exporting schedule as PDF:', error);
      showToast('Error exporting PDF: ' + error.message, 'error');
    }
  };
  
  // Export schedule as ODF
  const exportScheduleAsODF = async () => {
    if (!schedule) return;
    
    try {
      // Get user name
      let userName = nickname || 'Student';
      
      // If we don't have nickname in state, try to get from Firebase
      if (!nickname && auth.currentUser) {
        const userId = auth.currentUser.uid;
        const prefsResponse = await getUserLearningPreferences(userId);
        if (prefsResponse.success && prefsResponse.preferences.nickname) {
          userName = prefsResponse.preferences.nickname;
        }
      }
      
      // Generate ODF
      const odfBlob = exportScheduleToODF(schedule, userName);
      
      // Create download link
      const url = URL.createObjectURL(odfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AdaptIQ_Schedule_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.odt`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      // Hide export options
      setShowExportOptions(false);
      showToast('Schedule exported as ODF', 'success');
    } catch (error) {
      console.error('Error exporting schedule as ODF:', error);
      showToast('Error exporting ODF: ' + error.message, 'error');
    }
  };
  
  // Export schedule (main function that shows options)
  const exportSchedule = () => {
    toggleExportOptions();
  };

  // Sort days of the week in correct order
  const sortDaysByWeekOrder = (schedule) => {
    if (!schedule) return null;

    const dayOrder = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 7
    };

    // Create a new ordered schedule object
    const orderedSchedule = {};
    
    // Add days in correct order
    Object.keys(schedule)
      .sort((a, b) => dayOrder[a] - dayOrder[b])
      .forEach(day => {
        orderedSchedule[day] = schedule[day];
      });

    return orderedSchedule;
  };

  return (
    <div className={`dashboard-page ${isDarkMode ? 'dark-theme' : ''}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast({ show: false, message: '', type: 'success' })} 
          />
        )}
      </AnimatePresence>
    
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
          <Link to="/dashboard/schedule" className="nav-item active">
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
          <h1>Your Study Schedule</h1>
          <div className="user-profile">
            <span className="user-name">{nickname || 'Guest'}</span>
            <div className="user-avatar">{nickname ? nickname.substring(0, 2).toUpperCase() : 'G'}</div>
          </div>
        </div>
        
        <div className="schedule-controls">
          <div className="schedule-actions">
            <button 
              className={`edit-button ${editMode ? 'active' : ''}`} 
              onClick={toggleEditMode}
            >
              {editMode ? (
                <>
                  <IconCheck size={20} />
                  Done Editing
                </>
              ) : (
                <>
                  <IconEdit size={20} />
                  Customize Schedule
                </>
              )}
            </button>
            <button className="regenerate-button" onClick={regenerateSchedule}>
              <IconRefresh size={20} />
              Regenerate
            </button>
            <div className="export-container">
              <button className="export-button" onClick={exportSchedule}>
                <IconDownload size={20} />
                Export
              </button>
              {showExportOptions && (
                <div className="export-options">
                  <button className="export-option" onClick={exportScheduleAsPDF}>
                    <IconFileText size={16} />
                    Export as PDF
                  </button>
                  <button className="export-option" onClick={exportScheduleAsODF}>
                    <IconFile size={16} />
                    Export as ODF
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {editMode && (
            <div className="edit-instructions">
              <IconDragDrop size={24} />
              <p>Drag and drop study sessions to rearrange your schedule</p>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="schedule-loading">
            <div className="loading-animation">
              <IconCalendar size={64} className="loading-icon" />
              <div className="loading-spinner"></div>
            </div>
            <h2>Loading your study schedule...</h2>
            <p>We're preparing your personalized study plan</p>
          </div>
        ) : schedule ? (
          <div className="schedule-calendar">
            {Object.keys(sortDaysByWeekOrder(schedule) || {}).map(day => (
              <div key={day} className="calendar-day">
                <div className="day-header">{day}</div>
                <div 
                  className="day-sessions"
                  onDragOver={(e) => editMode && handleDragOver(e, day, schedule[day].length)}
                  onDrop={(e) => editMode && handleDrop(e, day, schedule[day].length)}
                >
                  {schedule[day].length > 0 ? (
                    schedule[day].map((session, index) => (
                      <div 
                        key={session.id}
                        className={`session-card ${draggedItem?.id === session.id ? 'dragging' : ''} ${draggedOverDay === day && draggedOverTime === index ? 'drag-over' : ''}`}
                        draggable={editMode}
                        onDragStart={(e) => editMode && handleDragStart(e, session)}
                        onDragOver={(e) => editMode && handleDragOver(e, day, index)}
                        onDrop={(e) => editMode && handleDrop(e, day, index)}
                        onClick={() => handleSubjectClick(getFormattedCourseName(session.course))}
                        style={{ cursor: editMode ? 'grab' : 'pointer' }}
                      >
                        <div className="session-time">
                          {session.startTime} - {session.endTime}
                        </div>
                        <div className="session-course">{getFormattedCourseName(session.course)}</div>
                        <div className="session-details">
                          <span className="session-type">{session.type}</span>
                          {session.difficulty && (
                            <span className={`session-difficulty ${session.difficulty.toLowerCase()}`}>
                              {session.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-sessions">No study sessions scheduled</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="schedule-empty">
            <IconCalendar size={64} />
            <h2>No Schedule Found</h2>
            <p>We couldn't find your study schedule. Please complete the onboarding process or generate a new schedule.</p>
            <div className="empty-actions">
              <Link to="/onboarding" className="onboarding-link">Complete Onboarding</Link>
              <button onClick={regenerateSchedule} className="regenerate-button">Generate Schedule</button>
            </div>
          </div>
        )}
        
        {/* Subject Popup */}
        {showPopup && selectedSubject && (
          <SubjectPopup 
            subject={selectedSubject} 
            onClose={closePopup}
          />
        )}
      </div>
    </div>
  );
};

export default SchedulePage;