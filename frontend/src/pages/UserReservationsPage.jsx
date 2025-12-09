import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar2';
import {
  FaEye,
  FaUpload,
  FaRegEnvelope,
  FaRegCalendarAlt,
  FaInfoCircle,
  FaTrash,
  FaMapPin,
  FaUsers,
  FaDollarSign,
  FaFile,
  FaExternalLinkAlt,
  FaEllipsisV,
  FaFilePdf,
  FaFileContract,
  FaArrowLeft,
  FaCalendarAlt,
} from 'react-icons/fa';
import { IoInformationCircleOutline } from 'react-icons/io5';
import Modal from '../components/Modal';
import ModalMobile from '../components/ModalMobile';

import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import getMediaUrl from '../utils/media';

const PAGE_SIZE = 25; // mismo que el backend

const UserReservationsPage = () => {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingProgramId, setUploadingProgramId] = useState(null);
  const [programFile, setProgramFile] = useState(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [openMenuId, setOpenMenuId] = useState(null);
  // ---------------------------------------------

  // Estados para los modales
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedEventContact, setSelectedEventContact] = useState('');
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [selectedEventDates, setSelectedEventDates] = useState({});
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');

  // Estados para el modal de imagen
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const navigate = useNavigate();

  // Estado para detectar si es móvil
  const [isMobile, setIsMobile] = useState(false);

  // Función para recargar eventos manteniendo la paginación actual
  const refreshEvents = async () => {
    try {
      const response = await axiosInstance.get('/my-events', {
        params: {
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: searchTerm,
        },
      });

      setEvents(response.data.events || []);
      setTotalEvents(response.data.totalEvents || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error refreshing events:', error);
      setError('Error al obtener las reservas.');
    }
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Función para renderizar el modal correcto
  const RenderModal = ({ children, onClose }) => {
    if (isMobile) {
      return <ModalMobile onClose={onClose}>{children}</ModalMobile>;
    }
    return <Modal onClose={onClose}>{children}</Modal>;
  };

  // Cierra el menú de acciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = event => {
      if (openMenuId && !event.target.closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Modificar la función handleSearch para buscar solo al presionar Enter
  const handleSearch = async term => {
    setSearchTerm(term);
    setCurrentSearch(term);
    setCurrentPage(1); // Siempre volver a la página 1 al buscar

    setLoading(true);
    try {
      const response = await axiosInstance.get('/my-events', {
        params: {
          page: 1,
          pageSize: PAGE_SIZE,
          search: term,
        },
      });

      setEvents(response.data.events || []);
      setTotalEvents(response.data.totalEvents || 0);
      setTotalPages(response.data.totalPages || 1);
      setError('');
    } catch (error) {
      console.error('Error searching events:', error);
      setError('Error al buscar eventos.');
    } finally {
      setLoading(false);
    }
  };

  // Obtener eventos con paginación del BACKEND
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/my-events', {
          params: {
            page: currentPage,
            pageSize: PAGE_SIZE,
            search: searchTerm,
          },
        });

        setEvents(response.data.events || []);
        setTotalEvents(response.data.totalEvents || 0);
        setTotalPages(response.data.totalPages || 1);
        setError('');
      } catch (error) {
        console.error('Error fetching reservations:', error);
        setError('Error al obtener las reservas.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentPage]); // Solo dependencia de currentPage

  // Manejar cambio de página
  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Manejar cambio de archivo para el programa
  const handleProgramFileChange = event => {
    setProgramFile(event.target.files[0]);
  };

  // Manejar la subida del archivo de programa
  const handleUploadProgram = async eventId => {
    if (!programFile) return;

    const formData = new FormData();
    formData.append('programPath', programFile);

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

    try {
      await axiosInstance.post(`/events/${eventId}/upload-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Swal.close();
      Swal.fire({
        title: '¡Éxito!',
        text: 'El programa ha sido subido exitosamente.',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Aceptar',
      });

      setUploadingProgramId(null);
      setProgramFile(null);

      // Recargar los datos manteniendo la paginación actual
      await refreshEvents();
    } catch (error) {
      Swal.close();
      console.error('Error al subir el programa:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al subir el programa. Intente nuevamente.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar',
      });
    }
  };

  const handleDeleteReservation = async reservation => {
    setOpenMenuId(null); // Cerrar el menú después de la acción

    const result = await Swal.fire({
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
    });

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

      try {
        await axiosInstance.delete(`/events/${reservation.id}`);

        Swal.close();
        Swal.fire({
          title: '¡Eliminado!',
          text: 'La reserva ha sido eliminada exitosamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Aceptar',
        });

        // Recargar desde el backend manteniendo la paginación
        await refreshEvents();
      } catch (error) {
        Swal.close();
        console.error('Error al eliminar la reserva:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al eliminar la reserva. Intente nuevamente.',
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'Aceptar',
        });
      }
    }
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

  // Función para mostrar el modal de fechas unificado
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

  // componente de acciones
  const ActionMenu = ({ event, index }) => {
    const isMenuOpen = openMenuId === event.id;
    const menuRef = useRef(null);
    const isUploading = uploadingProgramId === event.id;
    const fileInputRef = useRef(null);

    const shouldOpenUpward = index > 0;

    const toggleMenu = e => {
      e.stopPropagation();
      setOpenMenuId(isMenuOpen ? null : event.id);
    };

    const startUpload = () => {
      setOpenMenuId(null);
      setUploadingProgramId(event.id);
      setProgramFile(null); // Resetear el archivo al iniciar
    };

    const cancelUpload = () => {
      setUploadingProgramId(null);
      setProgramFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Limpiar el input file
      }
    };

    const executeUpload = () => {
      if (!programFile) {
        Swal.fire(
          'Error',
          'Por favor selecciona un archivo primero.',
          'warning'
        );
        return;
      }
      handleUploadProgram(event.id);
    };

    const handleFileChange = event => {
      const file = event.target.files[0];
      setProgramFile(file);
    };

    const handleProgramOptions = () => {
      setOpenMenuId(null);
      Swal.fire({
        title: '',
        html: `
        <div class="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden text-left">
          <div class="flex items-center justify-between px-4 py-3 border-b">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">Programa</h3>
              <p class="text-sm text-gray-600 mt-1">Ver, actualizar o eliminar el programa asociado a este evento.</p>
            </div>
          </div>

          <div class="px-4 py-4 space-y-3">
            <div class="text-sm text-gray-700">Acciones disponibles:</div>
            <div class="flex gap-2">
              <button id="swal-view-prog" class="w-1/3 px-3 py-2 bg-blue-600 text-white rounded-md text-sm">Ver</button>
              <button id="swal-update-prog" class="w-1/3 px-3 py-2 bg-yellow-500 text-white rounded-md text-sm">Actualizar</button>
              <button id="swal-delete-prog" class="w-1/3 px-3 py-2 bg-red-600 text-white rounded-md text-sm">Eliminar</button>
            </div>
          </div>

          <div class="px-4 py-3 border-t text-right">
            <button id="swal-cancel-prog" class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">Cerrar</button>
          </div>
        </div>
      `,
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
          const view = document.getElementById('swal-view-prog');
          const update = document.getElementById('swal-update-prog');
          const del = document.getElementById('swal-delete-prog');
          const cancel = document.getElementById('swal-cancel-prog');

          cancel && cancel.addEventListener('click', () => Swal.close());

          view &&
            view.addEventListener('click', () => {
              if (event.programPath)
                window.open(getMediaUrl(event.programPath), '_blank');
              Swal.close();
            });

          update &&
            update.addEventListener('click', () => {
              Swal.close();
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
              input.onchange = async e => {
                const file = e.target.files[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('programPath', file);

                Swal.fire({
                  title: 'Subiendo programa...',
                  allowOutsideClick: false,
                  didOpen: () => Swal.showLoading(),
                  showConfirmButton: false,
                });
                try {
                  await axiosInstance.post(
                    `/events/${event.id}/upload-files`,
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                  );
                  Swal.close();
                  await Swal.fire(
                    '¡Listo!',
                    'Programa actualizado correctamente.',
                    'success'
                  );
                  await refreshEvents();
                } catch (err) {
                  Swal.close();
                  console.error(err);
                  Swal.fire(
                    'Error',
                    'No se pudo actualizar el programa.',
                    'error'
                  );
                }
              };
              input.click();
            });

          del &&
            del.addEventListener('click', async () => {
              Swal.close();
              const r = await Swal.fire({
                title: '¿Eliminar programa?',
                text: 'Esta acción eliminará el programa permanentemente.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
              });
              if (r.isConfirmed) {
                Swal.fire({
                  title: 'Eliminando...',
                  allowOutsideClick: false,
                  didOpen: () => Swal.showLoading(),
                  showConfirmButton: false,
                });
                try {
                  await axiosInstance.delete(`/events/${event.id}/program`);
                  Swal.close();
                  await Swal.fire(
                    'Eliminado',
                    'Programa eliminado correctamente.',
                    'success'
                  );
                  await refreshEvents();
                } catch (err) {
                  Swal.close();
                  console.error(err);
                  Swal.fire(
                    'Error',
                    'No se pudo eliminar el programa.',
                    'error'
                  );
                }
              }
            });
        },
      });
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
              Subir programa:
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="text-xs border rounded p-1 w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />

            {programFile && (
              <div
                className="text-xs text-green-600 font-medium truncate"
                title={programFile.name}
              >
                ✓ {programFile.name}
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={executeUpload}
                className={`flex-1 py-1 px-2 rounded text-xs transition-colors ${
                  programFile
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!programFile}
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
                {/* ACCIONES DE DOCUMENTOS */}
                {event.programPath ? (
                  <button
                    onClick={() => handleProgramOptions()}
                    className="flex items-center w-full px-3 py-2 text-xs text-blue-600 hover:bg-gray-100"
                  >
                    <FaFilePdf className="mr-2" size={14} /> Programa
                  </button>
                ) : (
                  <button
                    onClick={startUpload}
                    className="flex items-center w-full px-3 py-2 text-xs text-purple-600 hover:bg-gray-100"
                  >
                    <FaUpload className="mr-2" size={14} /> Subir Programa
                  </button>
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
                  <span className="flex items-center w-full px-3 py-2 text-xs text-gray-500">
                    <FaFileContract className="mr-2" size={14} /> Contrato (N/A)
                  </span>
                )}

                {/* SEPARADOR */}
                <div className="border-t border-gray-100 w-full"></div>

                {/* OTRAS ACCIONES */}
                <button
                  onClick={() => handleDeleteReservation(event)}
                  className="flex items-center w-full px-3 py-2 text-xs text-red-600 hover:bg-gray-100 font-semibold"
                >
                  <FaTrash className="mr-2" size={14} /> Eliminar
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
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
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center text-gray-800 hover:text-gray-600 transition-colors mr-4"
            title="Volver al inicio"
          >
            <FaArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-bold text-gray-800">Mis Reservas</h2>
        </div>

        {/* SearchBar */}
        <div className="mb-6">
          <SearchBar
            placeholder="Buscar por nombre, descripción o espacio..."
            onSearch={handleSearch}
          />
        </div>

        {/* Indicador de búsqueda activa */}
        {currentSearch && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-sm text-blue-700">
                Mostrando resultados para: <strong>"{currentSearch}"</strong>
                {totalEvents > 0 && (
                  <span className="ml-2 text-blue-600">
                    ({totalEvents} resultado{totalEvents !== 1 ? 's' : ''})
                  </span>
                )}
              </p>
              <button
                onClick={() => handleSearch('')}
                className="text-blue-500 hover:text-blue-700 underline text-sm font-medium"
              >
                Limpiar búsqueda
              </button>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay resultados */}
        {currentSearch && events.length === 0 && !loading && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-yellow-700">
              No se encontraron resultados para:{' '}
              <strong>"{currentSearch}"</strong>
            </p>
            <button
              onClick={() => handleSearch('')}
              className="mt-2 text-yellow-600 hover:text-yellow-800 underline text-sm"
            >
              Ver todas las reservas
            </button>
          </div>
        )}

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {/* Vista Desktop - Tabla MODIFICADA */}
        <div className="hidden lg:block overflow-x-auto shadow-xl rounded-lg">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-blue-100">
                <th className="py-2 px-4 border-b text-left">Nombre</th>
                <th className="py-2 px-4 border-b text-left">Espacio</th>
                <th className="py-2 px-4 border-b text-center">Imagen</th>
                <th className="py-2 px-4 border-b text-center">Descripción</th>
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
              {events.length > 0 ? (
                events.map((event, index) => (
                  <tr
                    key={event.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2 px-4 border-b font-semibold text-gray-800">
                      {event.name}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {event.room?.name || 'N/A'}
                    </td>

                    {/* Imagen */}
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

                    {/* Descripción */}
                    <td className="py-2 px-4 border-b text-center">
                      <button
                        onClick={() => handleShowDescription(event.description)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Ver descripción"
                      >
                        <IoInformationCircleOutline size={22} />
                      </button>
                    </td>

                    <td className="py-2 px-4 border-b text-center">
                      {event.capacity}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      {event.cost}
                    </td>

                    {/* Contacto */}
                    <td className="py-2 px-4 border-b text-center">
                      <button
                        onClick={() => handleShowContact(event.contact)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Ver contacto"
                      >
                        <FaRegEnvelope size={18} />
                      </button>
                    </td>

                    {/* FECHAS UNIFICADAS */}
                    <td className="py-2 px-4 border-b text-center">
                      <button
                        onClick={() => handleShowDates(event)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Ver fechas"
                      >
                        <FaRegCalendarAlt size={18} />
                      </button>
                    </td>

                    {/* Estado */}
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

                    {/* Visualizar */}
                    <td className="py-2 px-4 border-b text-center">
                      <div className="flex justify-center items-center h-full">
                        <button
                          onClick={() => navigate(`/preview/${event.id}`)}
                          className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors w-20"
                        >
                          <FaExternalLinkAlt className="mr-1" size={12} />
                          Ver
                        </button>
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
                    {currentSearch
                      ? 'No se encontraron reservas que coincidan con tu búsqueda.'
                      : 'No hay reservas disponibles.'}
                  </td>
                </tr>
              )}
              <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                <td colSpan="11" className="py-6 px-4 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="max-w-2xl mx-auto mb-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-yellow-700">
                          Nota:
                        </span>{' '}
                        Las reservas no se pueden editar complementamente, para
                        editar descripción e imagen previsualizar el evento
                        (Cambios mayores conllevan eliminar el evento y hacer
                        una nueva solicitud)
                      </p>
                    </div>
                    <div className="flex justify-center items-center">
                      <button
                        onClick={() => navigate('/create-reservation')}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-lg"
                      >
                        Solicitar Reserva
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* PAGINACIÓN */}
          <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
            <p className="text-sm text-gray-600">
              Mostrando {events.length} de {totalEvents} reservas (Pág.{' '}
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

        {/* Vista Mobile - Cards MEJORADA */}
        <div className="lg:hidden space-y-4">
          {events.length > 0 ? (
            events.map((event, index) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-4 relative"
              >
                {/* Header mejorado con botón de opciones en posición más intuitiva */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-2">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">
                      {event.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <FaMapPin className="mr-2 text-blue-500" size={14} />
                      <span>{event.room?.name || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
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

                    {/* Botón de opciones */}
                    <div className="relative">
                      <ActionMenu event={event} index={index} />
                    </div>
                  </div>
                </div>

                {/* Imagen */}
                {event.imagePath && (
                  <div className="mb-3">
                    <img
                      src={getMediaUrl(event.imagePath)}
                      alt={event.name}
                      className="w-full h-40 object-cover rounded cursor-pointer"
                      onClick={() => handleImageClick(event.imagePath)}
                    />
                  </div>
                )}

                {/* Información básica compacta */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUsers className="mr-2 text-green-500" size={14} />
                    <span>Capacidad: {event.capacity}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaDollarSign className="mr-2 text-yellow-500" size={14} />
                    <span>Costo: {event.cost}</span>
                  </div>
                </div>

                {/* Botones de acción principales */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    onClick={() => handleShowDescription(event.description)}
                    className="flex flex-col items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-1 rounded text-xs transition-colors"
                  >
                    <FaInfoCircle className="mb-1" size={14} />
                    <span>Descripción</span>
                  </button>
                  <button
                    onClick={() => handleShowContact(event.contact)}
                    className="flex flex-col items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-1 rounded text-xs transition-colors"
                  >
                    <FaRegEnvelope className="mb-1" size={14} />
                    <span>Contacto</span>
                  </button>
                  <button
                    onClick={() => handleShowDates(event)}
                    className="flex flex-col items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-1 rounded text-xs transition-colors"
                  >
                    <FaRegCalendarAlt className="mb-1" size={14} />
                    <span>Fechas</span>
                  </button>
                </div>

                {/* Botón de previsualización */}
                <button
                  onClick={() => navigate(`/preview/${event.id}`)}
                  className="w-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm transition-colors mb-2"
                >
                  <FaEye className="mr-2" size={14} />
                  Previsualizar Evento
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {currentSearch
                ? 'No se encontraron reservas que coincidan con tu búsqueda.'
                : 'No hay reservas disponibles.'}
            </div>
          )}

          {/* PAGINACIÓN PARA MÓVIL */}
          {events.length > 0 && (
            <div className="flex justify-between items-center p-4 bg-gray-50 border-t rounded-lg">
              <p className="text-sm text-gray-600">
                Pág. {currentPage} de {totalPages}
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
          )}
        </div>
      </div>
      <Footer />

      {/* MODALES COMPLETAMENTE REDISEÑADOS PARA MÓVIL */}
      {showContactModal && (
        <RenderModal onClose={handleCloseContactModal}>
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">
              Información de Contacto
            </h2>
          </div>
          <div className="p-5">
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedEventContact}
              </p>
            </div>
            <button
              onClick={handleCloseContactModal}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        </RenderModal>
      )}

      {showDatesModal && (
        <RenderModal onClose={handleCloseDatesModal}>
          <div className="p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-gray-800">
              Fechas del Evento
            </h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Fechas del Evento */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <h3 className="text-base font-semibold text-blue-800 mb-3 flex items-center">
                <FaCalendarAlt className="mr-2" size={16} />
                Fechas del Evento
              </h3>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-xs font-medium text-blue-600 mb-1">
                    INICIO DEL EVENTO
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {formatDateTime(selectedEventDates.eventFrom).date}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDateTime(selectedEventDates.eventFrom).time}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-xs font-medium text-blue-600 mb-1">
                    FIN DEL EVENTO
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {formatDateTime(selectedEventDates.eventTo).date}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDateTime(selectedEventDates.eventTo).time}
                  </div>
                </div>
              </div>
            </div>

            {/* Fechas de Reserva */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <h3 className="text-base font-semibold text-green-800 mb-3 flex items-center">
                <FaCalendarAlt className="mr-2" size={16} />
                Fechas de Reserva
              </h3>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="text-xs font-medium text-green-600 mb-1">
                    INICIO DE RESERVA
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {formatDateTime(selectedEventDates.reservationFrom).date}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDateTime(selectedEventDates.reservationFrom).time}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="text-xs font-medium text-green-600 mb-1">
                    FIN DE RESERVA
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {formatDateTime(selectedEventDates.reservationTo).date}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDateTime(selectedEventDates.reservationTo).time}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              onClick={handleCloseDatesModal}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        </RenderModal>
      )}

      {showDescriptionModal && (
        <RenderModal onClose={handleCloseDescriptionModal}>
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">
              Descripción del Evento
            </h2>
          </div>
          <div className="flex-1 p-5 overflow-y-auto">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {selectedDescription || 'No hay descripción disponible.'}
              </p>
            </div>
          </div>
          <div className="p-5 border-t border-gray-200">
            <button
              onClick={handleCloseDescriptionModal}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        </RenderModal>
      )}

      {showImageModal && (
        <RenderModal onClose={() => setShowImageModal(false)}>
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">
              Imagen del Evento
            </h2>
          </div>
          <div className="p-5">
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Imagen ampliada"
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
            <button
              onClick={() => setShowImageModal(false)}
              className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        </RenderModal>
      )}
    </div>
  );
};

export default UserReservationsPage;
