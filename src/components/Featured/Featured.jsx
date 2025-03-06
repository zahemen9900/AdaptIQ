import "./Featured.css";

const Featured = () => {
  return (
    <section className="featured">
      <div className="featured-container">
        <h2>As Featured On</h2>
        <div className="featured-logos">
          <div className="logo-item">
            <img src="/src/assets/Featured-images/Bloomberg-Logo.webp" alt="Bloomberg Logo" />
          </div>
          <div className="logo-item">
            <img src="/src/assets/Featured-images/wall-street-journal-logo.png" alt="Wall Street Journal Logo" />
          </div>
          <div className="logo-item">
            <img src="/src/assets/Featured-images/cnbc-logo.webp" alt="CNBC Logo" />
          </div>
          <div className="logo-item">
            <img src="/src/assets/Featured-images/edsurge-logo.png" alt="EdSurge Logo" />
          </div>
          <div className="logo-item">
            <img src="/src/assets/Featured-images/forbes-logo.png" alt="Forbes Logo" />
          </div>
          <div className="logo-item">
            <img src="/src/assets/Featured-images/fortune-logo.webp" alt="Fortune Logo" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Featured;