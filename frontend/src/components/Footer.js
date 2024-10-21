import React from 'react';

const footerStyle = {
  backgroundColor: '#2c2c2c',
  color: '#ffffff',
  padding: '8px',
  textAlign: 'center',
  position: 'fixed',
  left: 0,
  bottom: 0,
  width: '100%',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: '12px',
  zIndex: 1000,
};

const linkStyle = {
  color: '#ffffff',
  textDecoration: 'none',
};

function Footer() {
  return (
    <footer style={footerStyle}>
      <a href="https://salzstudio.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>
        Developed in Florida by Salz Studio & DevStack.One
      </a>
    </footer>
  );
}

export default Footer;
