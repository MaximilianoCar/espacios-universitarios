//import React from 'react';

const NotificationBadge = ({ count, loading = false }) => {
  if (loading) {
    return (
      <div className="absolute -top-1 -right-1">
        <div className="h-3 w-3 bg-yellow-400 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (!count || count === 0) {
    return null;
  }

  return (
    <div className="absolute -top-2 -right-2">
      <div className="relative">
        {/* Efecto de pulso suave */}
        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>

        {/* Badge principal */}
        <div className="relative bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
          {count > 9 ? '9+' : count}
        </div>

        {/* Efecto de brillo */}
        <div className="absolute top-1 left-1 h-1 w-1 bg-white rounded-full opacity-60"></div>
      </div>
    </div>
  );
};

export default NotificationBadge;
