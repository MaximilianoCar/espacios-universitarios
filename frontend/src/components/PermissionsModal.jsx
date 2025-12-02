// src/components/PermissionsModal.js

import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from 'sweetalert2';

const PermissionsModal = ({ user, onClose }) => {
  const [allRooms, setAllRooms] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]); // IDs de las salas marcadas
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // función para cargar las salas y los permisos actuales
    const fetchPermissionsData = async () => {
      setLoading(true);
      try {
        const roomsResponse = await axiosInstance.get('/rooms');
        setAllRooms(roomsResponse.data);

        // obtener los permisos (managedRooms)
        const userPermissionsResponse = await axiosInstance.get(
          `/users/${user.id}/permissions`
        );

        // Mapear los IDs de las salas que el usuario ya administra
        const currentRoomIds = userPermissionsResponse.data.managedRooms
          ? userPermissionsResponse.data.managedRooms.map(room => room.id)
          : [];

        setSelectedRoomIds(currentRoomIds);
      } catch (err) {
        console.error('Error fetching permissions data:', err);
        setError('Error al cargar la lista de salas o los permisos actuales.');

        // Mostrar error con SweetAlert2
        Swal.fire({
          title: 'Error',
          text: 'Error al cargar la lista de salas o los permisos actuales.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissionsData();
  }, [user.id]);

  const handleCheckboxChange = roomId => {
    setSelectedRoomIds(prevIds => {
      if (prevIds.includes(roomId)) {
        return prevIds.filter(id => id !== roomId);
      } else {
        return [...prevIds, roomId];
      }
    });
  };

  const handleSavePermissions = async () => {
    // Confirmar antes de guardar
    const confirmResult = await Swal.fire({
      title: '¿Actualizar permisos?',
      text: `¿Estás seguro de que deseas guardar los cambios en los permisos de ${user.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmResult.isConfirmed) return;

    setIsSaving(true);
    setError('');

    // Mostrar loading
    Swal.fire({
      title: 'Guardando permisos...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await axiosInstance.put(`/users/${user.id}/permissions`, {
        roomIds: selectedRoomIds,
      });

      // Cerrar loading y mostrar éxito
      Swal.close();
      await Swal.fire({
        title: '¡Éxito!',
        text: `Permisos actualizados para ${user.name} con éxito.`,
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });

      onClose();
    } catch (err) {
      console.error('Error saving permissions:', err);

      // Cerrar loading y mostrar error
      Swal.close();
      Swal.fire({
        title: 'Error',
        text: 'Error al guardar los permisos. Verifique la conexión.',
        icon: 'error',
        confirmButtonColor: '#d33',
      });

      setError('Error al guardar los permisos. Verifique la conexión.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
        <h3 className="text-xl font-bold mb-4">
          Gestión de Permisos para {user.name}
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Asigna permisos de control total sobre los siguientes espacios al
          coordinador.
        </p>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {loading ? (
          <p>Cargando salas y permisos...</p>
        ) : (
          <div className="max-h-60 overflow-y-auto border p-3 rounded mb-4">
            {allRooms.length > 0 ? (
              allRooms.map(room => (
                <div
                  key={room.id}
                  className="flex items-center justify-between py-1 border-b last:border-b-0"
                >
                  <span className="text-gray-700">{room.name}</span>
                  <input
                    type="checkbox"
                    checked={selectedRoomIds.includes(room.id)}
                    onChange={() => handleCheckboxChange(room.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">
                No hay salas disponibles para asignar.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSavePermissions}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
            disabled={isSaving || loading}
          >
            {isSaving ? 'Guardando...' : 'Guardar Permisos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsModal;
