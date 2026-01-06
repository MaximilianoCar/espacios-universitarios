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
import ManageDependenciesModal from '../components/ManageDependenciesModal';
import backgroundImage from '../assets/ucvfondo.jpg';
import { FaArrowLeft, FaPlus, FaCogs, FaUsers } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import getMediaUrl from '../utils/media';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);
  const [showManageDepsModal, setShowManageDepsModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener el rol del usuario desde Redux
  const { role } = useSelector(state => state.auth);
  const isAdmin = role === 'admin';

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  // Fetch rooms from the backend API
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = () => {
    setLoading(true);
    axiosInstance
      .get('/rooms')
      .then(response => {
        setRooms(response.data || []);
        setFilteredRooms(response.data || []);
      })
      .catch(error => {
        console.error('Error fetching rooms:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSearch = searchTerm => {
    if (!searchTerm.trim()) {
      setFilteredRooms(rooms);
      return;
    }

    const lowerCaseTerm = searchTerm.toLowerCase();
    const filtered = rooms.filter(
      room =>
        room.name.toLowerCase().includes(lowerCaseTerm) ||
        room.description?.toLowerCase().includes(lowerCaseTerm) ||
        room.location?.toLowerCase().includes(lowerCaseTerm)
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
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto my-8 flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Cargando espacios...</p>
          </div>
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
          <AddRoomForm
            onRoomCreated={handleRoomCreated}
            onClose={() => setShowAddRoomForm(false)}
          />
        ) : (
          // Mostrar el buscador, los botones y las tarjetas
          <>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center flex-wrap">
                <button
                  onClick={handleBack}
                  className="flex items-center text-gray-800 hover:text-gray-600 transition-colors mr-4 mb-3 lg:mb-0"
                  title="Volver al inicio"
                >
                  <FaArrowLeft size={24} />
                  <span className="ml-2 hidden sm:inline">Volver</span>
                </button>
                <div className="min-w-[250px]">
                  <SearchBar
                    placeholder="Buscar espacios por nombre, descripción o ubicación..."
                    onSearch={handleSearch}
                  />
                </div>
              </div>

              {/* Mostrar los botones solo si el usuario es administrador */}
              {isAdmin && (
                <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
                  <button
                    onClick={() => setShowManageDepsModal(true)}
                    className="flex items-center justify-center bg-gray-700 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                  >
                    <FaUsers className="mr-2" size={14} />
                    <span className="text-sm">Gestionar Dependencias</span>
                  </button>
                  <button
                    onClick={handleAddRoom}
                    className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                  >
                    <FaPlus className="mr-2" size={14} />
                    <span className="text-sm">Añadir Espacio</span>
                  </button>
                </div>
              )}
            </div>

            {/* Indicador de resultados */}
            {filteredRooms.length > 0 && (
              <div className="mb-4 text-sm text-gray-600">
                Mostrando {filteredRooms.length} de {rooms.length} espacios
              </div>
            )}

            {/* Mensaje si no hay espacios */}
            {!loading && filteredRooms.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FaCogs className="text-4xl text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  No se encontraron espacios
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {rooms.length === 0
                    ? 'No hay espacios disponibles en este momento.'
                    : 'No hay resultados que coincidan con tu búsqueda.'}
                </p>
                {isAdmin && rooms.length === 0 && (
                  <button
                    onClick={handleAddRoom}
                    className="mt-4 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <FaPlus className="mr-2" />
                    Crear Primer Espacio
                  </button>
                )}
              </div>
            )}

            {/* Grid de espacios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {filteredRooms.map(room => (
                <div
                  key={room.id}
                  className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={
                        room.imagePath
                          ? getMediaUrl(room.imagePath)
                          : 'https://via.placeholder.com/600x400?text=Sin+Imagen'
                      }
                      alt={room.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    {room.isInCUC && (
                      <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        CUC
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="mb-2">
                      <h2 className="text-lg font-bold text-gray-800 truncate">
                        {room.name}
                      </h2>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <FaUsers className="mr-1 text-gray-500" size={12} />
                        <span>Capacidad: {room.capacity}</span>
                      </div>
                    </div>

                    {room.location && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        <span className="font-medium">Ubicación:</span>{' '}
                        {room.location}
                      </p>
                    )}

                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <Link
                        to={`/rooms/${room.id}`}
                        className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mensaje para administradores si no hay espacios */}
            {isAdmin && rooms.length === 0 && !loading && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <FaCogs className="text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-blue-800 font-medium mb-1">
                      ¡Comienza creando tu primer espacio!
                    </p>
                    <p className="text-blue-700 text-sm">
                      Como administrador, puedes crear nuevos espacios y
                      asignarlos a dependencias. Primero asegúrate de tener al
                      menos una dependencia creada.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setShowManageDepsModal(true)}
                        className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded"
                      >
                        Crear Dependencia
                      </button>
                      <button
                        onClick={handleAddRoom}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                      >
                        Crear Espacio
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />

      {/* Modal de gestión de dependencias */}
      {showManageDepsModal && (
        <ManageDependenciesModal
          isOpen={showManageDepsModal}
          onClose={() => {
            setShowManageDepsModal(false);
            fetchRooms();
          }}
        />
      )}
    </div>
  );
};

export default RoomsPage;
