import React from 'react';
import './LearningCenters.css';

const LearningCenters = () => {
  return (
    <section className="learning-centers">
      <div className="learning-centers-container">
        <h2>Our Learning Centers</h2>
        <p>
          Aligned with our cutting-edge technology, Squirrel AI's state-of-the-art learning centers offer a
          visually striking and functionally superior experience compared to traditional tutoring centers. Rather
          than confining students to isolated cubicles or conventional desk setups, our modernized spaces
          feature open areas and comfortable seating, including ergonomic chairs and bean bags.
        </p>
        <p>
          These innovative and inspiring environments foster both comfort and enthusiasm, encouraging a more
          engaging learning experience. Sign up to stay in the know about Squirrel AI learning center locations
          and offerings in your area.
        </p>
        <button className="signup-button">SIGN UP FOR THE LATEST NEWS</button>
      </div>
     <div className='learning-centers-pic-container'>
      <img className='learning-centers-pic' src="/src/assets/learningCenters-pic.png" alt="Learning Center" />
     </div>
    </section>
  );
};

export default LearningCenters;