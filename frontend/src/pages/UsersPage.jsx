// src/pages/UsersPage.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UpdateUserForm from '../components/UpdateUserForm';
import CreateUserForm from '../components/CreateUserForm';
import SearchBar from '../components/SearchBar';
import PermissionsModal from '../components/PermissionsModal';
import {
  FaArrowLeft,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaKey,
  FaUserPlus,
  FaFilter,
  FaEye,
  FaUser,
  FaBuilding,
  FaUniversity,
  FaInfoCircle,
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from '../utils/swal';

// Definición estática de roles para el menú lateral
const ALL_ROLES = [
  'admin',
  'coordinator',
  'requester',
  'visitor',
  'externalvisitor',
  'pending',
];
const PAGE_SIZE = 25;

const ROLE_TRANSLATIONS = {
  admin: 'Administrador',
  coordinator: 'Coordinador',
  requester: 'Solicitante',
  visitor: 'Visitante',
  externalvisitor: 'Visitante Externo',
  pending: 'Pendiente',
};

// Colores para tipos de usuario basados en isExternal y isCompanyRepresentative
const USER_TYPE_COLORS = {
  internal: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    label: 'Interno',
  },
  external: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: 'text-purple-500',
    label: 'Externo',
  },
  company: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: 'text-green-500',
    label: 'Empresa',
  },
};

// Función para determinar el tipo de usuario basado en isExternal y isCompanyRepresentative
const getUserType = user => {
  if (user.isExternal) {
    return user.isCompanyRepresentative ? 'company' : 'external';
  }
  return 'internal';
};

// Componente para mostrar el tipo de usuario con icono
const UserTypeBadge = ({ user }) => {
  const userType = getUserType(user);
  const typeConfig = USER_TYPE_COLORS[userType];

  return (
    <div
      className={`flex items-center px-3 py-1 rounded-full ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border} border`}
    >
      {userType === 'internal' && <FaUniversity className="mr-1" size={12} />}
      {userType === 'external' && <FaUser className="mr-1" size={12} />}
      {userType === 'company' && <FaBuilding className="mr-1" size={12} />}
      <span className="text-xs font-semibold">{typeConfig.label}</span>
    </div>
  );
};

// Componente Tooltip para mostrar información completa
const Tooltip = ({ content, children, position = 'top' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-block"
      >
        {children}
      </div>
      {showTooltip && content && (
        <div
          className={`absolute z-50 ${positionClasses[position]} bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top'
                ? 'top-full -translate-x-1/2 left-1/2 -mt-1'
                : position === 'bottom'
                  ? 'bottom-full -translate-x-1/2 left-1/2 -mb-1'
                  : position === 'left'
                    ? 'left-full -translate-y-1/2 top-1/2 -mr-1'
                    : 'right-full -translate-y-1/2 top-1/2 -ml-1'
            }`}
          ></div>
        </div>
      )}
    </div>
  );
};

// Componente para mostrar correo truncado con tooltip
const TruncatedEmail = ({ email, maxLength = 30 }) => {
  if (!email) return null;

  const truncated =
    email.length > maxLength
      ? email.substring(0, maxLength - 3) + '...'
      : email;

  if (email.length <= maxLength) {
    return <span className="truncate">{email}</span>;
  }

  return (
    <Tooltip content={email} position="top">
      <span className="truncate cursor-help border-b border-dotted border-gray-400">
        {truncated}
      </span>
    </Tooltip>
  );
};

// Componente para mostrar información de empresa con tooltip
const CompanyInfo = ({ user }) => {
  if (!user.isCompanyRepresentative || !user.companyName) return null;

  const fullInfo = `Empresa: ${user.companyName}${user.companyRif ? `\nRIF: ${user.companyRif}` : ''}`;

  return (
    <Tooltip content={fullInfo} position="top">
      <div className="flex items-center ml-2 text-gray-500 cursor-help">
        <FaBuilding size={12} />
        <FaInfoCircle size={10} className="ml-1" />
      </div>
    </Tooltip>
  );
};

const UsersPage = () => {
  // Datos de la API
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  // Paginación y Filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(ALL_ROLES);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Gestión de UI
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForPermissions, setUserForPermissions] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Estados para móvil
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  // Función central de carga de datos
  const fetchUsers = useCallback(async () => {
    setError('');
    try {
      const rolesQuery = selectedRoles.join(',');

      const response = await axiosInstance.get('/users', {
        params: {
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: searchTerm,
          roles: rolesQuery,
        },
      });

      setUsers(response.data.users || []);
      setTotalUsers(response.data.totalUsers || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error al obtener los usuarios. Intente recargar la página.');
    }
  }, [currentPage, searchTerm, selectedRoles]);

  // Detectar si es móvil
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Ejecutar la carga de usuarios
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Resetear la página a 1 cada vez que cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRoles]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = event => {
      if (openMenuId && !event.target.closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // --------------------------------------------------
  // MANEJO DE ESTADOS Y ACCIONES
  // --------------------------------------------------

  const applyFilters = (
    newSearchTerm = searchTerm,
    newRoles = selectedRoles
  ) => {
    if (currentPage === 1) {
      setSearchTerm(newSearchTerm);
      setSelectedRoles(newRoles);
      fetchUsers();
    } else {
      setSearchTerm(newSearchTerm);
      setSelectedRoles(newRoles);
      setCurrentPage(1);
    }
  };

  const handleRoleChange = role => {
    setSelectedRoles(prevRoles => {
      const newRoles = prevRoles.includes(role)
        ? prevRoles.filter(r => r !== role)
        : [...prevRoles, role];

      applyFilters(searchTerm, newRoles);
      return newRoles;
    });
  };

  const handleSearch = term => {
    applyFilters(term, selectedRoles);
  };

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleManagePermissions = user => {
    // Solo coordinadores pueden tener permisos asignados
    if (user.role === 'coordinator') {
      setUserForPermissions(user);
      setIsModalOpen(true);
    } else {
      Swal.fire({
        title: 'Información',
        text: `Solo los 'coordinadores' pueden tener permisos de dependencias asignados.`,
        icon: 'info',
        confirmButtonColor: '#3085d6',
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUserForPermissions(null);
    fetchUsers();
  };

  const handleUserUpdated = updatedUser => {
    setSelectedUser(null);
    fetchUsers();
  };

  const handleUserCreated = () => {
    setIsCreating(false);
    fetchUsers();
  };

  const handleUpdateUser = user => {
    setSelectedUser(user);
    setIsCreating(false);
    setOpenMenuId(null);
  };

  const handleCreateUser = () => {
    setIsCreating(true);
    setSelectedUser(null);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
  };

  const handleDeleteUser = async userId => {
    const user = users.find(u => u.id === userId);

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará permanentemente al usuario "${user?.name}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Eliminando usuario...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        await axiosInstance.delete(`/users/${userId}`);

        Swal.fire({
          title: '¡Eliminado!',
          text: `El usuario "${user?.name}" ha sido eliminado exitosamente.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
        });

        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al eliminar el usuario. Por favor, intente nuevamente.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      }
    }
    setOpenMenuId(null);
  };

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  // Componente de menú de acciones para móvil
  const MobileActionMenu = ({ user, index }) => {
    const isMenuOpen = openMenuId === user.id;
    const shouldOpenUpward = index > users.length - 3;

    const toggleMenu = e => {
      e.stopPropagation();
      setOpenMenuId(isMenuOpen ? null : user.id);
    };

    const handleUpdateClick = () => {
      handleUpdateUser(user);
    };

    const handlePermissionsClick = () => {
      handleManagePermissions(user);
    };

    const handleDeleteClick = () => {
      handleDeleteUser(user.id);
    };

    return (
      <div className="relative action-menu-container">
        <button
          onClick={toggleMenu}
          className={`p-2 rounded-full text-gray-600 hover:bg-gray-200 transition-colors ${
            isMenuOpen ? 'bg-gray-200' : ''
          }`}
          title="Opciones de usuario"
        >
          <FaEllipsisV size={18} />
        </button>

        {isMenuOpen && (
          <div
            className={`absolute right-0 w-48 bg-white border border-gray-200 shadow-lg rounded-lg z-50 flex flex-col items-start ${
              shouldOpenUpward ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
          >
            <button
              onClick={handleUpdateClick}
              className="flex items-center w-full px-4 py-3 text-sm text-blue-600 hover:bg-gray-50 border-b border-gray-100"
              title="Editar usuario"
            >
              <FaEdit className="mr-3" size={16} />
              Actualizar
            </button>

            <button
              onClick={handlePermissionsClick}
              disabled={user.role !== 'coordinator'}
              className={`flex items-center w-full px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 ${
                user.role === 'coordinator'
                  ? 'text-green-600'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={
                user.role === 'coordinator'
                  ? 'Gestionar permisos'
                  : 'Solo coordinadores pueden tener permisos'
              }
            >
              <FaKey className="mr-3" size={16} />
              Permisos
            </button>

            <button
              onClick={handleDeleteClick}
              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-gray-50"
              title="Eliminar usuario"
            >
              <FaTrash className="mr-3" size={16} />
              Eliminar
            </button>
          </div>
        )}
      </div>
    );
  };

  // --------------------------------------------------
  // RENDERIZADO
  // --------------------------------------------------

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      <Header />
      <div className="container mx-auto my-4 lg:my-8 px-4 lg:px-0">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* MENU LATERAL DE ROLES - SOLO DESKTOP */}
          {!isMobile && (
            <div className="hidden lg:block w-64 p-4 bg-white shadow-xl rounded-lg h-min sticky top-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Filtrar por Rol
              </h3>

              {/* Botón AGREGAR USUARIO */}
              <button
                onClick={handleCreateUser}
                className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg mb-6 hover:bg-blue-700 transition duration-150"
                title="Crear nuevo usuario"
              >
                + Agregar Usuario
              </button>

              {/* Checkboxes de Roles */}
              <div className="space-y-2">
                {ALL_ROLES.map(role => (
                  <label
                    key={role}
                    className="flex items-center cursor-pointer capitalize text-gray-700 hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => handleRoleChange(role)}
                      className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    {ROLE_TRANSLATIONS[role]}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* CONTENIDO PRINCIPAL */}
          <div className="flex-1">
            {/* HEADER CON BOTONES PARA MÓVIL */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button
                  onClick={handleBack}
                  className="flex items-center text-gray-800 hover:text-gray-600 transition-colors mr-3"
                  title="Volver"
                >
                  <FaArrowLeft size={20} />
                </button>
                <h2 className="text-xl lg:text-3xl font-bold text-gray-800">
                  Gestión de Usuarios
                </h2>
              </div>

              {isMobile && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"
                    title="Abrir filtros de roles"
                  >
                    <FaFilter size={16} />
                    <span className="text-sm">Filtros</span>
                  </button>
                  <button
                    onClick={handleCreateUser}
                    className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition"
                    title="Crear nuevo usuario"
                  >
                    <FaUserPlus size={16} />
                    <span className="text-sm">Agregar</span>
                  </button>
                </div>
              )}
            </div>

            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

            {/* SearchBar - Solo cuando no estemos creando o actualizando */}
            {!selectedUser && !isCreating && (
              <div className="mb-4">
                <SearchBar
                  placeholder="Buscar por Nombre, Correo, Rol o CI..."
                  onSearch={handleSearch}
                />
              </div>
            )}

            {/* Mostrar formulario de actualización, creación o lista */}
            {selectedUser ? (
              <UpdateUserForm
                user={selectedUser}
                onUserUpdated={handleUserUpdated}
              />
            ) : isCreating ? (
              <CreateUserForm
                onUserCreated={handleUserCreated}
                onCancel={handleCancelCreate}
              />
            ) : (
              <>
                {/* VISTA DESKTOP - TABLA */}
                <div className="hidden lg:block overflow-x-auto shadow-xl rounded-lg">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="py-3 px-4 border-b text-left w-[20%] min-w-[200px]">
                          Nombre
                        </th>
                        <th className="py-3 px-4 border-b text-left w-[22%] min-w-[250px]">
                          Correo Electrónico
                        </th>
                        <th className="py-3 px-4 border-b text-left w-[1%]">
                          Rol
                        </th>
                        <th className="py-3 px-4 border-b text-left w-[10%]">
                          Tipo
                        </th>
                        <th className="py-3 px-4 border-b text-left w-[10%]">
                          CI
                        </th>
                        <th className="py-3 px-4 border-b text-left w-[8%]">
                          Estado
                        </th>
                        <th className="py-3 px-4 border-b text-left w-[15%]">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length > 0 ? (
                        users.map(user => {
                          // Determinar tipo basado en isExternal y isCompanyRepresentative
                          const userType = getUserType(user);
                          const typeConfig = USER_TYPE_COLORS[userType];

                          return (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 border-b font-semibold text-gray-800">
                                <div className="flex items-center">
                                  <Tooltip content={user.name} position="top">
                                    <span className="truncate block max-w-[180px] cursor-help">
                                      {user.name}
                                    </span>
                                  </Tooltip>
                                  <CompanyInfo user={user} />
                                </div>
                              </td>
                              <td className="py-3 px-4 border-b text-gray-700">
                                <TruncatedEmail
                                  email={user.email}
                                  maxLength={30}
                                />
                              </td>
                              <td className="py-3 px-4 border-b">
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 truncate max-w-[120px] block text-center">
                                  {ROLE_TRANSLATIONS[user.role] || user.role}
                                </span>
                              </td>
                              <td className="py-3 px-4 border-b">
                                <div className="flex items-center">
                                  {userType === 'internal' && (
                                    <FaUniversity
                                      className={`mr-2 ${typeConfig.icon}`}
                                      size={14}
                                    />
                                  )}
                                  {userType === 'external' && (
                                    <FaUser
                                      className={`mr-2 ${typeConfig.icon}`}
                                      size={14}
                                    />
                                  )}
                                  {userType === 'company' && (
                                    <FaBuilding
                                      className={`mr-2 ${typeConfig.icon}`}
                                      size={14}
                                    />
                                  )}
                                  <span
                                    className={`text-xs font-semibold ${typeConfig.text}`}
                                  >
                                    {typeConfig.label}
                                  </span>
                                  {userType === 'company' && (
                                    <Tooltip
                                      content={`${user.companyName}${user.companyRif ? ` (${user.companyRif})` : ''}`}
                                      position="top"
                                    >
                                      <FaInfoCircle
                                        className="ml-2 text-gray-400 hover:text-gray-600 cursor-help"
                                        size={12}
                                      />
                                    </Tooltip>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 border-b text-gray-700">
                                <Tooltip
                                  content={user.ci || 'No registrada'}
                                  position="top"
                                >
                                  <span className="cursor-help">
                                    {user.ci || 'N/A'}
                                  </span>
                                </Tooltip>
                              </td>
                              <td className="py-3 px-4 border-b">
                                <span
                                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                    user.status
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {user.status ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="py-3 px-4 border-b">
                                <div className="flex items-center space-x-1">
                                  {/* Botón de Editar */}
                                  <button
                                    onClick={() => handleUpdateUser(user)}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors group relative"
                                    title="Editar usuario"
                                  >
                                    <FaEdit size={18} />
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                      Editar usuario
                                    </div>
                                  </button>

                                  {/* Botón de Permisos */}
                                  <button
                                    onClick={() =>
                                      handleManagePermissions(user)
                                    }
                                    disabled={user.role !== 'coordinator'}
                                    className={`p-2 rounded-lg transition-colors group relative ${
                                      user.role === 'coordinator'
                                        ? 'text-green-600 hover:text-green-800 hover:bg-green-100'
                                        : 'text-gray-400 cursor-not-allowed'
                                    }`}
                                    title={
                                      user.role === 'coordinator'
                                        ? 'Gestionar permisos'
                                        : 'Solo coordinadores pueden tener permisos'
                                    }
                                  >
                                    <FaKey size={18} />
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                      {user.role === 'coordinator'
                                        ? 'Gestionar permisos'
                                        : 'Solo coordinadores'}
                                    </div>
                                  </button>

                                  {/* Botón de Eliminar */}
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors group relative"
                                    title="Eliminar usuario"
                                  >
                                    <FaTrash size={18} />
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                      Eliminar usuario
                                    </div>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="7"
                            className="py-12 text-center text-gray-500"
                          >
                            <div className="flex flex-col items-center">
                              <FaEye className="text-4xl text-gray-400 mb-3" />
                              <p className="font-medium">
                                No se encontraron usuarios
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Intenta ajustar los filtros o crear un nuevo
                                usuario
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* VISTA MÓVIL - CARDS MÁS COMPACTOS */}
                <div className="lg:hidden space-y-3">
                  {users.length > 0 ? (
                    users.map((user, index) => {
                      const userType = getUserType(user);
                      const typeConfig = USER_TYPE_COLORS[userType];

                      return (
                        <div
                          key={user.id}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
                        >
                          {/* Header de la tarjeta */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 pr-2 max-w-[75%]">
                              <Tooltip content={user.name} position="top">
                                <h3
                                  className="font-bold text-base text-gray-800 mb-1 truncate cursor-help"
                                  title={user.name}
                                >
                                  {user.name}
                                </h3>
                              </Tooltip>
                              <TruncatedEmail
                                email={user.email}
                                maxLength={25}
                              />
                            </div>
                            <MobileActionMenu user={user} index={index} />
                          </div>

                          {/* Información del usuario */}
                          <div className="flex flex-wrap items-center gap-2 text-xs mt-3 mb-2">
                            {/* Rol */}
                            <div>
                              <span className="font-medium text-gray-500 mr-1">
                                Rol:
                              </span>
                              <span
                                className="font-semibold text-gray-800 capitalize truncate block text-center"
                                title={
                                  ROLE_TRANSLATIONS[user.role] || user.role
                                }
                              >
                                {ROLE_TRANSLATIONS[user.role] || user.role}
                              </span>
                            </div>

                            {/* Tipo de usuario */}
                            <div>
                              <span className="font-medium text-gray-500 mr-1">
                                Tipo:
                              </span>
                              <div className="flex items-center">
                                {userType === 'internal' && (
                                  <FaUniversity
                                    className={`mr-1 ${typeConfig.icon}`}
                                    size={10}
                                  />
                                )}
                                {userType === 'external' && (
                                  <FaUser
                                    className={`mr-1 ${typeConfig.icon}`}
                                    size={10}
                                  />
                                )}
                                {userType === 'company' && (
                                  <FaBuilding
                                    className={`mr-1 ${typeConfig.icon}`}
                                    size={10}
                                  />
                                )}
                                <span
                                  className={`font-semibold ${typeConfig.text}`}
                                >
                                  {typeConfig.label}
                                </span>
                                {userType === 'company' && (
                                  <Tooltip
                                    content={`${user.companyName}${user.companyRif ? ` (${user.companyRif})` : ''}`}
                                    position="top"
                                  >
                                    <FaInfoCircle
                                      className="ml-1 text-gray-400 hover:text-gray-600 cursor-help"
                                      size={10}
                                    />
                                  </Tooltip>
                                )}
                              </div>
                            </div>

                            {/* CI */}
                            <div>
                              <span className="font-medium text-gray-500 mr-1">
                                CI:
                              </span>
                              <Tooltip
                                content={user.ci || 'No registrada'}
                                position="top"
                              >
                                <span
                                  className="font-semibold text-gray-800 truncate block cursor-help"
                                  title={user.ci || 'N/A'}
                                >
                                  {user.ci || 'N/A'}
                                </span>
                              </Tooltip>
                            </div>
                          </div>

                          {/* Estado */}
                          <div className="mt-2 flex justify-between items-center">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.status
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.status ? 'Activo' : 'Inactivo'}
                            </span>

                            {/* Información de empresa si aplica */}
                            {user.isCompanyRepresentative &&
                              user.companyName && (
                                <Tooltip
                                  content={`Empresa: ${user.companyName}${user.companyRif ? ` (${user.companyRif})` : ''}`}
                                  position="top"
                                >
                                  <div className="flex items-center text-xs text-gray-500 cursor-help">
                                    <FaBuilding size={10} className="mr-1" />
                                    <span>Representante</span>
                                  </div>
                                </Tooltip>
                              )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center">
                        <FaEye className="text-4xl text-gray-400 mb-3" />
                        <p className="font-medium">
                          No se encontraron usuarios
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Intenta ajustar los filtros
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Paginación */}
                <div className="flex flex-col lg:flex-row justify-between items-center p-4 bg-gray-50 border-t rounded-lg mt-4">
                  <p className="text-sm text-gray-600 mb-2 lg:mb-0">
                    Mostrando {users.length} de {totalUsers} usuarios
                    {!isMobile && ` (Pág. ${currentPage} de ${totalPages})`}
                  </p>

                  {isMobile && (
                    <p className="text-sm text-gray-600 mb-3">
                      Pág. {currentPage} de {totalPages}
                    </p>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      title="Página anterior"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      title="Página siguiente"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Filtros para Móvil */}
      {isMobile && showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Filtrar por Rol
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                  title="Cerrar filtros"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {ALL_ROLES.map(role => (
                  <label
                    key={role}
                    className="flex items-center cursor-pointer capitalize text-gray-700 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => handleRoleChange(role)}
                      className="mr-3 h-5 w-5 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-base">{ROLE_TRANSLATIONS[role]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
                title="Aplicar filtros seleccionados"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Permisos */}
      {isModalOpen && userForPermissions && (
        <PermissionsModal
          user={userForPermissions}
          onClose={handleCloseModal}
        />
      )}

      <Footer />
    </div>
  );
};

export default UsersPage;
