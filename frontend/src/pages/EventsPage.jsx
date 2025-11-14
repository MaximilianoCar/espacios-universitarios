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
    const filtered = events.filter(event =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvents(filtered);
  };

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      if (!ev.eventFrom) return;
      const d = new Date(ev.eventFrom);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
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

  // Mobile Calendar Component
  const MobileCalendar = () => {
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();
    const firstDay = startOfMonth(calendarDate).getDay();
    const total = daysInMonth(y, m);

    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        {/* Header del calendario móvil - Título mejorado */}
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

        {/* Días de la semana */}
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

        {/* Días del mes */}
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

        {/* Eventos del día seleccionado */}
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
                      className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm flex justify-between items-center hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-lg">
                          {ev.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(ev.eventFrom).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <Link
                        to={`/events/${ev.id}`}
                        className="ml-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-blue-500 transition-colors"
                        onClick={closeCalendar}
                      >
                        Ver
                      </Link>
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
          <div className="flex-1 min-w-[200px]">
            <SearchBar
              placeholder="Buscar eventos..."
              onSearch={handleSearch}
            />
          </div>

          {/* movil */}
          <button
            onClick={openCalendar}
            className="lg:hidden mt-3 ml-auto flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-500 px-4 py-2 rounded"
          >
            <FaCalendarAlt />
            <span>Calendario</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* desktop */}
          <div className="hidden lg:block border rounded-lg overflow-hidden bg-white shadow-md flex flex-col hover:shadow-lg transition">
            <div className="w-full h-48 bg-gradient-to-r from-blue-200 to-blue-300 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-bold text-blue-800">Calendario</h3>
                <p className="text-sm text-blue-700 mt-2">
                  Consulta los eventos aprobados por fecha y navega por el mes.
                </p>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <h2 className="text-xl font-bold">Abrir calendario</h2>
              <p className="text-sm text-gray-600 mb-4">
                Para ver los días con eventos y acceder a los detalles.
              </p>
              <div>
                <button
                  onClick={openCalendar}
                  className="mt-4 inline-block bg-blue-600 text-white hover:bg-blue-500 px-4 py-2 rounded"
                >
                  Ver Calendario
                </button>
              </div>
            </div>
          </div>

          {/* Cards de eventos */}
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <div
                key={event.id}
                className="border rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow"
              >
                <img
                  src={
                    event.imagePath
                      ? getMediaUrl(event.imagePath)
                      : 'https://via.placeholder.com/600x400'
                  }
                  alt={event.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-xl font-bold">{event.name}</h2>
                  <p className="mt-2 text-gray-600 line-clamp-2">
                    {event.description}
                  </p>
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

        {/* MODAL DEL CALENDARIO: mostrar solo la versión correspondiente al dispositivo */}
        {showCalendarModal &&
          (isMobile ? (
            <ModalMobile onClose={closeCalendar} title="Calendario de Eventos">
              <MobileCalendar />
              <div className="mt-6 flex justify-center">
                <button
                  onClick={closeCalendar}
                  className="px-8 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 text-base font-medium"
                >
                  Cerrar
                </button>
              </div>
            </ModalMobile>
          ) : (
            <ModalCalendar onClose={closeCalendar}>
              <div className="max-w-4xl mx-auto">
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
                      className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      ◀
                    </button>
                    <button
                      onClick={goToday}
                      className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Hoy
                    </button>
                    <button
                      onClick={nextMonth}
                      className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                {/* Calendar grid */}
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
                    // leading blanks
                    for (let i = 0; i < firstDay; i++)
                      cells.push(<div key={`b-${i}`} className="py-6"></div>);
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
                            p-2 h-20 border rounded cursor-pointer flex flex-col justify-between
                            ${hasEvents ? 'bg-blue-50 border-blue-200' : ''}
                            ${isToday ? 'bg-blue-100 border-blue-300' : ''}
                            ${
                              isSelected
                                ? 'ring-2 ring-blue-500 bg-blue-100'
                                : ''
                            }
                            hover:bg-gray-50
                          `}
                          onClick={() =>
                            setSelectedDay({ year: y, month: m, day: d })
                          }
                        >
                          <div className="flex justify-between items-start">
                            <div
                              className={`text-sm font-medium ${
                                isToday ? 'text-blue-800' : ''
                              } ${isSelected ? 'text-blue-900 font-bold' : ''}`}
                            >
                              {d}
                            </div>
                            {hasEvents && (
                              <div
                                className="w-2 h-2 bg-blue-600 rounded-full"
                                title={`${dayEvents.length} eventos`}
                              ></div>
                            )}
                          </div>
                          <div className="flex justify-center">
                            {hasEvents && (
                              <span className="text-xs text-blue-700">
                                {dayEvents.length} evento
                                {dayEvents.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>

                {/* Selected day events list */}
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
                                  className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {ev.name}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {new Date(
                                        ev.eventFrom
                                      ).toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </div>
                                  </div>
                                  <Link
                                    to={`/events/${ev.id}`}
                                    className="ml-4 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-500"
                                  >
                                    Ver Detalles
                                  </Link>
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

                <div className="mt-6 text-right">
                  <button
                    onClick={closeCalendar}
                    className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cerrar
                  </button>
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
