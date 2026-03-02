// src/components/ModalMobile.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';

const ModalMobile = ({ children, onClose, title }) => {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header del Modal Móvil */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
        >
          <FaTimes size={20} />
        </button>
      </div>

      {/* Contenido que se estira para llenar la pantalla */}
      <div className="flex-grow overflow-hidden">{children}</div>
    </div>
  );
};

export default ModalMobile;
