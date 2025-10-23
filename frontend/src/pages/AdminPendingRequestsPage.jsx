// src/pages/AdminPendingRequestsPage.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import { FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';

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

  const handleApproveRequest = async (userId, userName) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas APROBAR la solicitud de ${userName}? El usuario se convertirá en Solicitante (Requester).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      // Mostrar loader
      Swal.fire({
        title: 'Procesando...',
        text: `Por favor espere mientras se aprueba la solicitud de ${userName}`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        await axiosInstance.put(`/users/approve/${userId}`);

        // Eliminar de la lista local
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setFilteredUsers(prevUsers =>
          prevUsers.filter(user => user.id !== userId)
        );

        Swal.fire(
          '¡Aprobado!',
          `La solicitud de ${userName} ha sido aprobada exitosamente.`,
          'success'
        );
      } catch (error) {
        console.error('Error al aprobar la solicitud:', error);
        Swal.fire(
          'Error',
          `Error al aprobar la solicitud de ${userName}. Intente nuevamente.`,
          'error'
        );
      }
    }
  };

  const handleRejectRequest = async (userId, userName) => {
    const { value: formValues } = await Swal.fire({
      title: `¿Estás seguro de rechazar la solicitud de ${userName}?`,
      html: `
      <p class="text-left mb-4">El usuario volverá al rol de Visitante (Visitor).</p>
      <div class="text-left">
        <label for="swal-comment" class="block text-sm font-medium text-gray-700 mb-1">
          Comentario (opcional):
        </label>
        <textarea 
          id="swal-comment" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          placeholder="Explica brevemente el motivo del rechazo..." 
          rows="4"
          maxlength="500"
        ></textarea>
        <div class="text-right text-xs text-gray-500 mt-1">
          <span id="swal-char-count">0</span>/500 caracteres
        </div>
      </div>
    `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        const comment = document.getElementById('swal-comment').value;

        // Validación de longitud
        if (comment && comment.length > 500) {
          Swal.showValidationMessage(
            'El comentario no puede exceder los 500 caracteres'
          );
          return false;
        }

        return {
          comments: comment || '',
        };
      },
      didOpen: () => {
        const textarea = document.getElementById('swal-comment');
        const charCount = document.getElementById('swal-char-count');

        textarea.addEventListener('input', () => {
          const length = textarea.value.length;
          charCount.textContent = length;

          // Cambiar color si se acerca al límite
          if (length > 450) {
            charCount.className = 'text-right text-xs text-red-500 mt-1';
          } else if (length > 400) {
            charCount.className = 'text-right text-xs text-orange-500 mt-1';
          } else {
            charCount.className = 'text-right text-xs text-gray-500 mt-1';
          }
        });
      },
    });

    // Si el usuario confirmó el rechazo
    if (formValues) {
      // Mostrar loader
      Swal.fire({
        title: 'Procesando...',
        text: `Por favor espere mientras se rechaza la solicitud de ${userName}`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        await axiosInstance.put(`/users/reject/${userId}`, {
          comments: formValues.comments,
        });

        // Eliminar de la lista local
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setFilteredUsers(prevUsers =>
          prevUsers.filter(user => user.id !== userId)
        );

        Swal.fire(
          '¡Rechazado!',
          `La solicitud de ${userName} ha sido rechazada y se notificó al usuario.`,
          'success'
        );
      } catch (error) {
        console.error('Error al rechazar la solicitud:', error);
        Swal.fire(
          'Error',
          `Error al rechazar la solicitud de ${userName}. Intente nuevamente.`,
          'error'
        );
      }
    }
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
                          onClick={() =>
                            handleApproveRequest(user.id, user.name)
                          }
                          className="flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                        >
                          <FaCheckCircle className="mr-2" size={16} /> Aprobar
                        </button>

                        {/* Botón Rechazar */}
                        <button
                          onClick={() =>
                            handleRejectRequest(user.id, user.name)
                          }
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
