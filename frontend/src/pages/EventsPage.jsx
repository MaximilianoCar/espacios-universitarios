// src/pages/EventsPage.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { Link } from 'react-router-dom';
//import { useSelector } from 'react-redux'; // Para obtener el rol del usuario desde Redux
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import HeroSection from '../components/HeroSection';
import backgroundImage from '../assets/ucvfondo.jpg';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  // Obtener eventos de la API y filtrar solo los eventos aprobados
  useEffect(() => {
    axiosInstance
      .get('/events')
      .then(response => {
        const approvedEvents = response.data;
        console.log('Approved Events:', approvedEvents);
        setEvents(approvedEvents);
        setFilteredEvents(approvedEvents);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching events:', error);
        setLoading(false);
      });
  }, []);

  const handleSearch = searchTerm => {
    const filtered = events.filter(event =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvents(filtered);
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto my-8">
          <p>Cargando eventos...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_auto_1fr_auto]">
      <Header />
      <HeroSection
        title="Eventos"
        subtitle="Descubre los próximos eventos"
        backgroundImage={backgroundImage}
      />
      <div className="container mx-auto my-8 px-4">
        <div className="flex items-center mb-6 flex-wrap">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-800 hover:text-gray-600 transition-colors mr-4 mt-3"
            title="Volver al inicio"
          >
            <FaArrowLeft size={24} />
          </button>
          <div>
            <SearchBar
              placeholder="Buscar eventos..."
              onSearch={handleSearch}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <div
                key={event.id}
                className="border rounded-lg overflow-hidden bg-white shadow-md"
              >
                <img
                  src={
                    event.imagePath
                      ? `http://localhost:3000/${event.imagePath}`
                      : 'https://via.placeholder.com/600x400'
                  }
                  alt={event.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-xl font-bold">{event.name}</h2>
                  <p className="mt-2 text-gray-600">{event.description}</p>
                  <Link
                    to={`/events/${event.id}`}
                    className="mt-4 inline-block bg-blue-600 text-white hover:bg-blue-500 px-4 py-2 rounded"
                  >
                    Ver Detalles
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">
              No se encontraron eventos.
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventsPage;
