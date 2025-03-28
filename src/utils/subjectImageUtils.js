/**
 * Utility functions for handling subject images
 */

// Subject-specific image URL mapping
const subjectImageUrls = {
  // Mathematics subjects
  'Algebra': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtWbUaNkdGnVH-dyGORvB3wV20YdYuXi_amQ&s',
  'Geometry': 'https://marketplace.canva.com/EAFDRh1CG6o/1/0/800w/canva-colorful-3d-geometry-schoology-profile-picture-dtwDAPWEJMo.jpg',
  'Calculus': 'https://i.ytimg.com/vi/0Be_6Qaq1es/maxresdefault.jpg',
  'Statistics': 'https://img.freepik.com/premium-vector/bar-chart-with-pie-chart-overlay-research-statistical-data-company-performance-indicators-simple-minimalist-flat-vector-illustration_538213-118982.jpg?semt=ais_hybrid',
  'Trigonometry': 'https://miro.medium.com/v2/resize:fit:840/1*4GRXwL8EGk7MxDlP9GDAgA.jpeg',
  
  // Science subjects
  'Biology': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd6Lzmu4JKafStm09sT55CduAVpILSkEVi6Q&s',
  'Chemistry': 'https://img.freepik.com/free-vector/chalkboard-background-with-chemistry-information_23-2148158991.jpg?semt=ais_hybrid',
  'Physics': 'https://media.istockphoto.com/id/1866121335/photo/physics-and-mathematics.jpg?s=612x612&w=0&k=20&c=OZmyFAhrYgv-61E3UBjii7R5rLqp5cNdokXSuoTCpiY=',
  'Environmental Science': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9RGj9ID7eyYPSKXPzuESBl4iviuhNAzJvgQ&s',
  'Astronomy': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyAHpyFJDEL6UlPoSBot6hUE4VDjgaUIe_GQ&s',
  
  // History subjects
  'World History': 'https://i.pinimg.com/736x/df/9b/3b/df9b3bed9df660eb8b51c1926d84b893.jpg',
  'US History': 'https://www.ushistory.org/data1/images/slide2.jpg',
  'European History': 'https://www.hist.cam.ac.uk/sites/default/files/styles/responsive_standard/public/2020-03/eugene_delacroix_-_la_liberte_guidant_le_peuple_1830.jpg?itok=QUxB0MKL',
  'Ancient Civilizations': 'https://cdn.clarku.edu/wp-content/uploads/2018/07/Majors-Ancient-Civilization-880x550.jpg',
  'Modern History': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIbfAL6UNfC2GJw_KDgmMnkpEE4rdiIZf9eA&s',
  
  // Language subjects
  'Composition': 'https://www.befunky.com/images/wp/wp-2022-07-composition-rules-featured.jpg?auto=avif,webp&format=jpg&width=1136&crop=16:9',
  'Literature': 'https://img.freepik.com/free-vector/watercolor-literature-illustration_52683-81536.jpg',
  'Grammar': 'https://media.istockphoto.com/id/1134880364/photo/grammar-word-from-wooden-blocks.jpg?s=612x612&w=0&k=20&c=V2dS_iEWmy9vSyb0myx2OXaVZSHFFYvXiFmto0Ab7r0=',
  'Creative Writing': 'https://nicolebianchi.com/wp-content/uploads/2020/05/dewang-gupta-wQIjxPeHhp0-unsplash-1024x683.jpg',
  'Speech & Debate': 'https://www.aimacademy.online/wp-content/uploads/2022/02/speech-and-debate.png',
  'Spanish': 'https://media.istockphoto.com/id/1338273072/vector/espanol-spanish-language-doodle-with-lettering.jpg?s=612x612&w=0&k=20&c=QIb8Col1ZIfKDYu__WN741cwCQstAYxdIElNjhu5sdE=',
  'French': 'https://soundprimary.co.uk/wp-content/uploads/2020/03/french.jpg',
  'German': 'https://media.istockphoto.com/id/1090094168/vector/german-german-language-hand-drawn-doodles-and-lettering.jpg?s=612x612&w=0&k=20&c=voS5Y21cNI_OAOe9tV7TXweDN0KHtENYOOvNFz_wNJw=',
  'Chinese': 'https://asiasociety.org/sites/default/files/styles/1200w/public/C/chinese-about.png',
  'Japanese': 'https://www.japaneseexplorer.com.sg/wp-content/uploads/2019/02/5-fascinating-facts-about-the-japanese-language.jpg',
  
  // Computer Science subjects
  'Programming': 'https://img.freepik.com/free-vector/laptop-with-program-code-isometric-icon-software-development-programming-applications-dark-neon_39422-971.jpg',
  'Web Development': 'https://invozone.com/static/61f8e7fc0eff9e0a7d4f8bb43ffa039d/features_to_make_web_developer_portfolio_2af3be2688.webp',
  'Database Systems': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRgeL-h9orNjnGD9YE9Sxc7Lbw42DDdeCWaQ&s',
  'Artificial Intelligence': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMjoB1XueXz3wgyw-OgkteVUFen3hzBazHfw&s',
  'Cybersecurity': 'https://www.shutterstock.com/image-photo/glowing-digital-lock-surrounded-by-600nw-2517566697.jpg',
  
  // Arts subjects
  'Drawing': 'https://fullbloomclub.net/wp-content/uploads/2024/03/realisitc-drawing.jpg',
  'Painting': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStbzkER6AehGYwVBoRYZvTrnkzN27GjCGHHg&s',
  'Sculpture': 'https://d7hftxdivxxvm.cloudfront.net/?quality=80&resize_to=width&src=https%3A%2F%2Fartsy-media-uploads.s3.amazonaws.com%2FQIxqHZiK1Kq492cxbjpArg%252F4098790549_378aea8dcb_o.jpg&width=910',
  'Digital Art': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRo-jC8pDEDnpf9V17QYFHP7ZlF3HkBm17Vkg&s',
  'Music Theory': 'https://splice.com/blog/wp-content/uploads/2019/12/Why_music_theory_important_BlogPost.png',
  'Instrumental': 'https://img.freepik.com/free-vector/gradient-background-world-music-day-celebration_23-2150377079.jpg',
  'Vocal': 'https://www.roadiemusic.com/blog/wp-content/uploads/2023/08/pexels-pixabay-164960.jpg',
  
  // Physical Education subjects
  'Fitness': 'https://img.freepik.com/premium-photo/workout-sexual-woman-with-dumbbells_136403-5416.jpg',
  'Sports': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsZjSTWj--Z1ZlJ-yMNt87-rUApgUgvmj1OA&s',
  'Nutrition': 'https://media.istockphoto.com/id/1471436624/photo/foods-recommended-for-stabilizing-insulin-and-blood-sugar-levels.jpg?s=612x612&w=0&k=20&c=E3dHx8QEP7lSsJhkSOFuz-BPuM7Ek9rBIZ-Ok6Oc5Z4=',
  'Wellness': 'https://ciiblog.in/wp-content/uploads/2024/03/Yoga-Blog-Cover-scaled-1.jpg'
};

// Default category image mapping (used as fallback)
const categoryImageUrls = {
  'mathematics': '../../assets/subjects/mathematics.svg',
  'science': '../../assets/subjects/science.svg',
  'language': '../../assets/subjects/language.svg',
  'history': '../../assets/subjects/history.svg',
  'arts': '../../assets/subjects/arts.svg',
  'computer-science': '../../assets/subjects/computer-science.svg',
  'physical-education': '../../assets/subjects/physical-education.svg',
  'other': '../../assets/subjects/mathematics.svg' // Default for 'Other' subjects
};

/**
 * Get a subject image URL
 * @param {string} subject - The subject name
 * @param {string} category - The subject category (used as fallback)
 * @returns {string} - The image URL
 */
export const getSubjectImageUrl = (subject, category) => {
  // If subject has a specific image URL, use it
  if (subjectImageUrls[subject]) {
    return subjectImageUrls[subject];
  }
  
  // If subject was added under 'Other', use the default 'other' image
  if (category === 'other') {
    return categoryImageUrls.other;
  }
  
  // Otherwise, fall back to the category image
  return categoryImageUrls[category] || categoryImageUrls.mathematics;
};

/**
 * Upload a custom subject image to Firebase Storage
 * @param {string} subject - The subject name
 * @param {File} imageFile - The image file to upload
 * @returns {Promise<string>} - A promise that resolves to the image URL
 */
export const uploadSubjectImage = async (subject, imageFile) => {
  // This would be implemented with Firebase Storage
  // For now, we'll just return a mock promise
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://firebasestorage.example.com/subjects/${subject.toLowerCase().replace(/\s+/g, '-')}.jpg`);
    }, 1000);
  });
};

/**
 * Get a list of all available subject images
 * @returns {Promise<Array>} - A promise that resolves to an array of image objects
 */
export const getAllSubjectImages = async () => {
  // This would fetch from Firebase Storage
  // For now, we'll return a mock promise with subject-specific URLs
  return new Promise((resolve) => {
    setTimeout(() => {
      // Convert the subjectImageUrls object to an array of objects
      const subjectImages = Object.entries(subjectImageUrls).map(([subject, url]) => ({
        subject,
        url,
        category: getCategoryForSubject(subject)
      }));
      
      resolve(subjectImages);
    }, 500);
  });
};

/**
 * Helper function to get the category for a subject
 * @param {string} subject - The subject name
 * @returns {string} - The category name
 */
const getCategoryForSubject = (subject) => {
  // This mapping should match the one in SubjectPopup.jsx
  const subjectCategories = {
    // Mathematics subjects
    'Algebra': 'mathematics',
    'Geometry': 'mathematics',
    'Calculus': 'mathematics',
    'Statistics': 'mathematics',
    'Trigonometry': 'mathematics',
    
    // Science subjects
    'Biology': 'science',
    'Chemistry': 'science',
    'Physics': 'science',
    'Environmental Science': 'science',
    'Astronomy': 'science',
    
    // History subjects
    'World History': 'history',
    'US History': 'history',
    'European History': 'history',
    'Ancient Civilizations': 'history',
    'Modern History': 'history',
    
    // Language subjects
    'Composition': 'language',
    'Literature': 'language',
    'Grammar': 'language',
    'Creative Writing': 'language',
    'Speech & Debate': 'language',
    'Spanish': 'language',
    'French': 'language',
    'German': 'language',
    'Chinese': 'language',
    'Japanese': 'language',
    
    // Computer Science subjects
    'Programming': 'computer-science',
    'Web Development': 'computer-science',
    'Database Systems': 'computer-science',
    'Artificial Intelligence': 'computer-science',
    'Cybersecurity': 'computer-science',
    
    // Arts subjects
    'Drawing': 'arts',
    'Painting': 'arts',
    'Sculpture': 'arts',
    'Digital Art': 'arts',
    'Music Theory': 'arts',
    'Instrumental': 'arts',
    'Vocal': 'arts',
    
    // Physical Education subjects
    'Fitness': 'physical-education',
    'Sports': 'physical-education',
    'Nutrition': 'physical-education',
    'Wellness': 'physical-education'
  };
  
  return subjectCategories[subject] || 'other';
};