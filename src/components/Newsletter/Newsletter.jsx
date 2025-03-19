import React from 'react';
import './Newsletter.css';

const Newsletter = () => {
  return (
    <section className="newsletter">
      <div className="newsletter-container">
        <div className="newsletter-content">
          <h2>Sign Up to Learn More About Squirrel Ai</h2>
          <p>
            Stay in the know about Squirrel AI learning center locations
            and offerings in your area.
          </p>
        </div>
        <div className="newsletter-form">
          <form>
            <div className="form-group">
              <input type="text" placeholder="Name*" required />
            </div>
            <div className="form-group">
              <input type="email" placeholder="Email*" required />
            </div>
            <button type="submit" className="subscribe-button">
              SUBSCRIBE
              <span className="arrow-icon">→</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;