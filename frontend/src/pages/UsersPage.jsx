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
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

// Definición estática de roles para el menú lateral
const ALL_ROLES = ['admin', 'coordinator', 'requester', 'visitor', 'pending'];
const PAGE_SIZE = 25;

const ROLE_TRANSLATIONS = {
  admin: 'Administrador',
  coordinator: 'Coordinador',
  requester: 'Solicitante',
  visitor: 'Visitante',
  pending: 'Pendiente',
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
          title="Opciones"
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
            >
              <FaKey className="mr-3" size={16} />
              Permisos
            </button>

            <button
              onClick={handleDeleteClick}
              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-gray-50"
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
                  >
                    <FaFilter size={16} />
                    <span className="text-sm">Filtros</span>
                  </button>
                  <button
                    onClick={handleCreateUser}
                    className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition"
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
                        <th className="py-2 px-4 border-b text-left">Nombre</th>
                        <th className="py-2 px-4 border-b text-left">
                          Correo Electrónico
                        </th>
                        <th className="py-2 px-4 border-b text-left">Rol</th>
                        <th className="py-2 px-4 border-b text-left">CI</th>
                        <th className="py-2 px-4 border-b text-left">Estado</th>
                        <th className="py-2 px-4 border-b text-left">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length > 0 ? (
                        users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border-b">{user.name}</td>
                            <td className="py-2 px-4 border-b">{user.email}</td>
                            <td className="py-2 px-4 border-b capitalize">
                              {user.role}
                            </td>
                            <td className="py-2 px-4 border-b">
                              {user.ci || 'N/A'}
                            </td>
                            <td className="py-2 px-4 border-b">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded ${
                                  user.status
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {user.status ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="py-2 px-4 border-b flex items-center space-x-2">
                              <button
                                onClick={() => handleUpdateUser(user)}
                                className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600 transition"
                              >
                                Actualizar
                              </button>

                              <button
                                onClick={() => handleManagePermissions(user)}
                                disabled={user.role !== 'coordinator'}
                                className={`text-white px-2 py-1 rounded text-sm transition ${
                                  user.role === 'coordinator'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-gray-400 cursor-not-allowed'
                                }`}
                                title={
                                  user.role === 'coordinator'
                                    ? 'Asignar permisos de espacio'
                                    : "Solo 'coordinators' pueden asignar permisos"
                                }
                              >
                                Permisos
                              </button>

                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700 transition"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-8 text-center text-gray-500"
                          >
                            No se encontraron usuarios con los filtros
                            seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* VISTA MÓVIL - CARDS MÁS COMPACTOS */}
                <div className="lg:hidden space-y-3">
                  {users.length > 0 ? (
                    users.map((user, index) => (
                      <div
                        key={user.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
                      >
                        {/* Header de la tarjeta */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 pr-2">
                            <h3 className="font-bold text-base text-gray-800 mb-1">
                              {user.name}
                            </h3>
                            <p className="text-xs text-gray-600 break-words">
                              {user.email}
                            </p>
                          </div>
                          <MobileActionMenu user={user} index={index} />
                        </div>

                        {/* Información del usuario - Solo Rol y CI */}
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-medium text-gray-500 mr-1">
                              Rol:
                            </span>
                            <span className="font-semibold text-gray-800 capitalize">
                              {ROLE_TRANSLATIONS[user.role] || user.role}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500 mr-1">
                              CI:
                            </span>
                            <span className="font-semibold text-gray-800">
                              {user.ci || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No se encontraron usuarios con los filtros seleccionados.
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
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
