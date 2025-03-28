import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SubjectPopup.css';

// Import subject image utility
import { getSubjectImageUrl } from '../../utils/subjectImageUtils';

const SubjectPopup = ({ subject, onClose }) => {
  // Subject category mapping
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
    
    // Engineering subjects
    'Mechanical Engineering': 'engineering',
    'Electrical Engineering': 'engineering',
    'Civil Engineering': 'engineering',
    'Chemical Engineering': 'engineering',
    'Software Engineering': 'engineering',
    
    // Economics subjects
    'Microeconomics': 'economics',
    'Macroeconomics': 'economics',
    'International Economics': 'economics',
    'Business Economics': 'economics',
    'Finance': 'economics',
    
    // Psychology subjects
    'General Psychology': 'psychology',
    'Developmental Psychology': 'psychology',
    'Cognitive Psychology': 'psychology',
    'Abnormal Psychology': 'psychology',
    'Social Psychology': 'psychology',
    
    // Arts subjects
    'Drawing': 'arts',
    'Painting': 'arts',
    'Sculpture': 'arts',
    'Digital Art': 'arts',
    'Music Theory': 'arts',
    'Instrumental': 'arts',
    'Vocal': 'arts',
    'Composition': 'arts',
    
    // Physical Education subjects
    'Fitness': 'physical-education',
    'Sports': 'physical-education',
    'Nutrition': 'physical-education',
    'Wellness': 'physical-education'
  };
  
  // This mapping is now handled by subjectImageUtils.js
  
  // Subject descriptions for standard subjects
  const subjectDescriptions = {
    'Algebra': 'A branch of mathematics that deals with symbols and the rules for manipulating these symbols, serving as the foundation for advanced mathematics.',
    'Geometry': 'The branch of mathematics concerned with the properties and relations of points, lines, surfaces, and solids.',
    'Calculus': 'The mathematical study of continuous change, dealing with limits, derivatives, integrals, and infinite series.',
    'Statistics': 'The practice or science of collecting and analyzing numerical data in large quantities for the purpose of inferring proportions in a whole from those in a representative sample.',
    'Trigonometry': 'The branch of mathematics dealing with the relations of the sides and angles of triangles and the relevant functions of any angles.',
    'Biology': 'The study of living organisms, including their physical structure, chemical processes, molecular interactions, physiological mechanisms, development, and evolution.',
    'Chemistry': 'The scientific discipline involved with elements and compounds composed of atoms, molecules, and ions, and their composition, structure, properties, and behavior.',
    'Physics': 'The natural science that studies matter, its motion and behavior through space and time, and the related entities of energy and force.',
    'Environmental Science': 'An interdisciplinary academic field that integrates physical, biological, and information sciences to study the environment and solutions to environmental problems.',
    'Astronomy': 'The study of celestial objects, space, and the physical universe as a whole.',
    'World History': 'The study of major civilizations over the past 3000 years, examining global exchange and interaction over time.',
    'US History': 'The study of the historical events, people, and movements that have shaped the United States from its founding to the present day.',
    'European History': 'The study of Europe\'s past from the emergence of civilization to the present day, focusing on cultural, political, and social developments.',
    'Ancient Civilizations': 'The study of the earliest civilizations that developed in different parts of the world, including Mesopotamia, Egypt, China, and Mesoamerica.',
    'Modern History': 'The study of the modern period, typically defined as the time following the Middle Ages, characterized by significant social and technological change.',
    'Composition': 'The study and practice of writing, focusing on structure, clarity, and effective communication.',
    'Literature': 'The study of written works, especially those considered of superior or lasting artistic merit.',
    'Grammar': 'The study of the way words are used to form sentences, and the rules that govern this usage.',
    'Creative Writing': 'The pursuit of artistic expression through the written word, including fiction, poetry, and creative non-fiction.',
    'Speech & Debate': 'The study and practice of public speaking and formal debate, developing skills in rhetoric, argumentation, and persuasion.',
    'Spanish': 'The study of the Spanish language, including vocabulary, grammar, pronunciation, and cultural aspects of Spanish-speaking countries.',
    'French': 'The study of the French language, including vocabulary, grammar, pronunciation, and cultural aspects of French-speaking countries.',
    'German': 'The study of the German language, including vocabulary, grammar, pronunciation, and cultural aspects of German-speaking countries.',
    'Chinese': 'The study of the Chinese language, including vocabulary, grammar, pronunciation, and cultural aspects of Chinese-speaking countries.',
    'Japanese': 'The study of the Japanese language, including vocabulary, grammar, pronunciation, and cultural aspects of Japan.',
    'Programming': 'The process of designing and building executable computer programs to accomplish specific computing tasks.',
    'Web Development': 'The work involved in developing websites for the internet, including web design, content development, client-side/server-side scripting, and network security configuration.',
    'Database Systems': 'The study of systems that store and organize data, including design, implementation, and management of database systems.',
    'Artificial Intelligence': 'The simulation of human intelligence processes by machines, especially computer systems, including learning, reasoning, and self-correction.',
    'Cybersecurity': 'The practice of protecting systems, networks, and programs from digital attacks, typically aimed at accessing, changing, or destroying sensitive information.',
    
    // Engineering subjects
    'Mechanical Engineering': 'The branch of engineering that applies physical principles to the creation of machines, mechanical systems, and tools, with applications in manufacturing, robotics, and automotive design.',
    'Electrical Engineering': 'The field of engineering that deals with electricity, electronics, and electromagnetism, designing and developing electrical systems, from power distribution to electronic circuits.',
    'Civil Engineering': 'The professional practice of designing and developing infrastructure such as roads, bridges, buildings, and water systems, with a focus on safety, efficiency, and sustainability.',
    'Chemical Engineering': 'The branch of engineering that applies chemistry, physics, biology, and mathematics to design and improve processes for converting raw materials into valuable products.',
    'Software Engineering': 'The systematic application of engineering principles to software design, development, testing, and maintenance, with a focus on scalability, reliability, and efficiency.',
    
    // Economics subjects
    'Microeconomics': 'The study of how individuals and businesses make decisions regarding the allocation of resources and prices of goods and services, focusing on supply and demand in markets.',
    'Macroeconomics': 'The field of economics dealing with the performance, structure, behavior, and decision-making of an economy as a whole, including national income, unemployment, inflation, and economic growth.',
    'International Economics': 'The study of economic interactions between countries, including trade, investment, and the effects of economic policies on global markets.',
    'Business Economics': 'The application of economic theory and methods to business decision-making, helping firms understand market dynamics and optimize their operations.',
    'Finance': 'The study of money management, including investments, assets, liabilities, and the systems that govern them in organizations and markets.',
    
    // Psychology subjects
    'General Psychology': 'An introduction to the scientific study of behavior and mental processes, examining the fundamental principles that govern how we think, feel, and behave.',
    'Developmental Psychology': 'The study of how humans grow and change throughout their lifespan, examining physical, cognitive, emotional, social, and personality development.',
    'Cognitive Psychology': 'The scientific study of mental processes such as attention, language use, memory, perception, problem solving, creativity, and reasoning.',
    'Abnormal Psychology': 'The study of unusual patterns of behavior, emotion, and thought that may be understood as mental disorders, including their causes, treatments, and impacts.',
    'Social Psychology': 'The scientific study of how people\'s thoughts, feelings, and behaviors are influenced by the actual, imagined, or implied presence of others.',
    
    'Drawing': 'The art or technique of representing objects, ideas, or emotions through lines, shapes, and values on a surface.',
    'Painting': 'The practice of applying paint, pigment, color, or other medium to a solid surface to create art.',
    'Sculpture': 'The art of making three-dimensional representative or abstract forms, especially by carving stone or wood or by casting metal or plaster.',
    'Digital Art': 'Art made using digital technology, including computer-generated art, digital photography, and digital painting.',
    'Music Theory': 'The study of the practices and possibilities of music, including the study of music notation, compositional methods, and the elements of music.',
    'Instrumental': 'The study and practice of playing musical instruments, developing technical proficiency and musical expression.',
    'Vocal': 'The study and practice of singing, including technique, repertoire, and performance skills.',
'Composition': 'The creation of original music, including melody, harmony, rhythm, and form.',
    'Fitness': 'Physical activity aimed at improving health and physical strength through regular exercise and proper nutrition.',
    'Sports': 'Competitive physical activities governed by a set of rules, often requiring physical exertion and skill.',
    'Nutrition': 'The study of nutrients in food, how the body uses them, and the relationship between diet, health, and disease.',
    'Wellness': 'The active pursuit of activities, choices, and lifestyles that lead to a state of holistic health.'
  };

  // Get description for the subject or use default message for custom subjects
  const description = subjectDescriptions[subject] || 'No default information available for this subject';
  
  // Get the category for the subject
  const category = subjectCategories[subject] || 'other';
  
  // Get the image URL for the specific subject
  const subjectImage = getSubjectImageUrl(subject, category);

  return (
    <div className="subject-popup-overlay" onClick={onClose}>
      <div className="subject-popup" onClick={(e) => e.stopPropagation()}>
        <div className="subject-popup-header">
          <h2>{subject}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="subject-popup-content">
          <div className="subject-image-container">
            <img src={subjectImage} alt={subject} className="subject-image" />
          </div>
          <p>{description}</p>
        </div>
        <div className="subject-popup-footer">
          <Link to="/dashboard/courses" className="learn-button">Learn</Link>
        </div>
      </div>
    </div>
  );
};

export default SubjectPopup;