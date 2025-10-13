// src/components/Layout.js
import React from 'react';
import fondoImagen from '../assets/ucvreloj.png';

const Layout = ({ children }) => {
  return (
    <div
      className="min-h-screen bg-cover bg-center md:bg-top bg-fixed"
      style={{ backgroundImage: `url(${fondoImagen})` }}
    >
      {children}
    </div>
  );
};

export default Layout;
