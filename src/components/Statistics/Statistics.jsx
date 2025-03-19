import "./Statistics.css";

const Statistics = () => {
  return (
    <section className="statistics">
      <div className="statistics-container">
      <h3 className="numbers">AdaptIQ by the Numbers</h3>
        <div className="statistics-grid">
          <div className="statistic-card">
            <div className="statistic-number">25%</div>
            <div className="statistic-text">Improvement in Math Scores in Just One Semester</div>
          </div>
          <div className="statistic-card">
            <div className="statistic-number">10 Billion</div>
            <div className="statistic-text">Learning Behaviors</div>
          </div>
          <div className="statistic-card">
            <div className="statistic-number">10k</div>
            <div className="statistic-text">Nano-level Learning Objectives</div>
          </div>
          <div className="statistic-card">
            <div className="statistic-number">3,000+</div>
            <div className="statistic-text">Worldwide Learning Centers</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Statistics;