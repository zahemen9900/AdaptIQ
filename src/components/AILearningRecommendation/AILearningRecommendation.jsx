import { useState, useEffect } from 'react';
import { IconRobot, IconRefresh, IconBrain, IconClock } from '@tabler/icons-react';
import { generateLearningRecommendations } from '../../utils/learningRecommendations';
import { motion, AnimatePresence } from 'framer-motion';
import './AILearningRecommendation.css';

const AILearningRecommendation = ({ userData }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  
  // Generate sparkle elements for the animation
  const sparkles = Array(8).fill().map((_, i) => (
    <div key={i} className="sparkle"></div>
  ));

  const fetchRecommendation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateLearningRecommendations(userData);
      
      if (result.success) {
        setRecommendation(result.recommendationText);
        setGeneratedAt(new Date(result.generatedAt));
      } else {
        setError(result.error || "Failed to generate recommendation");
        setRecommendation(result.recommendationText); // This will be an error message
      }
    } catch (err) {
      console.error("Error generating learning recommendation:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  // Format the generated time as relative time
  const getRelativeTime = (date) => {
    if (!date) return "";
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    
    if (diffSec < 60) {
      return "just now";
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Fetch recommendation when component mounts or userData changes
  useEffect(() => {
    if (userData) {
      fetchRecommendation();
    }
  }, [userData]);

  // Render the loading state with sparkle animation
  if (loading) {
    return (
      <div className="ai-recommendation-card">
        <div className="ai-recommendation-header">
          <h2>
            <IconRobot size={24} />
            AI Learning Recommendations
          </h2>
        </div>
        <div className="ai-recommendation-loading">
          <div className="sparkle-container">
            {sparkles}
          </div>
          <div className="sparkle-spinner"></div>
          <p>Generating personalized learning recommendations...</p>
        </div>
        <div className="ai-recommendation-footer">
          <span>Powered by AdaptIQ</span>
        </div>
      </div>
    );
  }

  // Render the error state
  if (error && !recommendation) {
    return (
      <div className="ai-recommendation-card">
        <div className="ai-recommendation-header">
          <h2>
            <IconRobot size={24} />
            AI Learning Recommendations
          </h2>
          <button className="refresh-button" onClick={fetchRecommendation}>
            <IconRefresh size={18} />
          </button>
        </div>
        <div className="ai-recommendation-body error">
          <IconBrain size={48} />
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button className="retry-button" onClick={fetchRecommendation}>
            Try Again
          </button>
        </div>
        <div className="ai-recommendation-footer">
          <span>Yours truly, AdaptIQ</span>
        </div>
      </div>
    );
  }

  // Render the recommendation
  return (
    <div className="ai-recommendation-card">
      <div className="ai-recommendation-header">
        <h2>
          <IconRobot size={24} />
          AI Learning Recommendations
        </h2>
        <button className="refresh-button" onClick={fetchRecommendation}>
          <IconRefresh size={18} />
        </button>
      </div>
      <AnimatePresence>
        <motion.div 
          className="ai-recommendation-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {recommendation && (
            <>
              <div className="sparkle-container">
                {sparkles}
              </div>
              <div className="recommendation-text sparkle-text">
                {recommendation}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="ai-recommendation-footer">
        <span>Powered by AdaptIQ</span>
        {generatedAt && (
          <div className="generated-time">
            <IconClock size={14} />
            <span>{getRelativeTime(generatedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AILearningRecommendation;