// src/pages/RoomsPage.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import HeroSection from '../components/HeroSection';
import AddRoomForm from '../components/AddRoomForm';
import backgroundImage from '../assets/ucvfondo.jpg';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);

  // Obtener el rol del usuario desde Redux
  const { role } = useSelector(state => state.auth);

  // Fetch rooms from the backend API
  useEffect(() => {
    axiosInstance
      .get('/rooms')
      .then(response => {
        setRooms(response.data);
        setFilteredRooms(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching rooms:', error);
        setLoading(false);
      });
  }, []);

  const handleSearch = searchTerm => {
    const filtered = rooms.filter(room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRooms(filtered);
  };

  const handleAddRoom = () => {
    setShowAddRoomForm(true);
  };

  const handleRoomCreated = newRoom => {
    // Update the rooms list with the new room
    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    setFilteredRooms(updatedRooms);
    setShowAddRoomForm(false);
    // Opcionalmente, mostrar un mensaje de éxito al usuario
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto my-8">
          <p>Cargando espacios...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_auto_1fr_auto]">
      <Header />
      <HeroSection
        title="Espacios"
        subtitle="Explora los espacios de la UCV"
        backgroundImage={backgroundImage}
      />
      <div className="container mx-auto my-8 px-4">
        {/* Renderizado condicional */}
        {showAddRoomForm ? (
          // Mostrar solo el formulario
          <AddRoomForm onRoomCreated={handleRoomCreated} />
        ) : (
          // Mostrar el buscador, el botón y las tarjetas
          <>
            <div className="flex justify-between items-center">
              <SearchBar
                placeholder="Buscar espacios..."
                onSearch={handleSearch}
              />

              {/* Mostrar el botón de "Añadir Sala" solo si el usuario es administrador */}
              {role === 'admin' && (
                <button
                  onClick={handleAddRoom}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Añadir Espacio
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {filteredRooms.map(room => (
                <div
                  key={room.id}
                  className="border rounded-lg overflow-hidden bg-white shadow-md flex flex-col"
                >
                  <img
                    src={
                      room.imagePath
                        ? `http://localhost:3000/${room.imagePath}`
                        : 'https://via.placeholder.com/600x400'
                    }
                    alt={room.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4 flex flex-col flex-grow">
                    <h2 className="text-xl font-bold">{room.name}</h2>
                    <p className="mt-2 text-gray-600">{room.description}</p>
                    <div className="mt-auto">
                      <Link
                        to={`/rooms/${room.id}`}
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default RoomsPage;
