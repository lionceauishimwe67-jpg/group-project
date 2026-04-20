import React from 'react';

function Contact() {
  return (
    <div className="page">
      <h1>Contact Us</h1>
      <p className="tagline">Get in touch with Lycee du Muhura</p>
      
      <div className="contact-container">
        <div className="contact-info">
          <h2>Contact Information</h2>
          <div className="info-item">
            <h3>📍 Address / Aho Duherereye</h3>
            <p><strong>Lycée du Muhura</strong><br/>Muhura Sector, Gatsibo District<br/>Eastern Province, Rwanda</p>
          </div>
          <div className="info-item">
            <h3>📞 Phone / Telephone</h3>
            <p>Main Office: +250 78X XXX XXX<br/>Admissions: +250 78X XXX XXX</p>
          </div>
          <div className="info-item">
            <h3>Email</h3>
            <p>info@lyceedumuhura.edu<br/>admissions@lyceedumuhura.edu</p>
          </div>
          <div className="info-item">
            <h3>Office Hours</h3>
            <p>Monday - Friday: 8:00 AM - 5:00 PM<br/>Saturday: 9:00 AM - 12:00 PM</p>
          </div>
        </div>
        
        <div className="contact-form">
          <h2>Send us a Message</h2>
          <form>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" />
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input type="text" id="subject" name="subject" required />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows="5" required></textarea>
            </div>
            <button type="submit" className="submit-btn">Send Message</button>
          </form>
        </div>
      </div>

      <div className="map-section">
        <h2>📍 Our Location / Aho Duherereye</h2>
        <div className="map-container">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8189!2d30.0619!3d-1.9441!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwNTYnMzguOCJTIDMwwrAwMyczMi44IkU!5e0!3m2!1sen!2srw!4v1609459200000!5m2!1sen!2srw"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Lycee du Muhura Location"
          ></iframe>
        </div>
      </div>
    </div>
  );
}

export default Contact;
