import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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

const RoomDetailsPage = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCoordinatorPermission, setHasCoordinatorPermission] =
    useState(false);

  const { role, user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

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
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando sala...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        axiosInstance
          .delete(`/rooms/${room.id}`)
          .then(() => {
            Swal.fire({
              title: '¡Eliminada!',
              text: `La sala "${room.name}" ha sido eliminada exitosamente.`,
              icon: 'success',
              confirmButtonColor: '#3085d6',
            }).then(() => {
              navigate('/rooms');
            });
          })
          .catch(error => {
            console.error('Error deleting room:', error);
            Swal.fire({
              title: 'Error',
              text: 'Error al eliminar la sala. Por favor, intente nuevamente.',
              icon: 'error',
              confirmButtonColor: '#d33',
            });
          });
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

      // Agregar los demás campos del room para no perderlos
      formData.append('name', room.name);
      formData.append('description', room.description);
      formData.append('capacity', room.capacity);
      formData.append('location', room.location);
      formData.append('staffowner', room.staffowner);
      formData.append('isInCUC', room.isInCUC);

      Swal.fire({
        title: 'Subiendo imagen...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const response = await axiosInstance.put(
          `/rooms/${room.id}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );

        Swal.close();
        Swal.fire({
          title: '¡Listo!',
          text: 'Imagen actualizada correctamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
        });
        setRoom(response.data);
      } catch (err) {
        Swal.close();
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar la imagen.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      }
    };
    input.click();
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
          <div class="text-left space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Sala</label>
              <input id="swal-name" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${
                room.name || ''
              }" placeholder="Nombre de la sala">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea id="swal-description" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="4" placeholder="Descripción de la sala">${
                room.description || ''
              }</textarea>
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
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Encargado</label>
              <input id="swal-staffowner" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${
                room.staffowner || ''
              }" placeholder="Encargado">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dependencia</label>
              <div class="flex items-center space-x-2">
                <select id="swal-dependency" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">-- Selecciona una dependencia --</option>
                  ${optionsHtml}
                </select>
                <button id="swal-add-dep" type="button" class="px-3 py-2 bg-green-500 text-white rounded">+ Agregar</button>
              </div>
            </div>
            <div class="flex items-center">
              <input id="swal-isInCUC" type="checkbox" class="h-4 w-4" ${
                room.isInCUC ? 'checked' : ''
              }>
              <label for="swal-isInCUC" class="ml-2 block text-sm text-gray-700">¿Está en la Ciudad Universitaria de Caracas?</label>
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
        didOpen: () => {
          const addBtn = document.getElementById('swal-add-dep');
          if (addBtn) {
            addBtn.addEventListener('click', async () => {
              const { value: depName } = await Swal.fire({
                title: 'Nueva Dependencia',
                input: 'text',
                inputLabel: 'Nombre',
                inputValidator: value =>
                  !value ? 'El nombre es requerido' : null,
                showCancelButton: true,
              });

              if (depName) {
                const { value: depDesc } = await Swal.fire({
                  title: 'Descripción (opcional)',
                  input: 'textarea',
                  showCancelButton: true,
                });

                try {
                  const res = await axiosInstance.post('/dependencies', {
                    name: depName,
                    description: depDesc,
                  });
                  // agregar opción al select
                  const sel = document.getElementById('swal-dependency');
                  if (sel) {
                    const opt = document.createElement('option');
                    opt.value = res.data.id;
                    opt.text = res.data.name;
                    sel.appendChild(opt);
                    sel.value = res.data.id;
                  }
                  Swal.fire({
                    title: '¡Creada!',
                    text: 'Dependencia creada.',
                    icon: 'success',
                  });
                } catch (err) {
                  console.error('Error creating dependency', err);
                  Swal.fire({
                    title: 'Error',
                    text:
                      err.response?.data?.error ||
                      'No se pudo crear la dependencia',
                    icon: 'error',
                  });
                }
              }
            });
          }
        },
        preConfirm: () => {
          const name = document.getElementById('swal-name').value;
          const description = document.getElementById('swal-description').value;
          const capacity = document.getElementById('swal-capacity').value;
          const location = document.getElementById('swal-location').value;
          const staffowner = document.getElementById('swal-staffowner').value;
          const isInCUC = document.getElementById('swal-isInCUC').checked;
          const dependencyId = document.getElementById('swal-dependency').value;

          if (!name || !description || !capacity || !location || !staffowner) {
            Swal.showValidationMessage('Todos los campos son obligatorios');
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

          return {
            name,
            description,
            capacity: parseInt(capacity),
            location,
            staffowner,
            isInCUC,
            dependencyId,
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
          const resp = await axiosInstance.put(`/rooms/${room.id}`, formValues);
          Swal.fire({
            title: '¡Actualizada!',
            text: 'La sala ha sido actualizada exitosamente.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
          });
          setRoom(resp.data);
        } catch (error) {
          console.error('Error updating room:', error);
          const msg =
            error.response?.data?.error ||
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
        <div className="container mx-auto my-8">
          <p>Cargando sala...</p>
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
          <p>Sala no encontrada.</p>
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
                  : 'https://via.placeholder.com/600x400'
              }
              alt={room?.name || 'Sala'}
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
