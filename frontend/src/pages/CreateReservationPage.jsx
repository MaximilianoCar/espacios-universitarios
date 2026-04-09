// src/pages/CreateReservationPage.jsx
import React from 'react';
import AddEventForm from '../components/AddEventForm';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosInstance from '../axiosConfig';
import { useNavigate } from 'react-router-dom';

const CreateReservationPage = () => {
  const navigate = useNavigate();

  // Función para manejar la creación del evento y la subida de archivos
  const handleEventCreated = async (event, programFile, agreementFile) => {
    //console.log('Evento creado:', event);

    // Solo sube archivos si hay archivos seleccionados
    if (programFile || agreementFile) {
      const formData = new FormData();
      if (programFile) formData.append('programPath', programFile);
      if (agreementFile) formData.append('agreementPath', agreementFile);

      try {
        const response = await axiosInstance.post(
          `/events/${event.id}/upload-files`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        //console.log('Archivos subidos:', response.data);
      } catch (error) {
        console.error('Error al subir archivos:', error);
      }
    }

    // Redirigir al usuario a la página de inicio después de crear el evento
    navigate('/');
  };

  return (
    <div className="min-h-screen grid grid-rows-[auto_auto_1fr_auto]">
      <Header />
      <div className="container mx-auto my-8 px-4">
        <AddEventForm onEventCreated={handleEventCreated} />
      </div>
      <Footer />
    </div>
  );
};

export default CreateReservationPage;
