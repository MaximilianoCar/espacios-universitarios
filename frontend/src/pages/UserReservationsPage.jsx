// src/pages/UserReservationsPage.js
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
} from 'react-icons/fa';
import Modal from '../components/Modal';

const UserReservationsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [error, setError] = useState('');
  const [uploadingProgramId, setUploadingProgramId] = useState(null);
  const [programFiles, setProgramFiles] = useState({});
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

  // Estados para la eliminación de reservas
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState(null);

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
      const searchableFields =
        `${event.name} ${event.description}`.toLowerCase();

      return searchableFields.includes(lowerCaseTerm);
    });

    setFilteredEvents(filtered);
  };

  // Manejar el cambio de archivo para el programa
  const handleProgramFileChange = (event, eventId) => {
    setProgramFiles(prevState => ({
      ...prevState,
      [eventId]: event.target.files[0],
    }));
  };

  // Manejar la subida del archivo del programa
  const handleUploadProgram = eventId => {
    const selectedFile = programFiles[eventId];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('programPath', selectedFile);

    axiosInstance
      .post(`/events/${eventId}/upload-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(response => {
        alert('Programa subido exitosamente.');
        setUploadingProgramId(null);
        setProgramFiles(prevState => ({
          ...prevState,
          [eventId]: null,
        }));
        // Refrescar los datos para mostrar el nuevo archivo
        axiosInstance.get(`/my-events`).then(response => {
          setEvents(response.data);
          setFilteredEvents(response.data);
        });
      })
      .catch(error => {
        console.error('Error al subir el programa:', error);
        alert('Error al subir el programa. Intente nuevamente.');
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

  // Funciones para manejar la eliminación de reservas
  const handleShowDeleteModal = reservation => {
    setReservationToDelete(reservation);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setReservationToDelete(null);
  };

  const handleDeleteReservation = () => {
    if (!reservationToDelete) return;

    axiosInstance
      .delete(`/events/${reservationToDelete.id}`) // Corrección aquí
      .then(response => {
        alert('Reserva eliminada exitosamente.');
        setShowDeleteModal(false);
        setReservationToDelete(null);
        // Actualizar el estado de eventos eliminando la reserva
        setEvents(prevEvents =>
          prevEvents.filter(event => event.id !== reservationToDelete.id)
        );
        setFilteredEvents(prevEvents =>
          prevEvents.filter(event => event.id !== reservationToDelete.id)
        );
      })
      .catch(error => {
        console.error('Error al eliminar la reserva:', error);
        alert('Error al eliminar la reserva. Intente nuevamente.');
      });
  };

  // Manejador de clic en la imagen para mostrar el modal
  const handleImageClick = imagePath => {
    setSelectedImage(`http://localhost:3000/${imagePath}`);
    setShowImageModal(true);
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
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Mis Reservas
        </h2>
        {/* Agregar el SearchBar */}
        <div className="mb-4">
          <SearchBar placeholder="Buscar reservas..." onSearch={handleSearch} />
        </div>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {filteredEvents.length > 0 ? (
          <div className="overflow-x-auto shadow-xl rounded-lg">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-2 px-4 border-b text-left">Nombre</th>
                  <th className="py-2 px-4 border-b text-left">Espacio</th>
                  <th className="py-2 px-4 border-b text-left">Imagen</th>
                  <th className="py-2 px-4 border-b text-left">Descripción</th>
                  <th className="py-2 px-4 border-b text-left">Capacidad</th>
                  <th className="py-2 px-4 border-b text-left">Costo</th>
                  <th className="py-2 px-4 border-b text-left">Contacto</th>
                  <th className="py-2 px-4 border-b text-left">
                    Fecha del Evento
                  </th>
                  <th className="py-2 px-4 border-b text-left">Reserva</th>
                  <th className="py-2 px-4 border-b text-left">Estado</th>
                  <th className="py-2 px-4 border-b text-left">Programa</th>
                  <th className="py-2 px-4 border-b text-left">Contrato</th>
                  <th className="py-2 px-4 border-b text-left">Acciones</th>
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
                        {event.room?.name || 'N/A'}
                      </td>

                      {/* Imagen */}
                      <td className="py-2 px-4 border-b">
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

                      <td className="py-2 px-4 border-b">{event.capacity}</td>
                      <td className="py-2 px-4 border-b">{event.cost}</td>

                      {/* Contacto */}
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          onClick={() => handleShowContact(event.contact)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <FaEnvelope size={18} />
                        </button>
                      </td>

                      {/* Fecha del Evento */}
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          onClick={() =>
                            handleShowEventDate({
                              eventFrom: event.eventFrom,
                              eventTo: event.eventTo,
                            })
                          }
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <FaCalendarAlt size={18} />
                        </button>
                      </td>

                      {/* Reserva */}
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          onClick={() =>
                            handleShowReservationDate({
                              reservationFrom: event.reservationFrom,
                              reservationTo: event.reservationTo,
                            })
                          }
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <FaCalendarAlt size={18} />
                        </button>
                      </td>

                      {/* Estado */}
                      <td className="py-2 px-4 border-b">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
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
                      <td className="py-2 px-4 border-b">
                        {event.programPath ? (
                          <a
                            href={`http://localhost:3000/${event.programPath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors w-20"
                          >
                            <FaEye className="mr-1" size={12} />
                            Ver
                          </a>
                        ) : (
                          <>
                            {uploadingProgramId === event.id ? (
                              <div className="flex flex-col space-y-1 w-20">
                                <input
                                  type="file"
                                  onChange={e =>
                                    handleProgramFileChange(e, event.id)
                                  }
                                  className="text-xs border rounded p-1 w-full"
                                />
                                {programFiles[event.id] && (
                                  <button
                                    onClick={() =>
                                      handleUploadProgram(event.id)
                                    }
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors w-full flex items-center justify-center"
                                  >
                                    <FaUpload className="mr-1" size={12} />
                                    Subir
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => setUploadingProgramId(event.id)}
                                className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors w-20"
                              >
                                <FaUpload className="mr-1" size={12} />
                                Subir
                              </button>
                            )}
                          </>
                        )}
                      </td>

                      {/* Contrato */}
                      <td className="py-2 px-4 border-b">
                        {event.agreementPath ? (
                          <a
                            href={`http://localhost:3000/${event.agreementPath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors w-20"
                          >
                            <FaEye className="mr-1" size={12} />
                            Ver
                          </a>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            No disponible
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-2 px-4 border-b">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleShowDeleteModal(event)}
                            className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
                          >
                            <FaTrash className="mr-1" size={12} />
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
        ) : (
          <p className="text-center">No tienes reservas.</p>
        )}
      </div>
      <Footer />
      {/* Modal para mostrar el contacto */}
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
      {/* Modal para mostrar la Fecha del Evento */}
      {showEventDateModal && (
        <Modal onClose={handleCloseEventDateModal}>
          <h2 className="text-xl font-bold mb-4">Fecha del Evento</h2>
          <p>
            Desde: {new Date(selectedEventDates.eventFrom).toLocaleString()}
          </p>
          <p>Hasta: {new Date(selectedEventDates.eventTo).toLocaleString()}</p>
          <button
            onClick={handleCloseEventDateModal}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Cerrar
          </button>
        </Modal>
      )}
      {/* Modal para mostrar la Fecha de Reserva */}
      {showReservationDateModal && (
        <Modal onClose={handleCloseReservationDateModal}>
          <h2 className="text-xl font-bold mb-4">Fecha de Reserva</h2>
          <p>
            Desde:{' '}
            {new Date(
              selectedReservationDates.reservationFrom
            ).toLocaleString()}
          </p>
          <p>
            Hasta:{' '}
            {new Date(selectedReservationDates.reservationTo).toLocaleString()}
          </p>
          <button
            onClick={handleCloseReservationDateModal}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Cerrar
          </button>
        </Modal>
      )}
      {/* Modal para mostrar la Descripción */}
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
      {/* Modal para Confirmar Eliminación de Reserva */}
      {showDeleteModal && (
        <Modal onClose={handleCloseDeleteModal}>
          <h2 className="text-xl font-bold mb-4">Confirmar Eliminación</h2>
          <p>
            ¿Estás seguro de que deseas eliminar la reserva de{' '}
            <strong>{reservationToDelete.name}</strong>?
          </p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCloseDeleteModal}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteReservation}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Eliminar
            </button>
          </div>
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

export default UserReservationsPage;
