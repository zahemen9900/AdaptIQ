import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SchedulePage.css';
import Logo from '../assets/logo-white.png';
import { IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, IconClipboard, IconUsers, IconEdit, IconCheck, IconDragDrop, IconDownload, IconRefresh, IconFileText, IconFile, IconSparkles } from '@tabler/icons-react';
import SubjectPopup from '../components/SubjectPopup/SubjectPopup';
import { exportScheduleToPDF, prepareScheduleForFirebase, saveScheduleToFirebase } from '../utils/scheduleExporter';
import { exportScheduleToODF } from '../utils/odfExporter';
import { generateOptimizedSchedule } from '../utils/scheduleAlgorithm';

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

  useEffect(() => {
    // Load user data and schedule from localStorage
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const userData = JSON.parse(onboardingData);
      if (userData.nickname) setNickname(userData.nickname);
      
      // Check if we already have a saved schedule
      const savedSchedule = localStorage.getItem('userSchedule');
      if (savedSchedule) {
        setSchedule(JSON.parse(savedSchedule));
        setLoading(false);
      } else {
        // Generate a new schedule if none exists
        setTimeout(() => {
          const generatedSchedule = generateOptimizedSchedule(userData);
          setSchedule(generatedSchedule);
          localStorage.setItem('userSchedule', JSON.stringify(generatedSchedule));
          setLoading(false);
        }, 2000); // Simulate loading time
      }
    } else {
      // If no user data, redirect to onboarding or show empty state
      setLoading(false);
    }
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
  const handleDrop = (e, day, timeIndex) => {
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
      
      // Update schedule
      setSchedule(newSchedule);
      localStorage.setItem('userSchedule', JSON.stringify(newSchedule));
    }
    
    // Reset drag state
    setDraggedItem(null);
    setDraggedOverDay(null);
    setDraggedOverTime(null);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
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
  const regenerateSchedule = () => {
    setLoading(true);
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const userData = JSON.parse(onboardingData);
      setTimeout(() => {
        const generatedSchedule = generateOptimizedSchedule(userData);
        setSchedule(generatedSchedule);
        localStorage.setItem('userSchedule', JSON.stringify(generatedSchedule));
        setLoading(false);
      }, 2000); // Simulate loading time
    } else {
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
  const exportScheduleAsPDF = () => {
    if (!schedule) return;
    
    try {
      // Get user name from localStorage
      const onboardingData = localStorage.getItem('onboardingData');
      const userData = onboardingData ? JSON.parse(onboardingData) : {};
      const userName = userData.nickname || 'Student';
      
      // Generate PDF with proper error handling
      console.log('Generating PDF for', userName);
      const pdfBlob = exportScheduleToPDF(schedule, userName);
      
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF: No blob returned');
      }
      
      console.log('PDF blob generated successfully:', pdfBlob);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AdaptIQ_Schedule_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      console.log('Download link created:', link.href);
      
      // Append to document, click, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000); // Increased timeout for better reliability
      
      // Prepare and save to Firebase (placeholder for future implementation)
      const firebaseSchedule = prepareScheduleForFirebase(schedule);
      saveScheduleToFirebase(firebaseSchedule, 'user123');
      
      // Hide export options after export
      setShowExportOptions(false);
      
      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('Error exporting schedule as PDF:', error);
      alert(`There was an error exporting your schedule as PDF: ${error.message}. Please try again.`);
    }
  };
  
  // Export schedule as ODF
  const exportScheduleAsODF = () => {
    if (!schedule) return;
    
    try {
      // Get user name from localStorage
      const onboardingData = localStorage.getItem('onboardingData');
      const userData = onboardingData ? JSON.parse(onboardingData) : {};
      const userName = userData.nickname || 'Student';
      
      // Generate ODF
      const odfBlob = exportScheduleToODF(schedule, userName);
      
      // Create download link
      const url = URL.createObjectURL(odfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AdaptIQ_Schedule_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.odt`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Prepare and save to Firebase (placeholder for future implementation)
      const firebaseSchedule = prepareScheduleForFirebase(schedule);
      saveScheduleToFirebase(firebaseSchedule, 'user123');
      
      // Hide export options after export
      setShowExportOptions(false);
    } catch (error) {
      console.error('Error exporting schedule as ODF:', error);
      alert('There was an error exporting your schedule as ODF. Please try again.');
    }
  };
  
  // Export schedule (main function that shows options)
  const exportSchedule = () => {
    toggleExportOptions();
  };

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
            {Object.keys(schedule).map(day => (
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