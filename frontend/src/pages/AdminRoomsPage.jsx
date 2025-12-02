// src/pages/AdminRoomsPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaArrowLeft,
  FaUsers,
  FaMapPin,
  FaUser,
  FaEllipsisV,
  FaInfoCircle,
} from 'react-icons/fa';
import { IoInformationCircleOutline } from 'react-icons/io5';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar2';
import Modal from '../components/Modal';
import ModalMobile from '../components/ModalMobile';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import getMediaUrl from '../utils/media';

const AdminRoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  // para modales
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');
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

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  // Obtener las salas desde la API
  useEffect(() => {
    fetchRooms();

    // Detectar tamaño de pantalla
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Manejar clicks fuera del menú de acciones
  useEffect(() => {
    const handleClickOutside = event => {
      if (openMenuId && !event.target.closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const fetchRooms = () => {
    axiosInstance
      .get('/rooms')
      .then(response => {
        setRooms(response.data);
        setFilteredRooms(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error al obtener las salas:', error);
        setError('Error al obtener las salas.');
        setLoading(false);
      });
  };

  // Manejar el cambio en el término de búsqueda
  const handleSearch = term => {
    setSearchTerm(term);
    setCurrentSearch(term);

    const filtered = rooms.filter(room => {
      const lowerCaseTerm = term.toLowerCase();
      const searchableFields =
        `${room.name} ${room.description} ${room.location} ${room.staffowner}`.toLowerCase();

      return searchableFields.includes(lowerCaseTerm);
    });

    setFilteredRooms(filtered);
  };

  // Manejar la eliminación de una sala
  const handleDeleteRoom = async (roomId, roomName) => {
    setOpenMenuId(null); // Cerrar menú si está abierto

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará permanentemente la sala "${roomName}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      // Mostrar loader
      Swal.fire({
        title: 'Eliminando sala...',
        text: `Por favor espere mientras se elimina la sala "${roomName}"`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        await axiosInstance.delete(`/rooms/${roomId}`);

        // Actualizar la lista de salas
        setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
        setFilteredRooms(prevRooms =>
          prevRooms.filter(room => room.id !== roomId)
        );

        Swal.fire(
          '¡Eliminada!',
          `La sala "${roomName}" ha sido eliminada exitosamente.`,
          'success'
        );
      } catch (error) {
        console.error('Error al eliminar la sala:', error);
        Swal.fire(
          'Error',
          'Error al eliminar la sala. Por favor, intente nuevamente.',
          'error'
        );
      }
    }
  };

  // Manejar la creación de una nueva sala - Usando SweetAlert2 como RoomDetailsPage
  const handleAddRoom = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Crear Nuevo Espacio',
      html: `
        <div class="text-left space-y-4 max-h-96 overflow-y-auto pr-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Espacio</label>
            <input 
              id="swal-name" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Nombre del espacio"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea 
              id="swal-description" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Descripción del espacio"
              rows="4"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
            <input 
              id="swal-capacity" 
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Capacidad"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <input 
              id="swal-location" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Ubicación"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Encargado</label>
            <input 
              id="swal-staffowner" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Encargado"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
            <input 
              id="swal-image" 
              type="file"
              accept="image/*"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            >
          </div>
          <div class="flex items-center">
            <input 
              id="swal-isInCUC" 
              type="checkbox"
              class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
            >
            <label for="swal-isInCUC" class="ml-2 block text-sm text-gray-700">
              ¿Está en la Ciudad Universitaria de Caracas?
            </label>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      confirmButtonColor: '#3085d6',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#d33',
      width: isMobile ? '90%' : '800px',
      focusConfirm: false,
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        const description = document.getElementById('swal-description').value;
        const capacity = document.getElementById('swal-capacity').value;
        const location = document.getElementById('swal-location').value;
        const staffowner = document.getElementById('swal-staffowner').value;
        const isInCUC = document.getElementById('swal-isInCUC').checked;
        const imageInput = document.getElementById('swal-image');
        const imageFile = imageInput.files[0];

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

        if (!imageFile) {
          Swal.showValidationMessage('La imagen es obligatoria');
          return false;
        }

        // Validar que el archivo sea una imagen
        if (!imageFile.type.startsWith('image/')) {
          Swal.showValidationMessage('El archivo debe ser una imagen');
          return false;
        }

        // Validar tamaño (5MB)
        if (imageFile.size > 5 * 1024 * 1024) {
          Swal.showValidationMessage('La imagen no puede ser mayor a 5MB');
          return false;
        }

        return {
          name,
          description,
          capacity: parseInt(capacity),
          location,
          staffowner,
          isInCUC,
          imageFile,
        };
      },
    });

    if (formValues) {
      Swal.fire({
        title: 'Creando espacio...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const formData = new FormData();
        formData.append('name', formValues.name);
        formData.append('description', formValues.description);
        formData.append('capacity', formValues.capacity);
        formData.append('location', formValues.location);
        formData.append('staffowner', formValues.staffowner);
        formData.append('isInCUC', formValues.isInCUC);
        formData.append('image', formValues.imageFile);

        await axiosInstance.post('/rooms', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        Swal.fire({
          title: '¡Creado!',
          text: 'El espacio ha sido creado exitosamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
        });

        // Refrescar la lista de salas
        fetchRooms();
      } catch (error) {
        console.error('Error creating room:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al crear el espacio. Por favor, intente nuevamente.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      }
    }
  };

  // Manejar la actualización de una sala - Usando SweetAlert2 como RoomDetailsPage
  const handleUpdateRoom = async room => {
    setOpenMenuId(null);

    const { value: formValues } = await Swal.fire({
      title: 'Actualizar Espacio',
      html: `
        <div class="text-left space-y-4 max-h-96 overflow-y-auto pr-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Espacio</label>
            <input 
              id="swal-name" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value="${room.name || ''}"
              placeholder="Nombre del espacio"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea 
              id="swal-description" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Descripción del espacio"
              rows="4"
            >${room.description || ''}</textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
            <input 
              id="swal-capacity" 
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value="${room.capacity || ''}"
              placeholder="Capacidad"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <input 
              id="swal-location" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value="${room.location || ''}"
              placeholder="Ubicación"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Encargado</label>
            <input 
              id="swal-staffowner" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value="${room.staffowner || ''}"
              placeholder="Encargado"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Imagen Actual</label>
            ${
              room.imagePath
                ? `<div class="mb-2">
                    <img src="${getMediaUrl(room.imagePath)}" alt="${
                    room.name
                  }" class="w-32 h-32 object-cover rounded">
                    <p class="text-xs text-gray-500 mt-1">Imagen actual. Sube una nueva para reemplazar.</p>
                   </div>`
                : '<p class="text-sm text-gray-500">No hay imagen actual</p>'
            }
            <input 
              id="swal-image" 
              type="file"
              accept="image/*"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            >
          </div>
          <div class="flex items-center">
            <input 
              id="swal-isInCUC" 
              type="checkbox"
              class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
              ${room.isInCUC ? 'checked' : ''}
            >
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
      width: isMobile ? '90%' : '800px',
      focusConfirm: false,
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        const description = document.getElementById('swal-description').value;
        const capacity = document.getElementById('swal-capacity').value;
        const location = document.getElementById('swal-location').value;
        const staffowner = document.getElementById('swal-staffowner').value;
        const isInCUC = document.getElementById('swal-isInCUC').checked;
        const imageInput = document.getElementById('swal-image');
        const imageFile = imageInput.files[0];

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

        if (imageFile) {
          // Validar que el archivo sea una imagen
          if (!imageFile.type.startsWith('image/')) {
            Swal.showValidationMessage('El archivo debe ser una imagen');
            return false;
          }

          // Validar tamaño (5MB)
          if (imageFile.size > 5 * 1024 * 1024) {
            Swal.showValidationMessage('La imagen no puede ser mayor a 5MB');
            return false;
          }
        }

        return {
          name,
          description,
          capacity: parseInt(capacity),
          location,
          staffowner,
          isInCUC,
          imageFile,
        };
      },
    });

    if (formValues) {
      Swal.fire({
        title: 'Actualizando espacio...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const formData = new FormData();
        formData.append('name', formValues.name);
        formData.append('description', formValues.description);
        formData.append('capacity', formValues.capacity);
        formData.append('location', formValues.location);
        formData.append('staffowner', formValues.staffowner);
        formData.append('isInCUC', formValues.isInCUC);

        // Solo agregar imagen si se seleccionó una nueva
        if (formValues.imageFile) {
          formData.append('image', formValues.imageFile);
        }

        await axiosInstance.put(`/rooms/${room.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        Swal.fire({
          title: '¡Actualizado!',
          text: 'El espacio ha sido actualizado exitosamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
        });

        // Refrescar la lista de salas
        fetchRooms();
      } catch (error) {
        console.error('Error updating room:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al actualizar el espacio. Por favor, intente nuevamente.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      }
    }
  };

  // Funciones para los modales (como en AdminReservationsPage)
  const handleShowDescription = description => {
    setSelectedDescription(description);
    setShowDescriptionModal(true);
  };

  const handleCloseDescriptionModal = () => {
    setShowDescriptionModal(false);
    setSelectedDescription('');
  };

  const handleImageClick = imagePath => {
    setSelectedImage(getMediaUrl(imagePath));
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  // Componente del menú de acciones (para móvil)
  const ActionMenu = ({ room, index }) => {
    const isMenuOpen = openMenuId === room.id;
    const menuRef = useRef(null);

    const shouldOpenUpward = index > 0;

    const toggleMenu = e => {
      e.stopPropagation();
      setOpenMenuId(isMenuOpen ? null : room.id);
    };

    return (
      <div
        className="relative action-menu-container flex flex-col items-center justify-center"
        ref={menuRef}
      >
        <button
          onClick={toggleMenu}
          className={`p-1 rounded-full text-gray-600 hover:bg-gray-200 transition-colors ${
            isMenuOpen ? 'bg-gray-200' : ''
          }`}
          title="Opciones"
        >
          <FaEllipsisV size={16} />
        </button>

        {isMenuOpen && (
          <div
            className={`absolute right-0 w-40 bg-white border border-gray-200 shadow-lg rounded z-50 flex flex-col items-start ${
              shouldOpenUpward ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
          >
            <button
              onClick={() => handleUpdateRoom(room)}
              className="flex items-center w-full px-3 py-2 text-xs text-yellow-600 hover:bg-gray-100 font-semibold"
            >
              <FaEdit className="mr-2" size={14} /> Editar
            </button>
            <button
              onClick={() => handleDeleteRoom(room.id, room.name)}
              className="flex items-center w-full px-3 py-2 text-xs text-red-600 hover:bg-gray-100 font-semibold"
            >
              <FaTrash className="mr-2" size={14} /> Eliminar
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto my-8">
          <p>Cargando salas...</p>
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
            onClick={handleBack}
            className="flex items-center text-gray-800 hover:text-gray-600 transition-colors mr-4"
            title="Volver al inicio"
          >
            <FaArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-bold text-gray-800">
            Gestionar Espacios
          </h2>
        </div>

        {/* SearchBar y botón de añadir */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
          <div className="w-full lg:w-auto">
            <SearchBar
              placeholder="Buscar Espacio..."
              onSearch={handleSearch}
            />
          </div>
          <button
            onClick={handleAddRoom}
            className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transition duration-200 shadow-md hover:shadow-lg"
          >
            <FaPlus className="mr-2" /> Añadir Espacio
          </button>
        </div>

        {/* Indicador de búsqueda activa */}
        {currentSearch && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-sm text-blue-700">
                Mostrando resultados para: <strong>"{currentSearch}"</strong>
                {filteredRooms.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    ({filteredRooms.length} resultado
                    {filteredRooms.length !== 1 ? 's' : ''})
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
        {currentSearch && filteredRooms.length === 0 && !loading && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-yellow-700">
              No se encontraron resultados para:{' '}
              <strong>"{currentSearch}"</strong>
            </p>
            <button
              onClick={() => handleSearch('')}
              className="mt-2 text-yellow-600 hover:text-yellow-800 underline text-sm"
            >
              Ver todos los espacios
            </button>
          </div>
        )}

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {/* Vista Desktop - Tabla */}
        <div className="hidden lg:block overflow-x-auto shadow-xl rounded-lg">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-blue-100">
                <th className="py-3 px-4 border-b text-left">Nombre</th>
                <th className="py-3 px-4 border-b text-center">Imagen</th>
                <th className="py-3 px-4 border-b text-center">Descripción</th>
                <th className="py-3 px-4 border-b text-center">Capacidad</th>
                <th className="py-3 px-4 border-b text-center">Ubicación</th>
                <th className="py-3 px-4 border-b text-center">CUC</th>
                <th className="py-3 px-4 border-b text-center">Encargado</th>
                <th className="py-3 px-4 border-b text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room, index) => (
                  <tr
                    key={room.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 border-b font-semibold text-gray-800">
                      {room.name}
                    </td>

                    {/* Imagen */}
                    <td className="py-3 px-4 border-b text-center">
                      {room.imagePath ? (
                        <img
                          src={getMediaUrl(room.imagePath)}
                          alt={room.name}
                          className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity duration-200 inline-block"
                          onClick={() => handleImageClick(room.imagePath)}
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
                        onClick={() => handleShowDescription(room.description)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Ver descripción"
                      >
                        <IoInformationCircleOutline size={22} />
                      </button>
                    </td>

                    <td className="py-3 px-4 border-b text-center">
                      {room.capacity}
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      {room.location}
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          room.isInCUC
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {room.isInCUC ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      {room.staffowner}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 border-b text-center">
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => handleUpdateRoom(room)}
                          className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded text-sm transition-colors shadow-sm"
                        >
                          <FaEdit className="mr-1" size={14} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id, room.name)}
                          className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded text-sm transition-colors shadow-sm"
                        >
                          <FaTrash className="mr-1" size={14} />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500">
                    No hay espacios disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Mobile - Cards */}
        <div className="lg:hidden space-y-4">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room, index) => (
              <div
                key={room.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-4 relative"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-2">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">
                      {room.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <FaMapPin className="mr-2 text-blue-500" size={14} />
                      <span>{room.location}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        room.isInCUC
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {room.isInCUC ? 'CUC' : 'No CUC'}
                    </span>

                    {/* Menú de opciones */}
                    <ActionMenu room={room} index={index} />
                  </div>
                </div>

                {/* Imagen */}
                {room.imagePath && (
                  <div className="mb-3">
                    <img
                      src={getMediaUrl(room.imagePath)}
                      alt={room.name}
                      className="w-full h-48 object-cover rounded cursor-pointer"
                      onClick={() => handleImageClick(room.imagePath)}
                    />
                  </div>
                )}

                {/* Información básica */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUsers className="mr-2 text-green-500" size={14} />
                    <span>Capacidad: {room.capacity}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUser className="mr-2 text-purple-500" size={14} />
                    <span>Encargado: {room.staffowner}</span>
                  </div>
                </div>

                {/* Botón de descripción (como en AdminReservationsPage) */}
                <div className="mb-3">
                  <button
                    onClick={() => handleShowDescription(room.description)}
                    className="w-full flex flex-col items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-1 rounded text-xs transition-colors"
                  >
                    <FaInfoCircle className="mb-1" size={14} />
                    <span>Descripción</span>
                  </button>
                </div>

                {/* Botones de acción principales */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateRoom(room)}
                    className="flex-1 flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded text-sm transition-colors shadow-sm"
                  >
                    <FaEdit className="mr-2" size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.id, room.name)}
                    className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm transition-colors shadow-sm"
                  >
                    <FaTrash className="mr-2" size={14} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {currentSearch
                ? 'No se encontraron espacios que coincidan con tu búsqueda.'
                : 'No hay espacios disponibles.'}
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* MODALES (igual que en AdminReservationsPage) */}
      {showDescriptionModal && (
        <RenderModal onClose={handleCloseDescriptionModal}>
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">
              Descripción del Espacio
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
        <RenderModal onClose={handleCloseImageModal}>
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">
              Imagen del Espacio
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
              onClick={handleCloseImageModal}
              className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        </RenderModal>
      )}
    </div>
  );
};

export default AdminRoomsPage;
