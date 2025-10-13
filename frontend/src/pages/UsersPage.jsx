// src/pages/UsersPage.js
import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UpdateUserForm from '../components/UpdateUserForm';
import SearchBar from '../components/SearchBar'; // Importamos el componente SearchBar

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); // Nuevo estado para los usuarios filtrados
  const [selectedUser, setSelectedUser] = useState(null); // Para actualizar un usuario
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda

  useEffect(() => {
    // Obtener usuarios desde la API
    axiosInstance
      .get('/users')
      .then(response => {
        setUsers(response.data);
        setFilteredUsers(response.data); // Inicializamos los usuarios filtrados
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        setError('Error al obtener los usuarios.');
      });
  }, []);

  const handleDeleteUser = userId => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      axiosInstance
        .delete(`/users/${userId}`)
        .then(() => {
          // Eliminar usuario de la lista
          setUsers(users.filter(user => user.id !== userId));
          setFilteredUsers(filteredUsers.filter(user => user.id !== userId));
        })
        .catch(error => {
          console.error('Error deleting user:', error);
          alert('Error al eliminar el usuario. Por favor, intente nuevamente.');
        });
    }
  };

  const handleUpdateUser = user => {
    setSelectedUser(user);
  };

  const handleUserUpdated = updatedUser => {
    // Actualizar el usuario en la lista
    setUsers(
      users.map(user => (user.id === updatedUser.id ? updatedUser : user))
    );
    setFilteredUsers(
      filteredUsers.map(user =>
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    setSelectedUser(null); // Cerrar el formulario de actualización
  };

  // Función para manejar la búsqueda
  const handleSearch = term => {
    setSearchTerm(term);
    if (term === '') {
      setFilteredUsers(users);
    } else {
      const lowerCaseTerm = term.toLowerCase();
      const filtered = users.filter(user => {
        return (
          user.name.toLowerCase().includes(lowerCaseTerm) ||
          user.email.toLowerCase().includes(lowerCaseTerm) ||
          user.role.toLowerCase().includes(lowerCaseTerm) ||
          (user.ci && user.ci.toLowerCase().includes(lowerCaseTerm))
        );
      });
      setFilteredUsers(filtered);
    }
  };

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      <Header />
      <div className="container mx-auto my-8">
        <h2 className="text-2xl font-bold mb-4">Lista de Usuarios</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {/* Agregamos el componente SearchBar */}
        <div className="mb-4">
          <SearchBar placeholder="Buscar usuarios..." onSearch={handleSearch} />
        </div>
        {selectedUser ? (
          <UpdateUserForm
            user={selectedUser}
            onUserUpdated={handleUserUpdated}
          />
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Nombre</th>
                <th className="py-2 px-4 border-b">Correo Electrónico</th>
                <th className="py-2 px-4 border-b">Rol</th>
                <th className="py-2 px-4 border-b">CI</th>
                <th className="py-2 px-4 border-b">Estado</th>
                <th className="py-2 px-4 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="py-2 px-4 border-b">{user.name}</td>
                  <td className="py-2 px-4 border-b">{user.email}</td>
                  <td className="py-2 px-4 border-b">{user.role}</td>
                  <td className="py-2 px-4 border-b">{user.ci || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">
                    {user.status ? 'Activo' : 'Inactivo'}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleUpdateUser(user)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                    >
                      Actualizar
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default UsersPage;
