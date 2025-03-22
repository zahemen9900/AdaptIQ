import React from 'react';
import './Contact.css';
import PIC from '../../assets/picc.svg';

const Contact = () => {
  return (
    <section className="contact-section">
      <div className="contact-container">
        <div className="logo-icon">
          <img src={PIC} alt="Leaf icon" />
        </div>
        <div className="contact-text">
          <h2>Still have questions about AdaptIQ AI?</h2>
        </div>
        <div className="contact-button-container">
          <a href="/contactUs" className="contact-button">
            CONTACT US
            <span className="arrow-icon">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Contact;