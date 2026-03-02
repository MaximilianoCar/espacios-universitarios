import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteRoom as deleteRoomThunk,
  updateRoom as updateRoomThunk,
} from '../features/rooms/roomsSlice';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import Swal from '../utils/swal';
import defaultBanner from '../assets/ucvfondo.jpg';
import { CameraIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import {
  FaArrowLeft,
  FaWheelchair,
  FaWifi,
  FaToilet,
  FaMicrophoneAlt,
  FaVideo,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaBox,
} from 'react-icons/fa';
import getMediaUrl from '../utils/media';

const RoomDetailsPage = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCoordinatorPermission, setHasCoordinatorPermission] =
    useState(false);

  const { role, user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Verificar permisos de coordinador
  const canEdit =
    role === 'admin' || (role === 'coordinator' && hasCoordinatorPermission);

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/rooms');
    }
  };

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axiosInstance.get(`/rooms/${id}`);
        setRoom(response.data);

        // Si el usuario es coordinador, verificar permisos sobre la sala
        if (role === 'coordinator' && user) {
          try {
            const permissionResponse = await axiosInstance.get(
              `/rooms/${id}/check-permission`
            );
            setHasCoordinatorPermission(permissionResponse.data.hasPermission);
          } catch (error) {
            console.error('Error checking coordinator permission:', error);
            setHasCoordinatorPermission(false);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching room:', error);
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [id, role, user]);

  const handleDeleteRoom = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará permanentemente la sala "${room.name}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async result => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando sala...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        try {
          await dispatch(deleteRoomThunk(room.id)).unwrap();
          Swal.fire({
            title: '¡Eliminada!',
            text: `La sala "${room.name}" ha sido eliminada exitosamente.`,
            icon: 'success',
            confirmButtonColor: '#3085d6',
          }).then(() => {
            navigate('/rooms');
          });
        } catch (error) {
          console.error('Error deleting room:', error);
          Swal.fire({
            title: 'Error',
            text:
              error.message ||
              'Error al eliminar la sala. Por favor, intente nuevamente.',
            icon: 'error',
            confirmButtonColor: '#d33',
          });
        }
      }
    });
  };

  const handleUploadImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;

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
      Object.keys(room).forEach(key => {
        if (
          key !== 'imagePath' &&
          room[key] !== null &&
          room[key] !== undefined
        ) {
          if (typeof room[key] === 'boolean') {
            formData.append(key, room[key].toString());
          } else if (typeof room[key] === 'object' && room[key] !== null) {
            // No adjuntar objetos complejos como dependencias, etc.
          } else {
            formData.append(key, room[key]);
          }
        }
      });

      Swal.fire({
        title: 'Subiendo imagen...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const response = await dispatch(
          updateRoomThunk({ id: room.id, data: formData })
        ).unwrap();

        Swal.close();
        Swal.fire({
          title: '¡Listo!',
          text: 'Imagen actualizada correctamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
        });
        setRoom(response);
      } catch (err) {
        Swal.close();
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: err.message || 'No se pudo actualizar la imagen.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      }
    };
    input.click();
  };

  // Función para renderizar las etiquetas de características sobre la imagen
  const renderFeatureTags = room => {
    const features = [];

    // Definir las características y sus iconos con texto corto
    const featureConfig = [
      {
        key: 'isAccessible',
        icon: <FaWheelchair />,
        text: 'Accesible',
        tooltip: 'Accesible para personas con discapacidad motriz',
      },
      {
        key: 'hasInternet',
        icon: <FaWifi />,
        text: 'Wi-Fi',
        tooltip: 'Disponibilidad deonectividad',
      },
      {
        key: 'hasBathrooms',
        icon: <FaToilet />,
        text: 'Baños',
        tooltip: 'Disponibilidad de sanitarios',
      },
      {
        key: 'hasAudioEquipment',
        icon: <FaMicrophoneAlt />,
        text: 'Audio',
        tooltip: 'Equipo de audio disponible',
      },
      {
        key: 'hasVideoEquipment',
        icon: <FaVideo />,
        text: 'Video',
        tooltip: 'Equipo de video disponible',
      },
      //{
      //  key: 'canExonerate',
      //  icon: <FaMoneyBillWave />,
      //  text: 'Exonerable',
      //  tooltip: 'Posibilidad de exoneración de pago',
      //},
      {
        key: 'acceptsTransfer',
        icon: <FaExchangeAlt />,
        text: 'Transferencia',
        tooltip: 'Acepta transferencia como método de pago',
      },
      {
        key: 'acceptsMaterials',
        icon: <FaBox />,
        text: 'Materiales',
        tooltip: 'Acepta materiales como método de pago',
      },
    ];

    // Solo agregar características que estén en true
    featureConfig.forEach(feature => {
      if (room[feature.key]) {
        features.push(
          <div
            key={feature.key}
            className="bg-blue-100 text-blue-800 px-1 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs flex items-center mr-1 mb-1 sm:mb-2 group relative"
            title={feature.tooltip}
          >
            <span className="text-sm sm:text-base mr-1 sm:mr-2">
              {feature.icon}
            </span>
            <span className="hidden sm:inline">{feature.text}</span>
            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block w-56 z-10">
              <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-normal text-left shadow-lg">
                {feature.tooltip}
                <div className="absolute top-full left-4 transform -mt-1">
                  <div className="border-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            </div>
          </div>
        );
      }
    });

    return features;
  };

  const handleUpdateRoom = async () => {
    try {
      // obtener dependencias disponibles
      const depsRes = await axiosInstance.get('/dependencies');
      const deps = depsRes.data || [];
      const currentDepId = room?.dependencies?.[0]?.id || '';

      const optionsHtml = deps
        .map(
          d =>
            `<option value="${d.id}" ${
              d.id === currentDepId ? 'selected' : ''
            }>${d.name}</option>`
        )
        .join('');

      const { value: formValues } = await Swal.fire({
        title: 'Actualizar Sala',
        html: `
          <div class="text-left space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Sala</label>
                <input id="swal-name" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${
                  room.name || ''
                }" placeholder="Nombre de la sala">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Costo ($)</label>
                <input id="swal-cost" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${
                  room.cost || '0'
                }" placeholder="Ej: 100.00">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                <input id="swal-capacity" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${
                  room.capacity || ''
                }" placeholder="Capacidad">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input id="swal-location" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${
                  room.location || ''
                }" placeholder="Ubicación">
              </div>
            </div>

            <!-- Dependencia -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dependencia</label>
              <div class="flex items-center space-x-2">
                <select id="swal-dependency" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">-- Selecciona una dependencia --</option>
                  ${optionsHtml}
                </select>
              </div>
            </div>

            <!-- Encargado y Descripción -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Encargado</label>
              <input id="swal-staffowner" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${
                room.staffowner || ''
              }" placeholder="Encargado">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea id="swal-description" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="4" placeholder="Descripción de la sala">${
                room.description || ''
              }</textarea>
            </div>

            <!-- Sección de características -->
            <div class="border-t pt-4">
              <h3 class="text-lg font-medium text-gray-700 mb-3">Características del Espacio</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex items-center">
                  <input id="swal-isAccessible" type="checkbox" class="h-4 w-4" ${
                    room.isAccessible ? 'checked' : ''
                  }>
                  <label for="swal-isAccessible" class="ml-2 block text-sm text-gray-700 flex items-center">
                    <span class="mr-1"></span> Accesibilidad motriz
                  </label>
                </div>
                <div class="flex items-center">
                  <input id="swal-hasBathrooms" type="checkbox" class="h-4 w-4" ${
                    room.hasBathrooms ? 'checked' : ''
                  }>
                  <label for="swal-hasBathrooms" class="ml-2 block text-sm text-gray-700 flex items-center">
                    <span class="mr-1"></span> Baños disponibles
                  </label>
                </div>
                <div class="flex items-center">
                  <input id="swal-hasInternet" type="checkbox" class="h-4 w-4" ${
                    room.hasInternet ? 'checked' : ''
                  }>
                  <label for="swal-hasInternet" class="ml-2 block text-sm text-gray-700 flex items-center">
                    <span class="mr-1"></span> Conexión a Internet
                  </label>
                </div>
                <div class="flex items-center">
                  <input id="swal-hasAudioEquipment" type="checkbox" class="h-4 w-4" ${
                    room.hasAudioEquipment ? 'checked' : ''
                  }>
                  <label for="swal-hasAudioEquipment" class="ml-2 block text-sm text-gray-700 flex items-center">
                    <span class="mr-1"></span> Equipo de audio
                  </label>
                </div>
                <div class="flex items-center">
                  <input id="swal-hasVideoEquipment" type="checkbox" class="h-4 w-4" ${
                    room.hasVideoEquipment ? 'checked' : ''
                  }>
                  <label for="swal-hasVideoEquipment" class="ml-2 block text-sm text-gray-700 flex items-center">
                    <span class="mr-1"></span> Equipo de video
                  </label>
                </div>
                <div class="flex items-center">
                  <input id="swal-canExonerate" type="checkbox" class="h-4 w-4" ${
                    room.canExonerate ? 'checked' : ''
                  }>
                  <label for="swal-canExonerate" class="ml-2 block text-sm text-gray-700 flex items-center">
                    <span class="mr-1"></span> Permite exoneración
                  </label>
                </div>
              </div>
            </div>

            <!-- Sección de métodos de pago -->
            <div class="border-t pt-4">
              <h3 class="text-lg font-medium text-gray-700 mb-3">Métodos de Pago Aceptados</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex items-center">
                  <input id="swal-acceptsTransfer" type="checkbox" class="h-4 w-4" ${
                    room.acceptsTransfer ? 'checked' : ''
                  }>
                  <label for="swal-acceptsTransfer" class="ml-2 block text-sm text-gray-700 flex items-center">
                    <span class="mr-1"></span> Transferencia
                  </label>
                </div>
                <div class="flex items-center">
                  <input id="swal-acceptsMaterials" type="checkbox" class="h-4 w-4" ${
                    room.acceptsMaterials ? 'checked' : ''
                  }>
                  <label for="swal-acceptsMaterials" class="ml-2 block text-sm text-gray-700 flex items-center">
                    <span class="mr-1"></span> Materiales
                  </label>
                </div>
              </div>
              <p id="payment-validation" class="text-red-500 text-xs mt-2 hidden">
                Debe seleccionar al menos un método de pago
              </p>
            </div>

            <!-- Checkbox de CUC -->
            <div class="flex items-center border-t pt-4">
              <input id="swal-isInCUC" type="checkbox" class="h-4 w-4" ${
                room.isInCUC ? 'checked' : ''
              }>
              <label for="swal-isInCUC" class="ml-2 block text-sm text-gray-700">
                ¿Está en la Ciudad Universitaria de Caracas?
              </label>
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
        didOpen: () => {},
        preConfirm: () => {
          const name = document.getElementById('swal-name').value;
          const description = document.getElementById('swal-description').value;
          const capacity = document.getElementById('swal-capacity').value;
          const location = document.getElementById('swal-location').value;
          const staffowner = document.getElementById('swal-staffowner').value;
          const isInCUC = document.getElementById('swal-isInCUC').checked;
          const dependencyId = document.getElementById('swal-dependency').value;
          const cost = document.getElementById('swal-cost').value;

          // Nuevos campos booleanos
          const isAccessible =
            document.getElementById('swal-isAccessible').checked;
          const hasBathrooms =
            document.getElementById('swal-hasBathrooms').checked;
          const hasInternet =
            document.getElementById('swal-hasInternet').checked;
          const hasAudioEquipment = document.getElementById(
            'swal-hasAudioEquipment'
          ).checked;
          const hasVideoEquipment = document.getElementById(
            'swal-hasVideoEquipment'
          ).checked;
          const canExonerate =
            document.getElementById('swal-canExonerate').checked;
          const acceptsTransfer = document.getElementById(
            'swal-acceptsTransfer'
          ).checked;
          const acceptsMaterials = document.getElementById(
            'swal-acceptsMaterials'
          ).checked;

          // Validaciones básicas
          if (!name || !description || !capacity || !location || !staffowner) {
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

          if (!dependencyId) {
            Swal.showValidationMessage('La dependencia es requerida');
            return false;
          }

          if (!acceptsTransfer && !acceptsMaterials) {
            Swal.showValidationMessage(
              'Debe seleccionar al menos un método de pago'
            );
            return false;
          }

          if (cost && isNaN(parseFloat(cost))) {
            Swal.showValidationMessage('El costo debe ser un número válido');
            return false;
          }

          return {
            name,
            description,
            capacity: parseInt(capacity),
            location,
            staffowner,
            isInCUC,
            dependencyId,
            cost: cost || '0',
            isAccessible,
            hasBathrooms,
            hasInternet,
            hasAudioEquipment,
            hasVideoEquipment,
            canExonerate,
            acceptsTransfer,
            acceptsMaterials,
          };
        },
      });

      if (formValues) {
        Swal.fire({
          title: 'Actualizando sala...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
        try {
          const resp = await dispatch(
            updateRoomThunk({ id: room.id, data: formValues })
          ).unwrap();
          Swal.fire({
            title: '¡Actualizada!',
            text: 'La sala ha sido actualizada exitosamente.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
          });
          setRoom(resp);
        } catch (error) {
          console.error('Error updating room:', error);
          const msg =
            error.message ||
            'Error al actualizar la sala. Por favor, intente nuevamente.';
          Swal.fire({
            title: 'Error',
            text: msg,
            icon: 'error',
            confirmButtonColor: '#d33',
          });
        }
      }
    } catch (err) {
      console.error('Error preparando actualización:', err);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo preparar la actualización.',
        icon: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
        <Header />
        <div className="container mx-auto my-8 flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Cargando detalles de la sala...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
        <Header />
        <div className="container mx-auto my-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Sala no encontrada
            </h2>
            <p className="text-gray-600 mb-6">
              La sala que buscas no existe o ha sido eliminada.
            </p>
            <button
              onClick={() => navigate('/rooms')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Volver a salas
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_auto_1fr_auto]">
      <Header />

      {/* HeroSection con banner por defecto */}
      <div className="relative">
        <HeroSection title={room?.name || ''} backgroundImage={defaultBanner} />
        {canEdit && (
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4"></div>
        )}
      </div>

      <div className="container mx-auto my-8 px-4">
        {/* Sección de Detalles de la Sala */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          {/* Contenedor de la Imagen de la Sala */}
          <div className="w-full lg:w-1/2 h-64 lg:h-96 overflow-hidden rounded-lg shadow-md relative">
            <img
              src={
                room?.imagePath
                  ? getMediaUrl(room.imagePath)
                  : 'https://via.placeholder.com/600x400?text=Sin+Imagen'
              }
              alt={room?.name || 'Sala'}
              className="w-full h-full object-cover"
            />

            {/* Etiqueta CUC con tooltip - Aumentada */}
            {room.isInCUC && (
              <div
                className="absolute top-2 right-2 bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-semibold group relative"
                title="Espacio ubicado en el Centro Urbano de la UCV"
              >
                CUC
                <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block w-48 z-10">
                  <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-normal text-left shadow-lg">
                    Espacio ubicado en el Centro Urbano de la UCV
                    <div className="absolute top-full right-4 transform -mt-1">
                      <div className="border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contenedor de etiquetas de características en la parte inferior */}
            <div className="absolute bottom-2 left-2 right-2 flex flex-wrap">
              {renderFeatureTags(room)}
            </div>

            {canEdit && (
              <div className="absolute top-2 left-2">
                <button
                  onClick={handleUploadImage}
                  className="bg-white/90 hover:bg-white text-gray-800 px-3 py-1.5 rounded-lg shadow transition-all duration-200 flex items-center space-x-1 border border-gray-200 text-sm"
                >
                  <PencilSquareIcon className="h-4 w-4 text-blue-500" />
                  <span className="hidden sm:inline">Cambiar imagen</span>
                </button>
              </div>
            )}
          </div>

          {/* Detalles de la Sala */}
          <div className="w-full lg:w-1/2">
            <div className="flex items-center mb-6 flex-wrap">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-800 hover:text-gray-600 transition-colors mr-4"
                title="Volver a salas"
              >
                <FaArrowLeft size={24} />
              </button>
              <h2 className="text-2xl lg:text-3xl font-bold">
                {room?.name || 'Sala'}
              </h2>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
              <p className="text-gray-700 whitespace-pre-line">
                {room?.description || 'Sin descripción'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6">
              <div className="space-y-3 lg:space-y-4">
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Capacidad:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {room?.capacity} personas
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Costo:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {room?.cost && room.cost !== '0'
                      ? `$${room.cost}`
                      : 'Gratuito'}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Ubicación:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {room?.location}
                  </p>
                </div>
              </div>
              <div className="space-y-3 lg:space-y-4">
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Ciudad Universitaria de Caracas:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {room?.isInCUC ? 'Sí' : 'No'}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700 text-sm lg:text-base">
                    Encargado:
                  </strong>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {room?.staffowner}
                  </p>
                </div>
                {room?.dependencies && room.dependencies.length > 0 && (
                  <div>
                    <strong className="text-gray-700 text-sm lg:text-base">
                      Dependencia:
                    </strong>
                    <p className="text-gray-600 text-sm lg:text-base">
                      {room.dependencies.map(dep => dep.name).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción */}
            {canEdit && (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleUpdateRoom}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg shadow transition-all duration-200 flex items-center space-x-2 border border-blue-700 w-full sm:w-auto justify-center"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                  <span>Actualizar Sala</span>
                </button>

                {role === 'admin' && (
                  <button
                    onClick={handleDeleteRoom}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg shadow transition-all duration-200 flex items-center space-x-2 border border-red-700 w-full sm:w-auto justify-center"
                  >
                    <span>Eliminar Sala</span>
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

export default RoomDetailsPage;
