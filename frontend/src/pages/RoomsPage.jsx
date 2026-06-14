// src/pages/RoomsPage.jsx
import { useEffect, useState } from 'react';
//import axiosInstance from '../axiosConfig';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchRooms,
  selectRooms,
  selectRoomsLoading,
  invalidateRooms,
  createRoom as createRoomThunk,
} from '../features/rooms/roomsSlice';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar2';
import HeroSection from '../components/HeroSection';
import AddRoomForm from '../components/AddRoomForm';
import ManageDependenciesModal from '../components/ManageDependenciesModal';
import backgroundImage from '../assets/ucvfondo.jpg';
import {
  FaArrowLeft,
  FaPlus,
  FaCogs,
  FaUsers,
  FaWheelchair,
  FaWifi,
  FaToilet,
  FaMicrophoneAlt,
  FaVideo,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaBox,
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import getMediaUrl from '../utils/media';

const RoomsPage = () => {
  const rooms = useSelector(selectRooms);
  const loading = useSelector(selectRoomsLoading);
  const totalPages = useSelector(state => state.rooms.totalPages);
  const totalRooms = useSelector(state => state.rooms.totalRooms);
  const pageSizeSelector = useSelector(state => state.rooms.pageSize);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const dispatch = useDispatch();
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);
  const [showManageDepsModal, setShowManageDepsModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const PAGE_SIZE = 2;

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

  const [currentPage, setCurrentPage] = useState(1);
  const [currentSearch, setCurrentSearch] = useState('');

  // Fetch rooms según página/búsqueda
  useEffect(() => {
    dispatch(
      fetchRooms({
        page: currentPage,
        pageSize: pageSizeSelector || 2,
        search: currentSearch,
      })
    );
  }, [dispatch, currentPage, currentSearch, pageSizeSelector]);

  useEffect(() => {
    setFilteredRooms(rooms || []);
  }, [rooms]);

  const handleSearch = searchTerm => {
    setCurrentSearch(searchTerm || '');
    setCurrentPage(1);
  };

  const handleAddRoom = () => {
    setShowAddRoomForm(true);
  };

  const handleRoomCreated = async newRoom => {
    // If AddRoomForm returns created room, optimistically add it via thunk
    if (newRoom) {
      try {
        await dispatch(createRoomThunk(newRoom)).unwrap();
      } catch (err) {
        console.error('Error creating room:', err);
      }
    } else {
      // force refetch if creation happened elsewhere
      dispatch(invalidateRooms());
      dispatch(fetchRooms());
    }

    setShowAddRoomForm(false);
  };

  // Función para renderizar las etiquetas de características
  const renderFeatureTags = room => {
    const features = [];

    // Definir las características y sus iconos
    const featureConfig = [
      {
        key: 'isAccessible',
        icon: <FaWheelchair />,
        tooltip: 'Accesible para personas con discapacidad motriz',
      },
      {
        key: 'hasInternet',
        icon: <FaWifi />,
        tooltip: 'Cuenta con conectividad',
      },
      {
        key: 'hasBathrooms',
        icon: <FaToilet />,
        tooltip: 'Disponibilidad de sanitarios',
      },
      {
        key: 'hasAudioEquipment',
        icon: <FaMicrophoneAlt />,
        tooltip: 'Cualquier equipo de sonido',
      },
      {
        key: 'hasVideoEquipment',
        icon: <FaVideo />,
        tooltip: 'Cuenta con equipos de video',
      },
      {
        key: 'canExonerate',
        icon: <FaMoneyBillWave />,
        tooltip: 'Posibilidad de exoneración de pago',
      },
      {
        key: 'acceptsTransfer',
        icon: <FaExchangeAlt />,
        tooltip: 'Acepta transferencia como método de pago',
      },
      {
        key: 'acceptsMaterials',
        icon: <FaBox />,
        tooltip: 'Acepta materiales como método de pago',
      },
    ];

    // Solo agregar características que estén en true
    featureConfig.forEach(feature => {
      if (room[feature.key]) {
        features.push(
          <div
            key={feature.key}
            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center mr-1 mb-1 group relative"
            title={feature.tooltip}
          >
            <span className="mr-1">{feature.icon}</span>
            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block w-48 z-10">
              <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-normal text-left">
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
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <div className="flex items-center flex-wrap w-full lg:w-auto">
                <button
                  onClick={handleBack}
                  className="flex items-center text-gray-800 hover:text-gray-600 transition-colors mr-4 mb-3 lg:mb-0"
                  title="Volver al inicio"
                >
                  <FaArrowLeft size={24} />
                </button>
                <div className="min-w-[250px] w-full lg:w-auto">
                  <SearchBar placeholder="Buscar..." onSearch={handleSearch} />
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
                    <span className="text-sm">Dependencias</span>
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

            {currentSearch && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center gap-3">
                  <p className="text-sm text-blue-700">
                    Mostrando resultados para:{' '}
                    <strong>"{currentSearch}"</strong>
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

                    {/* Etiqueta CUC con tooltip  */}
                    {room.isInCUC && (
                      <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        CUC
                        <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block w-48 z-10">
                          <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 whitespace-normal text-left">
                            Espacio ubicado en la Ciudad Universitaria de
                            Caracas
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
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="mb-2">
                      <h2 className="text-lg font-bold text-gray-800 truncate">
                        {room.name}
                      </h2>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <FaUsers className="mr-1 text-gray-500" size={12} />
                        <span>Capacidad: {room.capacity}</span>
                        <span className="mx-2">|</span>
                        <span>
                          Costo:{' '}
                          {room.cost && room.cost !== '0'
                            ? `$${room.cost}`
                            : 'Gratuito'}
                        </span>
                      </div>
                    </div>

                    {room.location && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium">Ubicación:</span>{' '}
                        {room.location}
                      </p>
                    )}
                    {room.dependencies && room.dependencies.length > 0 && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        <span className="font-medium">Dependencia:</span>{' '}
                        {room.dependencies.map(dep => dep.name).join(', ')}
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

            {/* PAGINACIÓN */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                Mostrando {filteredRooms.length} de {totalRooms} espacios (Pág.{' '}
                {currentPage} de {totalPages})
              </p>
              <div className="space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages || 1, currentPage + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
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
