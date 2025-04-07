import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconBulb, IconStar, IconSparkles, IconHeart, IconHeartFilled, 
  IconRefresh, IconMessageCircle, IconBooks, IconArrowRight, IconQuote, IconArrowLeft
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './InspirationPage.css';

// Helper function to get random courses (3 of them)
const getRandomCourses = (courses) => {
  if (!courses || courses.length === 0) return [];
  
  // Clone the array to avoid modifying the original
  const shuffled = [...courses];
  
  // Shuffle using Fisher-Yates algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Return first 3 (or less if we don't have 3)
  return shuffled.slice(0, Math.min(3, shuffled.length));
};

// Helper function to get liked posts from localStorage
const getLikedPosts = () => {
  try {
    const likedPosts = localStorage.getItem('adaptiq-liked-posts');
    return likedPosts ? JSON.parse(likedPosts) : [];
  } catch (error) {
    console.error("Error getting liked posts:", error);
    return [];
  }
};

// Helper function to save liked posts to localStorage
const saveLikedPosts = (postIds) => {
  try {
    localStorage.setItem('adaptiq-liked-posts', JSON.stringify(postIds));
  } catch (error) {
    console.error("Error saving liked posts:", error);
  }
};

// Helper to format post date (always today for our case)
const formatPostDate = () => {
  const now = new Date();
  return now.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

// Mock function to simulate Gemini API call for quote generation
const generateDailyQuote = async () => {
  // This would be replaced with actual Gemini API call
  const quotes = [
    {
      text: "Education is not the filling of a pail, but the lighting of a fire.",
      author: "William Butler Yeats"
    },
    {
      text: "The beautiful thing about learning is that no one can take it away from you.",
      author: "B.B. King"
    },
    {
      text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
      author: "Dr. Seuss"
    },
    {
      text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
      author: "Mahatma Gandhi"
    },
    {
      text: "The purpose of education is to replace an empty mind with an open one.",
      author: "Malcolm Forbes"
    }
  ];
  
  // Get a random quote
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

// Initialize the Google Generative AI with the API key
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
let genAI;
let geminiModel;

if (API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  } catch (error) {
    console.error("Error initializing Gemini AI:", error);
  }
}

// Function to generate content for a course using Gemini AI
const generateContentWithGemini = async (course, type) => {
  if (!API_KEY || !geminiModel) {
    throw new Error("Gemini API key not available or model not initialized");
  }
  
  let prompt;
  switch (type) {
    case 'fact':
      prompt = `Generate a fascinating and educational fact about ${course.name} (subject category: ${course.category}). 
      Make it concise (maximum 2 sentences), intellectually stimulating, and suitable for a college student. 
      Focus on something surprising or counter-intuitive that would make someone think differently about the subject.`;
      break;
    case 'tip':
      prompt = `Provide a specific, actionable study tip for learning ${course.name} (subject category: ${course.category}). 
      The tip should be concise (maximum 2 sentences), practical, and based on cognitive science or educational best practices. 
      Focus on techniques that might not be obvious to most students.`;
      break;
    case 'question':
      prompt = `Create a thought-provoking reflection question about ${course.name} (subject category: ${course.category}). 
      The question should be concise, open-ended, and designed to deepen understanding of fundamental concepts in ${course.name}. 
      It should challenge assumptions and encourage critical thinking.`;
      break;
    case 'application':
      prompt = `Describe a specific real-world application of ${course.name} (subject category: ${course.category}) that students might not be aware of. 
      Keep it concise (maximum 2 sentences), focusing on an interesting or surprising way this knowledge is applied in industry, 
      research, or everyday life.`;
      break;
    default:
      prompt = `Share an interesting insight about ${course.name} (subject category: ${course.category}) that would help a student appreciate 
      the value of this subject. Keep it concise (maximum 2 sentences) and make it intellectually engaging.`;
  }
  
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text().trim();
    return response;
  } catch (error) {
    console.error(`Error generating ${type} for ${course.name}:`, error);
    throw error;
  }
};

// Function to generate course posts using Gemini AI
const generateCoursePosts = async (courses) => {
  const postTemplates = [
    {
      title: "Did you know? {topic} fact",
      contentTemplate: "Fascinating insight about {topic}: {content}. This connects with many advanced concepts you'll explore further in your studies.",
      type: "fact"
    },
    {
      title: "Quick study tip for {topic}",
      contentTemplate: "When studying {topic}, try this: {content}. Many successful students have found this approach significantly improves retention and understanding.",
      type: "tip"
    },
    {
      title: "Reflection question on {topic}",
      contentTemplate: "Take a moment to consider: {content} This kind of critical thinking will deepen your understanding of {topic} fundamentals.",
      type: "question"
    },
    {
      title: "Link between {topic} and real world",
      contentTemplate: "Here's how {topic} applies in everyday life: {content}. Understanding these connections makes the abstract concepts much more concrete.",
      type: "application"
    }
  ];
  
  // Fallback content in case the API fails
  const fallbackContent = {
    Mathematics: {
      facts: "The concept of zero as a number was developed independently in multiple ancient civilizations",
      tips: "working through practice problems actively rather than passively reading examples",
      questions: "How might mathematics look different if we had evolved with a different number of fingers?",
      applications: "cryptography secures your online banking and messages through complex mathematical algorithms"
    },
    Science: {
      facts: "Quantum entanglement allows particles to instantly affect each other regardless of distance",
      tips: "drawing diagrams to visualize complex processes and relationships",
      questions: "How might our understanding of biology change if we discover life on another planet?",
      applications: "weather forecasting combines atmospheric physics with computational modeling"
    },
    History: {
      facts: "The ancient Library of Alexandria contained an estimated 400,000 scrolls before its destruction",
      tips: "creating timelines to visualize how events relate chronologically",
      questions: "How might world history be different if the printing press had been invented a thousand years earlier?",
      applications: "diplomatic negotiations draw on historical precedents and relationships"
    },
    Language: {
      facts: "The average adult English speaker knows about 20,000-35,000 words",
      tips: "immersing yourself in authentic content rather than just studying grammar rules",
      questions: "How does the language we speak influence how we think about the world?",
      applications: "forensic linguistics can help determine authorship of documents in legal cases"
    },
    "Computer Science": {
      facts: "The first computer programmer was Ada Lovelace, who wrote algorithms for Charles Babbage's Analytical Engine in the 1840s",
      tips: "building small projects to apply new programming concepts immediately",
      questions: "What are the ethical responsibilities of programmers when creating AI systems?",
      applications: "recommendation algorithms personalize content across streaming services and shopping sites"
    },
    Engineering: {
      facts: "The Burj Khalifa uses a special concrete mixture that can be pumped to extreme heights without separating",
      tips: "starting design processes by clearly defining the problem before jumping to solutions",
      questions: "How should engineers balance innovation with reliability in critical infrastructure?",
      applications: "earthquake engineering saves countless lives through building designs that absorb seismic energy"
    },
    Economics: {
      facts: "Economic game theory was used to design the US spectrum auctions, raising over $60 billion for the government",
      tips: "thinking in terms of incentives rather than rules when analyzing human behavior",
      questions: "How might economic systems evolve in a post-scarcity society?",
      applications: "market design principles create efficient systems for kidney donation matching"
    },
    Psychology: {
      facts: "The human brain typically processes visual information 60,000 times faster than text",
      tips: "using cognitive biases awareness to improve decision-making",
      questions: "How does our understanding of psychological development change how we should structure education?",
      applications: "user experience design applies psychological principles to create intuitive interfaces"
    },
    Arts: {
      facts: "Creating art activates the same reward pathways in the brain as falling in love",
      tips: "keeping a visual journal to develop observational skills and creative thinking",
      questions: "How does art creation differ from art appreciation in terms of cognitive benefits?",
      applications: "art therapy helps process trauma and express emotions that are difficult to verbalize"
    },
    "Physical Education": {
      facts: "Regular exercise increases brain-derived neurotrophic factor (BDNF), which improves learning capacity",
      tips: "integrating brief physical activity breaks between study sessions to improve focus",
      questions: "How might education change if physical movement was integrated throughout the learning day?",
      applications: "exercise programming can be tailored to enhance brain health and cognitive performance"
    },
    Other: {
      facts: "Interdisciplinary studies show that breakthrough innovations often occur at the intersection of different fields",
      tips: "connecting concepts across different subjects to strengthen understanding",
      questions: "How might education systems evolve to better prepare people for rapidly changing career landscapes?",
      applications: "systems thinking approaches help address complex global challenges requiring multiple disciplines"
    }
  };
  
  // Generate a post for each course
  return Promise.all(courses.map(async (course, index) => {
    // Get a random post template
    const template = postTemplates[Math.floor(Math.random() * postTemplates.length)];
    const type = template.type;
    
    let content;
    try {
      // Try to generate content with Gemini
      if (API_KEY && geminiModel) {
        content = await generateContentWithGemini(course, type);
      } else {
        throw new Error("Gemini API not available");
      }
    } catch (error) {
      console.warn(`Using fallback content for ${course.name} (${type}):`, error);
      
      // Determine which category to use based on course name
      let category = "Other";
      for (const cat in fallbackContent) {
        if (course.category.includes(cat) || course.name.includes(cat)) {
          category = cat;
          break;
        }
      }
      
      // Get fallback content for the selected category and type
      const contentType = type === "fact" ? "facts" : 
                         type === "tip" ? "tips" : 
                         type === "question" ? "questions" : "applications";
      
      content = fallbackContent[category][contentType];
    }
    
    // Create the post
    let title = template.title.replace("{topic}", course.name);
    let postContent = template.contentTemplate
      .replace("{topic}", course.name)
      .replace("{content}", content);
    
    return {
      id: `post-${Date.now()}-${index}`,
      title,
      content: postContent,
      course: course.name,
      category: course.category,
      author: "AdaptIQ Learning AI",
      date: formatPostDate(),
      type: template.type,
      likes: Math.floor(Math.random() * 50) + 10, // Random number of likes for effect
    };
  }));
};

const InspirationPage = () => {
  const [posts, setPosts] = useState([]);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  
  // Fetch initial data
  useEffect(() => {
    loadContent();
    
    // Get liked posts from localStorage
    setLikedPosts(getLikedPosts());
    
    // Check if we need to refresh (daily)
    const lastRefresh = localStorage.getItem('adaptiq-inspiration-last-refresh');
    const today = new Date().toDateString();
    
    if (!lastRefresh || lastRefresh !== today) {
      // New day, refresh content
      refreshContent();
      localStorage.setItem('adaptiq-inspiration-last-refresh', today);
    }
  }, []);
  
  // Load content
  const loadContent = async () => {
    setLoading(true);
    
    try {
      // Get user courses from localStorage
      const onboardingData = localStorage.getItem('onboardingData');
      let userData = null;
      let userCourses = [];
      
      if (onboardingData) {
        userData = JSON.parse(onboardingData);
        
        if (userData && userData.courses && Array.isArray(userData.courses)) {
          // Process courses similar to dashboard page
          userCourses = userData.courses.map((courseId, index) => {
            // Parse course ID (format: subject-course)
            let courseName, category;
            if (courseId.includes('-')) {
              const [subjectId, courseCode] = courseId.split('-');
              
              // Handle custom courses
              if (courseCode === 'other' && userData.customCourses && userData.customCourses[subjectId]) {
                courseName = userData.customCourses[subjectId];
                category = subjectId;
              } else {
                // Map from predefined courses (simplified for this example)
                const categoryMapping = {
                  math: 'Mathematics',
                  science: 'Science',
                  history: 'History',
                  language: 'Language',
                  foreign: 'Language',
                  computer: 'Computer Science',
                  engineering: 'Engineering',
                  economics: 'Economics',
                  psychology: 'Psychology',
                  art: 'Arts',
                  music: 'Arts',
                  physical: 'Physical Education',
                };
                
                // Simplify course name construction
                courseName = courseCode.charAt(0).toUpperCase() + courseCode.slice(1);
                category = categoryMapping[subjectId] || 'Other';
              }
            } else {
              // Fallback for malformed course IDs
              courseName = courseId;
              category = 'Other';
            }
            
            return {
              id: `course-${index}`,
              name: courseName,
              category: category
            };
          });
        }
      }
      
      // Get random selection of 3 courses for post generation
      const selectedCourses = getRandomCourses(userCourses);
      
      // Generate daily quote
      const dailyQuote = await generateDailyQuote();
      setQuote(dailyQuote);
      
      // Generate course-specific posts if we have courses
      if (selectedCourses.length > 0) {
        const generatedPosts = await generateCoursePosts(selectedCourses);
        setPosts(generatedPosts);
      } else {
        // Fallback for no courses
        setPosts([{
          id: 'default-post-1',
          title: 'The Power of Lifelong Learning',
          content: 'Embracing lifelong learning is one of the most empowering choices you can make. It keeps your mind sharp, opens new opportunities, and helps you adapt to our rapidly changing world.',
          author: 'AdaptIQ Learning AI',
          date: formatPostDate(),
          type: 'tip',
          likes: 42,
        }]);
      }
    } catch (error) {
      console.error("Error loading inspiration content:", error);
      // Set fallback content
      setQuote({
        text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
        author: "Malcolm X"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh content
  const refreshContent = async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  };
  
  // Toggle like on a post
  const toggleLike = (postId) => {
    if (likedPosts.includes(postId)) {
      // Unlike
      const updatedLikes = likedPosts.filter(id => id !== postId);
      setLikedPosts(updatedLikes);
      saveLikedPosts(updatedLikes);
    } else {
      // Like
      const updatedLikes = [...likedPosts, postId];
      setLikedPosts(updatedLikes);
      saveLikedPosts(updatedLikes);
    }
  };
  
  return (
    <div className="inspiration-page">
      <div className="inspiration-header">
        <div className="inspiration-title">
          <IconSparkles size={28} />
          <h1>Inspiration</h1>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="return-button">
            <IconArrowLeft size={20} />
          </Link>
          <button 
            className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
            onClick={refreshContent}
            disabled={refreshing}
          >
            <IconRefresh size={20} className={refreshing ? 'spin' : ''} />
          </button>
        </div>
      </div>
      
      <div className="inspiration-content">
        {loading ? (
          <div className="inspiration-loading">
            <div className="inspiration-loading-spinner"></div>
            <p>Gathering inspiration for you...</p>
          </div>
        ) : (
          <>
            <div className="inspiration-feed">
              {/* Daily Quote Card */}
              {quote && (
                <motion.div 
                  className="quote-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="quote-card-content">
                    <div className="quote-icon">
                      <IconQuote size={32} />
                    </div>
                    <blockquote>
                      <p>{quote.text}</p>
                      <footer>— {quote.author}</footer>
                    </blockquote>
                  </div>
                  <div className="quote-footer">
                    <span>Daily Inspiration</span>
                  </div>
                </motion.div>
              )}
              
              {/* Inspiration Posts */}
              <div className="posts-container">
                <AnimatePresence>
                  {posts.map((post, index) => (
                    <motion.div 
                      key={post.id}
                      className={`post-card ${post.type}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className="post-header">
                        <h3>{post.title}</h3>
                        <div className="post-meta">
                          <span className="post-date">{post.date}</span>
                          <span className="post-category">{post.category}</span>
                        </div>
                      </div>
                      
                      <div className="post-content">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          children={post.content} 
                        />
                      </div>
                      
                      <div className="post-footer">
                        <div className="post-author">
                          <IconBulb size={18} />
                          <span>{post.author}</span>
                        </div>
                        
                        <div className="post-actions">
                          <button 
                            className={`like-button ${likedPosts.includes(post.id) ? 'liked' : ''}`}
                            onClick={() => toggleLike(post.id)}
                          >
                            {likedPosts.includes(post.id) ? 
                              <IconHeartFilled size={18} /> : 
                              <IconHeart size={18} />
                            }
                            <span>{likedPosts.includes(post.id) ? post.likes + 1 : post.likes}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="inspiration-sidebar">
              <div className="sidebar-card about-card">
                <h3>About Inspiration Feed</h3>
                <p>
                  Your personalized inspiration feed uses AI to generate content 
                  tailored to your learning journey. Discover fascinating facts, 
                  helpful tips, and thought-provoking questions related to your courses.
                </p>
                <p>
                  New content appears daily to keep you motivated and engaged with 
                  your studies. Like posts that resonate with you!
                </p>
              </div>
              
              <div className="sidebar-card featured-card">
                <h3>
                  <IconStar size={18} />
                  <span>Learning Insight</span>
                </h3>
                <div className="featured-content">
                  <p>
                    Students who engage with diverse perspectives on their subjects 
                    show 37% better retention and application of knowledge in real-world 
                    contexts.
                  </p>
                  <div className="featured-footer">
                    <button className="featured-button">
                      <span>Learn More</span>
                      <IconArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InspirationPage;