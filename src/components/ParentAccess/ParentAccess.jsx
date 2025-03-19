import React from 'react';
import './ParentAccess.css';
import parentAccessImg from '../../assets/parentAccess.png';

const ParentAccess = () => {
  return (
    <section className="parent-access">
      <div className="parent-access-container">
        <div className="parent-access-content">
          <div className="parent-access-text">
            <h2>24/7 Parent Access</h2>
            <p>
              Stay connected to your child's progress anytime with round-the-
              clock access to detailed learning analytics, ensuring you're always
              informed and involved in their educational journey.
            </p>
          </div>
          <div className="parent-access-image">
            <img src={parentAccessImg} alt="Parent accessing learning analytics" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParentAccess;