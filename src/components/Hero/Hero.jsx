import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-content">
          <h1>The Future of Learning is Here</h1>
          <p>The most advanced learning technology in the world is finally coming to a city near you.</p>
        </div>
        <div className="hero-image">
          <img src="/src/assets/hero-image.png" alt="Person holding a blue book" />
        </div>
      </div>
    </section>
  );
};

export default Hero;