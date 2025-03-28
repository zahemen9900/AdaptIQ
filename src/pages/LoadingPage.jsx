import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoadingPage.css';
import { IconCalendarTime } from '@tabler/icons-react';
import Logo from '../assets/Logo.png';
import { generateOptimizedSchedule } from '../utils/scheduleAlgorithm';

const LoadingPage = () => {
  const navigate = useNavigate();
  const [loadingText, setLoadingText] = useState('Generating your recommendations');
  const [dots, setDots] = useState('');

  // Effect for the loading dots animation
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  // Effect for the loading text variations
  useEffect(() => {
    const texts = [
      'Generating your AI-powered recommendations',
      'Optimizing your study schedule',
      'Analyzing your learning preferences',
      'Creating personalized study plan'
    ];
    
    let currentIndex = 0;
    const textInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % texts.length;
      setLoadingText(texts[currentIndex]);
    }, 3000);

    return () => clearInterval(textInterval);
  }, []);

  // Effect to generate schedule and navigate to the schedule page after loading
  useEffect(() => {
    // Load user data from localStorage
    const onboardingData = localStorage.getItem('onboardingData');
    
    const timer = setTimeout(() => {
      if (onboardingData) {
        const userData = JSON.parse(onboardingData);
        // Generate the schedule during loading
        const generatedSchedule = generateOptimizedSchedule(userData);
        // Save the generated schedule to localStorage
        localStorage.setItem('userSchedule', JSON.stringify(generatedSchedule));
      }
      // Navigate to schedule page after generating
      navigate('/dashboard/schedule');
    }, 5000); // 5 seconds loading time

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="loading-page">
      <div className="loading-container">
        <img src={Logo} alt="AdaptIQ Logo" className="loading-logo" />
        
        <div className="loading-animation">
          <div className="loading-spinner"></div>
        </div>
        
        <h2 className="loading-text">{loadingText}<span className="loading-dots">{dots}</span></h2>
        <p className="loading-description">We're creating a schedule tailored to your learning preferences and availability.</p>
      </div>
    </div>
  );
};

export default LoadingPage;