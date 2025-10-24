import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import {
  FaEye,
  FaUpload,
  FaEnvelope,
  FaCalendarAlt,
  FaInfoCircle,
  FaTrash,
  FaMapPin,
  FaUsers,
  FaDollarSign,
  FaFile,
} from 'react-icons/fa';
import Modal from '../components/Modal';
import Swal from 'sweetalert2';

const UserReservationsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados para los modales
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedEventContact, setSelectedEventContact] = useState('');
  const [showEventDateModal, setShowEventDateModal] = useState(false);
  const [selectedEventDates, setSelectedEventDates] = useState({});
  const [showReservationDateModal, setShowReservationDateModal] =
    useState(false);
  const [selectedReservationDates, setSelectedReservationDates] = useState({});
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');

  // Estados para el modal de imagen
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    axiosInstance
      .get(`/my-events`)
      .then(response => {
        setEvents(response.data);
        setFilteredEvents(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching reservations:', error);
        setError('Error al obtener las reservas.');
        setLoading(false);
      });
  }, []);

  // Manejar el cambio en el término de búsqueda
  const handleSearch = term => {
    setSearchTerm(term);

    const filtered = events.filter(event => {
      const lowerCaseTerm = term.toLowerCase();
      const searchableFields = `${event.name} ${event.description} ${
        event.room?.name || ''
      }`.toLowerCase();

      return searchableFields.includes(lowerCaseTerm);
    });

    setFilteredEvents(filtered);
  };

  // Manejar clic en subir programa
  const handleUploadProgramClick = eventId => {
    // Crear input file dinámicamente
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*'; // Aceptar cualquier tipo de archivo
    input.onchange = e => {
      const file = e.target.files[0];
      if (file) {
        showUploadConfirmation(file, eventId);
      }
    };
    input.click();
  };

  // Mostrar confirmación de subida
  const showUploadConfirmation = (file, eventId) => {
    Swal.fire({
      title: '¿Subir archivo?',
      html: `
        <div class="text-left">
          <p class="mb-3">¿Estás seguro de subir este archivo como programa del evento?</p>
          <div class="bg-blue-50 p-3 rounded-lg">
            <p class="text-sm font-medium text-blue-800">Archivo seleccionado:</p>
            <p class="text-sm text-blue-600 break-all">${file.name}</p>
            <p class="text-xs text-blue-500 mt-1">Tamaño: ${(
              file.size /
              1024 /
              1024
            ).toFixed(2)} MB</p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, subir archivo',
      cancelButtonText: 'Cancelar',
      width: '500px',
    }).then(result => {
      if (result.isConfirmed) {
        uploadProgramFile(file, eventId);
      }
    });
  };

  // Subir el archivo del programa
  const uploadProgramFile = (file, eventId) => {
    const formData = new FormData();
    formData.append('programPath', file);

    // Mostrar loader durante la subida
    Swal.fire({
      title: 'Subiendo archivo...',
      text: 'Por favor espere mientras se sube el programa',
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
        Swal.close();
        Swal.fire({
          title: '¡Éxito!',
          text: 'El programa ha sido subido exitosamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Aceptar',
        });

        // Refrescar los datos para mostrar el nuevo archivo
        axiosInstance.get(`/my-events`).then(response => {
          setEvents(response.data);
          setFilteredEvents(response.data);
        });
      })
      .catch(error => {
        Swal.close();
        console.error('Error al subir el programa:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al subir el programa. Intente nuevamente.',
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'Aceptar',
        });
      });
  };

  // Función para manejar la eliminación de reservas con SweetAlert2
  const handleDeleteReservation = reservation => {
    Swal.fire({
      title: '¿Estás seguro?',
      html: `
        <div class="text-left">
          <p class="mb-4">¿Estás seguro de que deseas eliminar la reserva de <strong>"${reservation.name}"</strong>?</p>
          <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-700">
                  <strong>Esta acción no se puede deshacer.</strong> La reserva será eliminada permanentemente.
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar reserva',
      cancelButtonText: 'Cancelar',
      width: '500px',
    }).then(result => {
      if (result.isConfirmed) {
        // Mostrar loader durante la eliminación
        Swal.fire({
          title: 'Eliminando...',
          text: 'Por favor espere mientras se elimina la reserva',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          },
        });

        axiosInstance
          .delete(`/events/${reservation.id}`)
          .then(response => {
            Swal.close();
            Swal.fire({
              title: '¡Eliminado!',
              text: 'La reserva ha sido eliminada exitosamente.',
              icon: 'success',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Aceptar',
            });

            // Actualizar el estado de eventos eliminando la reserva
            setEvents(prevEvents =>
              prevEvents.filter(event => event.id !== reservation.id)
            );
            setFilteredEvents(prevEvents =>
              prevEvents.filter(event => event.id !== reservation.id)
            );
          })
          .catch(error => {
            Swal.close();
            console.error('Error al eliminar la reserva:', error);
            Swal.fire({
              title: 'Error',
              text: 'Error al eliminar la reserva. Intente nuevamente.',
              icon: 'error',
              confirmButtonColor: '#d33',
              confirmButtonText: 'Aceptar',
            });
          });
      }
    });
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

  const handleShowEventDate = eventDates => {
    setSelectedEventDates(eventDates);
    setShowEventDateModal(true);
  };

  const handleCloseEventDateModal = () => {
    setShowEventDateModal(false);
    setSelectedEventDates({});
  };

  const handleShowReservationDate = reservationDates => {
    setSelectedReservationDates(reservationDates);
    setShowReservationDateModal(true);
  };

  const handleCloseReservationDateModal = () => {
    setShowReservationDateModal(false);
    setSelectedReservationDates({});
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
    setSelectedImage(`http://localhost:3000/${imagePath}`);
    setShowImageModal(true);
  };

  // Formatear fecha
  const formatDate = dateString => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto my-8">
          <p>Cargando reservas...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      <Header />
      <div className="container mx-auto my-8 px-4">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Mis Reservas</h2>

        {/* SearchBar */}
        <div className="mb-6">
          <SearchBar
            placeholder="Buscar por nombre, descripción o espacio..."
            onSearch={handleSearch}
          />
        </div>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {/* Vista Desktop - Tabla */}
        <div className="hidden lg:block overflow-x-auto shadow-xl rounded-lg">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-blue-100">
                <th className="py-3 px-4 border-b text-left">Nombre</th>
                <th className="py-3 px-4 border-b text-left">Espacio</th>
                <th className="py-3 px-4 border-b text-left">Imagen</th>
                <th className="py-3 px-4 border-b text-left">Descripción</th>
                <th className="py-3 px-4 border-b text-left">Capacidad</th>
                <th className="py-3 px-4 border-b text-left">Costo</th>
                <th className="py-3 px-4 border-b text-left">Contacto</th>
                <th className="py-3 px-4 border-b text-left">Fecha Evento</th>
                <th className="py-3 px-4 border-b text-left">Reserva</th>
                <th className="py-3 px-4 border-b text-left">Estado</th>
                <th className="py-3 px-4 border-b text-left">Programa</th>
                <th className="py-3 px-4 border-b text-left">Contrato</th>
                <th className="py-3 px-4 border-b text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, index) => (
                  <tr
                    key={event.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 border-b font-semibold text-gray-800">
                      {event.name}
                    </td>
                    <td className="py-3 px-4 border-b">
                      {event.room?.name || 'N/A'}
                    </td>

                    {/* Imagen */}
                    <td className="py-3 px-4 border-b">
                      {event.imagePath ? (
                        <img
                          src={`http://localhost:3000/${event.imagePath}`}
                          alt={event.name}
                          className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity duration-200"
                          onClick={() => handleImageClick(event.imagePath)}
                        />
                      ) : (
                        <span className="text-gray-500 text-sm">
                          Sin imagen
                        </span>
                      )}
                    </td>

                    {/* Descripción */}
                    <td className="py-3 px-4 border-b text-center">
                      <button
                        onClick={() => handleShowDescription(event.description)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Ver descripción"
                      >
                        <FaInfoCircle size={18} />
                      </button>
                    </td>

                    <td className="py-3 px-4 border-b">{event.capacity}</td>
                    <td className="py-3 px-4 border-b">{event.cost}</td>

                    {/* Contacto */}
                    <td className="py-3 px-4 border-b text-center">
                      <button
                        onClick={() => handleShowContact(event.contact)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Ver contacto"
                      >
                        <FaEnvelope size={18} />
                      </button>
                    </td>

                    {/* Fecha del Evento */}
                    <td className="py-3 px-4 border-b text-center">
                      <button
                        onClick={() =>
                          handleShowEventDate({
                            eventFrom: event.eventFrom,
                            eventTo: event.eventTo,
                          })
                        }
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Ver fechas del evento"
                      >
                        <FaCalendarAlt size={18} />
                      </button>
                    </td>

                    {/* Reserva */}
                    <td className="py-3 px-4 border-b text-center">
                      <button
                        onClick={() =>
                          handleShowReservationDate({
                            reservationFrom: event.reservationFrom,
                            reservationTo: event.reservationTo,
                          })
                        }
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Ver fechas de reserva"
                      >
                        <FaCalendarAlt size={18} />
                      </button>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4 border-b">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
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
                          ? 'Denegado'
                          : 'Pendiente'}
                      </span>
                    </td>

                    {/* Programa */}
                    <td className="py-3 px-4 border-b">
                      {event.programPath ? (
                        <a
                          href={`http://localhost:3000/${event.programPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition-colors"
                          title="Ver programa"
                        >
                          <FaEye className="mr-2" size={14} />
                          Ver
                        </a>
                      ) : (
                        <button
                          onClick={() => handleUploadProgramClick(event.id)}
                          className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors w-full"
                          title="Subir programa"
                        >
                          <FaUpload className="mr-2" size={14} />
                          Subir
                        </button>
                      )}
                    </td>

                    {/* Contrato */}
                    <td className="py-3 px-4 border-b">
                      {event.agreementPath ? (
                        <a
                          href={`http://localhost:3000/${event.agreementPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition-colors"
                          title="Ver contrato"
                        >
                          <FaFile className="mr-2" size={14} />
                          Ver
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          No disponible
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 border-b">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleDeleteReservation(event)}
                          className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors"
                          title="Eliminar reserva"
                        >
                          <FaTrash className="mr-2" size={14} />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="py-8 text-center text-gray-500">
                    No hay eventos disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Mobile - Cards */}
        <div className="lg:hidden space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-gray-800 flex-1">
                    {event.name}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ml-2 ${
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
                      ? 'Denegado'
                      : 'Pendiente'}
                  </span>
                </div>

                {/* Imagen */}
                {event.imagePath && (
                  <div className="mb-3">
                    <img
                      src={`http://localhost:3000/${event.imagePath}`}
                      alt={event.name}
                      className="w-full h-32 object-cover rounded cursor-pointer"
                      onClick={() => handleImageClick(event.imagePath)}
                    />
                  </div>
                )}

                {/* Información básica */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaMapPin className="mr-2 text-blue-500" />
                    <span>{event.room?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUsers className="mr-2 text-green-500" />
                    <span>{event.capacity}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaDollarSign className="mr-2 text-yellow-500" />
                    <span>{event.cost}</span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => handleShowDescription(event.description)}
                    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm transition-colors"
                  >
                    <FaInfoCircle className="mr-2" size={14} />
                    Descripción
                  </button>
                  <button
                    onClick={() => handleShowContact(event.contact)}
                    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm transition-colors"
                  >
                    <FaEnvelope className="mr-2" size={14} />
                    Contacto
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() =>
                      handleShowEventDate({
                        eventFrom: event.eventFrom,
                        eventTo: event.eventTo,
                      })
                    }
                    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm transition-colors"
                  >
                    <FaCalendarAlt className="mr-2" size={14} />
                    Evento
                  </button>
                  <button
                    onClick={() =>
                      handleShowReservationDate({
                        reservationFrom: event.reservationFrom,
                        reservationTo: event.reservationTo,
                      })
                    }
                    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm transition-colors"
                  >
                    <FaCalendarAlt className="mr-2" size={14} />
                    Reserva
                  </button>
                </div>

                {/* Programa y Contrato */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {event.programPath ? (
                    <a
                      href={`http://localhost:3000/${event.programPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm transition-colors"
                    >
                      <FaEye className="mr-2" size={14} />
                      Programa
                    </a>
                  ) : (
                    <button
                      onClick={() => handleUploadProgramClick(event.id)}
                      className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm transition-colors"
                    >
                      <FaUpload className="mr-2" size={14} />
                      Subir Programa
                    </button>
                  )}

                  {event.agreementPath ? (
                    <a
                      href={`http://localhost:3000/${event.agreementPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm transition-colors"
                    >
                      <FaFile className="mr-2" size={14} />
                      Contrato
                    </a>
                  ) : (
                    <span className="flex items-center justify-center bg-gray-100 text-gray-500 py-2 px-3 rounded text-sm">
                      Sin contrato
                    </span>
                  )}
                </div>

                {/* Eliminar */}
                <button
                  onClick={() => handleDeleteReservation(event)}
                  className="w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  <FaTrash className="mr-2" size={14} />
                  Eliminar Reserva
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay eventos disponibles.
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Modales existentes (se mantienen igual) */}
      {showContactModal && (
        <Modal onClose={handleCloseContactModal}>
          <h2 className="text-xl font-bold mb-4">Información de Contacto</h2>
          <p className="text-gray-700">{selectedEventContact}</p>
          <button
            onClick={handleCloseContactModal}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Cerrar
          </button>
        </Modal>
      )}

      {showEventDateModal && (
        <Modal onClose={handleCloseEventDateModal}>
          <h2 className="text-xl font-bold mb-4">Fecha del Evento</h2>
          <div className="space-y-2">
            <p>
              <strong>Desde:</strong> {formatDate(selectedEventDates.eventFrom)}
            </p>
            <p>
              <strong>Hasta:</strong> {formatDate(selectedEventDates.eventTo)}
            </p>
          </div>
          <button
            onClick={handleCloseEventDateModal}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Cerrar
          </button>
        </Modal>
      )}

      {showReservationDateModal && (
        <Modal onClose={handleCloseReservationDateModal}>
          <h2 className="text-xl font-bold mb-4">Fecha de Reserva</h2>
          <div className="space-y-2">
            <p>
              <strong>Desde:</strong>{' '}
              {formatDate(selectedReservationDates.reservationFrom)}
            </p>
            <p>
              <strong>Hasta:</strong>{' '}
              {formatDate(selectedReservationDates.reservationTo)}
            </p>
          </div>
          <button
            onClick={handleCloseReservationDateModal}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Cerrar
          </button>
        </Modal>
      )}

      {showDescriptionModal && (
        <Modal onClose={handleCloseDescriptionModal}>
          <h2 className="text-xl font-bold mb-4">Descripción del Evento</h2>
          <p className="text-gray-700 whitespace-pre-line">
            {selectedDescription}
          </p>
          <button
            onClick={handleCloseDescriptionModal}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Cerrar
          </button>
        </Modal>
      )}

      {showImageModal && (
        <Modal onClose={() => setShowImageModal(false)}>
          <div className="flex flex-col items-center">
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-96 object-contain rounded"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserReservationsPage;
