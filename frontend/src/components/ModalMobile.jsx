import React from 'react';

const ModalMobile = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-start pt-4">
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-[85vw] max-w-md mx-auto my-auto max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default ModalMobile;
