import { useState } from 'react';
import './AssignmentSubmission.css';
import { 
  IconUpload, 
  IconX, 
  IconSend, 
  IconCheck, 
  IconAlertCircle,
  IconLoader,
  IconFileText
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Initialize the Google Generative AI with the API key
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const AssignmentSubmission = ({ assignment, onSubmit, onCancel }) => {
  const [submissionText, setSubmissionText] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [grade, setGrade] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState('draft'); // draft, submitted, graded

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    
    // Read the text file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setFileContent(e.target.result);
      } catch (error) {
        setError('Unable to read file content. Please try again.');
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file. Please try again.');
    };
    reader.readAsText(file);
  };

  // Remove the uploaded file
  const handleRemoveFile = () => {
    setFileContent(null);
    setFileName('');
  };

  // Handle submission of quiz answers
  const handleSubmitAssignment = async () => {
    // Check if there's a submission
    if (!submissionText && !fileContent) {
      setError('Please provide your answer or upload a solution file before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Use either the typed submission or the file content
    const submissionToGrade = fileContent || submissionText;

    try {
      // Generate the AI grading prompt
      const gradingPrompt = `
You are an AI educational grader for AdaptIQ learning platform. You need to grade the following assignment submission:

ASSIGNMENT: ${assignment.title}
SUBJECT: ${assignment.subject}
DESCRIPTION: ${assignment.description}

STUDENT SUBMISSION:
${submissionToGrade}

Please evaluate this submission and provide:
1. A detailed feedback explaining what was done well and what could be improved
2. A numerical grade from 0-100
3. A list of specific suggestions for improvement

Format your response exactly as follows:
---GRADE: [numerical grade from 0-100]---

---FEEDBACK---
[Your detailed feedback here]

---SUGGESTIONS FOR IMPROVEMENT---
- [Suggestion 1]
- [Suggestion 2]
- [Suggestion 3]
`;

      if (!API_KEY) {
        // Mock response for when API key is not available
        setTimeout(() => {
          const mockGrade = Math.floor(Math.random() * 31) + 70; // 70-100
          const mockFeedback = `
---GRADE: ${mockGrade}---

---FEEDBACK---
This is automated feedback as we couldn't connect to the grading service. Your submission shows good understanding of the core concepts. There are some areas that could be improved, but overall this is solid work.

---SUGGESTIONS FOR IMPROVEMENT---
- Consider adding more detail to your explanations
- Make sure to cite relevant sources when necessary
- Try to connect concepts to real-world applications
`;
          
          processFeedback(mockFeedback);
          setIsSubmitting(false);
          setSubmissionStatus('graded');
        }, 2000);
        return;
      }

      // Call Gemini API for grading
      const content = await model.generateContent(gradingPrompt);
      const response = content.response.text();
      
      processFeedback(response);
      setIsSubmitting(false);
      setSubmissionStatus('graded');
    } catch (error) {
      console.error("Error grading submission:", error);
      setError('Failed to grade your submission. Please try again later.');
      setIsSubmitting(false);
    }
  };

  // Process the feedback from the AI
  const processFeedback = (feedback) => {
    // Extract grade from the feedback
    const gradeMatch = feedback.match(/---GRADE:\s*(\d+)/);
    if (gradeMatch && gradeMatch[1]) {
      setGrade(parseInt(gradeMatch[1]));
    } else {
      setGrade(75); // Default grade if extraction fails
    }

    // Set the full feedback
    setFeedbackContent(feedback);
  };

  // Handle submission completion
  const handleCompleteSubmission = () => {
    onSubmit({
      assignmentId: assignment.id,
      submissionContent: fileContent || submissionText,
      feedback: feedbackContent,
      grade: grade,
      submittedAt: new Date().toISOString()
    });
  };

  return (
    <div className="assignment-submission-container">
      <div className="assignment-submission-header">
        <h2>Submit Your Solution</h2>
        <button className="close-button" onClick={onCancel}>
          <IconX size={20} />
        </button>
      </div>

      <div className="assignment-submission-content">
        <div className="assignment-details">
          <h3>{assignment.title}</h3>
          <div className="assignment-description">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {assignment.description}
            </ReactMarkdown>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {submissionStatus === 'draft' && (
            <motion.div 
              className="submission-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="submission-input-section">
                <h4>Your Solution</h4>
                <textarea
                  className="submission-textarea"
                  placeholder="Type your answer here..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  disabled={!!fileContent || isSubmitting}
                ></textarea>
              </div>

              <div className="file-upload-section">
                <h4>Or Upload Your Solution</h4>
                
                {!fileContent ? (
                  <label className="file-upload-label">
                    <IconUpload size={24} />
                    <span>Upload TXT or PDF file</span>
                    <input 
                      type="file" 
                      accept=".txt,.pdf" 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }}
                      disabled={isSubmitting}
                    />
                  </label>
                ) : (
                  <div className="uploaded-file">
                    <IconFileText size={20} />
                    <span className="file-name">{fileName}</span>
                    <button 
                      className="remove-file-button" 
                      onClick={handleRemoveFile}
                      disabled={isSubmitting}
                    >
                      <IconX size={16} />
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="submission-error">
                  <IconAlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="submission-actions">
                <button 
                  className="cancel-button" 
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  className="submit-button" 
                  onClick={handleSubmitAssignment}
                  disabled={(!submissionText && !fileContent) || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <IconLoader size={20} className="spinner" />
                      <span>Grading...</span>
                    </>
                  ) : (
                    <>
                      <IconSend size={20} />
                      <span>Submit for Grading</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {submissionStatus === 'graded' && (
            <motion.div 
              className="feedback-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grade-display">
                <div className="grade-circle" style={{ 
                  backgroundColor: grade >= 90 ? '#4caf50' : grade >= 70 ? '#8bc34a' : grade >= 60 ? '#ff9800' : '#f44336' 
                }}>
                  <span>{grade}</span>
                </div>
                <div className="grade-label">
                  {grade >= 90 ? 'Excellent!' : 
                   grade >= 80 ? 'Great Job!' : 
                   grade >= 70 ? 'Good Work' : 
                   grade >= 60 ? 'Satisfactory' : 'Needs Improvement'}
                </div>
              </div>

              <div className="feedback-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {feedbackContent}
                </ReactMarkdown>
              </div>

              <div className="submission-actions">
                <button 
                  className="cancel-button" 
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button 
                  className="complete-button" 
                  onClick={handleCompleteSubmission}
                >
                  <IconCheck size={20} />
                  <span>Complete Assignment</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AssignmentSubmission;