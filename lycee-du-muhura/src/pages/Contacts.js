import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Building, Users, Calendar, Share2 } from 'lucide-react';
import './Contacts.css';

function Contacts() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="contacts-page">
      <div className="contacts-hero">
        <div className="hero-content">
          <h1>Contact Us</h1>
          <p>We're here to help. Reach out to us for any questions or concerns.</p>
        </div>
      </div>

      <div className="contacts-container">
        <div className="contact-info-section">
          <h2>Get in Touch</h2>
          
          <div className="contact-cards">
            <div className="contact-card">
              <div className="card-icon">
                <Building size={32} />
              </div>
              <h3>School Address</h3>
              <p>Lycee du Muhura</p>
              <p>123 Education Street</p>
              <p>Kigali, Rwanda</p>
            </div>

            <div className="contact-card">
              <div className="card-icon">
                <Phone size={32} />
              </div>
              <h3>Phone Numbers</h3>
              <p>+250 788 123 456</p>
              <p>+250 728 987 654</p>
              <p>Office: +250 252 111 222</p>
            </div>

            <div className="contact-card">
              <div className="card-icon">
                <Mail size={32} />
              </div>
              <h3>Email Addresses</h3>
              <p>info@lyceemuhura.rw</p>
              <p>admissions@lyceemuhura.rw</p>
              <p>support@lyceemuhura.rw</p>
            </div>

            <div className="contact-card">
              <div className="card-icon">
                <Clock size={32} />
              </div>
              <h3>Office Hours</h3>
              <p>Monday - Friday</p>
              <p>7:00 AM - 5:00 PM</p>
              <p>Saturday: 8:00 AM - 12:00 PM</p>
            </div>
          </div>

          <div className="social-links">
            <h3>Follow Us</h3>
            <div className="social-icons">
              <a href="#" className="social-icon facebook">
                <Share2 size={24} />
              </a>
              <a href="#" className="social-icon twitter">
                <Share2 size={24} />
              </a>
              <a href="#" className="social-icon linkedin">
                <Share2 size={24} />
              </a>
              <a href="#" className="social-icon instagram">
                <Share2 size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="contact-form-section">
          <h2>Send us a Message</h2>
          
          {submitted && (
            <div className="success-message">
              Thank you for your message! We'll get back to you soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </div>
              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="admissions">Admissions</option>
                  <option value="academic">Academic Inquiries</option>
                  <option value="financial">Financial Aid</option>
                  <option value="technical">Technical Support</option>
                  <option value="general">General Inquiry</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                placeholder="How can we help you?"
              />
            </div>

            <button type="submit" className="submit-btn">
              <Send size={18} />
              Send Message
            </button>
          </form>
        </div>
      </div>

      <div className="map-section">
        <div className="map-container">
          <div className="map-placeholder">
            <MapPin size={48} />
            <p>Interactive Map</p>
            <small>Lycee du Muhura, Kigali, Rwanda</small>
          </div>
        </div>
      </div>

      <div className="departments-section">
        <h2>Department Contacts</h2>
        <div className="departments-grid">
          <div className="department-card">
            <div className="dept-icon">
              <Users size={28} />
            </div>
            <h3>Administration</h3>
            <p>Principal's Office</p>
            <p><Mail size={14} /> principal@lyceemuhura.rw</p>
            <p><Phone size={14} /> +250 788 123 456</p>
          </div>

          <div className="department-card">
            <div className="dept-icon">
              <Calendar size={28} />
            </div>
            <h3>Academic Affairs</h3>
            <p>Dean of Studies</p>
            <p><Mail size={14} /> academic@lyceemuhura.rw</p>
            <p><Phone size={14} /> +250 788 123 457</p>
          </div>

          <div className="department-card">
            <div className="dept-icon">
              <Users size={28} />
            </div>
            <h3>Student Services</h3>
            <p>Student Affairs Office</p>
            <p><Mail size={14} /> students@lyceemuhura.rw</p>
            <p><Phone size={14} /> +250 788 123 458</p>
          </div>

          <div className="department-card">
            <div className="dept-icon">
              <Building size={28} />
            </div>
            <h3>Finance Office</h3>
            <p>Bursar's Office</p>
            <p><Mail size={14} /> finance@lyceemuhura.rw</p>
            <p><Phone size={14} /> +250 788 123 459</p>
          </div>
        </div>
      </div>

      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>What are the admission requirements?</h3>
            <p>Admission requirements include completed application form, academic transcripts, birth certificate, and passport photos. Contact our admissions office for detailed requirements.</p>
          </div>
          <div className="faq-item">
            <h3>What is the school calendar?</h3>
            <p>Our academic year runs from September to June, with three terms. We follow the national education calendar with holidays in December and April.</p>
          </div>
          <div className="faq-item">
            <h3>Do you offer financial aid?</h3>
            <p>Yes, we offer scholarships and financial assistance to eligible students based on academic merit and financial need. Contact our finance office for more information.</p>
          </div>
          <div className="faq-item">
            <h3>How can I schedule a school visit?</h3>
            <p>School visits can be scheduled by calling our office or filling out the contact form above. We recommend visiting during school hours to see our facilities in action.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contacts;
