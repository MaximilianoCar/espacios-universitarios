import React from 'react';

const HeroSection = ({ title, subtitle, backgroundImage }) => {
  return (
    <section
      className="relative text-white py-20"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="container mx-auto text-center relative">
        <h1 className="text-5xl font-bold">{title}</h1>{' '}
        {/* Mostrará 'Bienvenido, {user}' */}
        {subtitle && <p className="mt-4 text-xl">{subtitle}</p>}
      </div>
    </section>
  );
};

export default HeroSection;
