import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoadingPage.css';
import { IconCalendarTime } from '@tabler/icons-react';
import Logo from '../assets/Logo.png';
import { generateOptimizedSchedule } from '../utils/scheduleAlgorithm';
import { generateUserAssignments, saveAssignmentsToFirestore } from '../utils/assignmentsUtils';
import { auth, saveUserSchedule } from '../../firebase';
import { motion } from 'framer-motion';

const LoadingPage = () => {
  const navigate = useNavigate();
  const [loadingText, setLoadingText] = useState('Generating your recommendations');
  const [dots, setDots] = useState('');
  const [scheduleGenerated, setScheduleGenerated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

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
    const generateAndSaveSchedule = async () => {
      try {
        // Load user data from localStorage
        const onboardingData = localStorage.getItem('onboardingData');
        
        if (onboardingData) {
          const userData = JSON.parse(onboardingData);
          
          // Generate the schedule based on updated user preferences
          const generatedSchedule = generateOptimizedSchedule(userData);
          
          // Save the generated schedule to localStorage
          localStorage.setItem('userSchedule', JSON.stringify(generatedSchedule));
          
          // Save the generated schedule to Firebase if user is authenticated
          if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            console.log('Saving newly generated schedule to Firebase after course changes...');
            await saveUserSchedule(userId, generatedSchedule);
            console.log('Schedule saved successfully to Firebase');
          }
          
          // Mark schedule as generated
          setScheduleGenerated(true);
        }
        
        // Start exit animation
        setIsExiting(true);
        
        // Navigate to schedule page after generating and animation
        setTimeout(() => {
          navigate('/dashboard/schedule');
        }, 500); // Match this with the animation duration in CSS
      } catch (error) {
        console.error('Error generating or saving schedule:', error);
        // Still navigate to dashboard even if there's an error
        setIsExiting(true);
        setTimeout(() => {
          navigate('/dashboard/schedule');
        }, 500);
      }
    };

    // Set a timeout to show loading screen for a few seconds before generating schedule
    const timer = setTimeout(() => {
      generateAndSaveSchedule();
    }, 3000); // 3 seconds for better user experience

    return () => clearTimeout(timer);
  }, [navigate]);

  // Effect to generate assignments in the background AFTER schedule is generated
  // This won't block the user from navigating to the dashboard
  useEffect(() => {
    // Only start generating assignments after schedule is successfully generated
    if (!scheduleGenerated) return;

    const generateAssignmentsInBackground = async () => {
      try {
        console.log('Starting background generation of assignments after course changes...');
        
        // Generate assignments based on the updated courses
        const newAssignments = await generateUserAssignments();
        
        // Save them to Firestore and localStorage
        if (newAssignments && newAssignments.length > 0) {
          if (auth.currentUser) {
            await saveAssignmentsToFirestore(newAssignments);
          }
          
          localStorage.setItem('userAssignments', JSON.stringify(newAssignments));
          console.log('New assignments generated and saved successfully in the background');
        }
      } catch (error) {
        console.error('Background assignment generation error:', error);
        // No need to notify the user since this happens in the background
      }
    };

    // Start the background process
    generateAssignmentsInBackground();

  }, [scheduleGenerated]);

  return (
    <motion.div 
      className={`loading-page ${isExiting ? 'exiting' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="loading-container"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.img 
          src={Logo} 
          alt="AdaptIQ Logo" 
          className="loading-logo"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        
        <motion.div 
          className="loading-animation"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* <div className="loading-spinner-login"></div> */}
        </motion.div>
        
        <motion.h2 
          className="loading-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {loadingText}<span className="loading-dots">{dots}</span>
        </motion.h2>
        
        <motion.p 
          className="loading-description"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          We're creating a schedule tailored to your learning preferences and availability.
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default LoadingPage;