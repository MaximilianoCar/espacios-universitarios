import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutAndRedirect } from '../features/auth/authActions';
import {
  FaHome,
  FaCalendarAlt,
  FaDoorOpen,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from 'react-icons/fa';

import ucvlogo from '../assets/ucvlogo1.png';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener datos del usuario y autenticación del estado de Redux
  const { user, role, isAuthenticated } = useSelector(state => state.auth);
  // Mostrar enlace a Espacios: también para usuarios no autenticados
  const isLoginPage = location.pathname === '/login';
  const showSpacesLink =
    isLoginPage ||
    !isAuthenticated ||
    (role && role !== 'visitor' && role !== 'pending');

  // Manejar el cierre de sesión
  const handleLogout = () => {
    dispatch(logoutAndRedirect(navigate));
  };

  // Función para determinar si una ruta está activa
  const isActivePath = path => {
    return location.pathname === path;
  };

  // Clases para los enlaces de navegación
  const getNavLinkClasses = path => {
    const isActive = isActivePath(path);
    const baseClasses =
      'text-white font-medium px-4 py-2 transition-all duration-300 ease-in-out flex items-center';
    const hoverClasses =
      'hover:text-gray-200 hover:translate-y-[-3px] hover:shadow-lg';
    const activeClasses = 'border-b-2 border-white/90 font-bold';

    return `${baseClasses} ${hoverClasses} ${
      isActive ? activeClasses : 'border-b-2 border-transparent'
    }`;
  };

  // Manejar el click en el logo/título para redirigir al panel
  const handleLogoClick = () => {
    if (isAuthenticated) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="bg-[#3969B1] shadow-lg">
      <div className="container mx-auto flex items-center h-16 relative px-4 sm:px-6 lg:px-8">
        {/* Logo y título */}
        <button
          onClick={handleLogoClick}
          className="flex items-center flex-shrink-0 z-10 hover:opacity-90 transition-opacity duration-200"
        >
          <img src={ucvlogo} alt="Logo" className="h-8 md:h-10 mr-3" />
          <span className="text-white text-lg md:text-xl font-bold hidden min-[1300px]:block">
            Universidad Central de Venezuela
          </span>
        </button>

        {/* Menú de escritorio: siempre mostrar enlaces (Panel solo si autenticado) */}
        <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-8">
          {/* Eventos */}
          <Link to="/events" className={getNavLinkClasses('/events')}>
            <FaCalendarAlt className="mr-2" />
            Eventos
          </Link>

          {/* Espacios (condicional) */}
          {showSpacesLink && (
            <Link to="/rooms" className={getNavLinkClasses('/rooms')}>
              <FaDoorOpen className="mr-2" />
              Espacios
            </Link>
          )}

          {/* Panel (solo para usuarios autenticados) */}
          {isAuthenticated && (
            <Link to="/home" className={getNavLinkClasses('/home')}>
              <FaHome className="mr-2" />
              Panel
            </Link>
          )}
        </div>

        {/* cierre de sesión y toggle móvil */}
        <div className="ml-auto flex items-center">
          {isAuthenticated ? (
            <>
              {/* Botón de cerrar sesión en escritorio */}
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:translate-y-[-2px] hover:shadow-lg"
              >
                <FaSignOutAlt className="mr-2" />
                <span className="font-semibold">Cerrar Sesión</span>
              </button>
            </>
          ) : (
            // Botón de login para usuarios no autenticados - NO se muestra en página de login
            !isLoginPage && (
              <Link
                to="/login"
                className="text-white hover:text-gray-300 font-semibold px-4 py-2 transition-all duration-300 ease-in-out hover:translate-y-[-2px]"
              >
                Iniciar Sesión
              </Link>
            )
          )}

          {/* Botón del menú móvil (siempre disponible) */}
          <button
            className="md:hidden text-white p-2 ml-2 transition-transform duration-300 hover:scale-110"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>

      {/* Menú móvil - siempre disponible (links dentro pueden variar según auth) */}
      <div
        className={`md:hidden bg-[#3969B1] transition-all duration-300 ease-in-out ${
          menuOpen
            ? 'max-h-96 opacity-100'
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="py-2 border-t border-white/20">
          <Link
            to="/events"
            className={`flex items-center px-6 py-3 text-white font-medium transition-all duration-300 hover:bg-white/10 hover:translate-x-2 ${
              isActivePath('/events') ? 'bg-white/20 font-bold' : ''
            }`}
            onClick={() => setMenuOpen(false)}
          >
            <FaCalendarAlt className="mr-3" />
            Eventos
          </Link>

          {showSpacesLink && (
            <Link
              to="/rooms"
              className={`flex items-center px-6 py-3 text-white font-medium transition-all duration-300 hover:bg-white/10 hover:translate-x-2 ${
                isActivePath('/rooms') ? 'bg-white/20 font-bold' : ''
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <FaDoorOpen className="mr-3" />
              Espacios
            </Link>
          )}

          {isAuthenticated && (
            <Link
              to="/home"
              className={`flex items-center px-6 py-3 text-white font-medium transition-all duration-300 hover:bg-white/10 hover:translate-x-2 ${
                isActivePath('/home') ? 'bg-white/20 font-bold' : ''
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <FaHome className="mr-3" />
              Panel
            </Link>
          )}

          {isAuthenticated ? (
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="flex items-center w-full text-left px-6 py-3 text-white font-medium transition-all duration-300 hover:bg-white/10 hover:translate-x-2"
            >
              <FaSignOutAlt className="mr-3" />
              Cerrar Sesión
            </button>
          ) : (
            // Si no está autenticado, mostrar enlace a login en el menú móvil (salvo en /login)
            !isLoginPage && (
              <Link
                to="/login"
                className="flex items-center px-6 py-3 text-white font-medium transition-all duration-300 hover:bg-white/10 hover:translate-x-2"
                onClick={() => setMenuOpen(false)}
              >
                <FaSignOutAlt className="mr-3" />
                Iniciar Sesión
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
