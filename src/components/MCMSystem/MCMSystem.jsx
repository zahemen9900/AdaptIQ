import React, { useState } from 'react';
import './MCMSystem.css';
import mcmLogo from '../../assets/mode of thinking.png';

const MCMSystem = () => {
  const [activeTab, setActiveTab] = useState('mcm');

  return (
    <section className="mcm-system">
      <div className="mcm-system-container">
        <div className="mcm-system-header">
          <h2>Beyond Just Test Scores</h2>
        </div>
        
        <div className="mcm-system-nav">
          <button 
            className={`mcm-system-nav-btn ${activeTab === 'mcm' ? 'active' : ''}`}
            onClick={() => setActiveTab('mcm')}
          >
            MCM System
          </button>
          <button 
            className={`mcm-system-nav-btn ${activeTab === 'mode' ? 'active' : ''}`}
            onClick={() => setActiveTab('mode')}
          >
            Mode of Thinking
          </button>
          <button 
            className={`mcm-system-nav-btn ${activeTab === 'capacity' ? 'active' : ''}`}
            onClick={() => setActiveTab('capacity')}
          >
            Capacity
          </button>
          <button 
            className={`mcm-system-nav-btn ${activeTab === 'methodology' ? 'active' : ''}`}
            onClick={() => setActiveTab('methodology')}
          >
            Methodology
          </button>
        </div>
        
        <div className="mcm-system-content">
          {activeTab === 'mcm' && (
            <>
              <div className="mcm-system-image">
                <img src={mcmLogo} alt="MCM System Logo" />
              </div>
              <div className="mcm-system-text">
                <h3>Mode of Thinking, Capacity, and Methodology System</h3>
                <p>
                  The MCM system at Squirrel AI integrates Mode of Thinking, Capacity Building, and Methodology to
                  equip students with both academic knowledge and essential cognitive and problem-solving skills
                  for real-world success.
                </p>
              </div>
            </>
          )}
          
          {activeTab === 'mode' && (
            <>
              <div className="mcm-system-image">
                <img src={mcmLogo} alt="Mode of Thinking Logo" />
              </div>
              <div className="mcm-system-text">
                <h3>Mode of Thinking</h3>
                <p>
                  Mode of Thinking emphasizes applying theoretical concepts to real-world situations, helping
                  students develop a deeper understanding of subjects like physics through practical problem-
                  solving.
                </p>
              </div>
            </>
          )}
          
          {activeTab === 'capacity' && (
            <>
              <div className="mcm-system-image">
                <img src={mcmLogo} alt="Capacity Logo" />
              </div>
              <div className="mcm-system-text">
                <h3>Capacity</h3>
                <p>
                  Capacity focuses on building essential skills that extend beyond academic knowledge, including
                  critical thinking, creativity, collaboration, and communication abilities that prepare students
                  for future challenges.
                </p>
              </div>
            </>
          )}
          
          {activeTab === 'methodology' && (
            <>
              <div className="mcm-system-image">
                <img src={mcmLogo} alt="Methodology Logo" />
              </div>
              <div className="mcm-system-text">
                <h3>Methodology</h3>
                <p>
                  Methodology provides students with effective learning strategies and approaches, teaching them
                  how to learn efficiently, organize information, and apply knowledge across different contexts
                  and disciplines.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default MCMSystem;