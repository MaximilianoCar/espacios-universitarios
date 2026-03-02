// src/components/ModalCalendar.jsx
import React from 'react';

const ModalCalendar = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col relative overflow-hidden"
        onClick={e => e.stopPropagation()} // Evita que el modal se cierre al hacer click dentro
      >
        {children}
      </div>
    </div>
  );
};

export default ModalCalendar;
