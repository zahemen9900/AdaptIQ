import './Hero.css';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-content">
          <h1>The Future of Learning is Here</h1>
          <p>The most advanced learning technology in the world is finally coming to a city near you.</p>
          <Link to="/signup" className="hero-signup-link">
            <button className="hero-signup-button">Sign Up Now</button>
          </Link>
        </div>
        <div className="hero-image">
          <img 
            src="/src/assets/HeroImg.png"
            alt="Person using modern learning technology"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;