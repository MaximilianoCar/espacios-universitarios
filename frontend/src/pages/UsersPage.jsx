// src/pages/UsersPage.js
import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UpdateUserForm from '../components/UpdateUserForm';
import CreateUserForm from '../components/CreateUserForm'; // Importar el nuevo componente
import SearchBar from '../components/SearchBar';
import PermissionsModal from '../components/PermissionsModal';

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
  const [isCreating, setIsCreating] = useState(false); // Nuevo estado para creación

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

  // Ejecutar la carga de usuarios
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Resetear la página a 1 cada vez que cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRoles]);

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
    if (user.role === 'coordinator' || user.role === 'admin') {
      setUserForPermissions(user);
      setIsModalOpen(true);
    } else {
      alert(`Solo 'coordinators' y 'admins' pueden tener permisos de espacio.`);
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

  // Nueva función para manejar usuario creado
  const handleUserCreated = () => {
    setIsCreating(false);
    fetchUsers(); // Recargar la lista
  };

  const handleUpdateUser = user => {
    setSelectedUser(user);
    setIsCreating(false); // Asegurar que no estamos en modo creación
  };

  const handleCreateUser = () => {
    setIsCreating(true);
    setSelectedUser(null); // Asegurar que no estamos en modo actualización
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
  };

  const handleDeleteUser = userId => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      axiosInstance
        .delete(`/users/${userId}`)
        .then(() => {
          fetchUsers();
        })
        .catch(error => {
          console.error('Error deleting user:', error);
          alert('Error al eliminar el usuario. Por favor, intente nuevamente.');
        });
    }
  };

  // --------------------------------------------------
  // RENDERIZADO
  // --------------------------------------------------

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      <Header />
      <div className="container mx-auto my-8 flex">
        {/*MENU LATERAL DE ROLES */}
        <div className="w-64 mr-8 p-4 bg-white shadow-xl rounded-lg h-min sticky top-0">
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

        {/* ⬅️ CONTENIDO PRINCIPAL */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}

          {/* Mostrar SearchBar solo cuando no estemos creando o actualizando */}
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
            <div className="overflow-x-auto shadow-xl rounded-lg">
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
                    <th className="py-2 px-4 border-b text-left">Acciones</th>
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
                            disabled={
                              user.role !== 'coordinator' &&
                              user.role !== 'admin'
                            }
                            className={`text-white px-2 py-1 rounded text-sm transition ${
                              user.role === 'coordinator'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-400 cursor-not-allowed'
                            }`}
                            title={
                              user.role === 'coordinator'
                                ? 'Asignar permisos de espacio'
                                : "Solo 'coordinators' y 'admins' pueden asignar permisos"
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

              {/* Paginación */}
              <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
                <p className="text-sm text-gray-600">
                  Mostrando {users.length} de {totalUsers} usuarios (Pág.{' '}
                  {currentPage} de {totalPages})
                </p>
                <div className="space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
