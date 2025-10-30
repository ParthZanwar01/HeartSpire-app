import React from 'react';
import './App.css';

const App: React.FC = () => {

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <div className="logo">💖 HeartSpire</div>
          <div className="subtitle">Support</div>
        </div>

        <div className="support-content">
          <div className="support-card">
            <h2>Need Help?</h2>
            <p>We're here to help you with any questions about HeartSpire, your pregnancy health companion app.</p>
            <p>For support, please contact us at:</p>
            <div className="email-contact">
              <a href="mailto:parth.zanwar01@gmail.com" className="email-link">
                parth.zanwar01@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="footer">
          <p>&copy; 2024 HeartSpire. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default App;
