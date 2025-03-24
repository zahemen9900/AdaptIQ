import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './OnboardingPage.css';
import Logo from '../assets/Logo.png';
import { IconArrowRight, IconArrowLeft, IconBulb, IconBook, IconCalendar, IconSchool } from '@tabler/icons-react';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Learning preferences
    learningStyle: '',
    studyEnvironment: '',
    preferredTime: '',
    
    // Subjects
    subjects: [],
    gradeLevel: '',
    
    // Courses
    courses: [],
    
    // Schedule
    availableDays: [],
    studyDuration: '',
    breakFrequency: ''
  });

  const learningStyles = [
    { id: 'visual', label: 'Visual', description: 'Learn best through images, diagrams, and videos' },
    { id: 'auditory', label: 'Auditory', description: 'Learn best through listening and discussions' },
    { id: 'reading', label: 'Reading/Writing', description: 'Learn best through reading and taking notes' },
    { id: 'kinesthetic', label: 'Kinesthetic', description: 'Learn best through hands-on activities and practice' }
  ];

  const subjects = [
    { id: 'math', label: 'Mathematics' },
    { id: 'science', label: 'Science' },
    { id: 'history', label: 'History' },
    { id: 'language', label: 'Language Arts' },
    { id: 'foreign', label: 'Foreign Languages' },
    { id: 'computer', label: 'Computer Science' }
  ];

  // Available courses for each subject
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
    ]
  };

  const weekdays = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];

  const handleLearningStyleChange = (styleId) => {
    setFormData({
      ...formData,
      learningStyle: styleId
    });
  };

  const handleSubjectToggle = (subjectId) => {
    const updatedSubjects = formData.subjects.includes(subjectId)
      ? formData.subjects.filter(id => id !== subjectId)
      : [...formData.subjects, subjectId];
    
    setFormData({
      ...formData,
      subjects: updatedSubjects
    });
  };

  const handleCourseToggle = (courseId) => {
    const updatedCourses = formData.courses.includes(courseId)
      ? formData.courses.filter(id => id !== courseId)
      : [...formData.courses, courseId];
    
    setFormData({
      ...formData,
      courses: updatedCourses
    });
  };

  const handleDayToggle = (dayId) => {
    const updatedDays = formData.availableDays.includes(dayId)
      ? formData.availableDays.filter(id => id !== dayId)
      : [...formData.availableDays, dayId];
    
    setFormData({
      ...formData,
      availableDays: updatedDays
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateStep = (currentStep) => {
    switch(currentStep) {
      case 1:
        return formData.learningStyle && formData.studyEnvironment && formData.preferredTime;
      case 2:
        return formData.subjects.length > 0 && formData.gradeLevel;
      case 3:
        return formData.courses.length > 0;
      case 4:
        return formData.availableDays.length > 0 && formData.studyDuration && formData.breakFrequency;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      alert('Please complete all required fields before proceeding.');
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Onboarding data:', formData);
    // Navigate to dashboard after completing onboarding
    navigate('/dashboard');
  };

  const renderStepIndicator = () => {
    return (
      <div className="step-indicator">
        <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
        <div className="step-line"></div>
        <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
        <div className="step-line"></div>
        <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
        <div className="step-line"></div>
        <div className={`step-dot ${step >= 4 ? 'active' : ''}`}></div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <div className="step-header">
              <IconBulb size={32} className="step-icon" />
              <h2>How do you learn best?</h2>
              <p className="step-description">Select your preferred learning style to help us personalize your experience</p>
            </div>
            
            <div className="learning-styles-grid">
              {learningStyles.map(style => (
                <div 
                  key={style.id}
                  className={`learning-style-card ${formData.learningStyle === style.id ? 'selected' : ''}`}
                  onClick={() => handleLearningStyleChange(style.id)}
                >
                  <h3>{style.label}</h3>
                  <p>{style.description}</p>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="studyEnvironment">Preferred Study Environment</label>
              <select 
                id="studyEnvironment" 
                name="studyEnvironment" 
                value={formData.studyEnvironment}
                onChange={handleInputChange}
                required
              >
                <option value="">Select an option</option>
                <option value="quiet">Quiet space</option>
                <option value="background">With background noise</option>
                <option value="music">With music</option>
                <option value="group">Group study</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="preferredTime">Best Time to Study</label>
              <select 
                id="preferredTime" 
                name="preferredTime" 
                value={formData.preferredTime}
                onChange={handleInputChange}
                required
              >
                <option value="">Select an option</option>
                <option value="morning">Early morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="night">Late night</option>
              </select>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="step-content">
            <div className="step-header">
              <IconBook size={32} className="step-icon" />
              <h2>What subjects are you studying?</h2>
              <p className="step-description">Select the subjects you want help with</p>
            </div>
            
            <div className="subjects-grid">
              {subjects.map(subject => (
                <div 
                  key={subject.id}
                  className={`subject-card ${formData.subjects.includes(subject.id) ? 'selected' : ''}`}
                  onClick={() => handleSubjectToggle(subject.id)}
                >
                  <h3>{subject.label}</h3>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="gradeLevel">Your Grade Level</label>
              <select 
                id="gradeLevel" 
                name="gradeLevel" 
                value={formData.gradeLevel}
                onChange={handleInputChange}
                required
              >
                <option value="">Select your grade</option>
                <option value="middle">Middle School</option>
                <option value="high">High School</option>
                <option value="college">College/University</option>
                <option value="graduate">Graduate School</option>
                <option value="professional">Professional Development</option>
              </select>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="step-content">
            <div className="step-header">
              <IconSchool size={32} className="step-icon" />
              <h2>Select your courses</h2>
              <p className="step-description">Choose the specific courses you want to study</p>
            </div>
            
            <div className="subjects-grid">
              {formData.subjects.map(subjectId => {
                const subjectCourses = coursesBySubject[subjectId] || [];
                return (
                  <div key={subjectId} className="subject-courses-container">
                    <h3 className="subject-title">{subjects.find(s => s.id === subjectId)?.label}</h3>
                    <div className="courses-grid">
                      {subjectCourses.map(course => (
                        <div 
                          key={course.id}
                          className={`subject-card ${formData.courses.includes(course.id) ? 'selected' : ''}`}
                          onClick={() => handleCourseToggle(course.id)}
                        >
                          <h3>{course.label}</h3>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="step-content">
            <div className="step-header">
              <IconCalendar size={32} className="step-icon" />
              <h2>Create your study schedule</h2>
              <p className="step-description">Let us know when you're available to study</p>
            </div>
            
            <div className="days-grid">
              {weekdays.map(day => (
                <div 
                  key={day.id}
                  className={`day-card ${formData.availableDays.includes(day.id) ? 'selected' : ''}`}
                  onClick={() => handleDayToggle(day.id)}
                >
                  <h3>{day.label}</h3>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="studyDuration">Preferred Study Session Length</label>
              <select 
                id="studyDuration" 
                name="studyDuration" 
                value={formData.studyDuration}
                onChange={handleInputChange}
                required
              >
                <option value="">Select duration</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2+ hours</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="breakFrequency">Break Frequency</label>
              <select 
                id="breakFrequency" 
                name="breakFrequency" 
                value={formData.breakFrequency}
                onChange={handleInputChange}
                required
              >
                <option value="">Select frequency</option>
                <option value="10">Every 10 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="25">Every 25 minutes (Pomodoro)</option>
                <option value="30">Every 30 minutes</option>
                <option value="45">Every 45 minutes</option>
                <option value="60">Every hour</option>
              </select>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <Link to="/" className="logo-link">
            <img src={Logo} alt="AdaptIQ Logo" className="onboarding-logo" />
          </Link>
          {renderStepIndicator()}
        </div>

        <form onSubmit={step === 4 ? handleSubmit : e => e.preventDefault()}>
          {renderStepContent()}

          <div className="onboarding-buttons">
            {step > 1 && (
              <button type="button" className="back-button" onClick={prevStep}>
                <IconArrowLeft size={20} /> Back
              </button>
            )}
            
            {step < 4 ? (
              <button type="button" className="next-button" onClick={nextStep}>
                Next <IconArrowRight size={20} />
              </button>
            ) : (
              <button type="submit" className="finish-button">
                Finish <IconArrowRight size={20} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;