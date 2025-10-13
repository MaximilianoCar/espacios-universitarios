import React from 'react';

const Modal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Fondo semi-transparente */}
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      {/* Contenido del modal */}
      <div className="bg-white rounded-lg p-6 z-10 max-w-md mx-auto">
        {children}
      </div>
    </div>
  );
};

export default Modal;
