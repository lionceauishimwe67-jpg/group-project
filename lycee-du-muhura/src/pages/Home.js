import React from 'react';

function Home() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Lycée Saint Alexandre Sauli du Muhura</h1>
          <p className="hero-subtitle">TVET - MUHURA</p>
          <p className="hero-tagline">Excellence in Technical Education, Building Future Leaders</p>
          <div className="hero-buttons">
            <a href="/courses" className="btn-primary">Explore Courses</a>
            <a href="/contact" className="btn-secondary">Contact Us</a>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">Students</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">15+</span>
            <span className="stat-label">Years Experience</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">95%</span>
            <span className="stat-label">Success Rate</span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="section-header">
          <h2>About Our School</h2>
          <div className="section-line"></div>
        </div>
        <p className="about-text">
          Lycée Saint Alexandre Sauli du Muhura is a premier technical and vocational education institution 
          dedicated to providing quality education and fostering academic excellence. We believe in 
          nurturing young minds and preparing them for a successful future in the modern workforce.
        </p>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Choose Us</h2>
          <div className="section-line"></div>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Quality Education</h3>
            <p>Comprehensive curriculum designed to meet international standards and industry needs.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍🏫</div>
            <h3>Expert Faculty</h3>
            <p>Highly qualified teachers dedicated to student success and practical learning.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏢</div>
            <h3>Modern Facilities</h3>
            <p>State-of-the-art classrooms, laboratories, and workshops for hands-on experience.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Career Focus</h3>
            <p>Practical training programs aligned with current market demands.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Industry Partnership</h3>
            <p>Strong connections with local and international companies for internships.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Proven Excellence</h3>
            <p>Consistently ranked among the top TVET institutions in the region.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join us today and transform your future with quality technical education.</p>
          <a href="/student-info" className="btn-primary">View Our Students</a>
        </div>
      </section>
    </div>
  );
}

export default Home;
