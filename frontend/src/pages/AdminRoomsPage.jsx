import { useEffect, useState, useRef } from 'react';
//import axiosInstance from '../axiosConfig';
import {
  fetchRooms,
  deleteRoom as deleteRoomThunk,
  selectRooms,
  selectRoomsLoading,
  selectRoomsLastFetched,
  invalidateRooms,
  //updateRoom as updateRoomThunk,
} from '../features/rooms/roomsSlice';
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
  FaBuilding,
  FaWheelchair,
  FaWifi,
  FaToilet,
  FaMicrophoneAlt,
  FaVideo,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaBox,
  FaDollarSign,
} from 'react-icons/fa';
import { IoInformationCircleOutline } from 'react-icons/io5';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar2';
import Modal from '../components/Modal';
import ModalMobile from '../components/ModalMobile';
import CreateRoomModal from '../components/CreateRoomModal';
import UpdateRoomModal from '../components/UpdateRoomModal';
import ManageDependenciesModal from '../components/ManageDependenciesModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Swal from '../utils/swal';
import getMediaUrl from '../utils/media';

const AdminRoomsPage = () => {
  const dispatch = useDispatch();
  const rooms = useSelector(selectRooms);
  const loading = useSelector(selectRoomsLoading);
  const lastFetched = useSelector(selectRoomsLastFetched);

  const totalPages = useSelector(state => state.rooms.totalPages);
  const totalRooms = useSelector(state => state.rooms.totalRooms);
  const pageSize = useSelector(state => state.rooms.pageSize);

  const [filteredRooms, setFilteredRooms] = useState([]);
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // para modales
  const [showDataModal, setShowDataModal] = useState(false);
  const [selectedRoomData, setSelectedRoomData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Estados para modales de creación/actualización
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showUpdateRoomModal, setShowUpdateRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showManageDepsModal, setShowManageDepsModal] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useSelector(state => state.auth);
  const isAdminOrCoordinator = role === 'admin' || role === 'coordinator';

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

  // Obtener las salas desde Redux
  useEffect(() => {
    dispatch(
      fetchRooms({ page: currentPage, pageSize, search: currentSearch })
    );
  }, [dispatch, currentPage, currentSearch, pageSize]);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    setFilteredRooms(rooms);
  }, [rooms]);

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

  const handleRoomCreated = () => {
    // Invalidar caché para forzar datos frescos (opcional pero recomendado)
    dispatch(invalidateRooms());
    // Recargar los espacios con la página, tamaño y búsqueda actuales
    dispatch(
      fetchRooms({
        page: currentPage,
        pageSize: pageSize,
        search: currentSearch,
      })
    );
    // Cerrar el modal
    setShowCreateRoomModal(false);
  };

  const handleRoomUpdated = () => {
    // Forzar la recarga de los datos del servidor
    dispatch(
      fetchRooms({
        page: currentPage,
        pageSize,
        search: currentSearch,
      })
    );
    setShowUpdateRoomModal(false);
    setSelectedRoom(null);
  };

  // Manejar el cambio en el término de búsqueda
  const handleSearch = term => {
    // Búsqueda por servidor: actualizar estado y reiniciar página
    setCurrentSearch(term || '');
    setCurrentPage(1);
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

    if (!result.isConfirmed) {
      return;
    }

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
      await dispatch(deleteRoomThunk(roomId)).unwrap();

      Swal.fire(
        '¡Eliminada!',
        `La sala "${roomName}" ha sido eliminada exitosamente.`,
        'success'
      );
      dispatch(invalidateRooms());
      dispatch(
        fetchRooms({
          page: currentPage,
          pageSize: pageSize,
          search: currentSearch,
        })
      );
    } catch (error) {
      console.error('Error al eliminar la sala:', error);
      Swal.fire(
        'Error',
        error.message ||
          'Error al eliminar la sala. Por favor, intente nuevamente.',
        'error'
      );
    }
  };

  // Funciones para los modales
  const handleShowData = room => {
    setSelectedRoomData(room);
    setShowDataModal(true);
  };

  const handleCloseDataModal = () => {
    setShowDataModal(false);
    setSelectedRoomData(null);
  };

  const handleImageClick = imagePath => {
    setSelectedImage(getMediaUrl(imagePath));
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  // Función para abrir modal de actualización
  const handleOpenUpdateModal = room => {
    setSelectedRoom(room);
    setShowUpdateRoomModal(true);
    setOpenMenuId(null); // Cerrar menú de acciones si está abierto
  };

  // ... (resto de funciones de renderizado no cambian)
  const renderFeatures = room => {
    const features = [];

    if (room.isAccessible) {
      features.push(
        <div key="accessible" className="flex items-center text-green-700">
          <FaWheelchair className="mr-2" /> Accesible
        </div>
      );
    }
    if (room.hasInternet) {
      features.push(
        <div key="internet" className="flex items-center text-blue-700">
          <FaWifi className="mr-2" /> Internet
        </div>
      );
    }
    if (room.hasBathrooms) {
      features.push(
        <div key="bathrooms" className="flex items-center text-purple-700">
          <FaToilet className="mr-2" /> Baños
        </div>
      );
    }
    if (room.hasAudioEquipment) {
      features.push(
        <div key="audio" className="flex items-center text-yellow-700">
          <FaMicrophoneAlt className="mr-2" /> Audio
        </div>
      );
    }
    if (room.hasVideoEquipment) {
      features.push(
        <div key="video" className="flex items-center text-red-700">
          <FaVideo className="mr-2" /> Video
        </div>
      );
    }
    if (room.canExonerate) {
      features.push(
        <div key="exonerate" className="flex items-center text-green-700">
          <FaMoneyBillWave className="mr-2" /> Exonerable
        </div>
      );
    }

    return features;
  };

  const renderPaymentMethods = room => {
    const methods = [];

    if (room.acceptsTransfer) {
      methods.push(
        <div key="transfer" className="flex items-center text-blue-700">
          <FaExchangeAlt className="mr-2" /> Transferencia
        </div>
      );
    }
    if (room.acceptsMaterials) {
      methods.push(
        <div key="materials" className="flex items-center text-orange-700">
          <FaBox className="mr-2" /> Materiales
        </div>
      );
    }

    return methods;
  };

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
              onClick={() => handleOpenUpdateModal(room)}
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

  const getDependencyName = room => {
    if (!room.dependencies || room.dependencies.length === 0) {
      return 'Sin dependencia';
    }
    return room.dependencies[0].name;
  };

  const formatCost = cost => {
    if (!cost || cost === '0') return 'Gratuito';
    return `$${cost}`;
  };

  if (loading && !lastFetched) {
    return (
      <div>
        <Header />
        <div className="container mx-auto my-8 flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Cargando salas...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      <Header />
      <div className="container mx-auto my-8 px-4">
        {/* ... (el resto del JSX no cambia, pero ahora onRoomCreated/Updated solo cierra el modal) ... */}
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

        <div className="flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
          <div className="w-full lg:w-auto">
            <SearchBar
              placeholder="Buscar Espacio..."
              onSearch={handleSearch}
            />
          </div>
          <div className="w-full lg:w-auto flex gap-3">
            {isAdminOrCoordinator && (
              <button
                onClick={() => setShowManageDepsModal(true)}
                className="flex-1 lg:flex-none bg-gray-800 hover:bg-gray-900 text-white px-4 py-3 rounded-lg flex items-center justify-center transition duration-200"
              >
                <FaUsers className="mr-2" size={14} />
                <span className="text-sm">Dependencias</span>
              </button>
            )}

            <button
              onClick={() => setShowCreateRoomModal(true)}
              className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transition duration-200 shadow-md hover:shadow-lg"
            >
              <FaPlus className="mr-2" /> Añadir Espacio
            </button>
          </div>
        </div>

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

        <div className="hidden lg:block overflow-x-auto shadow-xl rounded-lg">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-blue-100">
                <th className="py-3 px-4 border-b text-left">Nombre</th>
                <th className="py-3 px-4 border-b text-center">Imagen</th>
                <th className="py-3 px-4 border-b text-center">Datos</th>
                <th className="py-3 px-4 border-b text-center">Capacidad</th>
                <th className="py-3 px-4 border-b text-center">Costo</th>
                <th className="py-3 px-4 border-b text-center">Dependencia</th>
                <th className="py-3 px-4 border-b text-center">Encargado</th>
                <th className="py-3 px-4 border-b text-center">Opciones</th>
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

                    <td className="py-3 px-4 border-b text-center">
                      <button
                        onClick={() => handleShowData(room)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Ver datos completos"
                      >
                        <IoInformationCircleOutline size={22} />
                      </button>
                    </td>

                    <td className="py-3 px-4 border-b text-center">
                      {room.capacity}
                    </td>

                    <td className="py-3 px-4 border-b text-center">
                      <div className="flex items-center justify-center">
                        <FaDollarSign
                          className="mr-1 text-green-600"
                          size={14}
                        />
                        <span className="font-medium text-gray-800">
                          {formatCost(room.cost)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 border-b text-center">
                      <div className="flex items-center justify-center">
                        <span className="text-sm text-gray-700">
                          {getDependencyName(room)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 border-b text-center">
                      {room.staffowner}
                    </td>

                    <td className="py-3 px-4 border-b text-center">
                      <ActionMenu room={room} index={index} />
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
              <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                <td colSpan="8" className="py-8 px-4 text-center">
                  <div className="flex justify-center items-center">
                    <button
                      onClick={() => navigate('/rooms')}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-lg"
                    >
                      Ver espacios
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="lg:hidden space-y-4">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room, index) => (
              <div
                key={room.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-4 relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-2">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">
                      {room.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <FaBuilding className="mr-2 text-purple-500" size={14} />
                      <span>{getDependencyName(room)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaUser className="mr-2 text-blue-500" size={14} />
                      <span>{room.staffowner}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center text-green-600 font-semibold">
                      <FaDollarSign className="mr-1" size={14} />
                      <span>{formatCost(room.cost)}</span>
                    </div>

                    <ActionMenu room={room} index={index} />
                  </div>
                </div>

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

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUsers className="mr-2 text-green-500" size={14} />
                    <span>Capacidad: {room.capacity}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaMapPin className="mr-2 text-red-500" size={14} />
                    <span>Ubicación: {room.location}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <button
                    onClick={() => handleShowData(room)}
                    className="w-full flex flex-col items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-1 rounded text-xs transition-colors"
                  >
                    <FaInfoCircle className="mb-1" size={14} />
                    <span>Ver Datos</span>
                  </button>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenUpdateModal(room)}
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

        {filteredRooms.length > 0 && (
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
        )}
      </div>
      <Footer />

      {showDataModal && selectedRoomData && (
        <RenderModal onClose={handleCloseDataModal}>
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">
              Datos del Espacio: {selectedRoomData.name}
            </h2>
          </div>
          <div className="flex-1 p-5 overflow-y-auto max-h-[70vh]">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Descripción:</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedRoomData.description ||
                      'No hay descripción disponible.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Ubicación:</h3>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      {selectedRoomData.location}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">CUC:</h3>
                  <div
                    className={`rounded-lg p-3 ${selectedRoomData.isInCUC ? 'bg-green-50' : 'bg-red-50'}`}
                  >
                    <p
                      className={`text-sm font-medium ${selectedRoomData.isInCUC ? 'text-green-700' : 'text-red-700'}`}
                    >
                      {selectedRoomData.isInCUC
                        ? 'Sí, ubicado en la Ciudad Universitaria de Caracas'
                        : 'No ubicado en CUC'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Costo:</h3>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <FaDollarSign className="mr-2 text-green-600" />
                    <span className="text-lg font-semibold text-gray-800">
                      {formatCost(selectedRoomData.cost)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  Características:
                </h3>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {renderFeatures(selectedRoomData).length > 0 ? (
                      renderFeatures(selectedRoomData)
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No hay características especiales
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  Métodos de Pago Aceptados:
                </h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {renderPaymentMethods(selectedRoomData).length > 0 ? (
                      renderPaymentMethods(selectedRoomData)
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No se han especificado métodos de pago
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  Información Adicional:
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Capacidad:</p>
                      <p className="font-medium">
                        {selectedRoomData.capacity} personas
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dependencia:</p>
                      <p className="font-medium">
                        {getDependencyName(selectedRoomData)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Encargado:</p>
                      <p className="font-medium">
                        {selectedRoomData.staffowner}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-5 border-t border-gray-200">
            <button
              onClick={handleCloseDataModal}
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

      {showManageDepsModal && (
        <ManageDependenciesModal
          isOpen={showManageDepsModal}
          onClose={() => {
            setShowManageDepsModal(false);
          }}
        />
      )}

      {showCreateRoomModal && (
        <CreateRoomModal
          isOpen={showCreateRoomModal}
          onClose={() => setShowCreateRoomModal(false)}
          onRoomCreated={handleRoomCreated}
        />
      )}

      {showUpdateRoomModal && selectedRoom && (
        <UpdateRoomModal
          isOpen={showUpdateRoomModal}
          onClose={() => {
            setShowUpdateRoomModal(false);
            setSelectedRoom(null);
          }}
          room={selectedRoom}
          onRoomUpdated={() => {
            handleRoomUpdated();
          }}
        />
      )}
    </div>
  );
};

export default AdminRoomsPage;
