import React from 'react';
import logoImage from './Lycée Saint Alexandre Sauli emblem.png';

function Logo() {
  return (
    <div className="logo">
      <img 
        src={logoImage}
        alt="Lycée Saint Alexandre Sauli TVET - MUHURA"
        className="logo-image"
      />
      <span className="logo-text">Lycée Saint Alexandre Sauli</span>
    </div>
  );
}

export default Logo;
