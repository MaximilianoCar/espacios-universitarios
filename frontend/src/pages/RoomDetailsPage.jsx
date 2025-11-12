import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useSelector } from 'react-redux';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UpdateRoomForm from '../components/UpdateRoomForm';
import Modal from '../components/Modal';
import Swal from 'sweetalert2';
import getMediaUrl from '../utils/media';

const RoomDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  // Obtener el rol del usuario desde Redux
  const { role } = useSelector(state => state.auth);

  useEffect(() => {
    axiosInstance
      .get(`/rooms/${id}`)
      .then(response => {
        setRoom(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching room:', error);
        setLoading(false);
      });
  }, [id]);

  const handleUpdateClick = () => {
    setShowUpdateForm(true);
  };

  const handleCloseModal = () => {
    setShowUpdateForm(false);
  };

  const handleRoomUpdated = updatedRoom => {
    setRoom(updatedRoom);
    setShowUpdateForm(false);
  };

  const handleDeleteRoom = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará permanentemente la sala "${room.name}". Esta acción no se puede deshacer.`,
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
        text: `Por favor espere mientras se elimina la sala "${room.name}"`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        await axiosInstance.delete(`/rooms/${room.id}`);

        Swal.fire(
          '¡Eliminada!',
          `La sala "${room.name}" ha sido eliminada exitosamente.`,
          'success'
        ).then(() => {
          navigate('/rooms');
        });
      } catch (error) {
        console.error('Error deleting room:', error);
        Swal.fire(
          'Error',
          'Error al eliminar la sala. Por favor, intente nuevamente.',
          'error'
        );
      }
    }
  };

  if (loading) {
    return (
      <div>
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
      <div>
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
      <div className="container mx-auto my-8 px-4">
        {!showUpdateForm && (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2">
              <img
                src={
                  room.imagePath
                    ? getMediaUrl(room.imagePath)
                    : 'https://via.placeholder.com/600x400'
                }
                alt={room.name}
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
            <div className="md:w-1/2 flex flex-col justify-around">
              <h2 className="text-3xl font-bold mb-4 text-gray-800">
                {room.name}
              </h2>
              <p className="mb-6 text-gray-600 text-lg">{room.description}</p>
              <ul className="mb-6 space-y-3">
                <li className="flex items-center">
                  <strong className="text-gray-700 w-48">Capacidad:</strong>
                  <span className="text-gray-600">
                    {room.capacity} personas
                  </span>
                </li>
                <li className="flex items-center">
                  <strong className="text-gray-700 w-48">Ubicación:</strong>
                  <span className="text-gray-600">{room.location}</span>
                </li>
                <li className="flex items-center">
                  <strong className="text-gray-700 w-48">
                    Ciudad Universitaria de Caracas:
                  </strong>
                  <span className="text-gray-600">
                    {room.isInCUC ? 'Sí' : 'No'}
                  </span>
                </li>
                <li className="flex items-center">
                  <strong className="text-gray-700 w-48">Encargado:</strong>
                  <span className="text-gray-600">{room.staffowner}</span>
                </li>
              </ul>
              {/* Mostrar los botones de "Actualizar" y "Eliminar" solo si el usuario es administrador */}
              {role === 'admin' && (
                <div className="flex space-x-4">
                  <button
                    onClick={handleUpdateClick}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
                  >
                    Actualizar Sala
                  </button>
                  <button
                    onClick={handleDeleteRoom}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
                  >
                    Eliminar Sala
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />

      {/* Modal para actualizar sala */}
      {showUpdateForm && (
        <Modal onClose={handleCloseModal}>
          <UpdateRoomForm
            room={room}
            onRoomSaved={handleRoomUpdated}
            onClose={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default RoomDetailsPage;
