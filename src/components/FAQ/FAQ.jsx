import { useState } from "react";
import "./FAQ.css";

const FAQ = () => {
  const [activeQuestion, setActiveQuestion] = useState(null);

  const toggleQuestion = (index) => {
    setActiveQuestion(activeQuestion === index ? null : index);
  };

  const faqItems = [
    {
      question: "What is AdaptIQ Ai & how does it work?",
      answer:
        "AdaptIQ AI is an advanced adaptive learning system that uses artificial intelligence to personalize education. It works by analyzing each student's learning patterns, strengths, and weaknesses to create customized learning paths. Our smart tablets deliver interactive lessons that adjust in real-time based on student performance, ensuring efficient and effective learning.",
    },
    {
      question: "What subjects and grade levels does AdaptIQ Ai cover?",
      answer:
        "AdaptIQ AI covers a comprehensive range of subjects including Mathematics, Science, English, and more. Our curriculum spans from elementary through high school levels, with specialized content for each grade. The adaptive system ensures that students receive age-appropriate and curriculum-aligned material that challenges them at their individual level.",
    },
    {
      question: "How is AdaptIQ Ai different from traditional tutoring?",
      answer:
        "Unlike traditional tutoring that follows a one-size-fits-all approach, AdaptIQ AI creates a personalized learning experience for each student. Our AI-powered system identifies knowledge gaps with precision, adapts content in real-time, and provides immediate feedback. This allows students to progress at their optimal pace, focusing on areas that need improvement while quickly advancing through mastered concepts.",
    },
    {
      question:
        "What makes AdaptIQ Ai different from traditional services like Kumon and Mathnasium?",
      answer:
        "AdaptIQ AI distinguishes itself from services like Kumon and Mathnasium through our advanced AI technology. While traditional services rely on standardized worksheets and manual assessment, our system uses intelligent adaptive algorithms to create truly personalized learning paths. Our nano-level knowledge point system breaks down concepts more precisely, our real-time adaptation adjusts difficulty instantly, and our comprehensive analytics provide deeper insights into learning progress.",
    },
    {
      question:
        "Is AdaptIQ Ai only for struggling students, or can high-achievers benefit too?",
      answer:
        "AdaptIQ Ai's adaptive learning platform is designed to support students at every level, from those who are struggling to advanced and even gifted learners. The platform tailors its approach to each student's unique needs, factoring in preferred learning styles and evolving over time to match their progress and abilities. Whether a student needs to catch up or is looking for a greater challenge, Squirrel Ai provides a personalized learning experience that benefits everyone.",
    },
    {
      question:
        "How much does AdaptIQ Ai cost?",
      answer:
        "AdaptIQ Ai operates on a flat enrollment fee model, with students attending regularly, similar to a gym membership. We offer flexible payment options to accommodate families. Since most of our learning centers are independently owned and operated, we recommend contacting your nearest center for detailed information about tuition, fees, and available payment plans.",
    },
    {
        question:
          "Where is the closest AdaptIQ Ai learning center?",
        answer:
          "We are in the process of opening our first AdaptIQ Ai learning centers in California and New York, with plans to expand rapidly. To be notified about new locations as they open, sign up for our mailing list and stay updated on our latest expansions.",
      },
      {
        question:
          "How does AdaptIQ Ai protect my data and privacy?",
        answer:
          "AdaptIQ Ai North America is an independent American company that licenses its technology from AdaptIQ Ai in China. All personal data collected by AdaptIQ Ai North America stays securely within the United States and is never shared outside the country. We are committed to protecting user privacy and comply with all applicable U.S. data protection laws and industry standards. We implement strict security measures to safeguard personal information and ensure that student data is handled responsibly. For a detailed breakdown of what data we collect and how it is used, please review our Privacy Policy.",
      },
      {
        question:
          "How can I open my own AdaptIQ Ai learning center?",
        answer:
          "AdaptIQ Ai offers exciting franchising opportunities for entrepreneurs. Qualified individuals can even own multiple centers. To learn more about this opportunity—including qualifications, responsibilities, and potential financial returns—visit our Own a Franchise page for detailed information.",
      },
      {
        question:
          "How can I invest in AdaptIQ Ai?",
        answer:
          "If you're interested in investment opportunities with AdaptIQ Ai, we'd love to hear from you. Visit our Contact Us page to get in touch and learn more.",
      },
      {
        question:
          "How can I work for AdaptIQ Ai?",
        answer:
          "We're always looking for talented and passionate individuals to join our team! If you're interested in working with us, we'd love to hear from you. Visit our Careers page to see any open positions or to send us a message. We look forward to connecting with you!",
      },
  ];

  return (
    <section className="faq">
      <div className="faq-container">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className={`faq-item ${activeQuestion === index ? "active" : ""}`}
            >
              <div
                className="faq-question"
                onClick={() => toggleQuestion(index)}
              >
                <h3>{item.question}</h3>
                <div className="faq-icon">
                  <span className="plus">+</span>
                </div>
              </div>
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
