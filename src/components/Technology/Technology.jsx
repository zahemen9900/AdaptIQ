import { useState, useEffect } from "react";
import "./Technology.css";

const Platform = () => {
  const [activeTab, setActiveTab] = useState("accessing");
  const tabs = ["Tablet", "LAM", "IALS"];

  useEffect(() => {
    const interval = setInterval(() => {
      const currentIndex = tabs.indexOf(activeTab);
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex]);
    }, 5000); // Switch every 5 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <section className="technology">
      <div className="technology-container">
        <div className="technology-header">
          <h2>Our Technology</h2>
        </div>
        <nav className="technology-nav">
          <button
            className={`technology-nav-btn ${
              activeTab === "Tablet" ? "active" : ""
            }`}
            onClick={() => setActiveTab("Tablet")}
          >
            Tablet
          </button>
          <button
            className={`technology-nav-btn ${
              activeTab === "LAM" ? "active" : ""
            }`}
            onClick={() => setActiveTab("LAM")}
          >
            LAM
          </button>
          <button
            className={`technology-nav-btn ${
              activeTab === "IALS" ? "active" : ""
            }`}
            onClick={() => setActiveTab("IALS")}
          >
            IALS
          </button>
        </nav>
        <div className="technology-content">
          {activeTab === "Tablet" && (
            <>
              <div className="technology-text">
                <h3>A Look Inside Our Smart Tablets</h3>
                <p>
                  AdaptIQ utilizes specialized smart-learning tablets powered by
                  our proprietary software to deliver a seamless and engaging
                  learning experience to students. Our system fosters a
                  closed-loop feedback mechanism, integrating assessment,
                  practice, learning, testing, and teaching phases seamlessly
                  within a single device.
                </p>
                <button className="technology-cta">
                  WATCH THE WALK-THROUGH VIDEO{" "}
                </button>
              </div>
              <div className="platform-image">
                <img
                  src="/src/assets/Platform-images/accessing-image.png"
                  alt="Student using tablet"
                />
              </div>
            </>
          )}
          {activeTab === "LAM" && (
            <>
              <div className="technology-text">
                <h3>The Large Adaptive Model (LAM)</h3>
                <p>
                  Our flagship technology launched in January 2024 and is
                  transforming personalized learning by integrating adaptive
                  intelligence and multimodal agents. LAM uses vast data,
                  advanced algorithms, and substantial computing power to create
                  a sophisticated system that adapts like a human brain. It
                  enhances knowledge acquisition, communication, and resource
                  generation, significantly improving question accuracy rates
                  from 78% to 93%. With exclusive data from over 24 million
                  students and 10 billion learning behaviors, LAM optimizes
                  learning pathways, identifies strengths and weaknesses, and
                  provides targeted interventions. It tailors personalized
                  learning experiences, engaging students based on their unique
                  personalities and abilities, fostering interest and nurturing
                  potential.
                </p>
              </div>
              <div className="platform-image">
                <img
                  src="/src/assets/Platform-images/Learning-image.png"
                  alt="Interactive learning platform"
                />
              </div>
            </>
          )}
          {activeTab === "IALS" && (
            <>
              <div className="technology-text">
                <h3>Intelligent Adaptive Learning System (IALS)</h3>
                <p>
                  AdaptIQ Intelligent Adaptive Learning System (IALS) can break
                  down knowledge points at the nano-level, refining hundreds of
                  original knowledge points into tens of thousands of smaller
                  and more precise ones. This system provides targeted guidance
                  for students' weak areas, focusing on what they don't
                  understand and helping them learn precisely where they're
                  struggling. Instead of wasting more time on knowledge points
                  they've already mastered, students can genuinely improve their
                  learning efficiency.
                </p>
              </div>
              <div className="technology-image">
                <img
                  src="/src/assets//Platform-images/Practicing-image.png"
                  alt="Student practicing on platform"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Platform;
