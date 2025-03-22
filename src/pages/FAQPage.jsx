import React from 'react';
import FAQ from '../components/FAQ/FAQ'
import './FAQPage.css';
import { Link } from 'react-router-dom';
import LeafIcon from '../assets/leaf-icon.svg'; // Using the existing SVG file

const FAQPage = () => {
  return (
    <div className="faq-page">
      <div className="faq-banner">
        <div className="faq-banner-container">
          <div className="faq-banner-text">
            <h1>Frequently Asked Questions</h1>
          </div>
          <div className="faq-banner-image">
            <img
              src="https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
              alt="Students using AdaptIQ learning platform"
            />
          </div>
        </div>
      </div>
      <div className="faq-content">
        <FAQ />
      </div>
      
      <div className="more-questions">
        <div className="more-questions-container">
          <div className="more-questions-icon">
            <img src={LeafIcon} alt="Leaf icon" />
          </div>
          <div className="more-questions-content">
            <h2>Still have questions?</h2>
            <p>
              Whether you are looking to find a learning center near you or
              interested in franchising opportunities, we can help answer
              your questions.
            </p>
            <Link to="/contact" className="contact-button">CONTACT US</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
