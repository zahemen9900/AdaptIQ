import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import Logo from '../../assets/Logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/"><img src={Logo} alt="AdaptIQ Logo" /></Link>
        </div>

        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <div className="nav-links">
            <Link to="/about" className="nav-item">About</Link>
            <Link to="/pages" className="nav-item">FAQs</Link>
            <Link to="/contactUs" className="nav-item">Contact Us</Link>
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