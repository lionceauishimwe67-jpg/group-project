import React from 'react';

function About() {
  return (
    <div className="page">
      <h1>About Lycée du Muhura</h1>
      
      <div className="content-section">
        <h2>🏫 School Overview</h2>
        <p><strong>Lycée du Muhura</strong> is a prominent secondary school located in Muhura Sector, Gatsibo District, Eastern Province of Rwanda. The school serves as a key educational institution in the region, providing quality secondary education to students from Muhura and surrounding areas.</p>
        <p>The school operates under the Rwanda TVET Board (RTB) and specializes in Advanced Level (A-Level) education, preparing students for the Advanced Certificate of Education (ACE) examinations and future academic pursuits at university level.</p>
      </div>

      <div className="content-section">
        <h2>📍 Location & Contact</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <label>District</label>
            <span>Gatsibo District</span>
          </div>
          <div className="detail-item">
            <label>Sector</label>
            <span>Muhura Sector</span>
          </div>
          <div className="detail-item">
            <label>Province</label>
            <span>Eastern Province</span>
          </div>
          <div className="detail-item">
            <label>Country</label>
            <span>Rwanda</span>
          </div>
        </div>
      </div>

      <div className="content-section">
        <h2>� School Administration</h2>
        <p>Lycée du Muhura is managed by a dedicated team of education professionals under the supervision of the Rwanda TVET Board (RTB):</p>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Headmaster</label>
            <span>Mr. [Headmaster Name]</span>
          </div>
          <div className="detail-item">
            <label>Deputy Headmaster</label>
            <span>Mr. [Deputy Name]</span>
          </div>
          <div className="detail-item">
            <label>Director of Studies</label>
            <span>Mr. [DOS Name]</span>
          </div>
          <div className="detail-item">
            <label>Total Staff</label>
            <span>50+ Teachers & Staff</span>
          </div>
        </div>
        <p style={{marginTop: '15px'}}>The school administration works closely with the Parents' Association and local education authorities to ensure quality education delivery and student welfare.</p>
      </div>

      <div className="content-section">
        <h2>�📚 Academic Programs</h2>
        <p>Lycée du Muhura specializes in Advanced Level (A-Level) education:</p>
        <ul className="values-list">
          <li><strong>Advanced Level (A-Level)</strong> - Senior 4 to Senior 6</li>
          <li>Science and Technology programs</li>
          <li>Humanities and Social Sciences</li>
        </ul>
        <p>Students are prepared for the Advanced Certificate of Education (ACE) examinations, which qualify them for university admission.</p>
      </div>

      <div className="content-section">
        <h2>🎯 Mission</h2>
        <p>To provide quality secondary education that develops students' intellectual capabilities, practical skills, and moral values, preparing them to contribute effectively to Rwanda's development and compete in the global knowledge economy.</p>
      </div>

      <div className="content-section">
        <h2>👁️ Vision</h2>
        <p>To become a center of excellence in secondary education in the Eastern Province, producing well-rounded graduates who excel academically, demonstrate strong character, and are prepared for higher education and professional careers.</p>
      </div>

      <div className="content-section">
        <h2>⭐ Core Values</h2>
        <ul className="values-list">
          <li><strong>Excellence</strong> - Striving for the highest standards in all endeavors</li>
          <li><strong>Integrity</strong> - Upholding honesty and strong moral principles</li>
          <li><strong>Discipline</strong> - Maintaining focus and commitment to goals</li>
          <li><strong>Respect</strong> - Valuing diversity and treating all with dignity</li>
          <li><strong>Community Service</strong> - Contributing positively to society</li>
        </ul>
      </div>

      <div className="content-section">
        <h2>🏆 Achievements</h2>
        <p>Lycée du Muhura has consistently contributed to the educational development of Gatsibo District by:</p>
        <ul className="values-list">
          <li>Producing graduates who pursue higher education in national universities</li>
          <li>Contributing to the reduction of illiteracy in the Eastern Province</li>
          <li>Developing students' skills in science, technology, and innovation</li>
          <li>Fostering national values of unity, patriotism, and self-reliance</li>
        </ul>
      </div>

      <div className="content-section">
        <h2>🤝 Community Engagement</h2>
        <p>The school maintains strong ties with the local community of Muhura Sector and Gatsibo District through:</p>
        <ul className="values-list">
          <li>Community service projects and outreach programs</li>
          <li>Collaboration with local authorities and parents</li>
          <li>Participation in district-level educational initiatives</li>
          <li>Environmental conservation activities</li>
        </ul>
      </div>
    </div>
  );
}

export default About;
