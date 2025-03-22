import "./About.css";
import Newsletter from '../Newsletter/Newsletter'

const About = () => {
  return (
    <section className="about-page">
      <div className="about-container">
        <div className="about-header">
          <h1>About AdaptIQ Ai</h1>
        </div>
        <div className="about-image">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
            alt="Person using modern learning technology"
          />
        </div>
        <div className="mission-section">
          <h2>OUR MISSION IN A NUTSHELL</h2>
          <h3>To bring cutting-edge learning to all students</h3>
          <p>
            Our aim is to transform education with the capabilities of AI and empower every child to
            discover their full potential and become the best version of themselves. Watch the video below
            for a look into how the AdaptIQ Ai tablet interface engages students with customized learning
            pathways and tracks their progress.
          </p>
        </div>

        <div className="leadership-section">
          <h2>Leadership Team</h2>

          <div className="leadership-cards">
            <div className="leadership-card">
              <div className="leader-image">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=688&q=80" alt="Dr. Faustina Ama" />
              </div>
              <div className="leader-info">
                <h3>Dr. Faustina Ama</h3>
                <p className="leader-title">Co-Founder</p>
                <p className="leader-title">U.S. Division President</p>

                <div className="leader-social">
                  <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
                  <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                </div>

                <p className="leader-bio">
                  Faustina is a pioneering figure in the field of AI-powered education.
                </p>
                <p className="leader-bio">
                  She received her Ph.D. in Intelligent Science and Systems from Kwame Nhrumah University of Science
                  and Technology and serves as a visiting Professor at The Research Institute for Innovation
                  and Technology in Education (UNIR iTED).
                </p>
              </div>
            </div>

            <div className="leadership-card">
              <div className="leader-image">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80" alt="Dr. Samuel Owusu" />
              </div>
              <div className="leader-info">
                <h3>Dr. David</h3>
                <p className="leader-title">Chief Technology Officer</p>
                <p className="leader-title">AI Research Lead</p>

                <div className="leader-social">
                  <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
                  <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                </div>

                <p className="leader-bio">
                  David is the Founder and Chief Education Technology Scientist of AdaptIQ AI learning, one of Ghana's top AI unicorns.
                </p>
                <p className="leader-bio">
                  He is a first-prize winner of the Chinese Mathematical Olympiad and entered Kwame Nhrumah University's esteemed Computer Science Experimental Program while still in high school.
                </p>
              </div>
            </div>

            <div className="leadership-card">
              <div className="leader-image">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80" alt="Dr. William Kofi Owusu" />
              </div>
              <div className="leader-info">
                <h3>Dr. William Kofi Owusu</h3>
                <p className="leader-title">Chief Learning Officer</p>
                <p className="leader-title">Curriculum Director</p>

                <div className="leader-social">
                  <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
                  <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                </div>

                <p className="leader-bio">
                  Dr. William Kofi Owusu oversees our educational content and curriculum development, ensuring that our AI-powered platform delivers effective learning experiences.
                </p>
                <p className="leader-bio">
                  With a Ph.D. in Educational Psychology and 20 years of experience in curriculum design, he brings deep expertise in how children learn and develop across different subjects and age groups.
                </p>
              </div>
            </div>

            <div className="leadership-card">
              <div className="leader-image">
                <img src="https://images.unsplash.com/photo-1519085360753-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80" alt="Michael Adjei" />
              </div>
              <div className="leader-info">
                <h3>Roger</h3>
                <p className="leader-title">Chief Operations Officer</p>
                <p className="leader-title">Global Expansion Director</p>

                <div className="leader-social">
                  <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
                  <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                </div>

                <p className="leader-bio">
                  Roger leads our global operations and expansion strategy, bringing AdaptIQ to learning centers worldwide.
                </p>
                <p className="leader-bio">
                  With an MBA from Harvard Business School and experience scaling educational technology companies across five continents, he ensures that our innovative learning solutions reach students everywhere.
                </p>
              </div>
            </div>

            <div className="leadership-card">
              <div className="leader-image">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" alt="Flamy" />
              </div>
              <div className="leader-info">
                <h3>Flamy</h3>
                <p className="leader-title">Director</p>
                <p className="leader-title">U.S. Math Curriculumr</p>

                <div className="leader-social">
                  <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
                  <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                </div>

                <p className="leader-bio">
                  Flamy has over 20 years of experience in education, including a decade as classroom teacher.
                </p>
                <p className="leader-bio">
                  With a master's in Curriculum and Instruction, he contributed to KNUST Education's Everyday Mathematics program and later joined Age of Learning, where he designed curriculum for My Math Academy and ABCMouse. 
                </p>
              </div>
            </div>

            <div className="leadership-card">
              <div className="leader-image">
                <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80" alt="Walter" />
              </div>
              <div className="leader-info">
                <h3>Walter</h3>
                <p className="leader-title">Advisory Board Chairman</p>

                <div className="leader-social">
                  <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
                  <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                </div>

                <p className="leader-bio">
                  Walter is an American business executive, author, and angel investor who served as Apple Computer's First Vice President of Education.
                </p>
                <p className="leader-bio">
                  Walter has since launched several successful startups and, as an active angel investor, invested in various tech and media startups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Newsletter />
    </section>
  );
};

export default About;
