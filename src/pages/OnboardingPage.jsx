import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './OnboardingPage.css';
import Logo from '../assets/Logo.png';
import { IconArrowRight, IconArrowLeft, IconBulb, IconBook, IconCalendar, IconSchool, IconUser } from '@tabler/icons-react';
import ScheduleGenerator from '../components/ScheduleGenerator/ScheduleGenerator';
import { auth, updateUserData } from '../../firebase';

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
    customSubject: '',
    
    // Courses
    courses: [],
    customCourses: {},
    
    // Schedule
    availableDays: [],
    studyDuration: '',
    breakFrequency: '',
    schedulingStyle: '', // 'casual' or 'focused'
    
    // User information
    nickname: '',
    dateOfBirth: '',
    goals: ''
  });
  
  // State for generated schedule
  const [generatedSchedule, setGeneratedSchedule] = useState(null);

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
    { id: 'computer', label: 'Computer Science' },
    { id: 'art', label: 'Art & Design' },
    { id: 'music', label: 'Music' },
    { id: 'physical', label: 'Physical Education' },
    { id: 'economics', label: 'Economics' },
    { id: 'psychology', label: 'Psychology' },
    { id: 'engineering', label: 'Engineering' },
    { id: 'other', label: 'Other' }
  ];

  // Available courses for each subject
  const coursesBySubject = {
    math: [
      { id: 'algebra', label: 'Algebra' },
      { id: 'geometry', label: 'Geometry' },
      { id: 'calculus', label: 'Calculus' },
      { id: 'statistics', label: 'Statistics' },
      { id: 'trigonometry', label: 'Trigonometry' },
      { id: 'other', label: 'Other' }
    ],
    science: [
      { id: 'biology', label: 'Biology' },
      { id: 'chemistry', label: 'Chemistry' },
      { id: 'physics', label: 'Physics' },
      { id: 'environmental', label: 'Environmental Science' },
      { id: 'astronomy', label: 'Astronomy' },
      { id: 'other', label: 'Other' }
    ],
    history: [
      { id: 'world', label: 'World History' },
      { id: 'us', label: 'US History' },
      { id: 'european', label: 'European History' },
      { id: 'ancient', label: 'Ancient Civilizations' },
      { id: 'modern', label: 'Modern History' },
      { id: 'other', label: 'Other' }
    ],
    language: [
      { id: 'composition', label: 'Composition' },
      { id: 'literature', label: 'Literature' },
      { id: 'grammar', label: 'Grammar' },
      { id: 'creative', label: 'Creative Writing' },
      { id: 'speech', label: 'Speech & Debate' },
      { id: 'other', label: 'Other' }
    ],
    foreign: [
      { id: 'spanish', label: 'Spanish' },
      { id: 'french', label: 'French' },
      { id: 'german', label: 'German' },
      { id: 'chinese', label: 'Chinese' },
      { id: 'japanese', label: 'Japanese' },
      { id: 'other', label: 'Other' }
    ],
    computer: [
      { id: 'programming', label: 'Programming' },
      { id: 'webdev', label: 'Web Development' },
      { id: 'database', label: 'Database Systems' },
      { id: 'ai', label: 'Artificial Intelligence' },
      { id: 'cybersecurity', label: 'Cybersecurity' },
      { id: 'other', label: 'Other' }
    ],
    engineering: [
      { id: 'mechanical', label: 'Mechanical Engineering' },
      { id: 'electrical', label: 'Electrical Engineering' },
      { id: 'civil', label: 'Civil Engineering' },
      { id: 'chemical', label: 'Chemical Engineering' },
      { id: 'software', label: 'Software Engineering' },
      { id: 'other', label: 'Other' }
    ],
    economics: [
      { id: 'micro', label: 'Microeconomics' },
      { id: 'macro', label: 'Macroeconomics' },
      { id: 'international', label: 'International Economics' },
      { id: 'business', label: 'Business Economics' },
      { id: 'finance', label: 'Financial Economics' },
      { id: 'other', label: 'Other' }
    ],
    psychology: [
      { id: 'clinical', label: 'Clinical Psychology' },
      { id: 'cognitive', label: 'Cognitive Psychology' },
      { id: 'developmental', label: 'Developmental Psychology' },
      { id: 'social', label: 'Social Psychology' },
      { id: 'abnormal', label: 'Abnormal Psychology' },
      { id: 'other', label: 'Other' }
    ],
    art: [
      { id: 'drawing', label: 'Drawing' },
      { id: 'painting', label: 'Painting' },
      { id: 'sculpture', label: 'Sculpture' },
      { id: 'digital', label: 'Digital Art' },
      { id: 'other', label: 'Other' }
    ],
    music: [
      { id: 'theory', label: 'Music Theory' },
      { id: 'instrumental', label: 'Instrumental' },
      { id: 'vocal', label: 'Vocal' },
      { id: 'composition', label: 'Composition' },
      { id: 'other', label: 'Other' }
    ],
    physical: [
      { id: 'fitness', label: 'Fitness' },
      { id: 'sports', label: 'Sports' },
      { id: 'nutrition', label: 'Nutrition' },
      { id: 'wellness', label: 'Wellness' },
      { id: 'other', label: 'Other' }
    ],
    other: [
      { id: 'other', label: 'Other' }
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
    // If this is the 'other' subject, we don't want to remove it when clicked again
    if (subjectId === 'other' && formData.subjects.includes('other')) {
      return;
    }
    
    const updatedSubjects = formData.subjects.includes(subjectId)
      ? formData.subjects.filter(id => id !== subjectId)
      : [...formData.subjects, subjectId];
    
    setFormData({
      ...formData,
      subjects: updatedSubjects
    });
  };
  
  const handleCustomSubjectChange = (e) => {
    const { value } = e.target;
    
    setFormData({
      ...formData,
      customSubject: value
    });
  };

  const handleCourseToggle = (courseId, subjectId) => {
    // Track selected courses by subject
    const courseKey = `${subjectId}-${courseId}`;
    
    // Check if this course is already selected for this subject
    const isSelected = formData.courses.includes(courseKey);
    
    // Update the courses array
    const updatedCourses = isSelected
      ? formData.courses.filter(id => id !== courseKey)
      : [...formData.courses, courseKey];
    
    setFormData({
      ...formData,
      courses: updatedCourses
    });
  };
  
  const handleCustomCourseChange = (e, subjectId) => {
    const { value } = e.target;
    
    setFormData({
      ...formData,
      customCourses: {
        ...formData.customCourses,
        [subjectId]: value
      }
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
        return formData.availableDays.length > 0 && formData.studyDuration && formData.breakFrequency && formData.schedulingStyle;
      case 5:
        return formData.nickname && formData.goals;
      case 6:
        return true; // Schedule generator step doesn't need validation
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Onboarding data:', formData); 
    const response = await updateUserData(auth.currentUser.uid, formData);
    console.log("response: "+response);
    // Save onboarding data to localStorage
    localStorage.setItem('onboardingData', JSON.stringify(formData));
    // Navigate to loading page after completing onboarding
    navigate('/loading');
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
        <div className="step-line"></div>
        <div className={`step-dot ${step >= 5 ? 'active' : ''}`}></div>
        <div className="step-line"></div>
        <div className={`step-dot ${step >= 6 ? 'active' : ''}`}></div>
      </div>
    );
  };

  // Handle schedule completion
  const handleScheduleComplete = (schedule) => {
    console.log('Schedule saved:', schedule);
    navigate('/dashboard');
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
            
            {formData.subjects.includes('other') && (
              <div className="form-group custom-subject-input">
                <label htmlFor="customSubject">Enter your custom subject</label>
                <input 
                  type="text" 
                  id="customSubject" 
                  name="customSubject" 
                  value={formData.customSubject}
                  onChange={handleCustomSubjectChange}
                  placeholder="Enter your subject"
                  required
                />
              </div>
            )}

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
                // If this is the 'other' subject and we have a custom subject name
                if (subjectId === 'other' && formData.customSubject) {
                  return (
                    <div key={subjectId} className="subject-courses-container">
                      <h3 className="subject-title">{formData.customSubject}</h3>
                      <div className="form-group custom-course-input">
                        <label htmlFor={`customCourse-${subjectId}`}>Enter your custom course</label>
                        <input 
                          type="text" 
                          id={`customCourse-${subjectId}`} 
                          value={formData.customCourses[subjectId] || ''}
                          onChange={(e) => handleCustomCourseChange(e, subjectId)}
                          placeholder="Enter your course"
                          required
                        />
                      </div>
                    </div>
                  );
                }
                
                const subjectCourses = coursesBySubject[subjectId] || [];
                const subjectLabel = subjectId === 'other' ? formData.customSubject : subjects.find(s => s.id === subjectId)?.label;
                
                return (
                  <div key={subjectId} className="subject-courses-container">
                    <h3 className="subject-title">{subjectLabel}</h3>
                    <div className="courses-grid">
                      {subjectCourses.filter(course => course.id !== 'other').map(course => (
                        <div 
                          key={course.id}
                          className={`subject-card ${formData.courses.includes(`${subjectId}-${course.id}`) ? 'selected' : ''}`}
                          onClick={() => handleCourseToggle(course.id, subjectId)}
                        >
                          <h3>{course.label}</h3>
                        </div>
                      ))}
                      
                      {/* Add 'Other' option separately */}
                      <div 
                        key={`other-${subjectId}`}
                        className={`subject-card ${formData.courses.includes(`${subjectId}-other`) ? 'selected' : ''}`}
                        onClick={() => handleCourseToggle('other', subjectId)}
                      >
                        <h3>Other</h3>
                      </div>
                    </div>
                    
                    {formData.courses.includes(`${subjectId}-other`) && (
                      <div className="form-group custom-course-input">
                        <label htmlFor={`customCourse-${subjectId}`}>Enter your custom course</label>
                        <input 
                          type="text" 
                          id={`customCourse-${subjectId}`} 
                          value={formData.customCourses[subjectId] || ''}
                          onChange={(e) => handleCustomCourseChange(e, subjectId)}
                          placeholder="Enter your course"
                          required
                        />
                      </div>
                    )}
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
              <label htmlFor="schedulingStyle">Learning Style Approach</label>
              <select 
                id="schedulingStyle" 
                name="schedulingStyle" 
                value={formData.schedulingStyle}
                onChange={handleInputChange}
                required
              >
                <option value="">Select learning style</option>
                <option value="casual">Casual - Study each subject once per week</option>
                <option value="focused">Focused - Study important subjects multiple times per week</option>
              </select>
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
      
      case 5:
        return (
          <div className="step-content">
            <div className="step-header">
              <IconUser size={32} className="step-icon" />
              <h2>Tell us about yourself</h2>
              <p className="step-description">Help us personalize your learning experience</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="nickname">Nickname</label>
              <input 
                type="text" 
                id="nickname" 
                name="nickname" 
                value={formData.nickname}
                onChange={handleInputChange}
                placeholder="Enter a nickname to display on your dashboard"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth (Optional)</label>
              <input 
                type="date" 
                id="dateOfBirth" 
                name="dateOfBirth" 
                value={formData.dateOfBirth}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="goals">Tell us about yourself</label>
              <textarea 
                id="goals" 
                name="goals" 
                value={formData.goals}
                onChange={handleInputChange}
                placeholder="What do you hope to achieve with AdaptIQ?"
                rows="3"
                required
              />
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="step-content">
            <div className="step-header">
              <IconCalendar size={32} className="step-icon" />
              <h2>Your Personalized Schedule</h2>
              <p className="step-description">Here's your optimized study schedule based on your preferences</p>
            </div>
            
            <div className="schedule-container">
              <ScheduleGenerator 
                userData={formData} 
                onComplete={handleScheduleComplete} 
              />
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

        <form onSubmit={step === 6 ? handleSubmit : e => e.preventDefault()}>
          {renderStepContent()}

          <div className="onboarding-buttons">
            {step > 1 && (
              <button type="button" className="back-button" onClick={prevStep}>
                <IconArrowLeft size={20} /> Back
              </button>
            )}
            
            {step < 6 ? (
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