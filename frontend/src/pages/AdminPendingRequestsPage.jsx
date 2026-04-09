// src/pages/AdminPendingRequestsPage.jsx
import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
} from 'react-icons/fa';
import Swal from '../utils/swal';

const AdminPendingRequestsPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Detectar si es móvil
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const fetchPendingUsers = (page = 1, search = '') => {
    setLoading(true);
    axiosInstance
      .get(
        `/users/pending?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`
      )
      .then(response => {
        const data = response.data;
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
        setTotalUsers(data.totalUsers || data.users?.length || 0);
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
    fetchPendingUsers(currentPage, searchTerm);
  }, []);

  // Función para manejar la búsqueda (consulta al servidor)
  const handleSearch = term => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchPendingUsers(1, term);
  };

  const handlePageChange = newPage => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchPendingUsers(newPage, searchTerm);
  };

  const getUserType = user => {
    if (user.isCompanyRepresentative) return 'company';
    if (user.isExternal) return 'external';
    return 'internal';
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
        setTotalUsers(prev => Math.max(0, prev - 1)); // Reducir el contador total

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
        setTotalUsers(prev => Math.max(0, prev - 1)); // Reducir el contador total

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

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      <Header />
      <div className="container mx-auto my-4 lg:my-8 px-4 lg:px-0">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-800 hover:text-gray-600 transition-colors mr-3"
              title="Volver al inicio"
            >
              <FaArrowLeft size={isMobile ? 20 : 24} />
            </button>
            <h2
              className={`${
                isMobile ? 'text-xl' : 'text-3xl'
              } font-bold text-gray-800`}
            >
              Solicitudes Pendientes
            </h2>
          </div>
        </div>

        {/* SearchBar */}
        <div className="mb-4 lg:mb-6">
          <SearchBar
            placeholder="Buscar por Nombre, Correo o CI..."
            onSearch={handleSearch}
          />
        </div>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {/* VISTA DESKTOP - TABLA */}
        {!isMobile && filteredUsers.length > 0 && (
          <div className="hidden lg:block overflow-x-auto shadow-xl rounded-lg">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-3 px-4 text-left">Nombre</th>
                  <th className="py-3 px-4 text-left">Tipo</th>
                  <th className="py-3 px-4 text-left">Correo Electrónico</th>
                  <th className="py-3 px-4 text-left">CI</th>
                  <th className="py-3 px-4 text-left">Documento</th>
                  <th className="py-3 px-4 text-left">Empresa / RIF</th>
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
                    <td className="py-3 px-4 border-b">
                      {getUserType(user) === 'company' && (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                          Empresa
                        </span>
                      )}
                      {getUserType(user) === 'external' && (
                        <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                          Externo
                        </span>
                      )}
                      {getUserType(user) === 'internal' && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                          Interno
                        </span>
                      )}
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

                    <td className="py-3 px-4 border-b">
                      {user.isExternal ? (
                        <div className="text-sm">
                          <div className="font-medium">{user.companyName}</div>
                          <div className="text-xs text-gray-600">
                            {user.companyRif}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
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
        )}

        {/* VISTA MÓVIL - CARDS */}
        {isMobile && (
          <div className="lg:hidden space-y-3">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
                >
                  {/* Header de la tarjeta */}
                  <div className="mb-3">
                    <h3 className="font-bold text-base text-gray-800 mb-1">
                      {user.name}
                    </h3>
                    <p className="text-xs text-gray-600 break-words mb-1">
                      {user.email}
                    </p>
                    <div className="mb-2">
                      {getUserType(user) === 'company' && (
                        <span className="inline-block text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                          Empresa
                        </span>
                      )}
                      {getUserType(user) === 'external' && (
                        <span className="inline-block text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                          Externo
                        </span>
                      )}
                      {getUserType(user) === 'internal' && (
                        <span className="inline-block text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                          Interno
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-700">
                      <span className="font-medium mr-1">CI:</span>
                      <span>{user.ci || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Documento */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">
                        Documento:
                      </span>
                      {user.certificationPath ? (
                        <a
                          href={`http://localhost:3000/${user.certificationPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          <FaEye className="mr-1" size={12} /> Ver
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">No subido</span>
                      )}
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleApproveRequest(user.id, user.name)}
                      className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-2 rounded text-sm transition-colors"
                    >
                      <FaCheckCircle className="mr-2" size={14} />
                      <span>Aprobar</span>
                    </button>

                    <button
                      onClick={() => handleRejectRequest(user.id, user.name)}
                      className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-2 rounded text-sm transition-colors"
                    >
                      <FaTimesCircle className="mr-2" size={14} />
                      <span>Rechazar</span>
                    </button>
                  </div>
                  {/* Empresa (móvil) */}
                  {user.isCompanyRepresentative && (
                    <div className="mt-3 text-sm border-t pt-3">
                      <div className="font-medium">{user.companyName}</div>
                      <div className="text-xs text-gray-600">
                        {user.companyRif}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                No hay solicitudes de acceso pendientes de revisión.
              </div>
            )}
          </div>
        )}

        {/* VISTA DESKTOP - Sin resultados */}
        {!isMobile && filteredUsers.length === 0 && (
          <p className="text-center text-gray-600 p-8 border rounded-lg">
            No hay solicitudes de acceso pendientes de revisión.
          </p>
        )}

        {/* Paginación - Estilo igual a UsersPage */}
        {filteredUsers.length > 0 && (
          <div className="flex flex-col lg:flex-row justify-between items-center p-4 bg-gray-50 border-t rounded-lg mt-4">
            <p className="text-sm text-gray-600 mb-2 lg:mb-0">
              Mostrando {filteredUsers.length} de {totalUsers} solicitudes
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
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminPendingRequestsPage;
