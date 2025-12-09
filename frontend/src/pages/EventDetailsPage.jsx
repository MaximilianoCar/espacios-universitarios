import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useSelector } from 'react-redux';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import Swal from 'sweetalert2';
import defaultBanner from '../assets/ucvfondo.jpg';
import { CameraIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { FaArrowLeft } from 'react-icons/fa';
import getMediaUrl from '../utils/media';

const formatDateForInput = dateString => {
  if (!dateString) return '';

  const date = new Date(dateString);

  // Ajustar por la zona horaria local
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() - timezoneOffset);

  return adjustedDate.toISOString().slice(0, 16);
};

const EventDetailsPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCoordinatorPermission, setHasCoordinatorPermission] =
    useState(false);

  // obtener el rol del usuario desde Redux
  const { role, user } = useSelector(state => state.auth);

  // calcular si el usuario es el dueño del evento
  const isOwner = user && event && user.id === event.userId;

  // verificar permisos de coordinador
  const canEdit =
    isOwner ||
    role === 'admin' ||
    (role === 'coordinator' && hasCoordinatorPermission);

  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await axiosInstance.get(`/events/${id}`);
        setEvent(response.data);

        // si el usuario es coordinador verificar permisos sobre la sala
        if (role === 'coordinator' && user) {
          try {
            const permissionResponse = await axiosInstance.get(
              `/rooms/${response.data.roomId}/check-permission`
            );
            setHasCoordinatorPermission(permissionResponse.data.hasPermission);
            console.log(hasCoordinatorPermission);
          } catch (error) {
            console.error('Error checking coordinator permission:', error);
            setHasCoordinatorPermission(false);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching event:', error);
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, role, user]);

  const handleDeleteEvent = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer. El evento será eliminado permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando evento...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        axiosInstance
          .delete(`/events/${event.id}`)
          .then(() => {
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El evento ha sido eliminado exitosamente.',
              icon: 'success',
              confirmButtonColor: '#3085d6',
            }).then(() => {
              navigate('/events');
            });
          })
          .catch(error => {
            console.error('Error deleting event:', error);
            Swal.fire({
              title: 'Error',
              text: 'Error al eliminar el evento. Por favor, intente nuevamente.',
              icon: 'error',
              confirmButtonColor: '#d33',
            });
          });
      }
    });
  };

  const handleUploadBanner = async () => {
    // Si el usuario ya tiene un banner personalizado, ofrecer opción para quitar
    if (event.bannerPath) {
      const result = await Swal.fire({
        title: 'Banner',
        text: '¿Deseas subir uno nuevo o eliminar el banner actual?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Subir nuevo',
        confirmButtonColor: '#3085d6',
        denyButtonText: 'Quitar banner',
        denyButtonColor: '#3085d6',
        cancelButtonText: 'Cancelar',
        cancelButtonColor: '#d33',
        icon: 'question',
      });

      if (result.isDenied) {
        // quitar banner
        try {
          await axiosInstance.delete(`/events/${event.id}/banner`);
          Swal.fire({
            title: 'Eliminado',
            text: 'Banner restaurado al predeterminado.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
          });
          // refrescar evento
          const resp = await axiosInstance.get(`/events/${event.id}`);
          setEvent(resp.data);
        } catch (err) {
          console.error(err);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar el banner.',
            icon: 'error',
            confirmButtonColor: '#d33',
          });
        }
        return;
      }

      if (!result.isConfirmed) return; // cancel
    }

    // Subir nuevo banner
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;

      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'Error',
          text: 'La imagen no puede ser mayor a 5MB.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
        return;
      }

      const formData = new FormData();
      formData.append('banner', file);

      Swal.fire({
        title: 'Subiendo banner...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        await axiosInstance.post(
          `/events/${event.id}/upload-banner`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        // refrescar el evento
        const refreshed = await axiosInstance.get(`/events/${event.id}`);
        Swal.close();
        Swal.fire({
          title: '¡Listo!',
          text: 'Banner subido correctamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
        });
        setEvent(refreshed.data);
      } catch (err) {
        Swal.close();
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo subir el banner.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      }
    };
    input.click();
  };

  const handleUploadImage = async () => {
    // Si ya existe una imagen, ofrecer opción para reemplazar o quitar
    if (event.imagePath) {
      const result = await Swal.fire({
        title: 'Imagen del evento',
        text: '¿Deseas subir una nueva imagen o quitar la actual?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Subir nueva',
        confirmButtonColor: '#3085d6',
        denyButtonText: 'Quitar imagen',
        denyButtonColor: '#3085d6',
        cancelButtonText: 'Cancelar',
        cancelButtonColor: '#d33',
        icon: 'question',
      });

      if (result.isDenied) {
        try {
          await axiosInstance.delete(`/events/${event.id}/image`);
          Swal.fire({
            title: 'Eliminado',
            text: 'Imagen del evento eliminada.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
          });
          const resp = await axiosInstance.get(`/events/${event.id}`);
          setEvent(resp.data);
        } catch (err) {
          console.error(err);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar la imagen.',
            icon: 'error',
            confirmButtonColor: '#d33',
          });
        }
        return;
      }

      if (!result.isConfirmed) return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;

      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'Error',
          text: 'La imagen no puede ser mayor a 5MB.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      Swal.fire({
        title: 'Subiendo imagen...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        await axiosInstance.post(`/events/${event.id}/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        // refrescar el evento
        const refreshed = await axiosInstance.get(`/events/${event.id}`);
        Swal.close();
        Swal.fire({
          title: '¡Listo!',
          text: 'Imagen subida correctamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
        });
        setEvent(refreshed.data);
      } catch (err) {
        Swal.close();
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo subir la imagen.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      }
    };
    input.click();
  };

  const handleUpdateEvent = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Actualizar Evento',
      html: `
        <div class="text-left space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Evento</label>
            <input 
              id="swal-name" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value="${event.name || ''}"
              placeholder="Nombre del evento"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea 
              id="swal-description" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Descripción del evento"
              rows="4"
            >${event.description || ''}</textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
            <input 
              id="swal-capacity" 
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value="${event.capacity || ''}"
              placeholder="Capacidad"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Costo</label>
            <input 
              id="swal-cost" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value="${event.cost || ''}"
              placeholder="Costo"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
            <input 
              id="swal-contact" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value="${event.contact || ''}"
              placeholder="Información de contacto"
            >
          </div>
          
          <!-- Fechas del Evento -->
          <div class="border-t pt-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">Fechas del Evento</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Inicio del Evento</label>
                <input 
                  id="swal-eventFrom" 
                  type="datetime-local"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value="${formatDateForInput(event.eventFrom)}"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fin del Evento</label>
                <input 
                  id="swal-eventTo" 
                  type="datetime-local"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value="${formatDateForInput(event.eventTo)}"
                >
              </div>
            </div>
          </div>
          
          <!-- Fechas de Reserva -->
          <div class="border-t pt-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">Fechas de Reserva</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Inicio de Reserva</label>
                <input 
                  id="swal-reservationFrom" 
                  type="datetime-local"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value="${formatDateForInput(event.reservationFrom)}"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fin de Reserva</label>
                <input 
                  id="swal-reservationTo" 
                  type="datetime-local"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value="${formatDateForInput(event.reservationTo)}"
                >
              </div>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      confirmButtonColor: '#3085d6',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#d33',
      width: '800px',
      focusConfirm: false,
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        const description = document.getElementById('swal-description').value;
        const capacity = document.getElementById('swal-capacity').value;
        const cost = document.getElementById('swal-cost').value;
        const contact = document.getElementById('swal-contact').value;
        const eventFrom = document.getElementById('swal-eventFrom').value;
        const eventTo = document.getElementById('swal-eventTo').value;
        const reservationFrom = document.getElementById(
          'swal-reservationFrom'
        ).value;
        const reservationTo =
          document.getElementById('swal-reservationTo').value;

        // Validaciones básicas de campos requeridos
        if (!name || !description || !capacity || !cost || !contact) {
          Swal.showValidationMessage(
            'Todos los campos básicos son obligatorios'
          );
          return false;
        }

        if (description.length > 2000) {
          Swal.showValidationMessage(
            'La descripción no puede exceder los 2000 caracteres'
          );
          return false;
        }

        // Validaciones de fechas
        const now = new Date();
        const eventFromDate = new Date(eventFrom);
        const eventToDate = new Date(eventTo);
        const reservationFromDate = new Date(reservationFrom);
        const reservationToDate = new Date(reservationTo);

        const errors = [];

        // Validaciones eventFrom
        if (!eventFrom) {
          errors.push('La fecha y hora de inicio del evento son requeridas.');
        }

        // Validaciones eventTo
        if (!eventTo) {
          errors.push('La fecha y hora de fin del evento son requeridas.');
        } else if (eventToDate <= eventFromDate) {
          errors.push(
            'La fecha de fin del evento debe ser posterior al inicio.'
          );
        }

        // Validaciones reservationFrom
        if (!reservationFrom) {
          errors.push('La fecha de inicio de reserva es requerida.');
        } else if (reservationFromDate > eventFromDate) {
          errors.push('La reserva no puede iniciar después del evento.');
        }

        // Validaciones reservationTo
        if (!reservationTo) {
          errors.push('La fecha de fin de reserva es requerida.');
        } else if (reservationToDate < eventToDate) {
          errors.push('La reserva no puede finalizar antes del evento.');
        }

        if (errors.length > 0) {
          Swal.showValidationMessage(errors.join('<br>'));
          return false;
        }

        return {
          name,
          description,
          capacity: parseInt(capacity),
          cost,
          contact,
          eventFrom,
          eventTo,
          reservationFrom,
          reservationTo,
        };
      },
    });

    if (formValues) {
      Swal.fire({
        title: 'Actualizando evento...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const resp = await axiosInstance.put(`/events/${event.id}`, formValues);

        Swal.fire({
          title: '¡Actualizado!',
          text: 'El evento ha sido actualizado exitosamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
        });
        setEvent(resp.data);
      } catch (error) {
        console.error('Error updating event:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al actualizar el evento. Por favor, intente nuevamente.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
        <Header />
        <div className="container mx-auto my-8">
          <p>Cargando evento...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div>
        <Header />
        <div className="container mx-auto my-8">
          <p>Evento no encontrado.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_auto_1fr_auto]">
      <Header />

      {/* HeroSection con botón flotante para subir banner */}
      <div className="relative">
        <HeroSection
          title={event?.name || ''}
          backgroundImage={
            event?.bannerPath ? getMediaUrl(event.bannerPath) : defaultBanner
          }
        />
        {canEdit && (
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4">
            <button
              onClick={handleUploadBanner}
              className="bg-white/90 hover:bg-white text-gray-800 px-2 py-2 sm:px-4 sm:py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-1 sm:space-x-2 backdrop-blur-sm border border-gray-200 text-xs sm:text-sm"
            >
              <CameraIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <span>Cambiar Banner</span>
            </button>
          </div>
        )}
      </div>

      <div className="container mx-auto my-8 px-4">
        {/* Sección de Detalles del Evento */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          {/* Contenedor de la Imagen del Evento */}
          <div className="w-full lg:w-1/2 h-64 lg:h-96 overflow-hidden rounded-lg shadow-md relative">
            <img
              src={
                event?.imagePath
                  ? getMediaUrl(event.imagePath)
                  : 'https://via.placeholder.com/600x400'
              }
              alt={event?.name || 'Evento'}
              className="w-full h-full object-cover"
            />
            {canEdit && (
              <div className="absolute top-2 right-2">
                <button
                  onClick={handleUploadImage}
                  className="bg-white/90 hover:bg-white text-gray-800 px-2 py-1 rounded-lg shadow transition-all duration-200 flex items-center space-x-1 border border-gray-200 text-xs"
                >
                  <PencilSquareIcon className="h-4 w-4 text-blue-500" />
                  <span className="hidden sm:inline">Cambiar imagen</span>
                </button>
              </div>
            )}
          </div>

          {/* Detalles del Evento */}
          <div className="w-full lg:w-1/2">
            <div className="flex items-center mb-6 flex-wrap">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-800 hover:text-gray-600 transition-colors mr-4"
                title="Volver al inicio"
              >
                <FaArrowLeft size={24} />
              </button>
              <h2 className="text-2xl lg:text-3xl font-bold">
                {event?.name || 'Evento'}
              </h2>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
              <p className="text-gray-700 whitespace-pre-line break-words">
                {event?.description || 'Sin descripción'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6">
              <div className="space-y-3 lg:space-y-4">
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Espacio:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {event?.room?.name || 'No asignado'}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Capacidad:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {event?.capacity} personas
                  </p>
                </div>

                {/* Mostrar costo solo si el usuario puede editar */}
                {canEdit && (
                  <div>
                    <strong className="text-gray-700 text-sm lg:text-base">
                      Costo:
                    </strong>
                    <p className="text-gray-600 text-sm lg:text-base">
                      {event?.cost}
                    </p>
                  </div>
                )}

                {/* Mostrar contacto solo si el usuario puede editar */}
                {canEdit && (
                  <div>
                    <strong className="text-gray-700 text-sm lg:text-base">
                      Contacto:
                    </strong>
                    <p className="text-gray-600 text-sm lg:text-base">
                      {event?.contact}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3 lg:space-y-4">
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Estado:
                  </strong>
                  <span
                    className={`ml-2 px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${
                      event?.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : event?.status === 'denied'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {event?.status === 'approved'
                      ? 'Aprobado'
                      : event?.status === 'denied'
                      ? 'Rechazado'
                      : 'Pendiente'}
                  </span>
                </div>
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Inicio del Evento:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {event?.eventFrom
                      ? new Date(event.eventFrom).toLocaleString()
                      : 'No definido'}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Fin del Evento:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {event?.eventTo
                      ? new Date(event.eventTo).toLocaleString()
                      : 'No definido'}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Período de Reserva:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {event?.reservationFrom
                      ? new Date(event.reservationFrom).toLocaleString()
                      : 'No definido'}{' '}
                    -{' '}
                    {event?.reservationTo
                      ? new Date(event.reservationTo).toLocaleString()
                      : 'No definido'}
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            {canEdit && (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleUpdateEvent}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg shadow transition-all duration-200 flex items-center space-x-2 border border-blue-700 w-full sm:w-auto justify-center"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                  <span>Actualizar Evento</span>
                </button>

                {role === 'admin' && (
                  <button
                    onClick={handleDeleteEvent}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg shadow transition-all duration-200 flex items-center space-x-2 border border-red-700 w-full sm:w-auto justify-center"
                  >
                    <span>Eliminar Evento</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventDetailsPage;
