import { useState, useEffect } from "react";
import "./Platform.css";

const Platform = () => {
  const [activeTab, setActiveTab] = useState("accessing");
  const tabs = ["accessing", "learning", "practicing", "testing", "tutoring"];

  useEffect(() => {
    const interval = setInterval(() => {
      const currentIndex = tabs.indexOf(activeTab);
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex]);
    }, 5000); // Switch every 5 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <section className="platform">
      <div className="platform-container">
        <div className="platform-header">
          <h2>Our Platform</h2>
        </div>
        <nav className="platform-nav">
          <button
            className={`platform-nav-btn ${
              activeTab === "accessing" ? "active" : ""
            }`}
            onClick={() => setActiveTab("accessing")}
          >
            Accessing
          </button>
          <button
            className={`platform-nav-btn ${
              activeTab === "learning" ? "active" : ""
            }`}
            onClick={() => setActiveTab("learning")}
          >
            Learning
          </button>
          <button
            className={`platform-nav-btn ${
              activeTab === "practicing" ? "active" : ""
            }`}
            onClick={() => setActiveTab("practicing")}
          >
            Practicing
          </button>
          <button
            className={`platform-nav-btn ${
              activeTab === "testing" ? "active" : ""
            }`}
            onClick={() => setActiveTab("testing")}
          >
            Testing
          </button>
          <button
            className={`platform-nav-btn ${
              activeTab === "tutoring" ? "active" : ""
            }`}
            onClick={() => setActiveTab("tutoring")}
          >
            Tutoring
          </button>
        </nav>
        <div className="platform-content">
          {activeTab === "accessing" && (
            <>
              <div className="platform-text">
                <h3>Tailored Learning Paths</h3>
                <p>
                  Each student follows a personalized roadmap designed by our
                  Intelligent Adaptive Learning System (IALS), based on detailed
                  insights from their initial diagnostic test.
                </p>
                <button className="platform-cta">
                  Contact Us To Learn More{" "}
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
          {activeTab === "learning" && (
            <>
              <div className="platform-text">
                <h3>Smart Tablets at Home</h3>
                <p>
                  Our state-of-the-art smart-learning tablets allow your child
                  to continue their personalized learning journey at home or in
                  one of our centers, providing flexibility and consistency
                  wherever they are.
                </p>
                <button className="platform-cta">
                  WATCH THE WALK-THRU VIDEO
                </button>
              </div>
              <div className="platform-image">
                <img 
                  src="/src/assets/Platform-images/Learning-image.png"
                  alt="Interactive learning platform"
                />
              </div>
            </>
          )}
          {activeTab === "practicing" && (
            <>
              <div className="platform-text">
                <h3>Practicing</h3>
                <p>
                  Build confidence with targeted, interactive exercises tailored
                  to each student's needs. Real-time feedback ensures progress
                  every step of the way.
                </p>
              </div>
              <div className="platform-image">
                <img
                  src="/src/assets//Platform-images/Practicing-image.png"
                  alt="Student practicing on platform"
                />
              </div>
            </>
          )}
          {activeTab === "testing" && (
            <>
              <div className="platform-text">
                <h3>Testing</h3>
                <p>
                  Track mastery with ongoing assessments that adapt to your
                  child's progress, ensuring readiness before moving to new
                  challenges.
                </p>
              </div>
              <div className="platform-image">
                <img
                  src="/src/assets/Platform-images/Testing-image.png"
                  alt="Student taking an assessment"
                />
              </div>
            </>
          )}
          {activeTab === "tutoring" && (
            <>
              <div className="platform-text">
                <h3>Tutoring</h3>
                <p>
                  Combining expert guidance and AI-driven tools, our tutoring
                  system personalizes learning for every student, unlocking
                  their full potential.
                </p>
              </div>
              <div className="platform-image">
                <img
                  src="/src/assets/Platform-images/Tutoring-image.png"
                  alt="AI tutoring session"
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
