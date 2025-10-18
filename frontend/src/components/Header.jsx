import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // Importar Redux hooks
import { logoutAndRedirect } from '../features/auth/authActions'; // Acción de cerrar sesión

import ucvlogo from '../assets/ucvlogo1.png'; // Actualizar la ruta al logo

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
      {' '}
      {/* Cambia el fondo al color azul #3969B1 */}
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <img src={ucvlogo} alt="Logo" className="h-10 mr-2" />
          <span className="text-white text-xl font-bold">
            Universidad Central de Venezuela
          </span>
        </div>

        {/* Menu */}
        <div className="hidden md:flex space-x-4">
          {/* Links que siempre se muestran */}
          <Link to="/events" className="text-white hover:text-gray-300">
            Eventos
          </Link>
          {showSpacesLink && (
            <Link to="/rooms" className="text-white hover:text-gray-300">
              Espacios
            </Link>
          )}

          {/* Mostrar links según el estado de autenticación */}
          {isAuthenticated ? (
            <>
              <Link to="/home" className="text-white hover:text-gray-300">
                Panel
              </Link>
              <button
                onClick={handleLogout}
                className="text-white hover:text-gray-300 ml-4"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link to="/login" className="text-white hover:text-gray-300">
              Iniciar Sesión
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#3969B1]">
          <Link
            to="/events"
            className="block px-4 py-2 text-white hover:bg-blue-600"
          >
            Eventos
          </Link>
          <Link
            to="/rooms"
            className="block px-4 py-2 text-white hover:bg-blue-600"
          >
            Espacios
          </Link>

          {/* Mostrar el enlace "Home" y "Cerrar Sesión" solo si está autenticado */}
          {isAuthenticated ? (
            <>
              <Link
                to="/home"
                className="block px-4 py-2 text-white hover:bg-blue-600"
              >
                Panel
              </Link>
              <button
                onClick={handleLogout}
                className="block px-4 py-2 text-white hover:bg-blue-600"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="block px-4 py-2 text-white hover:bg-blue-600"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Header;
