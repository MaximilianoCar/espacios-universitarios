// src/pages/EventDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useSelector } from 'react-redux'; // Para obtener el rol del usuario desde Redux
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import UpdateEventForm from '../components/UpdateEventForm';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  // Obtener el rol del usuario desde Redux
  const { role } = useSelector(state => state.auth);

  useEffect(() => {
    axiosInstance
      .get(`/events/${id}`)
      .then(response => {
        setEvent(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching event:', error);
        setLoading(false);
      });
  }, [id]);

  const handleUpdateClick = () => {
    setShowUpdateForm(true);
  };

  const handleEventUpdated = updatedEvent => {
    setEvent(updatedEvent);
    setShowUpdateForm(false);
  };

  const handleDeleteEvent = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      axiosInstance
        .delete(`/events/${event.id}`)
        .then(() => {
          // Redirigir a la lista de eventos u otra página apropiada
          navigate('/events');
        })
        .catch(error => {
          console.error('Error deleting event:', error);
          alert('Error al eliminar el evento. Por favor, intente nuevamente.');
        });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
        <Header />
        <div className="container mx-auto my-8">
          <p>Cargando evento...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div>
        <Header />
        <div className="container mx-auto my-8">
          <p>Evento no encontrado.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_auto_1fr_auto]">
      <Header />
      <HeroSection title={event.name} backgroundImage={event.imagePath} />
      <div className="container mx-auto my-8 px-4">
        {showUpdateForm ? (
          <UpdateEventForm event={event} onEventUpdated={handleEventUpdated} />
        ) : (
          <>
            {/* Sección de Detalles del Evento */}
            <div className="flex flex-col md:flex-row mb-8">
              {/* Contenedor de la Imagen del Evento */}
              <div className="w-full md:w-1/2 h-64 overflow-hidden rounded">
                <img
                  src={
                    event.imagePath
                      ? `http://localhost:3000/${event.imagePath}`
                      : 'https://via.placeholder.com/600x400'
                  }
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Detalles del Evento */}
              <div className="w-full md:w-1/2 md:pl-8 mt-4 md:mt-0">
                <h2 className="text-3xl font-bold mb-4">{event.name}</h2>
                <p className="mb-4">{event.description}</p>
                <ul className="mb-4 space-y-2">
                  <li>
                    <strong>Capacidad:</strong> {event.capacity}
                  </li>
                  <li>
                    <strong>Costo:</strong> {event.cost}
                  </li>
                  <li>
                    <strong>Contacto:</strong> {event.contact}
                  </li>
                  <li>
                    <strong>Inicio del Evento:</strong>{' '}
                    {new Date(event.eventFrom).toLocaleString()}
                  </li>
                  <li>
                    <strong>Fin del Evento:</strong>{' '}
                    {new Date(event.eventTo).toLocaleString()}
                  </li>
                </ul>
              </div>
            </div>

            {/* Sección de Sala Asociada */}
            {event.room && (
              <div className="flex flex-col md:flex-row mb-8">
                {/* Contenedor de la Imagen de la Sala */}
                <div className="w-full md:w-1/3 h-32 overflow-hidden rounded mb-4 md:mb-0">
                  <img
                    src={
                      event.room.imagePath
                        ? `${process.env.REACT_APP_BACKEND_URL}/${event.room.imagePath}`
                        : 'https://via.placeholder.com/150x100'
                    }
                    alt={event.room.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Detalles de la Sala */}
                <div className="w-full md:w-2/3 md:pl-6">
                  <h3 className="text-2xl font-semibold mb-2">
                    {event.room.name}
                  </h3>
                  <p className="text-gray-600 mb-2">{event.room.description}</p>
                  <p className="text-gray-600">
                    <strong>Capacidad:</strong> {event.room.capacity}
                  </p>
                  <p className="text-gray-600">
                    <strong>Costo:</strong> {event.room.cost}
                  </p>
                  <p className="text-gray-600">
                    <strong>Contacto:</strong> {event.room.contact}
                  </p>
                  <Link
                    to={`/rooms/${event.room.id}`}
                    className="text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Ver Detalles de la Sala
                  </Link>
                </div>
              </div>
            )}

            {/* Botones de Acción (Actualizar y Eliminar) */}
            {role === 'admin' && (
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={handleUpdateClick}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                >
                  Actualizar Evento
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Eliminar Evento
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default EventDetailsPage;
