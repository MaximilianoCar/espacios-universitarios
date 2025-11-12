import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import {
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaUpload,
  FaEnvelope,
  FaCalendarAlt,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaEllipsisV,
  FaEdit,
  FaFileContract,
  FaFilePdf,
  FaArrowLeft,
} from 'react-icons/fa';
import Modal from '../components/Modal';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import getMediaUrl from '../utils/media';

const AdminReservationsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingAgreementId, setUploadingAgreementId] = useState(null);
  const [agreementFile, setAgreementFile] = useState(null);

  // estado menu acciones
  const [openMenuId, setOpenMenuId] = useState(null);
  // ---------------------------------------------

  // para los modales
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedEventContact, setSelectedEventContact] = useState('');
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [selectedEventDates, setSelectedEventDates] = useState({});
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');

  // para el modal de imagen
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  //manejar volver atras
  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  useEffect(() => {
    const handleClickOutside = event => {
      if (openMenuId && !event.target.closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // obtener los eventos
  useEffect(() => {
    axiosInstance
      .get('/admin/events')
      .then(response => {
        setEvents(response.data);
        setFilteredEvents(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching events:', error);
        setError('Error al obtener los eventos.');
        setLoading(false);
      });
  }, []);

  // manejar el cambio en el término de búsqueda
  const handleSearch = term => {
    setSearchTerm(term);

    const filtered = events.filter(event => {
      const lowerCaseTerm = term.toLowerCase();
      const searchableFields =
        `${event.name} ${event.description}`.toLowerCase();

      return searchableFields
        .split(' ')
        .some(word => word.startsWith(lowerCaseTerm));
    });

    setFilteredEvents(filtered);
  };

  // manejar el cambio de archivo para el contrato
  const handleAgreementFileChange = event => {
    setAgreementFile(event.target.files[0]);
  };

  // manejar la subida del archivo de contrato
  const handleUploadAgreement = eventId => {
    if (!agreementFile) return;

    const formData = new FormData();
    formData.append('agreementPath', agreementFile);

    // modal de carga
    Swal.fire({
      title: 'Subiendo archivo...',
      text: 'Por favor espere mientras se sube el contrato',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });

    axiosInstance
      .post(`/events/${eventId}/upload-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(response => {
        Swal.close(); // cerrar modal

        Swal.fire(
          'Contrato subido',
          'El contrato se subió exitosamente.',
          'success'
        );

        setUploadingAgreementId(null);
        setAgreementFile(null);

        axiosInstance.get('/admin/events').then(response => {
          const updatedEvents = response.data;
          setEvents(updatedEvents);
          setFilteredEvents(updatedEvents);

          // Re-aplicar búsqueda si hay término
          if (searchTerm) {
            handleSearch(searchTerm);
          }
        });
      })
      .catch(error => {
        Swal.close(); // cerrar modal de carga

        console.error('Error al subir el contrato:', error);
        Swal.fire(
          'Error',
          'Error al subir el contrato. Intente nuevamente.',
          'error'
        );
        setUploadingAgreementId(null);
        setAgreementFile(null);
      });
  };

  // para mostrar fechas de forma mas legible
  const formatDateTime = dateString => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  // Función para mostrar el modal de fechas
  const handleShowDates = event => {
    setSelectedEventDates({
      eventFrom: event.eventFrom,
      eventTo: event.eventTo,
      reservationFrom: event.reservationFrom,
      reservationTo: event.reservationTo,
    });
    setShowDatesModal(true);
  };

  const handleCloseDatesModal = () => {
    setShowDatesModal(false);
    setSelectedEventDates({});
  };

  // Función para actualizar el estado del evento
  const handleUpdateStatus = async (eventId, eventName, newStatus) => {
    setOpenMenuId(null);

    if (newStatus === 'approved') {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas APROBAR la reserva "${eventName}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, aprobar',
        cancelButtonText: 'Cancelar',
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: 'Procesando...',
          text: 'Por favor espere mientras se aprueba la reserva',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          },
        });

        try {
          await axiosInstance.put(`/events/${eventId}`, { status: newStatus });

          // Actualizar el estado local
          setEvents(prevEvents =>
            prevEvents.map(event =>
              event.id === eventId ? { ...event, status: newStatus } : event
            )
          );
          setFilteredEvents(prevFilteredEvents =>
            prevFilteredEvents.map(event =>
              event.id === eventId ? { ...event, status: newStatus } : event
            )
          );

          Swal.fire(
            '¡Aprobado!',
            'La reserva ha sido aprobada exitosamente.',
            'success'
          );
        } catch (error) {
          console.error('Error updating event status:', error);
          Swal.fire(
            'Error',
            'Error al aprobar la reserva. Por favor, intente nuevamente.',
            'error'
          );
        }
      }
    } else if (newStatus === 'denied') {
      const { value: formValues } = await Swal.fire({
        title: `¿Estás seguro de rechazar la reserva "${eventName}"?`,
        html: `
        <p class="text-left mb-4">Esta acción no se puede deshacer.</p>
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

      if (formValues) {
        Swal.fire({
          title: 'Procesando...',
          text: 'Por favor espere mientras se rechaza la reserva',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          },
        });

        try {
          await axiosInstance.put(`/events/${eventId}`, {
            status: newStatus,
            comments: formValues.comments,
          });

          setEvents(prevEvents =>
            prevEvents.map(event =>
              event.id === eventId ? { ...event, status: newStatus } : event
            )
          );
          setFilteredEvents(prevFilteredEvents =>
            prevFilteredEvents.map(event =>
              event.id === eventId ? { ...event, status: newStatus } : event
            )
          );

          Swal.fire(
            '¡Rechazado!',
            'La reserva ha sido rechazada y se notificó al usuario.',
            'success'
          );
        } catch (error) {
          console.error('Error updating event status:', error);
          Swal.fire(
            'Error',
            'Error al rechazar la reserva. Por favor, intente nuevamente.',
            'error'
          );
        }
      }
    }
  };

  // Funciones para manejar los modales
  const handleShowContact = contactInfo => {
    setSelectedEventContact(contactInfo);
    setShowContactModal(true);
  };

  const handleCloseContactModal = () => {
    setShowContactModal(false);
    setSelectedEventContact('');
  };

  const handleShowDescription = description => {
    setSelectedDescription(description);
    setShowDescriptionModal(true);
  };

  const handleCloseDescriptionModal = () => {
    setShowDescriptionModal(false);
    setSelectedDescription('');
  };

  // Manejador de clic en la imagen para mostrar el modal
  const handleImageClick = imagePath => {
    setSelectedImage(getMediaUrl(imagePath));
    setShowImageModal(true);
  };

  const ActionMenu = ({ event, index }) => {
    const isMenuOpen = openMenuId === event.id;
    const menuRef = useRef(null);
    const isUploading = uploadingAgreementId === event.id;
    const fileInputRef = useRef(null);

    const shouldOpenUpward = index > 0;

    const toggleMenu = e => {
      e.stopPropagation();
      setOpenMenuId(isMenuOpen ? null : event.id);
    };

    const startUpload = () => {
      setOpenMenuId(null);
      setUploadingAgreementId(event.id);
      setAgreementFile(null);
    };

    const cancelUpload = () => {
      setUploadingAgreementId(null);
      setAgreementFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const executeUpload = () => {
      if (!agreementFile) {
        Swal.fire(
          'Error',
          'Por favor selecciona un archivo primero.',
          'warning'
        );
        return;
      }
      handleUploadAgreement(event.id);
    };

    const handleFileChange = event => {
      const file = event.target.files[0];
      setAgreementFile(file);
    };

    return (
      <div
        className="relative action-menu-container flex flex-col items-center justify-center"
        ref={menuRef}
      >
        {isUploading ? (
          <div
            className={`flex flex-col space-y-2 w-48 absolute right-0 z-50 p-3 bg-white border border-gray-200 shadow-lg rounded ${
              shouldOpenUpward ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
          >
            <div className="text-xs font-medium text-gray-700 mb-1">
              Subir contrato:
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="text-xs border rounded p-1 w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />

            {agreementFile && (
              <div
                className="text-xs text-green-600 font-medium truncate"
                title={agreementFile.name}
              >
                ✓ {agreementFile.name}
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={executeUpload}
                className={`flex-1 py-1 px-2 rounded text-xs transition-colors ${
                  agreementFile
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!agreementFile}
              >
                <FaUpload className="mr-1 inline" size={10} /> Subir
              </button>

              <button
                onClick={cancelUpload}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={toggleMenu}
              className={`p-1 rounded-full text-gray-600 hover:bg-gray-200 transition-colors ${
                isMenuOpen ? 'bg-gray-200' : ''
              }`}
              title="Opciones de Gestión"
            >
              <FaEllipsisV size={16} />
            </button>

            {isMenuOpen && (
              <div
                className={`absolute right-0 w-48 bg-white border border-gray-200 shadow-lg rounded z-50 flex flex-col items-start ${
                  shouldOpenUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                }`}
              >
                {event.status !== 'approved' && (
                  <button
                    onClick={() =>
                      handleUpdateStatus(event.id, event.name, 'approved')
                    }
                    className="flex items-center w-full px-3 py-2 text-xs text-green-600 hover:bg-gray-100 font-semibold"
                  >
                    <FaCheckCircle className="mr-2" size={14} /> Aprobar
                  </button>
                )}
                {event.status !== 'denied' && (
                  <button
                    onClick={() =>
                      handleUpdateStatus(event.id, event.name, 'denied')
                    }
                    className="flex items-center w-full px-3 py-2 text-xs text-red-600 hover:bg-gray-100 font-semibold"
                  >
                    <FaTimesCircle className="mr-2" size={14} /> Denegar
                  </button>
                )}

                {/* SEPARADOR */}
                {(event.status !== 'approved' || event.status !== 'denied') && (
                  <div className="border-t border-gray-100 w-full"></div>
                )}

                {/* ACCIONES DE DOCUMENTOS */}
                {event.programPath ? (
                  <a
                    href={getMediaUrl(event.programPath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpenMenuId(null)}
                    className="flex items-center w-full px-3 py-2 text-xs text-blue-600 hover:bg-gray-100"
                  >
                    <FaFilePdf className="mr-2" size={14} /> Ver Programa
                  </a>
                ) : (
                  <span className="flex items-center w-full px-3 py-2 text-xs text-gray-500">
                    <FaFilePdf className="mr-2" size={14} /> Programa (N/A)
                  </span>
                )}

                {event.agreementPath ? (
                  <a
                    href={getMediaUrl(event.agreementPath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpenMenuId(null)}
                    className="flex items-center w-full px-3 py-2 text-xs text-blue-600 hover:bg-gray-100"
                  >
                    <FaFileContract className="mr-2" size={14} /> Ver Contrato
                  </a>
                ) : (
                  <button
                    onClick={startUpload}
                    className="flex items-center w-full px-3 py-2 text-xs text-purple-600 hover:bg-gray-100"
                  >
                    <FaUpload className="mr-2" size={14} /> Subir Contrato
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ---------------------------------------------

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto my-8">
          <p>Cargando eventos...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_auto_1fr_auto]">
      <Header />
      <div className="container mx-auto my-8 px-4">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-800 hover:text-gray-600 transition-colors mr-4"
            title="Volver al inicio"
          >
            <FaArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-bold text-gray-800">Mis Reservas</h2>
        </div>
        {/* Agregar el SearchBar */}
        <div className="mb-4">
          <SearchBar placeholder="Buscar reserva..." onSearch={handleSearch} />
        </div>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {filteredEvents.length > 0 ? (
          <div className="overflow-x-auto shadow-xl rounded-lg">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-2 px-4 border-b text-left">Nombre</th>
                  <th className="py-2 px-4 border-b text-left">Espacio</th>
                  {/* COLUMNA IMAGEN REDUCIDA A ÍCONO (OPCIONAL) O MANTENIDA AQUÍ */}
                  <th className="py-2 px-4 border-b text-center">Imagen</th>
                  <th className="py-2 px-4 border-b text-center">
                    Descripción
                  </th>
                  <th className="py-2 px-4 border-b text-left">Capacidad</th>
                  <th className="py-2 px-4 border-b text-left">Costo</th>
                  <th className="py-2 px-4 border-b text-center">Contacto</th>
                  <th className="py-2 px-4 border-b text-center">Fechas</th>
                  <th className="py-2 px-4 border-b text-center">Estado</th>
                  <th className="py-2 px-4 border-b text-center">Visualizar</th>
                  <th className="py-2 px-4 border-b text-center">Opciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event, index) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b font-semibold text-gray-800">
                        {event.name}
                      </td>
                      <td className="py-2 px-4 border-b font-semibold text-gray-800">
                        {event.room.name}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        {event.imagePath ? (
                          <img
                            src={getMediaUrl(event.imagePath)}
                            alt={event.name}
                            className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity duration-200 inline-block"
                            onClick={() => handleImageClick(event.imagePath)}
                          />
                        ) : (
                          <span className="text-gray-500 text-xs">N/I</span>
                        )}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          onClick={() =>
                            handleShowDescription(event.description)
                          }
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <FaInfoCircle size={18} />
                        </button>
                      </td>

                      <td className="py-2 px-4 border-b text-center">
                        {event.capacity}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        {event.cost}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          onClick={() => handleShowContact(event.contact)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <FaEnvelope size={18} />
                        </button>
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          onClick={() => handleShowDates(event)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <FaCalendarAlt size={18} />
                        </button>
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        <div className="flex justify-center items-center h-full">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              event.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : event.status === 'denied'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {event.status === 'approved'
                              ? 'Aprobado'
                              : event.status === 'denied'
                              ? 'Rechazado'
                              : 'Pendiente'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        <div className="flex justify-center items-center h-full">
                          <Link
                            to={`/events/${event.id}`}
                            className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors w-20"
                          >
                            <FaExternalLinkAlt className="mr-1" size={12} />
                            Ver
                          </Link>
                        </div>
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        <ActionMenu event={event} index={index} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="py-8 text-center text-gray-500">
                      No hay eventos disponibles.
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td colSpan="11" className="py-8 px-4 text-center">
                    <div className="flex justify-center items-center">
                      <button
                        onClick={() => navigate('/events')}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-lg"
                      >
                        Ver eventos
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-700">
            No hay eventos disponibles.
          </p>
        )}
      </div>
      <Footer />

      {/* MODALES*/}
      {showContactModal && (
        <Modal onClose={handleCloseContactModal}>
          <h2 className="text-xl font-bold mb-4">Información de Contacto</h2>
          <p>{selectedEventContact}</p>
          <button
            onClick={handleCloseContactModal}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Cerrar
          </button>
        </Modal>
      )}

      {/* Modal unificado para mostrar fechas del evento y reserva */}
      {showDatesModal && (
        <Modal onClose={handleCloseDatesModal}>
          <h2 className="text-xl font-bold mb-4">
            Fechas del Evento y Reserva
          </h2>

          <div className="space-y-6">
            {/* Fechas del Evento */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-600">
                Fechas del Evento
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="mb-2">
                  <strong className="text-gray-700">Inicio del Evento:</strong>
                  <div className="ml-2">
                    <div className="font-medium">
                      {formatDateTime(selectedEventDates.eventFrom).date}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDateTime(selectedEventDates.eventFrom).time}
                    </div>
                  </div>
                </div>
                <div>
                  <strong className="text-gray-700">Fin del Evento:</strong>
                  <div className="ml-2">
                    <div className="font-medium">
                      {formatDateTime(selectedEventDates.eventTo).date}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDateTime(selectedEventDates.eventTo).time}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fechas de Reserva */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-600">
                Fechas de Reserva
              </h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="mb-2">
                  <strong className="text-gray-700">Inicio de Reserva:</strong>
                  <div className="ml-2">
                    <div className="font-medium">
                      {formatDateTime(selectedEventDates.reservationFrom).date}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDateTime(selectedEventDates.reservationFrom).time}
                    </div>
                  </div>
                </div>
                <div>
                  <strong className="text-gray-700">Fin de Reserva:</strong>
                  <div className="ml-2">
                    <div className="font-medium">
                      {formatDateTime(selectedEventDates.reservationTo).date}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDateTime(selectedEventDates.reservationTo).time}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCloseDatesModal}
            className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Cerrar
          </button>
        </Modal>
      )}

      {/* Modal para mostrar la descripción */}
      {showDescriptionModal && (
        <Modal onClose={handleCloseDescriptionModal}>
          <h2 className="text-xl font-bold mb-4">Descripción del Evento</h2>
          <p>{selectedDescription}</p>
          <button
            onClick={handleCloseDescriptionModal}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Cerrar
          </button>
        </Modal>
      )}

      {/* Modal para mostrar la imagen ampliada */}
      {showImageModal && (
        <Modal onClose={() => setShowImageModal(false)}>
          <div className="flex flex-col items-center">
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-screen object-contain rounded"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminReservationsPage;
