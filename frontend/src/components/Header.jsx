import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutAndRedirect } from '../features/auth/authActions';

import ucvlogo from '../assets/ucvlogo1.png';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Obtener datos del usuario y autenticación del estado de Redux
  const { user, role, isAuthenticated } = useSelector(state => state.auth);
  const showSpacesLink = role !== 'visitor' && role !== 'pending';

  // Manejar el cierre de sesión
  const handleLogout = () => {
    dispatch(logoutAndRedirect(navigate));
  };

  return (
    <nav className="bg-[#3969B1] p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <img src={ucvlogo} alt="Logo" className="h-10 mr-2" />
          <span className="text-white text-xl font-bold">
            Universidad Central de Venezuela
          </span>
        </div>

        {/* Menu de escritorio - SOLO se muestra si está autenticado */}
        {isAuthenticated && (
          <div className="hidden md:flex space-x-4">
            {/* Links que siempre se muestran para usuarios autenticados */}
            <Link to="/events" className="text-white hover:text-gray-300">
              Eventos
            </Link>
            {showSpacesLink && (
              <Link to="/rooms" className="text-white hover:text-gray-300">
                Espacios
              </Link>
            )}

            {/* Links para usuarios autenticados */}
            <Link to="/home" className="text-white hover:text-gray-300">
              Panel
            </Link>
            <button
              onClick={handleLogout}
              className="text-white hover:text-gray-300 ml-4"
            >
              Cerrar Sesión
            </button>
          </div>
        )}

        {/* Si NO está autenticado, mostrar solo el botón de login en escritorio */}
        {!isAuthenticated && (
          <div className="hidden md:flex space-x-4">
            <Link to="/login" className="text-white hover:text-gray-300">
              Iniciar Sesión
            </Link>
          </div>
        )}

        {/* Mobile Menu Button - SOLO se muestra si está autenticado */}
        {isAuthenticated && (
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        )}

        {/* Si NO está autenticado, mostrar botón de login en móvil */}
        {!isAuthenticated && (
          <Link
            to="/login"
            className="md:hidden text-white hover:text-gray-300"
          >
            Iniciar Sesión
          </Link>
        )}
      </div>

      {/* Mobile Menu - SOLO se muestra si está autenticado y el menú está abierto */}
      {isAuthenticated && menuOpen && (
        <div className="md:hidden bg-[#3969B1]">
          <Link
            to="/events"
            className="block px-4 py-2 text-white hover:bg-blue-600"
            onClick={() => setMenuOpen(false)}
          >
            Eventos
          </Link>
          {showSpacesLink && (
            <Link
              to="/rooms"
              className="block px-4 py-2 text-white hover:bg-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              Espacios
            </Link>
          )}
          <Link
            to="/home"
            className="block px-4 py-2 text-white hover:bg-blue-600"
            onClick={() => setMenuOpen(false)}
          >
            Panel
          </Link>
          <button
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-white hover:bg-blue-600"
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
};

export default Header;
