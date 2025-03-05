import "./Featured.css";

const Featured = () => {
  return (
    <section className="featured">
      <div className="featured-container">
        <h2>As Featured On</h2>
        <div className="featured-logos">
          <div className="logo-item">
            <img src="/src/assets/featured/bloomberg.png" alt="Bloomberg Logo" />
          </div>
          <div className="logo-item">
            <img src="/src/assets/featured/wsj.png" alt="Wall Street Journal Logo" />
          </div>
          <div className="logo-item">
            <img src="/src/assets/featured/cnbc.png" alt="CNBC Logo" />
          </div>
          <div className="logo-item">
            <img src="/src/assets/featured/edsurge.png" alt="EdSurge Logo" />
          </div>
          <div className="logo-item">
            <img src="/src/assets/featured/forbes.png" alt="Forbes Logo" />
          </div>
          <div className="logo-item">
            <img src="/src/assets/featured/fortune.png" alt="Fortune Logo" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Featured;