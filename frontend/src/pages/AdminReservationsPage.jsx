import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar2';
import CreateReservationModal from '../components/CreateReservationModal';
import UpdateEventModal from '../components/UpdateEventModal';
import {
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaUpload,
  FaRegEnvelope,
  FaRegCalendarAlt,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaEllipsisV,
  FaEdit,
  FaFileContract,
  FaFilePdf,
  FaArrowLeft,
  FaCalendarAlt,
  FaMapPin,
  FaUsers,
  FaDollarSign,
  FaPlus,
  FaTrash,
  FaBuilding,
  FaIdCard,
  FaUniversity,
  FaUserTie,
} from 'react-icons/fa';
import { IoInformationCircleOutline } from 'react-icons/io5';
import Modal from '../components/Modal';
import ModalMobile from '../components/ModalMobile';
import Swal from '../utils/swal';
import { Link } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import getMediaUrl from '../utils/media';

const PAGE_SIZE = 25; // Mismo que el backend

const AdminReservationsPage = () => {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingAgreementId, setUploadingAgreementId] = useState(null);
  const [agreementFile, setAgreementFile] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  const [selectedEventUser, setSelectedEventUser] = useState({
    name: '',
    email: '',
    companyName: null,
    companyRif: null,
  });

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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
  const [selectedSpecialRequirements, setSelectedSpecialRequirements] =
    useState('');
  const [selectedCapacity, setSelectedCapacity] = useState(null);
  // para el modal de imagen
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Estado para detectar si es móvil
  const [isMobile, setIsMobile] = useState(false);

  // Función para renderizar el modal correcto
  const RenderModal = ({ children, onClose }) => {
    if (isMobile) {
      return <ModalMobile onClose={onClose}>{children}</ModalMobile>;
    }
    return <Modal onClose={onClose}>{children}</Modal>;
  };

  // Función para recargar eventos manteniendo la paginación actual
  const refreshEvents = async () => {
    try {
      const response = await axiosInstance.get('/admin/events', {
        params: {
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: searchTerm,
        },
      });
      //console.log('Refreshed events:', response.data);
      setEvents(response.data.events || []);
      setTotalEvents(response.data.totalEvents || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error refreshing events:', error);
      setError('Error al obtener los eventos.');
    }
  };

  //manejar volver atras
  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
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
      const response = await axiosInstance.get('/admin/events', {
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

  // obtener los eventos con paginación del BACKEND
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/admin/events', {
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
        console.error('Error fetching events:', error);
        setError('Error al obtener los eventos.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentPage]); // Solo dependencia de currentPage

  // manejar la subida del archivo de contrato
  const handleUploadAgreement = async eventId => {
    if (!agreementFile) return;

    const formData = new FormData();
    formData.append('agreementPath', agreementFile);

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

    try {
      await axiosInstance.post(`/events/${eventId}/upload-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Swal.close();
      Swal.fire(
        'Contrato subido',
        'El contrato se subió exitosamente.',
        'success'
      );

      setUploadingAgreementId(null);
      setAgreementFile(null);

      // Recargar los datos manteniendo la paginación actual
      await refreshEvents();
    } catch (error) {
      Swal.close();
      console.error('Error al subir el contrato:', error);
      Swal.fire(
        'Error',
        'Error al subir el contrato. Intente nuevamente.',
        'error'
      );
      setUploadingAgreementId(null);
      setAgreementFile(null);
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

          // Recargar desde el backend manteniendo la paginación
          await refreshEvents();

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

          await refreshEvents();

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

  // Función para manejar la edición de un evento
  const handleEditEvent = event => {
    setOpenMenuId(null);
    setEventToEdit(event);
    setShowUpdateModal(true);
  };

  // Función para manejar la eliminación de un evento
  const handleDeleteEvent = async (eventId, eventName) => {
    setOpenMenuId(null);

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará permanentemente el evento "${eventName}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Eliminando evento...',
        text: 'Por favor espere mientras se elimina el evento',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        await axiosInstance.delete(`/events/${eventId}`);

        // Recargar los eventos
        await refreshEvents();

        Swal.fire(
          '¡Eliminado!',
          `El evento "${eventName}" ha sido eliminado exitosamente.`,
          'success'
        );
      } catch (error) {
        console.error('Error al eliminar el evento:', error);
        Swal.fire(
          'Error',
          'Error al eliminar el evento. Por favor, intente nuevamente.',
          'error'
        );
      }
    }
  };

  // Funciones para manejar los modales
  const handleShowContact = (contactInfo, user) => {
    setSelectedEventContact(contactInfo);
    setSelectedEventUser({
      name: user?.name || '',
      email: user?.email || '',
      companyName: user?.companyName || null,
      companyRif: user?.companyRif || null,
    });
    setShowContactModal(true);
  };

  const handleCloseContactModal = () => {
    setShowContactModal(false);
    setSelectedEventContact('');
    setSelectedEventUser({
      name: '',
      email: '',
      companyName: null,
      companyRif: null,
    });
  };

  const handleShowDescription = (
    description,
    specialRequirements,
    capacity
  ) => {
    setSelectedDescription(description);
    setSelectedSpecialRequirements(specialRequirements);
    setSelectedCapacity(capacity);
    setShowDescriptionModal(true);
  };

  const handleCloseDescriptionModal = () => {
    setShowDescriptionModal(false);
    setSelectedDescription('');
    setSelectedSpecialRequirements('');
    setSelectedCapacity(null);
  };

  // Manejador de clic en la imagen para mostrar el modal
  const handleImageClick = imagePath => {
    setSelectedImage(getMediaUrl(imagePath));
    setShowImageModal(true);
  };

  // Manejar cambio de página
  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Función para determinar si un usuario es externo
  const isExternalUser = user => {
    return user?.companyName !== null && user?.companyName !== undefined;
  };

  const ActionMenu = ({ event, index }) => {
    const isMenuOpen = openMenuId === event.id;
    const menuRef = useRef(null);
    const isUploading = uploadingAgreementId === event.id;
    const fileInputRef = useRef(null);

    const shouldOpenUpward = index > 2;

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

    const handleAgreementOptions = () => {
      setOpenMenuId(null);
      Swal.fire({
        title: '',
        html: `
				<div class="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden text-left">
				  <div class="flex items-center justify-between px-4 py-3 border-b">
					<div>
					  <h3 class="text-lg font-semibold text-gray-800">Contrato</h3>
					  <p class="text-sm text-gray-600 mt-1">Ver, actualizar o eliminar el contrato asociado a este evento.</p>
					</div>
					<!-- El botón de cerrar lo añade SweetAlert con showCloseButton -->
				  </div>

				  <div class="px-4 py-4 space-y-3">
					<div class="text-sm text-gray-700">Acciones disponibles:</div>
					<div class="flex gap-2">
					  <button id="swal-view" class="w-1/3 px-3 py-2 bg-blue-600 text-white rounded-md text-sm">Ver</button>
					  <button id="swal-update" class="w-1/3 px-3 py-2 bg-yellow-500 text-white rounded-md text-sm">Actualizar</button>
					  <button id="swal-delete" class="w-1/3 px-3 py-2 bg-red-600 text-white rounded-md text-sm">Eliminar</button>
					</div>
				  </div>

				  <div class="px-4 py-3 border-t text-right">
					<button id="swal-cancel" class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">Cerrar</button>
				  </div>
				</div>
			`,
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
          const viewBtn = document.getElementById('swal-view');
          const updateBtn = document.getElementById('swal-update');
          const deleteBtn = document.getElementById('swal-delete');
          const cancelBtn = document.getElementById('swal-cancel');

          cancelBtn && cancelBtn.addEventListener('click', () => Swal.close());

          viewBtn &&
            viewBtn.addEventListener('click', () => {
              if (event.agreementPath)
                window.open(getMediaUrl(event.agreementPath), '_blank');
              Swal.close();
            });

          updateBtn &&
            updateBtn.addEventListener('click', () => {
              Swal.close();
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
              input.onchange = async e => {
                const file = e.target.files[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('agreementPath', file);

                Swal.fire({
                  title: 'Subiendo contrato...',
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
                    'Contrato actualizado correctamente.',
                    'success'
                  );
                  await refreshEvents();
                } catch (err) {
                  Swal.close();
                  console.error(err);
                  Swal.fire(
                    'Error',
                    'No se pudo actualizar el contrato.',
                    'error'
                  );
                }
              };
              input.click();
            });

          deleteBtn &&
            deleteBtn.addEventListener('click', async () => {
              Swal.close();
              const r = await Swal.fire({
                title: '¿Eliminar contrato?',
                text: 'Esta acción eliminará el contrato permanentemente.',
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
                  await axiosInstance.delete(`/events/${event.id}/agreement`);
                  Swal.close();
                  await Swal.fire(
                    'Eliminado',
                    'Contrato eliminado correctamente.',
                    'success'
                  );
                  await refreshEvents();
                } catch (err) {
                  Swal.close();
                  console.error(err);
                  Swal.fire(
                    'Error',
                    'No se pudo eliminar el contrato.',
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

                {/* Opciones de Editar y Eliminar */}
                <button
                  onClick={() => handleEditEvent(event)}
                  className="flex items-center w-full px-3 py-2 text-xs text-yellow-600 hover:bg-gray-100 font-semibold"
                >
                  <FaEdit className="mr-2" size={14} /> Editar
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id, event.name)}
                  className="flex items-center w-full px-3 py-2 text-xs text-red-600 hover:bg-gray-100 font-semibold"
                >
                  <FaTrash className="mr-2" size={14} /> Eliminar
                </button>

                {/* SEPARADOR */}
                <div className="border-t border-gray-100 w-full"></div>

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
                  <button
                    onClick={() => handleAgreementOptions()}
                    className="flex items-center w-full px-3 py-2 text-xs text-blue-600 hover:bg-gray-100"
                  >
                    <FaFileContract className="mr-2" size={14} /> Contrato
                  </button>
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
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      <Header />
      <div className="container mx-auto my-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-800 hover:text-gray-600 transition-colors mr-4"
              title="Volver al inicio"
            >
              <FaArrowLeft size={24} />
            </button>
            <h2 className="text-3xl font-bold text-gray-800">Reservas</h2>
          </div>

          {/* Botón para crear nueva reserva */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
          >
            <FaPlus className="mr-2" />
            Crear Reserva
          </button>
        </div>

        {showCreateModal && (
          <CreateReservationModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onReservationCreated={refreshEvents}
          />
        )}

        {showUpdateModal && eventToEdit && (
          <UpdateEventModal
            isOpen={showUpdateModal}
            onClose={() => {
              setShowUpdateModal(false);
              setEventToEdit(null);
            }}
            event={eventToEdit}
            onEventUpdated={() => {
              setShowUpdateModal(false);
              setEventToEdit(null);
              refreshEvents();
            }}
          />
        )}

        {/* SearchBar */}
        <div className="mb-6">
          <SearchBar
            placeholder="Buscar por nombre..."
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
              Ver todos los eventos
            </button>
          </div>
        )}

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {/* Vista Desktop - Tabla */}
        <div className="hidden lg:block overflow-x-auto shadow-xl rounded-lg">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-blue-100">
                <th className="py-2 px-4 border-b text-left">Nombre</th>
                <th className="py-2 px-4 border-b text-left">Espacio</th>
                <th className="py-2 px-4 border-b text-center">Imagen</th>
                <th className="py-2 px-4 border-b text-center">Tipo Usuario</th>
                <th className="py-2 px-4 border-b text-center">Descripción</th>
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
                events.map((event, index) => {
                  const externalUser = isExternalUser(event.user);
                  return (
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

                      {/* Tipo de Usuario */}
                      <td className="py-2 px-4 border-b text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs text-center font-semibold flex items-center justify-center ${
                            externalUser ? 'text-purple-800' : 'text-blue-800'
                          }`}
                        >
                          {externalUser ? (
                            <span className="flex items-center">
                              <FaBuilding className="mr-1" size={10} />
                              Externo
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <FaUniversity className="mr-1" size={10} />
                              Interno
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Descripción */}
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          onClick={() =>
                            handleShowDescription(
                              event.description,
                              event.specialRequirements,
                              event.capacity
                            )
                          }
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Ver descripción y capacidad"
                        >
                          <IoInformationCircleOutline size={22} />
                        </button>
                      </td>

                      <td className="py-2 px-4 border-b text-center">
                        {event.cost}
                      </td>

                      {/* Contacto */}
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          onClick={() =>
                            handleShowContact(event.contact, event.user)
                          }
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-gray-500">
                    {currentSearch
                      ? 'No se encontraron eventos que coincidan con tu búsqueda.'
                      : 'No hay eventos disponibles.'}
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

          {/* PAGINACIÓN */}
          <div className="flex justify-between items-center p-6 bg-gray-50 border-t">
            <p className="text-sm text-gray-600">
              Mostrando {events.length} de {totalEvents} eventos (Pág.{' '}
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

        {/* Vista Mobile - Cards */}
        <div className="lg:hidden space-y-4">
          {events.length > 0 ? (
            events.map((event, index) => {
              const externalUser = isExternalUser(event.user);
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-4 relative"
                >
                  {/* Header mejorado */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">
                        {event.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <FaMapPin className="mr-2 text-blue-500" size={14} />
                        <span>{event.room?.name || 'N/A'}</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          externalUser ? 'ext-purple-800' : 'text-blue-800'
                        }`}
                      >
                        {externalUser ? (
                          <span className="flex items-center">
                            <FaBuilding className="mr-1" size={10} />
                            Externo
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <FaUniversity className="mr-1" size={10} />
                            Interno
                          </span>
                        )}
                      </span>
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
                      <FaDollarSign
                        className="mr-2 text-yellow-500"
                        size={14}
                      />
                      <span>Costo: {event.cost}</span>
                    </div>
                  </div>

                  {/* Botones de acción principales */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button
                      onClick={() =>
                        handleShowDescription(
                          event.description,
                          event.specialRequirements,
                          event.capacity
                        )
                      }
                      className="flex flex-col items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-1 rounded text-xs transition-colors"
                    >
                      <FaInfoCircle className="mb-1" size={14} />
                      <span>Descripción</span>
                    </button>
                    <button
                      onClick={() =>
                        handleShowContact(event.contact, event.user)
                      }
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
                  <Link
                    to={`/events/${event.id}`}
                    className="w-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm transition-colors mb-2"
                  >
                    <FaEye className="mr-2" size={14} />
                    Ver Evento
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              {currentSearch
                ? 'No se encontraron eventos que coincidan con tu búsqueda.'
                : 'No hay eventos disponibles.'}
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
            <div className="bg-blue-50 rounded-lg p-4 mb-4 space-y-3">
              {/* Tipo de Usuario */}
              <div className="mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedEventUser.companyName
                      ? 'text-purple-800'
                      : 'text-blue-800'
                  }`}
                >
                  {selectedEventUser.companyName ? (
                    <span className="flex items-center">
                      <FaBuilding className="mr-2" size={12} />
                      Usuario Externo - Empresa
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FaUniversity className="mr-2" size={12} />
                      Usuario Interno - Comunidad Universitaria
                    </span>
                  )}
                </span>
              </div>

              {/* Información del Solicitante */}
              <div className="border-b border-blue-200 pb-3">
                <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                  <FaUserTie className="mr-2" size={14} />
                  Información del Solicitante
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-blue-600">
                      Nombre:
                    </span>
                    <p className="text-sm text-gray-700">
                      {selectedEventUser?.name || 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-blue-600">
                      Correo:
                    </span>
                    <p className="text-sm text-gray-700 break-all">
                      {selectedEventUser?.email || 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de Empresa (solo para usuarios externos) */}
              {selectedEventUser.companyName && (
                <div className="border-b border-blue-200 pb-3">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                    <FaBuilding className="mr-2" size={14} />
                    Información de la Empresa
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-blue-600">
                        Nombre de la Empresa:
                      </span>
                      <p className="text-sm text-gray-700">
                        {selectedEventUser.companyName}
                      </p>
                    </div>
                    {selectedEventUser.companyRif && (
                      <div>
                        <span className="text-xs font-medium text-blue-600">
                          <FaIdCard className="inline mr-1" size={12} />
                          RIF de la Empresa:
                        </span>
                        <p className="text-sm text-gray-700">
                          {selectedEventUser.companyRif}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Información de Contacto Adicional */}
              <div>
                <h3 className="text-sm font-semibold text-blue-800 mb-2">
                  Información de Contacto Adicional
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedEventContact ||
                    'No hay información de contacto adicional.'}
                </p>
              </div>
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
              Información del Evento
            </h2>
          </div>
          <div className="flex-1 p-5 overflow-y-auto">
            <div className="bg-blue-50 rounded-lg p-4 mb-4 space-y-4">
              {/* Capacidad */}
              <div className="bg-white rounded-md p-3 border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                  <FaUsers className="mr-2 text-green-500" size={14} />
                  Capacidad del Evento
                </h3>
                <div className="text-center py-2">
                  <span className="text-2xl font-bold text-green-600">
                    {selectedCapacity || 'N/A'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">personas</p>
                </div>
              </div>

              {/* Sección de Descripción */}
              <div className="border-t border-blue-200 pt-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">
                  Descripción del Evento
                </h3>
                <div className="bg-white rounded-md p-3 border border-blue-100">
                  {selectedDescription ? (
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedDescription}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic text-center py-2">
                      No hay descripción disponible
                    </p>
                  )}
                </div>
              </div>

              {/* Sección de Requerimientos Especiales */}
              <div className="border-t border-blue-200 pt-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">
                  Requerimientos Especiales
                </h3>
                <div className="bg-white rounded-md p-3 border border-blue-100">
                  {selectedSpecialRequirements ? (
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <FaInfoCircle
                          className="text-green-500 mt-1 mr-2 flex-shrink-0"
                          size={14}
                        />
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {selectedSpecialRequirements}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic text-center py-2">
                      No hay requerimientos especiales
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Nota informativa */}
            <div className="text-xs text-gray-500 text-center mb-4">
              <p>Esta información fue proporcionada por el solicitante</p>
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

export default AdminReservationsPage;
