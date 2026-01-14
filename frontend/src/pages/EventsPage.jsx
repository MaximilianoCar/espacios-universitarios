// src/pages/EventsPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../axiosConfig';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import HeroSection from '../components/HeroSection';
import backgroundImage from '../assets/ucvfondo.jpg';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaMapPin,
  FaUsers,
  FaCogs,
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import getMediaUrl from '../utils/media';
import ModalCalendar from '../components/ModalCalendar.jsx';
import ModalMobile from '../components/ModalMobile';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
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

  // Detectar tamaño de pantalla para elegir modal (Mobile vs Desktop)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleSearch = searchTerm => {
    if (!searchTerm.trim()) {
      setFilteredEvents(events);
      return;
    }

    const lowerCaseTerm = searchTerm.toLowerCase();
    const filtered = events.filter(
      event =>
        event.name.toLowerCase().includes(lowerCaseTerm) ||
        event.description?.toLowerCase().includes(lowerCaseTerm) ||
        event.room?.name?.toLowerCase().includes(lowerCaseTerm)
    );
    setFilteredEvents(filtered);
  };

  // MODIFICADO: Ahora incluye todos los días entre eventFrom y eventTo
  const eventsByDay = useMemo(() => {
    const map = {};

    events.forEach(ev => {
      if (!ev.eventFrom || !ev.eventTo) return;

      const startDate = new Date(ev.eventFrom);
      const endDate = new Date(ev.eventTo);

      // Asegurarnos de que las fechas sean válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

      // Iterar por todos los días entre eventFrom y eventTo (inclusive)
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDate();
        const key = `${year}-${month}-${day}`;

        if (!map[key]) map[key] = [];

        // Evitar duplicados del mismo evento en el mismo día
        if (!map[key].some(event => event.id === ev.id)) {
          map[key].push(ev);
        }

        // Avanzar al siguiente día
        currentDate.setDate(currentDate.getDate() + 1);

        // Resetear la hora para evitar problemas con cambios de hora
        currentDate.setHours(0, 0, 0, 0);
      }
    });

    return map;
  }, [events]);

  const startOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1);
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  const prevMonth = () => {
    setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDay(null);
  };
  const goToday = () => {
    const t = new Date();
    setCalendarDate(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelectedDay(null);
  };

  const getKey = (y, m, day) => `${y}-${m}-${day}`;

  const openCalendar = () => {
    setShowCalendarModal(true);
    setSelectedDay(null);
  };
  const closeCalendar = () => setShowCalendarModal(false);

  // Función para formatear el rango de fechas del evento
  const formatEventDateRange = event => {
    const start = new Date(event.eventFrom);
    const end = new Date(event.eventTo);

    const startDate = start.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });

    const endDate = end.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return `${startDate} - ${endDate}`;
  };

  // Formatear hora del evento
  const formatEventTime = event => {
    const start = new Date(event.eventFrom);
    const end = new Date(event.eventTo);

    return `${start.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${end.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  // Mobile Calendar Component (sin cambios)
  const MobileCalendar = () => {
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();
    const firstDay = startOfMonth(calendarDate).getDay();
    const total = daysInMonth(y, m);

    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <FaChevronLeft className="text-gray-700 text-lg" />
          </button>

          <div className="text-center flex-1 mx-4">
            <h3 className="text-2xl font-bold text-gray-900 capitalize leading-tight">
              {calendarDate.toLocaleString('es-ES', {
                month: 'long',
              })}
            </h3>
            <p className="text-lg text-gray-600 font-semibold mt-1">
              {calendarDate.getFullYear()}
            </p>
            <button
              onClick={goToday}
              className="text-base text-blue-600 hover:text-blue-800 font-medium mt-2 px-4 py-1 bg-blue-50 rounded-full"
            >
              Ir a hoy
            </button>
          </div>

          <button
            onClick={nextMonth}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <FaChevronRight className="text-gray-700 text-lg" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-3">
          {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(day => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square"></div>
          ))}

          {Array.from({ length: total }).map((_, index) => {
            const day = index + 1;
            const key = getKey(y, m, day);
            const dayEvents = eventsByDay[key] || [];
            const hasEvents = dayEvents.length > 0;
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === m &&
              new Date().getFullYear() === y;
            const isSelected =
              selectedDay &&
              selectedDay.year === y &&
              selectedDay.month === m &&
              selectedDay.day === day;

            return (
              <button
                key={key}
                onClick={() => setSelectedDay({ year: y, month: m, day })}
                className={`
                  aspect-square rounded-full text-base flex items-center justify-center relative
                  transition-all duration-200
                  ${isToday ? 'bg-blue-500 text-white font-bold shadow-md' : ''}
                  ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300 ring-offset-2'
                      : ''
                  }
                  ${
                    !isToday && !isSelected
                      ? 'hover:bg-gray-100 text-gray-800'
                      : ''
                  }
                  ${
                    !isToday && !isSelected && !hasEvents ? 'text-gray-600' : ''
                  }
                `}
              >
                {day}
                {hasEvents && !isSelected && !isToday && (
                  <div className="absolute bottom-2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                )}
                {hasEvents && (isSelected || isToday) && (
                  <div className="absolute bottom-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <div className="mt-6 border-t pt-4">
            <h4 className="font-bold mb-3 text-xl text-gray-900 text-center">
              {selectedDay.day} de{' '}
              {new Date(selectedDay.year, selectedDay.month).toLocaleString(
                'es-ES',
                {
                  month: 'long',
                }
              )}{' '}
              de {selectedDay.year}
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {(() => {
                const key = getKey(
                  selectedDay.year,
                  selectedDay.month,
                  selectedDay.day
                );
                const dayEvents = eventsByDay[key] || [];

                return dayEvents.length > 0 ? (
                  dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="font-semibold text-gray-900 text-lg mb-2">
                        {ev.name}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {formatEventDateRange(ev)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatEventTime(ev)}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Link
                          to={`/events/${ev.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
                          onClick={closeCalendar}
                        >
                          Ver Detalles
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-6 text-lg">
                    No hay eventos programados
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto my-8 flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Cargando eventos...</p>
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
        title="Eventos"
        subtitle="Descubre los próximos eventos"
        backgroundImage={backgroundImage}
      />
      <div className="container mx-auto my-8 px-4">
        <div className="flex justify-between items-start mb-6 flex-wrap">
          <div className="flex items-center flex-wrap">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-800 hover:text-gray-600 transition-colors mr-4 mb-3 lg:mb-0"
              title="Volver al inicio"
            >
              <FaArrowLeft size={24} />
            </button>
            <div className="min-w-[250px]">
              <SearchBar
                placeholder="Buscar eventos por nombre, descripción o espacio..."
                onSearch={handleSearch}
              />
            </div>
          </div>

          <button
            onClick={openCalendar}
            className="mt-3 lg:mt-0 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <FaCalendarAlt />
            <span className="text-sm">Calendario</span>
          </button>
        </div>

        {filteredEvents.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Mostrando {filteredEvents.length} de {events.length} eventos
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <div
                key={event.id}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={
                      event.imagePath
                        ? getMediaUrl(event.imagePath)
                        : 'https://via.placeholder.com/600x400?text=Sin+Imagen'
                    }
                    alt={event.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <div className="mb-2">
                    <h2 className="text-lg font-bold text-gray-800 truncate">
                      {event.name}
                    </h2>

                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <FaCalendarAlt className="mr-1 text-gray-500" size={12} />
                      <span>{formatEventDateRange(event)}</span>
                    </div>

                    {event.room && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <FaMapPin className="mr-1 text-blue-500" size={12} />
                        <span className="truncate">{event.room.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <Link
                      to={`/events/${event.id}`}
                      className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FaCogs className="text-4xl text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                No se encontraron eventos
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {events.length === 0
                  ? 'No hay eventos disponibles en este momento.'
                  : 'No hay resultados que coincidan con tu búsqueda.'}
              </p>
            </div>
          )}
        </div>

        <div className="hidden lg:block mt-6">
          <div className="border-2 border-blue-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="border-b-2 border-blue-100 bg-white px-6 py-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <FaCalendarAlt className="text-blue-600 text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-blue-800 mb-2">
                  Calendario de Eventos
                </h3>
                <p className="text-blue-600">
                  Consulta los eventos aprobados por fecha y navega por el mes.
                </p>
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                Explora los eventos por fecha
              </h2>
              <p className="text-gray-600 mb-4">
                Utiliza nuestro calendario interactivo para ver los días con
                eventos y acceder rápidamente a los detalles de cada evento
                programado.
              </p>
              <button
                onClick={openCalendar}
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors text-base font-medium shadow-sm hover:shadow-md"
              >
                <FaCalendarAlt className="mr-2" />
                Abrir Calendario
              </button>
            </div>
          </div>
        </div>

        {/* MODAL DEL CALENDARIO (sin cambios) */}
        {showCalendarModal &&
          (isMobile ? (
            <ModalMobile onClose={closeCalendar} title="Calendario de Eventos">
              <button
                onClick={closeCalendar}
                className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes size={20} />
              </button>
              <MobileCalendar />
            </ModalMobile>
          ) : (
            <ModalCalendar onClose={closeCalendar}>
              <button
                onClick={closeCalendar}
                className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes size={20} />
              </button>

              <div className="max-w-4xl mx-auto pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      Calendario de Eventos
                    </h3>
                    <p className="text-sm text-gray-600">
                      Mes:{' '}
                      {calendarDate.toLocaleString('es-ES', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={prevMonth}
                      className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 flex items-center justify-center transition-all duration-200 hover:border-blue-300"
                      title="Mes anterior"
                    >
                      <FaChevronLeft
                        className="text-blue-600 hover:text-blue-600"
                        size={16}
                      />
                    </button>

                    <button
                      onClick={goToday}
                      className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors duration-200 border border-transparent hover:border-gray-300"
                    >
                      Hoy
                    </button>

                    <button
                      onClick={nextMonth}
                      className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 flex items-center justify-center transition-all duration-200 hover:border-blue-300"
                      title="Mes siguiente"
                    >
                      <FaChevronRight
                        className="text-blue-600 hover:text-blue-600"
                        size={16}
                      />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(h => (
                    <div
                      key={h}
                      className="text-sm font-medium text-gray-600 py-2"
                    >
                      {h}
                    </div>
                  ))}
                  {(() => {
                    const y = calendarDate.getFullYear();
                    const m = calendarDate.getMonth();
                    const firstDay = startOfMonth(calendarDate).getDay();
                    const total = daysInMonth(y, m);
                    const cells = [];
                    for (let i = 0; i < firstDay; i++)
                      cells.push(<div key={`b-${i}`} className="py-4"></div>);
                    for (let d = 1; d <= total; d++) {
                      const key = getKey(y, m, d);
                      const dayEvents = eventsByDay[key] || [];
                      const hasEvents = dayEvents.length > 0;
                      const isToday =
                        new Date().getDate() === d &&
                        new Date().getMonth() === m &&
                        new Date().getFullYear() === y;
                      const isSelected =
                        selectedDay &&
                        selectedDay.year === y &&
                        selectedDay.month === m &&
                        selectedDay.day === d;
                      cells.push(
                        <div
                          key={key}
                          className={`
                      p-1 h-16 border rounded cursor-pointer flex flex-col justify-between transition-all duration-150
                      ${hasEvents ? 'bg-blue-50 border-blue-200' : 'bg-white'}
                      ${isToday ? 'bg-blue-100 border-blue-300 shadow-sm' : ''}
                      ${
                        isSelected
                          ? 'ring-2 ring-blue-500 bg-blue-100 shadow-md transform scale-105'
                          : ''
                      }
                      hover:bg-gray-50 hover:shadow-sm hover:border-gray-300
                    `}
                          onClick={() =>
                            setSelectedDay({ year: y, month: m, day: d })
                          }
                        >
                          <div className="flex justify-between items-start">
                            <div
                              className={`text-xs font-medium ${
                                isToday
                                  ? 'text-blue-800 font-bold'
                                  : 'text-gray-700'
                              } ${isSelected ? 'text-blue-900 font-bold' : ''}`}
                            >
                              {d}
                            </div>
                            {hasEvents && (
                              <div
                                className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-0.5"
                                title={`${dayEvents.length} eventos`}
                              ></div>
                            )}
                          </div>
                          <div className="flex justify-center">
                            {hasEvents && (
                              <span className="text-xs text-blue-600 font-medium">
                                {dayEvents.length}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
                <div className="mt-6">
                  {selectedDay ? (
                    (() => {
                      const key = getKey(
                        selectedDay.year,
                        selectedDay.month,
                        selectedDay.day
                      );
                      const dayEvents = eventsByDay[key] || [];
                      return (
                        <div>
                          <h4 className="font-semibold mb-3 text-lg">
                            Eventos el {selectedDay.day}/{selectedDay.month + 1}
                            /{selectedDay.year}
                          </h4>
                          {dayEvents.length > 0 ? (
                            <div className="grid gap-3 max-h-60 overflow-y-auto">
                              {dayEvents.map(ev => (
                                <div
                                  key={ev.id}
                                  className="p-3 border rounded-lg bg-gray-50"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900 mb-1">
                                        {ev.name}
                                      </div>
                                      <div className="text-sm text-gray-600 mb-1">
                                        {formatEventDateRange(ev)}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {new Date(
                                          ev.eventFrom
                                        ).toLocaleTimeString('es-ES', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}{' '}
                                        -{' '}
                                        {new Date(
                                          ev.eventTo
                                        ).toLocaleTimeString('es-ES', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </div>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                      <Link
                                        to={`/events/${ev.id}`}
                                        className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-500 whitespace-nowrap"
                                      >
                                        Ver Detalles
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 py-6 border rounded-lg">
                              No hay eventos programados para este día.
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center text-gray-500 py-6 border rounded-lg">
                      Selecciona un día para ver los eventos programados.
                    </div>
                  )}
                </div>
              </div>
            </ModalCalendar>
          ))}
      </div>
      <Footer />
    </div>
  );
};

export default EventsPage;
