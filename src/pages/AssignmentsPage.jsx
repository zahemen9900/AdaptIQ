import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AssignmentsPage.css';
import Logo from '../assets/logo-white.png';
import { 
  IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, 
  IconClipboard, IconListDetails, IconFilter, IconSearch, IconChevronLeft, 
  IconChevronRight, IconCheck, IconPlus, IconArrowUpRight, IconX,
  IconLayoutGrid, IconAlertCircle, IconSparkles
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAssignments, 
  saveAssignments, 
  updateAssignmentStatus,
  updateAssignmentInFirestore,
  submitAssignmentToFirestore,
  groupAssignmentsByDate,
  generateCalendarDates,
  isSameDay,
  formatAssignmentDate,
  sortAssignments,
  getPriorityInfo,
  filterAssignments,
  fetchUserSubjects,
  selectSubjectsForAssignments,
  generateAssignmentsForSubjects,
  ensureUserHasAssignments
} from '../utils/assignmentsUtils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AssignmentSubmission from '../components/AssignmentSubmission/AssignmentSubmission';
import { auth, db } from '../../firebase';
import { doc, getDoc } from '@firebase/firestore';

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
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
          <h3>{title}</h3>
          <button className="close-modal-button" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>
        
        <div className="modal-content">
          <p>{message}</p>
        </div>
        
        <div className="modal-actions">
          <button className="modal-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-button primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Past Assignment Modal Component
const PastAssignmentModal = ({ isOpen, onClose, pastAssignments }) => {
  const [selectedPastAssignment, setSelectedPastAssignment] = useState(null);

  if (!isOpen) return null;
  
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="past-assignments-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="past-assignments-header">
          <h2>Past Assignments</h2>
          <button className="close-modal-button" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>
        
        <div className="past-assignments-content">
          <div className="past-assignments-list">
            {pastAssignments.length > 0 ? (
              pastAssignments.map(assignment => {
                const priorityInfo = getPriorityInfo(assignment.priority);
                return (
                  <div 
                    key={assignment.id}
                    className={`past-assignment-item ${selectedPastAssignment?.id === assignment.id ? 'active' : ''}`}
                    onClick={() => setSelectedPastAssignment(assignment)}
                  >
                    <div className="past-assignment-header">
                      <h3>{assignment.title}</h3>
                      <div className="assignment-badge status-badge">Completed</div>
                    </div>
                    <div className="past-assignment-meta">
                      <div className="meta-item">
                        <IconBook size={14} />
                        <span>{assignment.subject}</span>
                      </div>
                      <div className="meta-item">
                        <IconCalendar size={14} />
                        <span>{formatAssignmentDate(assignment.dueDate)}</span>
                      </div>
                      {assignment.submission?.submittedAt && (
                        <div className="meta-item">
                          <IconCheck size={14} />
                          <span>Submitted {new Date(assignment.submission.submittedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {assignment.submission?.grade && (
                        <div className="meta-item grade">
                          <span className="grade-pill">{assignment.submission.grade}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-past-assignments">
                <p>You haven't completed any assignments yet.</p>
              </div>
            )}
          </div>
          
          <div className="past-assignment-details">
            {selectedPastAssignment ? (
              <>
                <div className="past-details-header">
                  <h3>{selectedPastAssignment.title}</h3>
                  <div 
                    className="details-priority-badge"
                    style={{ 
                      color: getPriorityInfo(selectedPastAssignment.priority).color,
                      backgroundColor: getPriorityInfo(selectedPastAssignment.priority).bgColor
                    }}
                  >
                    {getPriorityInfo(selectedPastAssignment.priority).label}
                  </div>
                </div>
                
                <div className="past-details-content">
                  <div className="details-section">
                    <h4>Description</h4>
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedPastAssignment.description}
                      </ReactMarkdown>
                    </div>
                  </div>
                  
                  {selectedPastAssignment.submission && (
                    <>
                      <div className="details-section">
                        <div className="section-header">
                          <h4>Your Submission</h4>
                          <div className="submission-date">
                            {new Date(selectedPastAssignment.submission.submittedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {selectedPastAssignment.submission.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      
                      <div className="details-section">
                        <div className="section-header">
                          <h4>Feedback & Solution</h4>
                          <div className="grade-display">
                            Grade: <span className="grade-value">{selectedPastAssignment.submission.grade}</span>
                          </div>
                        </div>
                        <div className="markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {selectedPastAssignment.submission.feedback}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="no-selection">
                <p>Select an assignment from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AssignmentsPage = () => {
  // State for user info
  const [nickname, setNickname] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  
  // State for assignments and view settings
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar'
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [loading, setLoading] = useState(true); // Start with loading state active
  
  // New state for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // New state for assignment submission
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionAssignment, setSubmissionAssignment] = useState(null);
  
  // State for past assignments modal
  const [showPastAssignmentsModal, setShowPastAssignmentsModal] = useState(false);
  const [pastAssignments, setPastAssignments] = useState([]);
  
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

  // Fetch user data and load or generate assignments
  useEffect(() => {
    async function initializeAssignmentsPage() {
      try {
        setLoading(true);
        
        // Fetch user data from Firebase
        const userData = await fetchUserData();
        if (userData) {
          if (userData.nickname) setNickname(userData.nickname);
        }
        
        // Fetch user subjects from Firebase
        const userSubjects = await fetchUserSubjects();
        setSubjects(userSubjects);
        
        // Select up to 4 random subjects if more than 4 exist, otherwise use all
        const subjectsForAssignments = selectSubjectsForAssignments(userSubjects);
        setSelectedSubjects(subjectsForAssignments);
        
        // Check if there are existing assignments in Firestore
        const existingAssignments = await getAssignments();
        
        if (existingAssignments && existingAssignments.length > 0) {
          // Use existing assignments, but update their status based on due dates
          const updatedAssignments = existingAssignments.map(updateAssignmentStatus);
          setAssignments(updatedAssignments);
          setFilteredAssignments(sortAssignments(updatedAssignments, filters.sortBy));
          
          // Separate past assignments
          const completedAssignments = updatedAssignments.filter(a => a.status === 'completed');
          setPastAssignments(completedAssignments);
        } else {
          // Generate new assignments for selected subjects
          const newAssignments = await generateAssignmentsForSubjects(subjectsForAssignments);
          setAssignments(newAssignments);
          setFilteredAssignments(sortAssignments(newAssignments, filters.sortBy));
          
          // Save the newly generated assignments
          await saveAssignments(newAssignments);
        }
        
        // Ensure user has assignments due within the next week
        const updatedAssignments = await ensureUserHasAssignments();
        if (updatedAssignments && updatedAssignments.length > 0) {
          setAssignments(updatedAssignments);
          setFilteredAssignments(sortAssignments(updatedAssignments, filters.sortBy));
        }
        
        // Generate calendar dates for current month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const dates = generateCalendarDates(year, month);
        setCalendarDates(dates);
      } catch (error) {
        console.error("Error initializing assignments page:", error);
      } finally {
        setLoading(false);
      }
    }
    
    initializeAssignmentsPage();
  }, []);

  // Helper function to fetch user data from Firebase
  const fetchUserData = async () => {
    try {
      if (!auth.currentUser) return null;
      
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        console.warn("User document not found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

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
  const handleStatusChange = async (assignmentId, newStatus) => {
    // If the assignment is being marked as completed, show the submission form
    if (newStatus === 'completed') {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        setSubmissionAssignment(assignment);
        setShowSubmissionForm(true);
      }
      return;
    }
    
    // For other status changes, update directly
    const updatedAssignments = assignments.map(assignment => {
      if (assignment.id === assignmentId) {
        return { ...assignment, status: newStatus };
      }
      return assignment;
    });
    
    setAssignments(updatedAssignments);
    
    // Update in Firestore
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        await updateAssignmentInFirestore(assignmentId, { status: newStatus });
      }
      
      // Also save to local storage via the saveAssignments function
      await saveAssignments(updatedAssignments);
    } catch (error) {
      console.error("Error updating assignment status:", error);
    }
    
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

  // Generate new assignments
  const handleGenerateNewAssignments = async () => {
    setLoading(true);
    setShowConfirmModal(false); // Close confirmation modal
    
    try {
      // Get subjects from state
      const subjectsToUse = selectedSubjects.length > 0 ? selectedSubjects : subjects;
      
      if (subjectsToUse.length === 0) {
        console.warn("No subjects available for generating assignments");
        
        // If no subjects are available, set empty assignments list
        setAssignments([]);
        setFilteredAssignments([]);
        setLoading(false);
        return;
      }
      
      console.log("Generating assignments for subjects:", subjectsToUse);
      
      // Generate assignments for selected subjects (one per subject)
      const newAssignments = await generateAssignmentsForSubjects(subjectsToUse);
      
      // Save to Firestore and update assignments in state
      await saveAssignments(newAssignments);
      setAssignments(newAssignments);
      setFilteredAssignments(sortAssignments(newAssignments, filters.sortBy));
    } catch (error) {
      console.error("Error generating new assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle assignment submission
  const handleAssignmentSubmit = async (submissionData) => {
    try {
      // Submit the assignment to Firestore
      await submitAssignmentToFirestore(submissionData.assignmentId, {
        content: submissionData.submissionContent,
        feedback: submissionData.feedback,
        grade: submissionData.grade,
        submittedAt: new Date().toISOString()
      });
      
      // Update the assignment in local state
      const updatedAssignments = assignments.map(assignment => {
        if (assignment.id === submissionData.assignmentId) {
          return { 
            ...assignment, 
            status: 'completed',
            submission: {
              content: submissionData.submissionContent,
              feedback: submissionData.feedback,
              grade: submissionData.grade,
              submittedAt: new Date().toISOString()
            }
          };
        }
        return assignment;
      });
      
      // Update state
      setAssignments(updatedAssignments);
      
      // Update filtered assignments
      const filtered = filterAssignments(updatedAssignments, filters);
      const sorted = sortAssignments(filtered, filters.sortBy);
      setFilteredAssignments(sorted);
      
      // Close the submission form
      setShowSubmissionForm(false);
      setSubmissionAssignment(null);
      
      // If the same assignment was open in the details panel, update it
      if (selectedAssignment && selectedAssignment.id === submissionData.assignmentId) {
        const updatedAssignment = updatedAssignments.find(a => a.id === submissionData.assignmentId);
        setSelectedAssignment(updatedAssignment);
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      // Show error message to user
      alert("Failed to submit assignment. Please try again.");
    }
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
                onClick={() => setShowConfirmModal(true)}
              >
                <IconPlus size={20} />
                <span>New</span>
              </button>
              
              <button 
                className="past-assignments-button"
                onClick={() => setShowPastAssignmentsModal(true)}
              >
                <IconClipboard size={20} />
                <span>Past</span>
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
          {/* Loading Overlay */}
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner-container">
                <div className="loading-spinner-assignments"></div>
                <p>Generating AI assignments...</p>
              </div>
            </div>
          )}
          
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
                  <button className="create-assignment-button" onClick={handleGenerateNewAssignments}>
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
                  // const hasAssignments = dayAssignments.length > 0;
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
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selectedAssignment.description}
                    </ReactMarkdown>
                  </div>
                </div>
                
                {/* Display submission and feedback if available */}
                {selectedAssignment.submission && (
                  <div className="details-submission">
                    <h4>Submission</h4>
                    <div className="submission-info">
                      <div className="submission-grade">
                        <div 
                          className="grade-display"
                          style={{ 
                            backgroundColor: 
                              selectedAssignment.submission.grade >= 90 ? '#4caf50' :
                              selectedAssignment.submission.grade >= 70 ? '#8bc34a' :
                              selectedAssignment.submission.grade >= 60 ? '#ff9800' : '#f44336'
                          }}
                        >
                          {selectedAssignment.submission.grade}
                        </div>
                        <span>Grade</span>
                      </div>
                      <div className="submission-date">
                        <span>Submitted on:</span>
                        <span>{new Date(selectedAssignment.submission.submittedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                    
                    <div className="feedback-content">
                      <h4>Feedback</h4>
                      <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedAssignment.submission.feedback}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
                
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
                      disabled={selectedAssignment.status === 'completed'}
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
                
                {selectedAssignment.status !== 'completed' ? (
                  <button 
                    className="details-action-button primary"
                    onClick={() => handleStatusChange(selectedAssignment.id, 'completed')}
                  >
                    <IconFileUpload size={18} />
                    <span>Submit Solution</span>
                  </button>
                ) : (
                  <div className="completed-message">
                    <IconCheck size={18} />
                    <span>Completed</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Assignment Submission Modal */}
        <AnimatePresence>
          {showSubmissionForm && submissionAssignment && (
            <AssignmentSubmission
              assignment={submissionAssignment}
              onSubmit={handleAssignmentSubmit}
              onCancel={() => {
                setShowSubmissionForm(false);
                setSubmissionAssignment(null);
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Past Assignments Modal */}
        <PastAssignmentModal
          isOpen={showPastAssignmentsModal}
          onClose={() => setShowPastAssignmentsModal(false)}
          pastAssignments={pastAssignments}
        />
        
        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleGenerateNewAssignments}
          title="Generate New Assignments"
          message="This will generate new assignments for your selected subjects. Do you want to proceed?"
        />
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

const IconFileUpload = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <path d="M12 18v-6"></path>
    <path d="M8 15l4-4 4 4"></path>
  </svg>
);

export default AssignmentsPage;