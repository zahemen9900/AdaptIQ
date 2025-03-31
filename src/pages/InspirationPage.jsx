import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconBulb, IconStar, IconSparkles, IconHeart, IconHeartFilled, 
  IconRefresh, IconMessageCircle, IconBooks, IconArrowRight, IconQuote, IconArrowLeft
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
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

// Mock function to simulate Gemini API call for post generation based on courses
const generateCoursePosts = async (courses) => {
  // Simulated delay to represent API call
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const postTemplates = [
    {
      title: "Did you know? {topic} fact",
      content: "Fascinating insight about {topic}: {fact}. This connects with many advanced concepts you'll explore further in your studies.",
      type: "fact"
    },
    {
      title: "Quick study tip for {topic}",
      content: "When studying {topic}, try this: {tip}. Many successful students have found this approach significantly improves retention and understanding.",
      type: "tip"
    },
    {
      title: "Reflection question on {topic}",
      content: "Take a moment to consider: {question} This kind of critical thinking will deepen your understanding of {topic} fundamentals.",
      type: "question"
    },
    {
      title: "Link between {topic} and real world",
      content: "Here's how {topic} applies in everyday life: {application}. Understanding these connections makes the abstract concepts much more concrete.",
      type: "application"
    }
  ];
  
  // Generate a post for each course
  return courses.map((course, index) => {
    // Get a random post template
    const template = postTemplates[Math.floor(Math.random() * postTemplates.length)];
    
    // Facts, tips, questions, and applications for different subjects
    const subjectContent = {
      Mathematics: {
        facts: [
          "The concept of zero as a number was developed independently in multiple ancient civilizations",
          "There are more possible chess games than atoms in the observable universe",
          "The Fibonacci sequence appears throughout nature, from flower petals to spiral galaxies"
        ],
        tips: [
          "working through practice problems actively rather than passively reading examples",
          "teaching concepts to someone else (or even an imaginary student)",
          "connecting new concepts to previously mastered material through concept mapping"
        ],
        questions: [
          "How might mathematics look different if we had evolved with a different number of fingers?",
          "Can you think of a real-world situation where mathematical optimization directly impacts people's lives?",
          "How does the concept of infinity relate to our finite physical world?"
        ],
        applications: [
          "cryptography secures your online banking and messages through complex mathematical algorithms",
          "traffic flow optimization uses differential equations to reduce congestion in cities",
          "medical imaging relies on mathematical transformations to convert sensor data into visual images"
        ]
      },
      Science: {
        facts: [
          "Quantum entanglement allows particles to instantly affect each other regardless of distance",
          "Human DNA shares about 60% similarity with banana DNA",
          "The human body contains more bacterial cells than human cells"
        ],
        tips: [
          "drawing diagrams to visualize complex processes and relationships",
          "creating analogies to connect scientific concepts to familiar experiences",
          "designing simple experiments to test your understanding of principles"
        ],
        questions: [
          "How might our understanding of biology change if we discover life on another planet?",
          "What scientific discovery would most dramatically change human society if made tomorrow?",
          "How do scientific models balance accuracy with simplicity, and when is one more important than the other?"
        ],
        applications: [
          "weather forecasting combines atmospheric physics with computational modeling",
          "genetic engineering allows precise modification of crops to increase yield and nutrition",
          "materials science creates new substances with properties that enable technological innovation"
        ]
      },
      History: {
        facts: [
          "The ancient Library of Alexandria contained an estimated 400,000 scrolls before its destruction",
          "More time separates Cleopatra from the building of the Great Pyramid than separates Cleopatra from us",
          "The modern weekend originated from labor rights movements in the early 20th century"
        ],
        tips: [
          "creating timelines to visualize how events relate chronologically",
          "examining primary sources to develop your own interpretations",
          "considering multiple perspectives on historical events and their causes"
        ],
        questions: [
          "How might world history be different if the printing press had been invented a thousand years earlier?",
          "What historical period would provide the best insights for addressing contemporary global challenges?",
          "How do we balance recognizing historical injustices with celebrating historical achievements?"
        ],
        applications: [
          "economic policy is often shaped by analysis of previous economic crises and responses",
          "diplomatic negotiations draw on historical precedents and relationships",
          "urban planning builds on understanding how cities have evolved through centuries"
        ]
      },
      Language: {
        facts: [
          "The average adult English speaker knows about 20,000-35,000 words",
          "Language acquisition activates different brain regions than adult language learning",
          "Over 43% of languages are currently considered endangered"
        ],
        tips: [
          "immersing yourself in authentic content rather than just studying grammar rules",
          "practicing spaced repetition for vocabulary retention",
          "finding conversation partners to practice speaking without fear of mistakes"
        ],
        questions: [
          "How does the language we speak influence how we think about the world?",
          "What would be gained and lost if the world adopted a single universal language?",
          "How are digital communications changing language evolution compared to previous eras?"
        ],
        applications: [
          "machine translation systems use sophisticated linguistic models to bridge language barriers",
          "forensic linguistics can help determine authorship of documents in legal cases",
          "marketing effectiveness depends heavily on language choices and cultural understanding"
        ]
      },
      "Computer Science": {
        facts: [
          "The first computer programmer was Ada Lovelace, who wrote algorithms for Charles Babbage's Analytical Engine in the 1840s",
          "The entire Apollo 11 mission ran on a computer with less processing power than a modern calculator",
          "Every Google search uses algorithms that process about 20 petabytes of data per day"
        ],
        tips: [
          "building small projects to apply new programming concepts immediately",
          "using the 'rubber duck debugging' technique of explaining code problems aloud",
          "reading well-written code from open source projects to improve your own style"
        ],
        questions: [
          "What are the ethical responsibilities of programmers when creating AI systems?",
          "How might computing change if quantum computers become widely available?",
          "What balance between automation and human control is optimal for critical systems?"
        ],
        applications: [
          "recommendation algorithms personalize content across streaming services and shopping sites",
          "computer vision enables medical diagnostic tools that can detect diseases earlier than human doctors",
          "simulation software allows testing dangerous scenarios safely in fields from aviation to nuclear engineering"
        ]
      },
      Engineering: {
        facts: [
          "The Burj Khalifa uses a special concrete mixture that can be pumped to extreme heights without separating",
          "The International Space Station travels at approximately 17,500 mph, orbiting Earth every 90 minutes",
          "Modern smartphone processors contain billions of transistors in an area smaller than your fingernail"
        ],
        tips: [
          "starting design processes by clearly defining the problem before jumping to solutions",
          "using back-of-the-envelope calculations to quickly test if ideas are feasible",
          "studying failure cases as valuable learning opportunities"
        ],
        questions: [
          "How should engineers balance innovation with reliability in critical infrastructure?",
          "What engineering challenges would be most difficult to overcome in establishing a Mars colony?",
          "How might we design systems that remain useful beyond their creators' lifespans?"
        ],
        applications: [
          "earthquake engineering saves countless lives through building designs that absorb seismic energy",
          "environmental engineering creates systems that clean water and air while minimizing energy use",
          "biomedical engineering develops implantable devices that restore lost bodily functions"
        ]
      },
      Economics: {
        facts: [
          "Economic game theory was used to design the US spectrum auctions, raising over $60 billion for the government",
          "The 'marshmallow test' on delayed gratification is one of the strongest predictors of future economic success",
          "Behavioral economics research shows people consistently value what they own more highly than identical items they don't own"
        ],
        tips: [
          "thinking in terms of incentives rather than rules when analyzing human behavior",
          "distinguishing between correlation and causation when examining economic data",
          "considering both seen and unseen consequences of economic policies"
        ],
        questions: [
          "How might economic systems evolve in a post-scarcity society?",
          "What economic indicators best reflect actual well-being rather than just production?",
          "How should we value environmental resources that provide benefits for generations?"
        ],
        applications: [
          "market design principles create efficient systems for kidney donation matching",
          "behavioral nudges can significantly increase retirement savings rates",
          "economic models help predict and mitigate financial crisis risks"
        ]
      },
      Psychology: {
        facts: [
          "The human brain typically processes visual information 60,000 times faster than text",
          "Studies show that spacing learning over time (distributed practice) leads to stronger long-term retention than cramming",
          "The brain physically changes its structure in response to learning new skills"
        ],
        tips: [
          "using cognitive biases awareness to improve decision-making",
          "practicing mindfulness to enhance attention and reduce stress response",
          "applying spaced repetition and active recall for effective studying"
        ],
        questions: [
          "How does our understanding of psychological development change how we should structure education?",
          "What balance between digital and physical social interaction is healthiest for development?",
          "How do cultural differences influence psychological processes previously thought to be universal?"
        ],
        applications: [
          "user experience design applies psychological principles to create intuitive interfaces",
          "cognitive behavioral therapy techniques help people reshape harmful thought patterns",
          "organizational psychology improves workplace productivity and employee satisfaction"
        ]
      },
      Arts: {
        facts: [
          "Creating art activates the same reward pathways in the brain as falling in love",
          "Music training physically changes brain structure, improving language processing and executive function",
          "Renaissance painters discovered mathematical perspective rules that revolutionized visual representation"
        ],
        tips: [
          "keeping a visual journal to develop observational skills and creative thinking",
          "studying the fundamentals before breaking rules creatively",
          "establishing regular creative practice rather than waiting for inspiration"
        ],
        questions: [
          "How does art creation differ from art appreciation in terms of cognitive benefits?",
          "What role should AI-generated art play in our understanding of creativity?",
          "How do different cultures define the boundaries between art, craft, and design?"
        ],
        applications: [
          "art therapy helps process trauma and express emotions that are difficult to verbalize",
          "design thinking methodology improves problem-solving across disciplines",
          "public art installations can transform urban spaces and strengthen community identity"
        ]
      },
      "Physical Education": {
        facts: [
          "Regular exercise increases brain-derived neurotrophic factor (BDNF), which improves learning capacity",
          "Coordination exercises create new neural pathways that improve cognitive function",
          "Research shows that short movement breaks during study sessions improve information retention"
        ],
        tips: [
          "integrating brief physical activity breaks between study sessions to improve focus",
          "practicing movement skills mindfully to enhance mind-body connection",
          "using exercise as a stress management tool during intensive learning periods"
        ],
        questions: [
          "How might education change if physical movement was integrated throughout the learning day?",
          "What balance between specialized and diverse physical activities best supports lifelong health?",
          "How do different forms of movement affect cognitive function in unique ways?"
        ],
        applications: [
          "exercise programming can be tailored to enhance brain health and cognitive performance",
          "movement-based learning strategies improve memory encoding for certain types of information",
          "physical literacy development supports confidence and participation across life domains"
        ]
      },
      Other: {
        facts: [
          "Interdisciplinary studies show that breakthrough innovations often occur at the intersection of different fields",
          "Learning through teaching others has been shown to significantly improve retention and understanding",
          "Developing expertise in any field typically requires around 10,000 hours of deliberate practice"
        ],
        tips: [
          "connecting concepts across different subjects to strengthen understanding",
          "creating personal meaning from abstract information to improve memory",
          "alternating between focused and diffuse thinking modes to solve complex problems"
        ],
        questions: [
          "How might education systems evolve to better prepare people for rapidly changing career landscapes?",
          "What balance between breadth and depth of knowledge is most valuable in the information age?",
          "How can we better integrate traditional knowledge with modern scientific understanding?"
        ],
        applications: [
          "systems thinking approaches help address complex global challenges requiring multiple disciplines",
          "creative problem-solving methods from one field can often be applied to breakthrough innovations in another",
          "lifelong learning strategies support adaptation to technological and social changes"
        ]
      }
    };
    
    // Determine which category to use based on course name
    let category = "Other";
    for (const cat in subjectContent) {
      if (course.category.includes(cat) || course.name.includes(cat)) {
        category = cat;
        break;
      }
    }
    
    // Get content for the selected category
    const content = subjectContent[category];
    const contentType = template.type === "fact" ? "facts" : 
                      template.type === "tip" ? "tips" : 
                      template.type === "question" ? "questions" : "applications";
    
    // Get a random content item
    const contentItems = content[contentType];
    const randomContent = contentItems[Math.floor(Math.random() * contentItems.length)];
    
    // Create the post
    let title = template.title.replace("{topic}", course.name);
    let postContent = template.content
      .replace("{topic}", course.name)
      .replace(/\{(fact|tip|question|application)\}/g, randomContent);
    
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
  });
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
        setPosts([
          {
            id: 'default-post-1',
            title: 'The Power of Lifelong Learning',
            content: 'Embracing lifelong learning is one of the most empowering choices you can make. It keeps your mind sharp, opens new opportunities, and helps you adapt to our rapidly changing world.',
            author: 'AdaptIQ Learning AI',
            date: formatPostDate(),
            type: 'tip',
            likes: 42,
          }
        ]);
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
          <h1>✨ Inspiration</h1>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="return-button">
            <IconArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
          <button 
            className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
            onClick={refreshContent}
            disabled={refreshing}
          >
            <IconRefresh size={20} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>
        </div>
      </div>
      
      <div className="inspiration-content">
        {loading ? (
          <div className="inspiration-loading">
            <div className="loading-spinner"></div>
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
                        <p>{post.content}</p>
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