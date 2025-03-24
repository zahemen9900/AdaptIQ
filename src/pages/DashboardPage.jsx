import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';
import Logo from '../assets/Logo.png';
import { IconCalendar, IconUser, IconBook, IconSettings } from '@tabler/icons-react';
import ScheduleGenerator from '../components/ScheduleGenerator/ScheduleGenerator';

const DashboardPage = () => {
  // Simulate user data from onboarding (in a real app, this would come from a database or context)
  const [userData, setUserData] = useState(null);
  
  // Simulate loading user data
  useEffect(() => {
    // In a real app, this would fetch from an API or local storage
    const mockUserData = {
      learningStyle: 'visual',
      studyEnvironment: 'quiet',
      preferredTime: 'evening',
      subjects: ['math', 'science', 'computer'],
      gradeLevel: 'college',
      courses: ['algebra', 'calculus', 'physics', 'programming'],
      availableDays: ['monday', 'wednesday', 'friday', 'saturday'],
      studyDuration: '45',
      breakFrequency: '15'
    };
    
    // Simulate API delay
    setTimeout(() => {
      setUserData(mockUserData);
    }, 1000);
  }, []);
  
  // Handle schedule completion
  const handleScheduleComplete = (schedule) => {
    console.log('Schedule saved:', schedule);
    // In a real app, this would save to a database
    alert('Your schedule has been saved!');
  };
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src={Logo} alt="AdaptIQ Logo" className="dashboard-logo" />
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            <IconCalendar size={24} />
            <span>Schedule</span>
          </Link>
          <Link to="/dashboard/courses" className="nav-item">
            <IconBook size={24} />
            <span>Courses</span>
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
          <h1>My Study Schedule</h1>
          <div className="user-profile">
            <span className="user-name">John Doe</span>
            <div className="user-avatar">JD</div>
          </div>
        </div>
        
        <div className="dashboard-main">
          {userData ? (
            <ScheduleGenerator 
              userData={userData} 
              onComplete={handleScheduleComplete} 
            />
          ) : (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;