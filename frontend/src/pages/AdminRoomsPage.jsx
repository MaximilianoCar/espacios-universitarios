// src/pages/AdminRoomsPage.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import AddRoomForm from '../components/AddRoomForm';
import UpdateRoomForm from '../components/UpdateRoomForm';

const AdminRoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);
  const [showUpdateRoomForm, setShowUpdateRoomForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

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
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Gestionar Espacios
        </h2>
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
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white">
                  <th className="py-2 px-4 text-left">Nombre</th>
                  <th className="py-2 px-4 text-left">Imagen</th>
                  <th className="py-2 px-4 text-left">Descripción</th>
                  <th className="py-2 px-4 text-left">Capacidad</th>
                  <th className="py-2 px-4 text-left">Ubicación</th>
                  <th className="py-2 px-4 text-left">Encargado</th>
                  <th className="py-2 px-4 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room, index) => (
                  <tr
                    key={room.id}
                    className={`${
                      index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                    } hover:bg-gray-200 transition-colors`}
                  >
                    <td className="py-2 px-4 font-semibold text-gray-800">
                      {room.name}
                    </td>
                    {/* Mostrar una miniatura de la imagen */}
                    <td className="py-2 px-4">
                      {room.imagePath ? (
                        <img
                          src={`http://localhost:3000/${room.imagePath}`}
                          alt={room.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        'Sin imagen'
                      )}
                    </td>
                    <td className="py-2 px-4">{room.description}</td>
                    <td className="py-2 px-4">{room.capacity}</td>
                    <td className="py-2 px-4">{room.location}</td>
                    <td className="py-2 px-4">{room.staffowner}</td>
                    {/* Acciones */}
                    <td className="py-2 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateRoom(room)}
                          className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs"
                        >
                          <FaEdit className="mr-1" size={14} /> Actualizar
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="flex items-center bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-xs"
                        >
                          <FaTrash className="mr-1" size={14} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
