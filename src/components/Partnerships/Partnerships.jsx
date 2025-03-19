import React from 'react';
import './Partnerships.css';

const Partnerships = () => {
  return (
    <section className="partnerships">
      <div className="partnerships-container">
        <h2>Our Partnerships</h2>
        <div className="partnership-logos">
          <div className="partnership-logo-item">
            <img src="/src/assets/PartnerShip-images/harvardPic.jpg" alt="Harvard University" />
          </div>
          <div className="partnership-logo-item">
            <img src="/src/assets/PartnerShip-images/melloUniPic.jpg" alt="Carnegie Mellon University" />
          </div>
          <div className="partnership-logo-item">
            <img src="/src/assets/PartnerShip-images/sriPic.jpg" alt="SRI" />
          </div>
          <div className="partnership-logo-item">
            <img src="/src/assets/PartnerShip-images/stanfordPic.png" alt="Stanford University" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partnerships;