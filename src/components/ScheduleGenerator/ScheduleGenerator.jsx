import { useState, useEffect } from 'react';
import './ScheduleGenerator.css';
import { IconCalendarTime, IconDragDrop, IconEdit, IconCheck } from '@tabler/icons-react';
import { generateOptimizedSchedule } from '../../utils/scheduleAlgorithm';

const ScheduleGenerator = ({ userData, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverDay, setDraggedOverDay] = useState(null);
  const [draggedOverTime, setDraggedOverTime] = useState(null);

  // Generate schedule based on user data
  useEffect(() => {
    const generateSchedule = () => {
      // Simulate loading time
      setTimeout(() => {
        const generatedSchedule = generateOptimizedSchedule(userData);
        setSchedule(generatedSchedule);
        setLoading(false);
      }, 3000); // 3 seconds loading animation
    };

    generateSchedule();
  }, [userData]);

  // Helper functions moved to scheduleAlgorithm.js utility file

  // Helper functions moved to scheduleAlgorithm.js utility file

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

  // Save schedule and complete onboarding
  const saveSchedule = () => {
    if (onComplete) {
      onComplete(schedule);
    }
  };

  if (loading) {
    return (
      <div className="schedule-generator-loading">
        <div className="loading-animation">
          <IconCalendarTime size={64} className="loading-icon" />
          <div className="loading-spinner"></div>
        </div>
        <h2>Generating your personalized study schedule...</h2>
        <p>We're creating a schedule tailored to your learning preferences and availability.</p>
      </div>
    );
  }

  return (
    <div className="schedule-generator">
      <div className="schedule-header">
        <h2>Your Personalized Study Schedule</h2>
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
          <button className="save-button" onClick={saveSchedule}>
            Save Schedule
          </button>
        </div>
      </div>
      
      {editMode && (
        <div className="edit-instructions">
          <IconDragDrop size={24} />
          <p>Drag and drop study sessions to rearrange your schedule</p>
        </div>
      )}
      
      <div className="schedule-calendar">
        {Object.keys(schedule).map(day => (
          <div key={day} className="calendar-day">
            <div className="day-header">{day}</div>
            <div className="day-sessions">
              {schedule[day].length > 0 ? (
                schedule[day].map((session, index) => (
                  <div 
                    key={session.id}
                    className={`session-card ${draggedItem?.id === session.id ? 'dragging' : ''} ${draggedOverDay === day && draggedOverTime === index ? 'drag-over' : ''}`}
                    draggable={editMode}
                    onDragStart={(e) => editMode && handleDragStart(e, session)}
                    onDragOver={(e) => editMode && handleDragOver(e, day, index)}
                    onDrop={(e) => editMode && handleDrop(e, day, index)}
                  >
                    <div className="session-time">
                      {session.startTime} - {session.endTime}
                    </div>
                    <div className="session-course">{session.course}</div>
                  </div>
                ))
              ) : (
                <div className="no-sessions">No study sessions scheduled</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleGenerator;