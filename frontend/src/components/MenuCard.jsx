// src/components/MenuCard.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // 👈 IMPORTAR LINK
import NotificationBadge from './NotificationBadge';

const MenuCard = ({
  title,
  description,
  link,
  icon,
  onClick,
  isButton,
  disabled,
  badgeCount,
  badgeLoading = false,
  approvedCount = 0,
  deniedCount = 0,
  pendingCount = 0,
  showMultipleBadges = false,
}) => {
  const cardClasses = `
    relative bg-white shadow-lg rounded-lg p-6 
    transform transition-all duration-300 min-h-[215px] 
    flex flex-col justify-between border-2 border-transparent
    ${
      disabled
        ? 'opacity-50 cursor-not-allowed grayscale'
        : 'hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 cursor-pointer'
    }
    ${isButton ? 'text-left w-full' : ''}
  `;

  const CardContent = (
    <div className="flex flex-col justify-between h-full">
      {/* Icono con badges */}
      <div className="relative inline-block">
        <div className="text-4xl mb-4 transform transition-transform group-hover:scale-110">
          {icon}
        </div>

        {/* BADGES MÚLTIPLES */}
        {showMultipleBadges ? (
          <div className="absolute -top-2 -right-2 flex flex-col gap-1">
            {/* Badge de Aprobados */}
            {approvedCount > 0 && (
              <div className="relative">
                <div className="relative bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                  {approvedCount > 9 ? '9+' : approvedCount}
                </div>
              </div>
            )}

            {/* Badge de Denegados */}
            {deniedCount > 0 && (
              <div className="relative">
                <div className="relative bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                  {deniedCount > 9 ? '9+' : deniedCount}
                </div>
              </div>
            )}

            {/* Badge de Pendientes */}
            {pendingCount > 0 && (
              <div className="relative">
                <div className="relative bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Badge simple (comportamiento original)
          <NotificationBadge count={badgeCount} loading={badgeLoading} />
        )}
      </div>

      {/* Contenido textual */}
      <div className="flex-grow">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>

      {/* Indicador sutil de hover */}
      {!disabled && (
        <div className="mt-3 text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {isButton ? 'Haz clic para continuar →' : 'Ver más detalles →'}
        </div>
      )}
    </div>
  );

  // Render como botón
  if (isButton && (onClick || disabled)) {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        className={`${cardClasses} group`}
        disabled={disabled}
      >
        {CardContent}
      </button>
    );
  }

  // Render como enlace
  if (link && !disabled) {
    return (
      <Link
        to={link}
        className={`${cardClasses} group no-underline hover:no-underline`}
      >
        {CardContent}
      </Link>
    );
  }

  // Render deshabilitado (sin interacción)
  return (
    <div className={`${cardClasses} group no-underline hover:no-underline`}>
      {CardContent}
    </div>
  );
};

export default MenuCard;
