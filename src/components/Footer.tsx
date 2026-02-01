import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <img src="/guin_icon.png" alt="" className="footer-icon" />
        <span className="footer-text">제작: 펭귄은펭귄</span>
      </div>
    </footer>
  );
};

export default Footer;
