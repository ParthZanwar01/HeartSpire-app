import React from 'react';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <div className="logo">💖 HeartSpire</div>
          <div className="tagline">Your Pregnancy Health Companion</div>
        </div>

        <div className="hero-section">
          <h1>Take Control of Your Pregnancy Health</h1>
          <p className="hero-description">
            Scan supplements, track vitamins, and get personalized recommendations 
            designed specifically for expecting mothers.
          </p>
          <div className="cta-buttons">
            <button className="primary-button">Download App</button>
            <button className="secondary-button">Learn More</button>
          </div>
        </div>

        <div className="features-section">
          <h2>Everything You Need for a Healthy Pregnancy</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📷</div>
              <h3>Smart Supplement Scanning</h3>
              <p>Scan supplement labels with AI-powered analysis to ensure safety during pregnancy</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💊</div>
              <h3>Vitamin Tracking</h3>
              <p>Track your daily vitamins and get personalized reminders tailored to your trimester</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Privacy First</h3>
              <p>Your health data is encrypted and secure. We never sell your personal information</p>
            </div>
          </div>
        </div>

        <div className="download-section">
          <h2>Available Now</h2>
          <p>Download HeartSpire and start your journey to a healthier pregnancy</p>
          <div className="download-buttons">
            <button className="download-button ios">📱 Download for iOS</button>
            <button className="download-button android">🤖 Download for Android</button>
          </div>
        </div>

        <div className="footer">
          <p>&copy; 2024 HeartSpire. All rights reserved.</p>
          <div className="footer-links">
            <button className="footer-link">Privacy Policy</button>
            <button className="footer-link">Support</button>
            <button className="footer-link">Contact</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

