import "./About.css";

const About = () => {
  return (
    <section className="about">
      <div className="about-container">
        <div className="about-header">
          <h2>What is AdaptIQ?</h2>
        </div>
        <div className="about-content">
          <div className="about-text">
            <h3>
              Personalized Learning for All Students, from Struggling to
              Advanced
            </h3>
            <p>
              Trusted in over 3,000 locations worldwide, AdaptIQ is an
              advanced tutoring system designed to help children excel, whether
              they're struggling or gifted. Using a smart-learning tablet in our
              physical centers, your child works on personalized lessons that
              adjust in real time to their strengths and challenges. While AI
              customizes the learning path, the teaching comes from mini lessons
              by award-winning educators.
            </p>
          </div>
          <div className="about-image">
            <img src="/src/assets/about-image.png" alt="AI Learning Platform" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
