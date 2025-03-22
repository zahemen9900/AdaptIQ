import React from 'react';
import './Footer.css';
import { FaYoutube, FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import Logo from '../../assets/Logo.png';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-logo">
            <img src={Logo} alt="AdaptIQ AI Logo" />
          </div>
          
          <nav className="footer-nav">
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><a href="#">Own a Franchise</a></li>
              <li><Link to="/contactUs">Contact Us</Link></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </nav>
          
          <div className="footer-newsletter">
            <h3>Stay ahead of the curve and sign up for our newsletter!</h3>
            <div className="newsletter-form">
              <input type="email" placeholder="Email Address" />
              <button className="subscribe-btn">
                SUBSCRIBE
                <span className="arrow-icon">→</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">AdaptIQ Ai Ghana</a>
          </div>
          
          <div className="footer-copyright">
            &copy; Copyright 2025 AdaptIQ Ai
          </div>
          
          <div className="footer-social">
            <a href="#" aria-label="YouTube"><FaYoutube /></a>
            <a href="#" aria-label="GitHub"><FaGithub /></a>
            <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
            <a href="#" aria-label="Twitter"><FaTwitter /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;