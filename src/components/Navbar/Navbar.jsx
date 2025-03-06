import { useState } from 'react';
import './Navbar.css';
import Logo from '../../assets/Logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <a href="/"><img src={Logo} alt="AdaptIQ Logo" /></a>
        </div>

        <div className={`navbar-menu ${isOpen ? 'active' : ''}}`}>
          <div className="nav-links">
            <a href="/about" className="nav-item">About</a>
            <a href="/faqs" className="nav-item">FAQs</a>
            <a href="/contact" className="nav-item">Contact Us</a>
          </div>
          <button className="franchise-button">OWN A FRANCHISE</button>
        </div>

        <div 
          className={`hamburger ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;