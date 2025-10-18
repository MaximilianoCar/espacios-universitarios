// src/pages/AdminPendingRequestsPage.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import { FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const AdminPendingRequestsPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPendingUsers = () => {
    setLoading(true);
    axiosInstance
      .get('/users/pending')
      .then(response => {
        setUsers(response.data);
        setFilteredUsers(response.data);
        setLoading(false);
        setError('');
      })
      .catch(error => {
        console.error('Error fetching pending users:', error);
        setError('Error al obtener las solicitudes pendientes.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Función para manejar la búsqueda
  const handleSearch = term => {
    if (term === '') {
      setFilteredUsers(users);
    } else {
      const lowerCaseTerm = term.toLowerCase();
      const filtered = users.filter(user => {
        return (
          user.name.toLowerCase().includes(lowerCaseTerm) ||
          user.email.toLowerCase().includes(lowerCaseTerm) ||
          (user.ci && user.ci.toLowerCase().includes(lowerCaseTerm))
        );
      });
      setFilteredUsers(filtered);
    }
  };

  const handleApproveRequest = userId => {
    if (
      !window.confirm(
        '¿Estás seguro de que deseas APROBAR esta solicitud? El usuario se convertirá en Solicitante (Requester).'
      )
    ) {
      return;
    }

    axiosInstance
      .put(`/users/approve/${userId}`) // Endpoint PUT para aprobar
      .then(() => {
        // Eliminar de la lista local (ya que el rol cambiará a 'requester')
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setFilteredUsers(prevUsers =>
          prevUsers.filter(user => user.id !== userId)
        );
      })
      .catch(error => {
        console.error('Error al aprobar la solicitud:', error);
        alert('Error al aprobar la solicitud. Intente nuevamente.');
      });
  };

  const handleRejectRequest = userId => {
    if (
      !window.confirm(
        '¿Estás seguro de que deseas RECHAZAR esta solicitud? El usuario volverá al rol de Visitante (Visitor).'
      )
    ) {
      return;
    }

    axiosInstance
      .put(`/users/reject/${userId}`) // Endpoint PUT para rechazar
      .then(() => {
        // Eliminar de la lista local (ya que el rol dejará de ser 'pending')
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setFilteredUsers(prevUsers =>
          prevUsers.filter(user => user.id !== userId)
        );
      })
      .catch(error => {
        console.error('Error al rechazar la solicitud:', error);
        alert('Error al rechazar la solicitud. Intente nuevamente.');
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
        <Header />
        <div className="container mx-auto my-8 p-4 text-center">
          Cargando solicitudes pendientes...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      <Header />
      <div className="container mx-auto my-8">
        <h2 className="text-2xl font-bold mb-4">Solicitudes pendientes</h2>

        {/* SearchBar */}
        <div className="mb-4">
          <SearchBar
            placeholder="Buscar por Nombre, Correo o CI..."
            onSearch={handleSearch}
          />
        </div>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto shadow-xl rounded-lg">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-3 px-4 text-left">Nombre</th>
                  <th className="py-3 px-4 text-left">Correo Electrónico</th>
                  <th className="py-3 px-4 text-left">CI</th>
                  <th className="py-3 px-4 text-left">Documento</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-blue-50 transition-colors`}
                  >
                    <td className="py-3 px-4 border-b text-gray-800 font-medium">
                      {user.name}
                    </td>
                    <td className="py-3 px-4 border-b">{user.email}</td>
                    <td className="py-3 px-4 border-b">{user.ci || 'N/A'}</td>

                    {/* Columna del Documento */}
                    <td className="py-3 px-4 border-b">
                      {user.certificationPath ? (
                        <a
                          href={`http://localhost:3000/${user.certificationPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors w-20"
                        >
                          <FaEye className="mr-1" size={12} /> Ver
                        </a>
                      ) : (
                        <span className="text-gray-500">No subido</span>
                      )}
                    </td>

                    {/* Columna de Acciones */}
                    <td className="py-3 px-4 border-b">
                      <div className="flex justify-center space-x-3">
                        {/* Botón Aceptar */}
                        <button
                          onClick={() => handleApproveRequest(user.id)}
                          className="flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                        >
                          <FaCheckCircle className="mr-2" size={16} /> Aprobar
                        </button>

                        {/* Botón Rechazar */}
                        <button
                          onClick={() => handleRejectRequest(user.id)}
                          className="flex items-center bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                        >
                          <FaTimesCircle className="mr-2" size={16} /> Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-600 p-8 border rounded-lg">
            No hay solicitudes de acceso pendientes de revisión.
          </p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminPendingRequestsPage;
