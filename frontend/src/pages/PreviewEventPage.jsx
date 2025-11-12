import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import Swal from 'sweetalert2';
import { useSelector } from 'react-redux';
import defaultBanner from '../assets/ucvfondo.jpg';
import { CameraIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import getMediaUrl from '../utils/media';

const PreviewEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { role } = useSelector(state => state.auth);

  useEffect(() => {
    axiosInstance
      .get(`/events/${id}`)
      .then(resp => {
        setEvent(resp.data);
        console.log('trayendo evento', resp.data);
        setLoading(false);
        // si no es owner y tampoco admin/coordinator redirigir al home
        const isOwner = resp.data?.isOwner;
        if (
          !isOwner &&
          role !== 'admin' &&
          role !== 'coordinator' &&
          role !== 'coord'
        ) {
          navigate('/');
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        // si falla la petición (p. ej. no autorizado o recurso no encontrado), redirigir al home
        navigate('/');
      });
  }, [id]);

  const handleUploadBanner = async () => {
    // Si el usuario ya tiene un banner personalizado, ofrecer opción para quitar
    if (event.bannerPath) {
      const result = await Swal.fire({
        title: 'Banner',
        text: '¿Deseas subir uno nuevo o eliminar el banner actual?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Subir nuevo',
        denyButtonText: 'Quitar banner',
      });

      if (result.isDenied) {
        // quitar banner
        try {
          await axiosInstance.delete(`/events/${event.id}/banner`);
          Swal.fire(
            'Eliminado',
            'Banner restaurado al predeterminado.',
            'success'
          );
          // refrescar evento
          const resp = await axiosInstance.get(`/events/${event.id}`);
          setEvent(resp.data);
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'No se pudo eliminar el banner.', 'error');
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
        // refrescar el evento para obtener un payload consistente (incluye isOwner)
        const refreshed = await axiosInstance.get(`/events/${event.id}`);
        Swal.close();
        Swal.fire('¡Listo!', 'Banner subido correctamente.', 'success');
        setEvent(refreshed.data);
      } catch (err) {
        Swal.close();
        console.error(err);
        Swal.fire('Error', 'No se pudo subir el banner.', 'error');
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
        denyButtonText: 'Quitar imagen',
      });

      if (result.isDenied) {
        try {
          await axiosInstance.delete(`/events/${event.id}/image`);
          Swal.fire('Eliminado', 'Imagen del evento eliminada.', 'success');
          const resp = await axiosInstance.get(`/events/${event.id}`);
          setEvent(resp.data);
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'No se pudo eliminar la imagen.', 'error');
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
        // refrescar el evento para obtener isOwner y paths normalizados
        const refreshed = await axiosInstance.get(`/events/${event.id}`);
        Swal.close();
        Swal.fire('¡Listo!', 'Imagen subida correctamente.', 'success');
        setEvent(refreshed.data);
      } catch (err) {
        Swal.close();
        console.error(err);
        Swal.fire('Error', 'No se pudo subir la imagen.', 'error');
      }
    };
    input.click();
  };

  const handleChangeDescription = async () => {
    const { value: description } = await Swal.fire({
      title: 'Editar descripción',
      input: 'textarea',
      inputLabel: 'Descripción del evento',
      inputValue: event?.description || '',
      showCancelButton: true,
      inputValidator: value => {
        if (!value) {
          return 'La descripción no puede estar vacía';
        }
      },
    });

    if (description !== undefined) {
      try {
        // Guardar el isOwner actual antes de hacer la actualización
        const currentIsOwner = event.isOwner;

        const resp = await axiosInstance.put(`/events/${event.id}`, {
          description,
        });

        Swal.fire('Guardado', 'Descripción actualizada.', 'success');

        // Mantener el valor de isOwner al actualizar el estado
        setEvent({
          ...resp.data,
          isOwner: currentIsOwner,
        });
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'No se pudo actualizar la descripción.', 'error');
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
          title={event.name}
          backgroundImage={
            event.bannerPath ? getMediaUrl(event.bannerPath) : defaultBanner
          }
        />
        {event.isOwner && (
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
                event.imagePath
                  ? getMediaUrl(event.imagePath)
                  : 'https://via.placeholder.com/600x400'
              }
              alt={event.name}
              className="w-full h-full object-cover"
            />
            {event.isOwner && (
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
            <h2 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6">
              {event.name}
            </h2>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
              <p className="text-gray-700 whitespace-pre-line">
                {event.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6">
              <div className="space-y-3 lg:space-y-4">
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Espacio:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {event.room?.name || 'No asignado'}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Capacidad:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {event.capacity} personas
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Costo:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {event.cost}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Contacto:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {event.contact}
                  </p>
                </div>
              </div>
              <div className="space-y-3 lg:space-y-4">
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Estado:
                  </strong>
                  <span
                    className={`ml-2 px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${
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
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Inicio del Evento:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {new Date(event.eventFrom).toLocaleString()}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Fin del Evento:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {new Date(event.eventTo).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {event.isOwner && (
              <div className="flex justify-start">
                <button
                  onClick={handleChangeDescription}
                  className="bg-blue-600 text-white hover:bg-blue-500 px-4 py-3 rounded-lg shadow transition-all duration-200 flex items-center space-x-2 border border-gray-200 w-full sm:w-auto justify-center"
                >
                  <span>Editar Descripción</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PreviewEventPage;
