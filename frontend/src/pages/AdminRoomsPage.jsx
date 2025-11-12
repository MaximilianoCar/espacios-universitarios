// src/pages/AdminRoomsPage.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { FaEdit, FaTrash, FaPlus, FaArrowLeft } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import AddRoomForm from '../components/AddRoomForm';
import UpdateRoomForm from '../components/UpdateRoomForm';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import getMediaUrl from '../utils/media';

const AdminRoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);
  const [showUpdateRoomForm, setShowUpdateRoomForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  const handleCloseModal = () => {
    setShowUpdateRoomForm(false);
  };

  const handleCloseAddModal = () => {
    setShowAddRoomForm(false);
  };

  // Obtener las salas desde la API
  useEffect(() => {
    fetchRooms();
  }, []);

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

  // Manejar la actualización de una sala
  const handleUpdateRoom = room => {
    setSelectedRoom(room);
    setShowUpdateRoomForm(true);
  };

  // Manejar la creación de una nueva sala
  const handleAddRoom = () => {
    setShowAddRoomForm(true);
  };

  // Manejar el envío del formulario de agregar sala
  const handleAddRoomSubmit = async formData => {
    setIsSubmitting(true);

    // Mostrar loader
    Swal.fire({
      title: 'Creando espacio...',
      text: 'Por favor espere mientras se crea el nuevo espacio',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await axiosInstance.post('/rooms', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Cerrar loader
      Swal.close();

      // Mostrar éxito
      await Swal.fire(
        '¡Creado!',
        `El espacio "${formData.get('name')}" ha sido creado exitosamente.`,
        'success'
      );

      // Actualizar la lista y cerrar modal
      handleRoomSaved(response.data);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error al crear el espacio:', error);

      // Cerrar loader
      Swal.close();

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.errors?.join(', ') ||
        'Error al crear el espacio. Por favor, intente nuevamente.';

      await Swal.fire('Error', errorMessage, 'error');

      setIsSubmitting(false);
    }
  };

  // Actualizar la lista de salas después de agregar o actualizar
  const handleRoomSaved = updatedRoom => {
    fetchRooms(); // Refrescar la lista de salas
    setShowAddRoomForm(false);
    setShowUpdateRoomForm(false);
    setSelectedRoom(null);
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
    <div className="min-h-screen grid grid-rows-[auto_auto_1fr_auto]">
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
        {/* Agregar el SearchBar y el botón de añadir sala */}
        <div className="flex justify-between items-center mb-4">
          <SearchBar placeholder="Buscar Espacio..." onSearch={handleSearch} />
          <button
            onClick={handleAddRoom}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center transition duration-200"
          >
            <FaPlus className="mr-2" /> Añadir Espacio
          </button>
        </div>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {filteredRooms.length > 0 ? (
          <div className="overflow-x-auto shadow-xl rounded-lg">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-2 px-4 border-b text-left">Nombre</th>
                  <th className="py-2 px-4 border-b text-left">Imagen</th>
                  <th className="py-2 px-4 border-b text-left">Descripción</th>
                  <th className="py-2 px-4 border-b text-left">Capacidad</th>
                  <th className="py-2 px-4 border-b text-left">Ubicación</th>
                  <th className="py-2 px-4 border-b text-left">CUC</th>
                  <th className="py-2 px-4 border-b text-left">Encargado</th>
                  <th className="py-2 px-4 border-b text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.length > 0 ? (
                  filteredRooms.map((room, index) => (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b font-semibold text-gray-800">
                        {room.name}
                      </td>

                      {/* Imagen */}
                      <td className="py-2 px-4 border-b">
                        {room.imagePath ? (
                          <img
                            src={getMediaUrl(room.imagePath)}
                            alt={room.name}
                            className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity duration-200"
                          />
                        ) : (
                          <span className="text-gray-500 text-sm">
                            Sin imagen
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-4 border-b">{room.description}</td>
                      <td className="py-2 px-4 border-b">{room.capacity}</td>
                      <td className="py-2 px-4 border-b">{room.location}</td>
                      <td className="py-2 px-4 border-b">
                        {room.isInCUC ? 'Sí' : 'No'}
                      </td>
                      <td className="py-2 px-4 border-b">{room.staffowner}</td>

                      {/* Acciones - Horizontal */}
                      <td className="py-2 px-4 border-b">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateRoom(room)}
                            className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-2 rounded text-xs transition-colors"
                          >
                            <FaEdit className="mr-1" size={12} />
                            Actualizar
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id, room.name)}
                            className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded text-xs transition-colors"
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
                    <td colSpan="8" className="py-8 text-center text-gray-500">
                      No hay salas disponibles.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-700">No hay salas disponibles.</p>
        )}
      </div>
      <Footer />
      {/* Modal para añadir sala */}
      {showAddRoomForm && (
        <Modal onClose={handleCloseAddModal}>
          <AddRoomForm
            onRoomCreated={handleRoomSaved}
            onClose={handleCloseAddModal}
          />
        </Modal>
      )}
      {/* Modal para actualizar sala */}
      {showUpdateRoomForm && selectedRoom && (
        <Modal onClose={handleCloseModal}>
          <UpdateRoomForm
            room={selectedRoom}
            onRoomSaved={handleRoomSaved}
            onClose={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default AdminRoomsPage;
