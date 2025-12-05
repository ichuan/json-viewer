import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; 2024 JSON Viewer. All rights reserved.</p>
        <p>
          <a
            href="https://github.com/ichuan/json-viewer"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
};