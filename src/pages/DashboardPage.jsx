import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';
import Logo from '../assets/logo-white.png';
import { IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, IconClipboard, IconUsers } from '@tabler/icons-react';

const DashboardPage = () => {
  const [activeUsers] = useState(189);
  const [totalCourses] = useState(12);
  const [completionRate] = useState(78);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const { nickname } = JSON.parse(onboardingData);
      if (nickname) setNickname(nickname);
    }
  }, []);
  const [upcomingAssignments] = useState([
    { id: 1, title: 'Calculus Homework', course: 'Mathematics', dueDate: '2024-01-20' },
    { id: 2, title: 'Physics Lab Report', course: 'Physics', dueDate: '2024-01-22' },
    { id: 3, title: 'Programming Project', course: 'Computer Science', dueDate: '2024-01-25' }
  ]);

  const courseProgress = [
    { id: 1, name: 'Mathematics', progress: 85 },
    { id: 2, name: 'Physics', progress: 72 },
    { id: 3, name: 'Computer Science', progress: 90 },
    { id: 4, name: 'Chemistry', progress: 65 }
  ];
  
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
        <div className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <div className="user-profile">
            <span className="user-name">{nickname || 'Guest'}</span>
            <div className="user-avatar">{nickname ? nickname.substring(0, 2).toUpperCase() : 'G'}</div>
          </div>
        </div>
        
        <div className="dashboard-main">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Active Students</h3>
              <div className="stat-value">{activeUsers}</div>
              <div className="stat-label">Currently Online</div>
            </div>
            <div className="stat-card">
              <h3>Total Courses</h3>
              <div className="stat-value">{totalCourses}</div>
              <div className="stat-label">Enrolled</div>
            </div>
            <div className="stat-card">
              <h3>Completion Rate</h3>
              <div className="stat-value">{completionRate}%</div>
              <div className="stat-label">Average</div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card assignments-card">
              <h2>Upcoming Assignments</h2>
              <div className="assignments-list">
                {upcomingAssignments.map(assignment => (
                  <div key={assignment.id} className="assignment-item">
                    <div className="assignment-info">
                      <h4>{assignment.title}</h4>
                      <p>{assignment.course}</p>
                    </div>
                    <div className="assignment-due">Due: {assignment.dueDate}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-card progress-card">
              <h2>Course Progress</h2>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;