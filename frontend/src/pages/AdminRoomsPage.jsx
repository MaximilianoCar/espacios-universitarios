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
      const searchableFields = `${room.name} ${room.description}`.toLowerCase();

      return searchableFields.includes(lowerCaseTerm);
    });

    setFilteredRooms(filtered);
  };

  // Manejar la eliminación de una sala
  const handleDeleteRoom = roomId => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta sala?')) {
      axiosInstance
        .delete(`/rooms/${roomId}`)
        .then(() => {
          // Actualizar la lista de salas
          setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
          setFilteredRooms(prevRooms =>
            prevRooms.filter(room => room.id !== roomId)
          );
        })
        .catch(error => {
          console.error('Error al eliminar la sala:', error);
          alert('Error al eliminar la sala. Por favor, intente nuevamente.');
        });
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
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
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
                            src={`http://localhost:3000/${room.imagePath}`}
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
                            onClick={() => handleDeleteRoom(room.id)}
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
                    <td colSpan="7" className="py-8 text-center text-gray-500">
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
        <Modal onClose={() => setShowAddRoomForm(false)}>
          <AddRoomForm onRoomCreated={handleRoomSaved} />
        </Modal>
      )}
      {/* Modal para actualizar sala */}
      {showUpdateRoomForm && selectedRoom && (
        <Modal onClose={() => setShowUpdateRoomForm(false)}>
          <UpdateRoomForm room={selectedRoom} onRoomSaved={handleRoomSaved} />
        </Modal>
      )}
    </div>
  );
};

export default AdminRoomsPage;
