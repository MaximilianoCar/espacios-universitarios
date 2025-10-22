import React, { useEffect, useState } from 'react';
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
  FaInfoCircle, // Importar el icono de información
} from 'react-icons/fa';
import Modal from '../components/Modal'; // Asegúrate de que el componente Modal esté creado

const AdminReservationsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingAgreementId, setUploadingAgreementId] = useState(null);
  const [agreementFile, setAgreementFile] = useState(null);

  // Estados para los modales
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedEventContact, setSelectedEventContact] = useState('');
  const [showEventDateModal, setShowEventDateModal] = useState(false);
  const [selectedEventDates, setSelectedEventDates] = useState({});
  const [showReservationDateModal, setShowReservationDateModal] =
    useState(false);
  const [selectedReservationDates, setSelectedReservationDates] = useState({});
  const [showDescriptionModal, setShowDescriptionModal] = useState(false); // Estado para el modal de descripción
  const [selectedDescription, setSelectedDescription] = useState(''); // Descripción seleccionada

  // Estados para el modal de imagen
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Obtener los eventos desde la API
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

  // Manejar el cambio en el término de búsqueda
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

  // Manejar el cambio de archivo para el contrato
  const handleAgreementFileChange = event => {
    setAgreementFile(event.target.files[0]);
  };

  // Manejar la subida del archivo de contrato
  const handleUploadAgreement = eventId => {
    if (!agreementFile) return;

    const formData = new FormData();
    formData.append('agreementPath', agreementFile);

    axiosInstance
      .post(`/events/${eventId}/upload-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(response => {
        alert('Contrato subido exitosamente.');
        setUploadingAgreementId(null);
        setAgreementFile(null);
        // Refrescar los datos para mostrar el nuevo archivo
        axiosInstance.get('/admin/events').then(response => {
          setEvents(response.data);
          // Aplicar el filtro de búsqueda nuevamente
          handleSearch(searchTerm);
        });
      })
      .catch(error => {
        console.error('Error al subir el contrato:', error);
        alert('Error al subir el contrato. Intente nuevamente.');
      });
  };

  // Función para actualizar el estado del evento
  const handleUpdateStatus = (eventId, newStatus) => {
    if (
      window.confirm(`¿Estás seguro de que deseas ${newStatus} esta reserva?`)
    ) {
      axiosInstance
        .put(`/events/${eventId}`, { status: newStatus })
        .then(response => {
          // Actualizar 'events' y 'filteredEvents'
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
        })
        .catch(error => {
          console.error('Error updating event status:', error);
          alert(
            'Error al actualizar el estado del evento. Por favor, intente nuevamente.'
          );
        });
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
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          Gestionar Reservas
        </h2>
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
                        {event.room.name}
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

                      {/* ESTADO*/}
                      <td className="py-2 px-4 border-b">
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

                      {/* PROGRAMA */}
                      <td className="py-2 px-4 border-b">
                        <div className="flex justify-center items-center h-full">
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
                            <span className="text-gray-500 text-sm">N/A</span>
                          )}
                        </div>
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
                          <>
                            {uploadingAgreementId === event.id ? (
                              <div className="flex flex-col space-y-1 w-20">
                                <input
                                  type="file"
                                  onChange={handleAgreementFileChange}
                                  className="text-xs border rounded p-1 w-full"
                                />
                                <button
                                  onClick={() =>
                                    handleUploadAgreement(event.id)
                                  }
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors w-full"
                                >
                                  Subir
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setUploadingAgreementId(event.id)
                                }
                                className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors w-20"
                              >
                                <FaUpload className="mr-1" size={12} />
                                Subir
                              </button>
                            )}
                          </>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-2 px-4 border-b">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() =>
                              handleUpdateStatus(event.id, 'approved')
                            }
                            className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded text-xs transition-colors"
                          >
                            <FaCheckCircle className="mr-1" size={12} /> Aprobar
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(event.id, 'denied')
                            }
                            className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded text-xs transition-colors"
                          >
                            <FaTimesCircle className="mr-1" size={12} /> Denegar
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
          <p className="text-center text-gray-700">
            No hay eventos disponibles.
          </p>
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
