import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AssignmentsPage.css';
import Logo from '../assets/logo-white.png';
import { 
  IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, 
  IconClipboard, IconUsers, IconFilter, IconSearch, IconChevronLeft, 
  IconChevronRight, IconCheck, IconPlus, IconArrowUpRight, IconX,
  IconListDetails, IconLayoutGrid, IconAlertCircle, IconAdjustments
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAssignments, 
  saveAssignments, 
  ensureWeeklyAssignments, 
  updateAssignmentStatus,
  groupAssignmentsByDate,
  generateCalendarDates,
  isSameDay,
  formatAssignmentDate,
  sortAssignments,
  getPriorityInfo,
  filterAssignments,
  generateAssignmentWithGemini
} from '../utils/assignmentsUtils';

const AssignmentsPage = () => {
  // State for user info
  const [nickname, setNickname] = useState('');
  const [subjects, setSubjects] = useState([]);
  
  // State for assignments and view settings
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar'
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // State for calendar view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState([]);
  
  // State for filters
  const [filters, setFilters] = useState({
    status: 'all',
    subject: 'all',
    searchTerm: '',
    dateRange: null,
    sortBy: 'dueDate'
  });

  // Load user data and assignments
  useEffect(() => {
    // Get user data
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const userData = JSON.parse(onboardingData);
      if (userData.nickname) setNickname(userData.nickname);
      
      // Extract subjects from courses
      if (userData.courses && userData.courses.length > 0) {
        const extractedSubjects = userData.courses.map(courseId => {
          const parts = courseId.split('-');
          const subjectId = parts[0];
          
          // Map from subject IDs to subject names
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
          
          return subjectMap[subjectId] || 'General';
        });
        
        // Remove duplicates
        const uniqueSubjects = [...new Set(extractedSubjects)];
        setSubjects(uniqueSubjects);
        
        // Ensure weekly assignments for each subject
        const updatedAssignments = ensureWeeklyAssignments(uniqueSubjects);
        setAssignments(updatedAssignments);
        setFilteredAssignments(sortAssignments(updatedAssignments, filters.sortBy));
      }
    }
    
    // If no subjects were found, use some defaults for demo purposes
    if (!subjects || subjects.length === 0) {
      const defaultSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Programming', 'History'];
      setSubjects(defaultSubjects);
      
      // Generate default assignments
      const defaultAssignments = ensureWeeklyAssignments(defaultSubjects);
      setAssignments(defaultAssignments);
      setFilteredAssignments(sortAssignments(defaultAssignments, filters.sortBy));
    }
    
    // Generate calendar dates for the current month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dates = generateCalendarDates(year, month);
    setCalendarDates(dates);
  }, []);

  // Update filtered assignments when filters change
  useEffect(() => {
    if (assignments.length > 0) {
      const filtered = filterAssignments(assignments, filters);
      const sorted = sortAssignments(filtered, filters.sortBy);
      setFilteredAssignments(sorted);
    }
  }, [filters, assignments]);

  // Update calendar dates when current date changes
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dates = generateCalendarDates(year, month);
    setCalendarDates(dates);
  }, [currentDate]);

  // Handle assignment status update
  const handleStatusChange = (assignmentId, newStatus) => {
    const updatedAssignments = assignments.map(assignment => {
      if (assignment.id === assignmentId) {
        return { ...assignment, status: newStatus };
      }
      return assignment;
    });
    
    setAssignments(updatedAssignments);
    saveAssignments(updatedAssignments);
    
    // If viewing assignment details, update the selected assignment
    if (selectedAssignment && selectedAssignment.id === assignmentId) {
      setSelectedAssignment({ ...selectedAssignment, status: newStatus });
    }
  };

  // Handle month change in calendar view
  const handleMonthChange = (increment) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  // View assignment details
  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDetails(true);
  };

  // Close details panel
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedAssignment(null);
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Toggle filter menu
  const handleToggleFilterMenu = () => {
    setShowFilterMenu(prev => !prev);
  };

  // Group assignments by date for the calendar view
  const assignmentsByDate = groupAssignmentsByDate(filteredAssignments);

  // Generate a new assignment (to be connected to Gemini API)
  const handleGenerateNewAssignment = async () => {
    if (subjects.length === 0) return;
    
    // For now, just use the first subject. In a real implementation,
    // you would let the user select a subject
    const subject = subjects[0];
    
    // This would call the Gemini API in the future
    const newAssignment = await generateAssignmentWithGemini(subject, 'recent topics');
    
    const updatedAssignments = [...assignments, newAssignment];
    setAssignments(updatedAssignments);
    saveAssignments(updatedAssignments);
  };

  // Format month name for display
  const formatMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <motion.div
      className="dashboard-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
          <Link to="/dashboard/assignments" className="nav-item active">
            <IconClipboard size={24} />
            <span>Assignments</span>
          </Link>
          <Link to="/dashboard/schedule" className="nav-item">
            <IconCalendar size={24} />
            <span>Schedule</span>
          </Link>
          <Link to="/dashboard/study-groups" className="nav-item">
            <IconUsers size={24} />
            <span>Study Groups</span>
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
        <div className="dashboard-header assignments-header">
          <h1>Assignments</h1>
          
          <div className="header-actions">
            <div className="view-toggle">
              <button 
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <IconListDetails size={20} />
                <span>List</span>
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                <IconLayoutGrid size={20} />
                <span>Calendar</span>
              </button>
            </div>
            
            <div className="filter-controls">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search assignments..." 
                  className="search-input"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </div>
              
              <button 
                className={`filter-button ${showFilterMenu ? 'active' : ''}`}
                onClick={handleToggleFilterMenu}
              >
                <IconFilter size={20} />
                <span>Filter</span>
              </button>
              
              <button 
                className="new-assignment-button"
                onClick={handleGenerateNewAssignment}
              >
                <IconPlus size={20} />
                <span>New</span>
              </button>
            </div>
            
            <div className="user-profile">
              <span className="user-name">{nickname || 'Guest'}</span>
              <div className="user-avatar">{nickname ? nickname.substring(0, 2).toUpperCase() : 'G'}</div>
            </div>
          </div>
        </div>
        
        {/* Filter Menu */}
        <AnimatePresence>
          {showFilterMenu && (
            <motion.div 
              className="filter-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="filter-group">
                <label>Status</label>
                <div className="filter-options">
                  <button 
                    className={`filter-option ${filters.status === 'all' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('status', 'all')}
                  >
                    All
                  </button>
                  <button 
                    className={`filter-option ${filters.status === 'pending' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('status', 'pending')}
                  >
                    Pending
                  </button>
                  <button 
                    className={`filter-option ${filters.status === 'in-progress' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('status', 'in-progress')}
                  >
                    In Progress
                  </button>
                  <button 
                    className={`filter-option ${filters.status === 'completed' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('status', 'completed')}
                  >
                    Completed
                  </button>
                  <button 
                    className={`filter-option ${filters.status === 'overdue' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('status', 'overdue')}
                  >
                    Overdue
                  </button>
                </div>
              </div>
              
              <div className="filter-group">
                <label>Subject</label>
                <div className="filter-options subject-options">
                  <button 
                    className={`filter-option ${filters.subject === 'all' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('subject', 'all')}
                  >
                    All Subjects
                  </button>
                  
                  {subjects.map(subject => (
                    <button 
                      key={subject}
                      className={`filter-option ${filters.subject === subject ? 'active' : ''}`}
                      onClick={() => handleFilterChange('subject', subject)}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="filter-group">
                <label>Sort By</label>
                <div className="filter-options">
                  <button 
                    className={`filter-option ${filters.sortBy === 'dueDate' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('sortBy', 'dueDate')}
                  >
                    Due Date
                  </button>
                  <button 
                    className={`filter-option ${filters.sortBy === 'priority' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('sortBy', 'priority')}
                  >
                    Priority
                  </button>
                  <button 
                    className={`filter-option ${filters.sortBy === 'subject' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('sortBy', 'subject')}
                  >
                    Subject
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Assignments Content */}
        <div className="assignments-content">
          {/* List View */}
          {viewMode === 'list' && (
            <div className="assignments-list-view">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map(assignment => {
                  const priorityInfo = getPriorityInfo(assignment.priority);
                  
                  return (
                    <motion.div 
                      key={assignment.id}
                      className={`assignment-card status-${assignment.status}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleViewDetails(assignment)}
                    >
                      <div className="assignment-priority" style={{ backgroundColor: priorityInfo.color }}></div>
                      <div className="assignment-content">
                        <div className="assignment-header">
                          <h3>{assignment.title}</h3>
                          <div 
                            className="priority-badge"
                            style={{ 
                              color: priorityInfo.color,
                              backgroundColor: priorityInfo.bgColor
                            }}
                          >
                            {priorityInfo.label}
                          </div>
                        </div>
                        
                        <div className="assignment-details">
                          <div className="assignment-subject">
                            <IconBook size={16} />
                            <span>{assignment.subject}</span>
                          </div>
                          <div className="assignment-due-date">
                            <IconCalendar size={16} />
                            <span>{formatAssignmentDate(assignment.dueDate)}</span>
                          </div>
                          <div className="assignment-time">
                            <IconClock size={16} />
                            <span>{assignment.estimatedMinutes} min</span>
                          </div>
                        </div>
                        
                        <p className="assignment-description">
                          {assignment.description.length > 120 ? 
                            `${assignment.description.substring(0, 120)}...` : 
                            assignment.description}
                        </p>
                        
                        <div className="assignment-actions">
                          <div className="assignment-status">
                            <span>Status:</span>
                            <select 
                              value={assignment.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStatusChange(assignment.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                          
                          <button 
                            className="view-details-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(assignment);
                            }}
                          >
                            <IconArrowUpRight size={16} />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="no-assignments">
                  <IconClipboard size={48} />
                  <h3>No assignments found</h3>
                  <p>Try adjusting your filters or create a new assignment.</p>
                  <button className="create-assignment-button" onClick={handleGenerateNewAssignment}>
                    <IconPlus size={20} />
                    <span>Create Assignment</span>
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <div className="calendar-view">
              <div className="calendar-header">
                <button className="month-nav-button" onClick={() => handleMonthChange(-1)}>
                  <IconChevronLeft size={20} />
                </button>
                <h2>{formatMonthName(currentDate)}</h2>
                <button className="month-nav-button" onClick={() => handleMonthChange(1)}>
                  <IconChevronRight size={20} />
                </button>
              </div>
              
              <div className="calendar-weekdays">
                <div className="weekday">Sun</div>
                <div className="weekday">Mon</div>
                <div className="weekday">Tue</div>
                <div className="weekday">Wed</div>
                <div className="weekday">Thu</div>
                <div className="weekday">Fri</div>
                <div className="weekday">Sat</div>
              </div>
              
              <div className="calendar-grid">
                {calendarDates.map((day, index) => {
                  const dateKey = day.date.toISOString().split('T')[0];
                  const dayAssignments = assignmentsByDate[dateKey] || [];
                  const hasAssignments = dayAssignments.length > 0;
                  const hasOverdue = dayAssignments.some(a => a.status === 'overdue');
                  const hasDueToday = dayAssignments.some(a => a.priority === 4); // Due today
                  
                  return (
                    <div 
                      key={index} 
                      className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}`}
                    >
                      <div className="day-header">
                        <span className="day-number">{day.day}</span>
                        {hasOverdue && (
                          <div className="day-alert overdue">
                            <IconAlertCircle size={16} />
                          </div>
                        )}
                        {!hasOverdue && hasDueToday && (
                          <div className="day-alert due-today">
                            <IconAlertCircle size={16} />
                          </div>
                        )}
                      </div>
                      
                      <div className="day-assignments">
                        {dayAssignments.slice(0, 3).map(assignment => (
                          <div 
                            key={assignment.id}
                            className={`day-assignment status-${assignment.status}`}
                            onClick={() => handleViewDetails(assignment)}
                          >
                            <div 
                              className="assignment-indicator"
                              style={{ backgroundColor: getPriorityInfo(assignment.priority).color }}
                            ></div>
                            <span className="assignment-title">{assignment.title}</span>
                          </div>
                        ))}
                        
                        {dayAssignments.length > 3 && (
                          <div className="more-assignments">
                            +{dayAssignments.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Assignment Details Panel */}
        <AnimatePresence>
          {showDetails && selectedAssignment && (
            <motion.div 
              className="assignment-details-panel"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="details-header">
                <button className="close-details-button" onClick={handleCloseDetails}>
                  <IconX size={20} />
                </button>
                <h2>Assignment Details</h2>
              </div>
              
              <div className="details-content">
                <div 
                  className="details-priority-badge"
                  style={{ 
                    color: getPriorityInfo(selectedAssignment.priority).color,
                    backgroundColor: getPriorityInfo(selectedAssignment.priority).bgColor
                  }}
                >
                  {getPriorityInfo(selectedAssignment.priority).label}
                </div>
                
                <h3>{selectedAssignment.title}</h3>
                
                <div className="details-meta">
                  <div className="meta-item">
                    <IconBook size={18} />
                    <span>{selectedAssignment.subject}</span>
                  </div>
                  <div className="meta-item">
                    <IconCalendar size={18} />
                    <span>{formatAssignmentDate(selectedAssignment.dueDate)}</span>
                  </div>
                  <div className="meta-item">
                    <IconClock size={18} />
                    <span>{selectedAssignment.estimatedMinutes} minutes</span>
                  </div>
                </div>
                
                <div className="details-description">
                  <h4>Description</h4>
                  <p>{selectedAssignment.description}</p>
                </div>
                
                {selectedAssignment.resources && selectedAssignment.resources.length > 0 && (
                  <div className="details-resources">
                    <h4>Resources</h4>
                    <div className="resources-list">
                      {selectedAssignment.resources.map(resource => (
                        <div key={resource.id} className={`resource-item type-${resource.type}`}>
                          <div className="resource-icon">
                            {resource.type === 'reading' && <IconBook size={18} />}
                            {resource.type === 'video' && <IconVideo size={18} />}
                            {resource.type === 'practice' && <IconNotebook size={18} />}
                          </div>
                          <div className="resource-content">
                            <h5>{resource.title}</h5>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              View Resource
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="details-status">
                  <h4>Status</h4>
                  <div className="status-options">
                    <button 
                      className={`status-option ${selectedAssignment.status === 'pending' ? 'active' : ''}`}
                      onClick={() => handleStatusChange(selectedAssignment.id, 'pending')}
                    >
                      <span className="status-icon"></span>
                      <span>Pending</span>
                    </button>
                    <button 
                      className={`status-option ${selectedAssignment.status === 'in-progress' ? 'active' : ''}`}
                      onClick={() => handleStatusChange(selectedAssignment.id, 'in-progress')}
                    >
                      <span className="status-icon"></span>
                      <span>In Progress</span>
                    </button>
                    <button 
                      className={`status-option ${selectedAssignment.status === 'completed' ? 'active' : ''}`}
                      onClick={() => handleStatusChange(selectedAssignment.id, 'completed')}
                    >
                      <span className="status-icon"></span>
                      <span>Completed</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="details-actions">
                <button className="details-action-button secondary">
                  <IconCalendar size={18} />
                  <span>Add to Calendar</span>
                </button>
                <button 
                  className="details-action-button primary"
                  onClick={() => handleStatusChange(selectedAssignment.id, 'completed')}
                >
                  <IconCheck size={18} />
                  <span>Mark as Completed</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Icons for details panel (not imported above)
const IconClock = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const IconVideo = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>
);

const IconNotebook = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

export default AssignmentsPage;