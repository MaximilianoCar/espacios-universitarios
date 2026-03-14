import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../axiosConfig';
import Swal from '../utils/swal';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  UserIcon,
  PhotoIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaSyncAlt,
  FaTimes,
  FaCalendar,
  FaInfoCircle,
  FaFileImage,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  fetchRooms,
  selectRooms,
  selectRoomsLoading,
  selectRoomsLastFetched,
} from '../features/rooms/roomsSlice';

// Componentes auxiliares (ligeramente modificados para coincidir con el estilo del modal)
const InputWithIcon = ({
  icon: Icon,
  type,
  name,
  value,
  onChange,
  placeholder,
  min,
  max,
  error,
}) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
    </div>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      className={`block w-full pl-9 sm:pl-10 pr-3 py-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
    />
  </div>
);

const SelectWithIcon = ({
  icon: Icon,
  name,
  value,
  onChange,
  error,
  children,
}) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
    </div>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`block w-full pl-9 sm:pl-10 pr-3 py-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
    >
      {children}
    </select>
  </div>
);

const ImageUploadArea = ({ imageFile, onFileChange, imagePreview }) => (
  <div>
    {imagePreview && (
      <div className="mb-3">
        <img
          src={imagePreview}
          alt="Previsualización"
          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
        />
      </div>
    )}
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center">
      <PhotoIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
      <div className="mt-2 sm:mt-4">
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700"
        >
          Seleccionar imagen
        </label>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          accept="image/*"
          onChange={onFileChange}
        />
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          PNG, JPG, GIF, WebP hasta 5MB
        </p>
      </div>
      {imageFile && (
        <div className="mt-2 sm:mt-4">
          <p className="text-xs sm:text-sm text-green-600 truncate">
            ✓ {imageFile.name}
          </p>
          <p className="text-xs text-gray-500">
            {(imageFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}
    </div>
  </div>
);

const AddEventForm = ({ onEventCreated }) => {
  const dispatch = useDispatch();

  // Selectores de Redux
  const rooms = useSelector(selectRooms);
  const roomsLoading = useSelector(selectRoomsLoading);
  const roomsLastFetched = useSelector(selectRoomsLastFetched);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    specialRequirements: '',
    capacity: '',
    cost: '',
    contact: '',
    eventFrom: '',
    eventTo: '',
    reservationFrom: '',
    reservationTo: '',
    roomId: '',
    paymentMethod: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [roomsError, setRoomsError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('space');
  const [selectedRoomIsCUC, setSelectedRoomIsCUC] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [roomsFetchAttempted, setRoomsFetchAttempted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Configuración de recurrencia
  const [recurrenceConfig, setRecurrenceConfig] = useState({
    active: false,
    frequency: 'weekly',
    daysOfWeek: [],
    repeatUntil: '',
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Referencias para controlar la generación de horarios
  const previousSchedulesHashRef = useRef('');
  const isFirstGenerationRef = useRef(true);
  const lastChangeWasManualRef = useRef(false);
  const manuallyDeletedDatesRef = useRef(new Set());

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Definición de secciones (orden y metadatos)
  const sectionTabs = [
    { id: 'space', label: 'Espacio', icon: MapPinIcon },
    { id: 'basic', label: 'Información Básica', icon: FaInfoCircle },
    { id: 'dates', label: 'Fechas', icon: FaCalendarAlt },
    { id: 'recurrence', label: 'Recurrencia', icon: FaSyncAlt },
    { id: 'image', label: 'Imagen', icon: FaFileImage },
    { id: 'review', label: 'Revisión', icon: ClipboardDocumentCheckIcon },
  ];

  // Días de la semana para selección
  const weekDays = [
    { id: 0, label: 'Dom', name: 'Domingo' },
    { id: 1, label: 'Lun', name: 'Lunes' },
    { id: 2, label: 'Mar', name: 'Martes' },
    { id: 3, label: 'Mié', name: 'Miércoles' },
    { id: 4, label: 'Jue', name: 'Jueves' },
    { id: 5, label: 'Vie', name: 'Viernes' },
    { id: 6, label: 'Sáb', name: 'Sábado' },
  ];

  // Protocolo CUC - Normas y prohibiciones
  const protocoloCUC = {
    titulo: '¡Atención! Está solicitando un espacio en un Patrimonio Mundial',
    mensaje:
      'Para preservar la CUC, su solicitud está sujeta al Protocolo de Uso. Por favor, lea atentamente las normas principales:',
    permitido: [
      'Actividades académicas de la UCV',
      'Actividades culturales, artísticas y recreativas organizadas por la comunidad ucevista',
      'Uso compartido y respetuoso de los espacios',
    ],
    prohibido: [
      'Consumir o vender alcohol, tabaco o drogas',
      'Portar armas de cualquier tipo',
      'Encender fogatas o usar equipos que generen fuego',
      'Generar ruidos excesivos',
      'Dañar o intervenir el patrimonio (edificios, obras de arte, murales)',
      'Restringir el libre tránsito de las personas',
      'Instalar publicidad masiva (vallas, pendones) sin autorización',
    ],
    requisitos: [
      'Sera necesario que suba la programacion del proyecto detallado de la actividad',
    ],
    compromiso:
      'Al enviar esta solicitud, usted se compromete a cumplir con este protocolo.',
  };

  // Checklist de compromiso
  const checklistCompromiso = [
    'Confirmo que he leído y comprendo el Protocolo para el Uso de los Espacios Abiertos de la CUC',
    'Declaro que mi actividad no interferirá con el normal desenvolvimiento de las actividades académicas',
    'Acepto que está prohibido el consumo o venta de alcohol, tabaco y sustancias ilegales',
    'Me comprometo a no dañar, alterar o intervenir en el patrimonio cultural de la CUC',
    'Entiendo que mi actividad puede requerir un aval de COPRED y me comprometo a gestionarlo si es necesario',
    'Acepto que el incumplimiento de estas normas puede acarrear la suspensión de mi actividad, sanciones y la prohibición de acceso futuro',
  ];

  // Fetch rooms usando Redux con cache (sin cambios)
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setRoomsFetchAttempted(true);
        setRoomsError(null);

        const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
        const shouldShowLoading =
          !roomsLastFetched || Date.now() - roomsLastFetched > CACHE_DURATION;

        if (shouldShowLoading) {
          // Mostrar loading solo si es necesario
        }

        await dispatch(fetchRooms()).unwrap();
      } catch (error) {
        console.error('Error al cargar espacios:', error);

        let errorMessage = 'No se pudieron cargar los espacios disponibles.';

        if (error.response) {
          if (error.response.status === 401) {
            errorMessage =
              'Sesión expirada. Por favor, inicia sesión nuevamente.';
          } else if (error.response.status === 403) {
            errorMessage = 'No tienes permisos para ver los espacios.';
          } else if (error.response.status === 404) {
            errorMessage = 'No se encontraron espacios disponibles.';
          } else if (error.response.status >= 500) {
            errorMessage = 'Error del servidor. Por favor, intenta más tarde.';
          }
        } else if (error.request) {
          errorMessage = 'Error de conexión. Verifica tu internet.';
        }

        setRoomsError(errorMessage);

        Swal.fire({
          title: 'Error al cargar espacios',
          text: errorMessage,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Reintentar',
          showCancelButton: true,
          cancelButtonText: 'Cancelar',
        }).then(result => {
          if (result.isConfirmed) {
            setRoomsFetchAttempted(false);
            dispatch(fetchRooms());
          }
        });
      }
    };

    if (!roomsFetchAttempted || rooms.length === 0) {
      loadRooms();
    }
  }, [dispatch, rooms.length, roomsFetchAttempted, roomsLastFetched]);

  const retryLoadRooms = () => {
    setRoomsFetchAttempted(false);
    setRoomsError(null);
    dispatch(fetchRooms());
  };

  // Funciones de generación de horarios (sin cambios)
  const generateSchedulesHash = schedulesArray => {
    if (!schedulesArray || schedulesArray.length === 0) return 'empty';
    const hashString = schedulesArray
      .map(
        s =>
          `${new Date(s.eventFrom).getTime()}-${new Date(s.eventTo).getTime()}-${s.dayOfWeek || ''}`
      )
      .join('|');
    return hashString;
  };

  const generateRecurringSchedules = useCallback(() => {
    const pad = n => String(n).padStart(2, '0');
    const toLocalInputString = d => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(
        dt.getHours()
      )}:${pad(dt.getMinutes())}`;
    };
    const toLocalDateOnly = d => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    };
    const toLocalTime = d => {
      const dt = new Date(d);
      return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    };

    if (!formData.eventFrom || !formData.eventTo) {
      return [];
    }

    const eventStart = new Date(formData.eventFrom);
    const eventEnd = new Date(formData.eventTo);
    const reservationStart = formData.reservationFrom
      ? new Date(formData.reservationFrom)
      : eventStart;
    const reservationEnd = formData.reservationTo
      ? new Date(formData.reservationTo)
      : eventEnd;

    const repeatUntil = recurrenceConfig.repeatUntil
      ? new Date(recurrenceConfig.repeatUntil)
      : reservationEnd;

    const eventDuration = eventEnd.getTime() - eventStart.getTime();

    if (!recurrenceConfig.active || recurrenceConfig.daysOfWeek.length === 0) {
      return [
        {
          eventFrom: formData.eventFrom,
          eventTo: formData.eventTo,
          reservationFrom: formData.reservationFrom || formData.eventFrom,
          reservationTo: formData.reservationTo || formData.eventTo,
          dateOnly: toLocalDateOnly(eventStart),
          startTime: toLocalTime(eventStart),
          endTime: toLocalTime(eventEnd),
        },
      ];
    }

    const generatedSchedules = [];

    recurrenceConfig.daysOfWeek.forEach(dayOfWeek => {
      let currentDate = new Date(reservationStart);
      while (currentDate.getDay() !== dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      while (currentDate <= repeatUntil) {
        const scheduleStart = new Date(currentDate);
        scheduleStart.setHours(
          eventStart.getHours(),
          eventStart.getMinutes(),
          eventStart.getSeconds()
        );

        const scheduleEnd = new Date(scheduleStart.getTime() + eventDuration);

        generatedSchedules.push({
          eventFrom: toLocalInputString(scheduleStart),
          eventTo: toLocalInputString(scheduleEnd),
          reservationFrom: toLocalInputString(scheduleStart),
          reservationTo: toLocalInputString(scheduleEnd),
          dateOnly: toLocalDateOnly(scheduleStart),
          startTime: toLocalTime(scheduleStart),
          endTime: toLocalTime(scheduleEnd),
          dayOfWeek: dayOfWeek,
        });

        switch (recurrenceConfig.frequency) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            const next = new Date(currentDate);
            next.setMonth(next.getMonth() + 1);
            const desiredDay = currentDate.getDate();
            const temp = new Date(next.getFullYear(), next.getMonth() + 1, 0);
            if (desiredDay > temp.getDate()) {
              next.setDate(temp.getDate());
            } else {
              next.setDate(desiredDay);
            }
            currentDate = next;
            while (currentDate.getDay() !== dayOfWeek) {
              currentDate.setDate(currentDate.getDate() + 1);
            }
            break;
          default:
            currentDate.setDate(currentDate.getDate() + 7);
        }
      }
    });

    const filtered = generatedSchedules.filter(
      gs => !manuallyDeletedDatesRef.current.has(gs.dateOnly)
    );

    return filtered.sort(
      (a, b) => new Date(a.eventFrom) - new Date(b.eventFrom)
    );
  }, [
    formData.eventFrom,
    formData.eventTo,
    formData.reservationFrom,
    formData.reservationTo,
    recurrenceConfig,
  ]);

  useEffect(() => {
    if (recurrenceConfig.active && formData.eventFrom) {
      const day = new Date(formData.eventFrom).getDay();
      setRecurrenceConfig(prev => ({
        ...prev,
        daysOfWeek: [day],
      }));
    }
  }, [formData.eventFrom, recurrenceConfig.active]);

  useEffect(() => {
    if (formData.eventFrom && formData.eventTo) {
      const generatedSchedules = generateRecurringSchedules();

      if (generatedSchedules.length > 50) {
        Swal.fire({
          title: 'Demasiados horarios',
          text: `Se generarían ${generatedSchedules.length} horarios. Por favor, reduce el rango de fechas.`,
          icon: 'warning',
        });
        return;
      }

      const currentHash = generateSchedulesHash(generatedSchedules);
      const previousHash = previousSchedulesHashRef.current;
      previousSchedulesHashRef.current = currentHash;

      if (!isFirstGenerationRef.current && currentHash !== previousHash) {
        const wasJustTimeChange =
          generatedSchedules.length === schedules.length &&
          generatedSchedules.every((newSch, index) => {
            const oldSch = schedules[index];
            if (!oldSch) return false;
            const newDate = new Date(newSch.eventFrom);
            const oldDate = new Date(oldSch.eventFrom);
            return (
              newDate.toDateString() === oldDate.toDateString() &&
              newDate.getTime() !== oldDate.getTime()
            );
          });

        if (!wasJustTimeChange && !lastChangeWasManualRef.current) {
          Swal.fire({
            title: 'Horarios actualizados',
            text: `Se ${generatedSchedules.length === schedules.length ? 'actualizaron' : 'generaron'} ${generatedSchedules.length} horario(s)`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
          });
        }
      }

      if (isFirstGenerationRef.current) {
        isFirstGenerationRef.current = false;
      }

      lastChangeWasManualRef.current = false;
      setSchedules(generatedSchedules);
    }
  }, [
    formData.eventFrom,
    formData.eventTo,
    generateRecurringSchedules,
    schedules.length,
    recurrenceConfig,
  ]);

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  const handleChange = useCallback(
    e => {
      const { name, value, type, files } = e.target;

      if (type === 'file') {
        const file = files[0];
        setImageFile(file);
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result);
          };
          reader.readAsDataURL(file);
        } else {
          setImagePreview(null);
        }
      } else {
        if (name === 'eventFrom' || name === 'eventTo') {
          lastChangeWasManualRef.current = true;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
          setErrors(prev => ({ ...prev, [name]: '' }));
        }
      }
      setError('');
    },
    [errors]
  );

  useEffect(() => {
    if (formData.roomId) {
      const selectedRoom = rooms.find(room => room.id == formData.roomId);
      if (selectedRoom && selectedRoom.isInCUC) {
        setSelectedRoomIsCUC(true);
        mostrarModalProtocoloCUC();
      } else {
        setSelectedRoomIsCUC(false);
      }
      setFormData(prev => ({ ...prev, paymentMethod: '' }));
    }
  }, [formData.roomId, rooms]);

  const handleRecurrenceChange = (field, value) => {
    if (field === 'active') {
      if (value) {
        if (!formData.eventFrom) {
          Swal.fire({
            title: 'Fechas requeridas',
            text: 'Primero selecciona la fecha de inicio del evento para activar la recurrencia.',
            icon: 'warning',
          });
          return;
        }
        const day = new Date(formData.eventFrom).getDay();
        setRecurrenceConfig({
          active: true,
          frequency: 'weekly',
          daysOfWeek: [day],
          repeatUntil: recurrenceConfig.repeatUntil,
        });
      } else {
        setRecurrenceConfig({
          active: false,
          frequency: 'weekly',
          daysOfWeek: [],
          repeatUntil: '',
        });
      }
      return;
    }
    setRecurrenceConfig(prev => ({ ...prev, [field]: value }));
  };

  const toggleDaySelection = dayId => {
    setRecurrenceConfig(prev => {
      const newDays = prev.daysOfWeek.includes(dayId)
        ? prev.daysOfWeek.filter(d => d !== dayId)
        : [...prev.daysOfWeek, dayId];
      return { ...prev, daysOfWeek: newDays };
    });
  };

  const removeSchedule = index => {
    lastChangeWasManualRef.current = true;
    setSchedules(prev => {
      const toRemove = prev[index];
      if (toRemove && toRemove.dateOnly) {
        try {
          manuallyDeletedDatesRef.current.add(toRemove.dateOnly);
        } catch (e) {
          // ignore
        }
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const mostrarModalProtocoloCUC = () => {
    Swal.fire({
      title: protocoloCUC.titulo,
      html: `
        <div class="text-left max-h-96 overflow-y-auto">
          <p class="mb-4 text-gray-700">${protocoloCUC.mensaje}</p>
          <div class="mb-4">
            <p class="font-semibold text-green-700 mb-2">Lo que está PERMITIDO priorizando:</p>
            <ul class="list-disc list-inside ml-4 text-sm text-gray-600">
              ${protocoloCUC.permitido.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          <div class="mb-4">
            <p class="font-semibold text-red-700 mb-2">Lo que está PROHIBIDO:</p>
            <ul class="list-disc list-inside ml-4 text-sm text-gray-600">
              ${protocoloCUC.prohibido.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          <div class="mb-4">
            <p class="font-semibold text-blue-700 mb-2">Requisitos Clave:</p>
            <ul class="list-disc list-inside ml-4 text-sm text-gray-600">
              ${protocoloCUC.requisitos.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <p class="text-sm text-yellow-700 font-semibold">${protocoloCUC.compromiso}</p>
          </div>
        </div>
      `,
      icon: 'warning',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Entendido',
      width: isMobile ? '95%' : '600px',
      customClass: { container: 'z-50' },
    });
  };

  const mostrarModalConfirmacionFinal = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Confirmación Final - Protocolo CUC',
      html: `
        <div class="text-left max-h-96 overflow-y-auto">
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-yellow-700">
                  <strong>Resumen del Protocolo CUC</strong>
                </p>
              </div>
            </div>
          </div>
          <div class="mb-4">
            <p class="font-semibold text-green-700 mb-2 text-sm">PERMITIDO:</p>
            <p class="text-xs text-gray-600 mb-2">Actividades académicas, culturales y uso respetuoso</p>
            <p class="font-semibold text-red-700 mb-2 text-sm">PROHIBIDO:</p>
            <p class="text-xs text-gray-600 mb-2">Alcohol, armas, fogatas, ruido excesivo, daño al patrimonio</p>
            <p class="font-semibold text-blue-700 mb-2 text-sm">REQUISITOS:</p>
            <p class="text-xs text-gray-600">Subir programación del evento</p>
          </div>
          <div class="border-t pt-4">
            <p class="font-semibold text-gray-700 mb-3">Checklist de Compromiso *</p>
            <form id="checklistForm">
              ${checklistCompromiso
                .map(
                  (item, index) => `
                <div class="flex items-start mb-3">
                  <input type="checkbox" id="check${index}" name="check${index}" class="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" required>
                  <label for="check${index}" class="text-sm text-gray-700 flex-1">${item}</label>
                </div>
              `
                )
                .join('')}
            </form>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar y Enviar Solicitud',
      cancelButtonText: 'Revisar Datos',
      focusConfirm: false,
      width: isMobile ? '95%' : '650px',
      preConfirm: () => {
        const checkboxes = checklistCompromiso.map((_, index) =>
          document.getElementById(`check${index}`)
        );
        const allChecked = checkboxes.every(checkbox => checkbox.checked);
        if (!allChecked) {
          Swal.showValidationMessage(
            'Debe aceptar todos los puntos del checklist para continuar.'
          );
          return false;
        }
        return true;
      },
    });
    return formValues;
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const getMaxDateTime = () => {
    const now = new Date();
    now.setFullYear(now.getFullYear() + 1);
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  // Validación completa (se usa al enviar)
  const validate = () => {
    const newErrors = {};
    const now = new Date();

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    else if (formData.name.length > 200)
      newErrors.name = 'El nombre no puede exceder 200 caracteres';

    if (!formData.description.trim())
      newErrors.description = 'La descripción es requerida';
    else if (formData.description.length > 5000)
      newErrors.description =
        'La descripción no puede exceder los 5000 caracteres';

    if (
      formData.specialRequirements &&
      formData.specialRequirements.length > 2000
    ) {
      newErrors.specialRequirements =
        'Los requerimientos especiales no pueden exceder 2000 caracteres';
    }

    if (!formData.capacity) newErrors.capacity = 'La capacidad es requerida';
    else if (parseInt(formData.capacity) <= 0)
      newErrors.capacity = 'La capacidad debe ser un número positivo';
    else if (parseInt(formData.capacity) > 10000)
      newErrors.capacity = 'La capacidad máxima es 10,000 personas';

    if (!formData.cost) newErrors.cost = 'El costo es requerido';
    else if (formData.cost.length > 100)
      newErrors.cost = 'El costo no puede exceder 100 caracteres';

    if (!formData.contact.trim())
      newErrors.contact = 'El contacto es requerido';
    else if (formData.contact.length > 500)
      newErrors.contact = 'El contacto no puede exceder 500 caracteres';

    if (!formData.roomId) newErrors.roomId = 'Debe seleccionar un espacio';

    if (formData.roomId) {
      const selectedRoom = rooms.find(r => r.id == formData.roomId);
      const acceptsTransfer = selectedRoom?.acceptsTransfer;
      const acceptsMaterials = selectedRoom?.acceptsMaterials;
      if ((acceptsTransfer || acceptsMaterials) && !formData.paymentMethod) {
        newErrors.paymentMethod = 'Debe seleccionar un método de pago';
      }
    }

    if (!formData.eventFrom)
      newErrors.eventFrom = 'La fecha de inicio del evento es requerida';
    if (!formData.eventTo)
      newErrors.eventTo = 'La fecha de fin del evento es requerida';

    if (formData.eventFrom && formData.eventTo) {
      const eventFrom = new Date(formData.eventFrom);
      const eventTo = new Date(formData.eventTo);
      if (eventFrom >= eventTo) {
        newErrors.eventTo =
          'La fecha de fin debe ser posterior a la fecha de inicio';
      }
      if (eventFrom < now) {
        newErrors.eventFrom = 'La fecha del evento no puede ser en el pasado';
      }
    }

    const reservationFromDate = formData.reservationFrom
      ? new Date(formData.reservationFrom)
      : formData.eventFrom
        ? new Date(formData.eventFrom)
        : null;
    const reservationToDate = formData.reservationTo
      ? new Date(formData.reservationTo)
      : formData.eventTo
        ? new Date(formData.eventTo)
        : null;

    if (reservationFromDate && reservationToDate) {
      if (reservationFromDate >= reservationToDate) {
        newErrors.reservationTo =
          'La fecha de fin de reserva debe ser posterior a la fecha de inicio';
      }
    }

    if (formData.eventFrom && reservationFromDate) {
      const eventFrom = new Date(formData.eventFrom);
      if (eventFrom < reservationFromDate) {
        newErrors.eventFrom =
          'El evento debe comenzar después del inicio de la reserva';
      }
    }
    if (formData.eventTo && reservationToDate) {
      const eventTo = new Date(formData.eventTo);
      if (eventTo > reservationToDate) {
        newErrors.eventTo =
          'El evento debe finalizar antes del fin del período de reserva';
      }
    }

    if (recurrenceConfig.active) {
      if (recurrenceConfig.daysOfWeek.length === 0) {
        newErrors.recurrenceDays =
          'Selecciona al menos un día para la recurrencia';
      }
      if (!recurrenceConfig.repeatUntil) {
        newErrors.recurrenceUntil = 'Especifica hasta cuándo se repetirá';
      } else {
        const repeatUntil = new Date(recurrenceConfig.repeatUntil);
        const eventFrom = new Date(formData.eventFrom);
        if (repeatUntil <= eventFrom) {
          newErrors.recurrenceUntil =
            'La fecha límite debe ser posterior al inicio del evento';
        }
      }
    }

    if (schedules.length === 0) {
      newErrors.schedules = 'Debe haber al menos un horario programado';
    } else {
      for (let i = 0; i < schedules.length; i++) {
        for (let j = i + 1; j < schedules.length; j++) {
          const scheduleA = schedules[i];
          const scheduleB = schedules[j];
          const startA = new Date(scheduleA.eventFrom);
          const endA = new Date(scheduleA.eventTo);
          const startB = new Date(scheduleB.eventFrom);
          const endB = new Date(scheduleB.eventTo);
          if (
            (startA >= startB && startA < endB) ||
            (endA > startB && endA <= endB) ||
            (startA <= startB && endA >= endB)
          ) {
            newErrors.schedules = `Hay conflictos de horario entre los eventos ${i + 1} y ${j + 1}`;
            break;
          }
        }
        if (newErrors.schedules) break;
      }
    }

    if (!imageFile) {
      newErrors.imageFile = 'La imagen del evento es obligatoria';
    } else {
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      const maxSize = 5 * 1024 * 1024;
      if (!allowedTypes.includes(imageFile.type)) {
        newErrors.imageFile =
          'Solo se permiten imágenes (JPEG, JPG, PNG, GIF, WebP)';
      }
      if (imageFile.size > maxSize) {
        newErrors.imageFile = 'La imagen no debe exceder los 5MB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validación por sección (para navegación)
  const validateSection = sectionId => {
    const sectionFields = {
      space: ['roomId'],
      basic: [
        'name',
        'description',
        'capacity',
        'cost',
        'contact',
        'paymentMethod',
      ],
      dates: [
        'eventFrom',
        'eventTo',
        'reservationFrom',
        'reservationTo',
        'schedules',
      ],
      recurrence: ['recurrenceDays', 'recurrenceUntil'],
      image: ['imageFile'],
      review: [],
    };

    const fullResult = validate(); // ejecuta toda la validación
    const keys = Object.keys(fullResult.errors || {});
    const filtered = keys.filter(k => sectionFields[sectionId]?.includes(k));
    const filteredErrors = {};
    filtered.forEach(k => (filteredErrors[k] = fullResult.errors[k]));

    return {
      valid: Object.keys(filteredErrors).length === 0,
      errors: filteredErrors,
    };
  };

  const handleSectionClick = targetSection => {
    if (targetSection === activeSection) return;

    const order = sectionTabs.map(t => t.id);
    const currentIndex = order.indexOf(activeSection);
    const targetIndex = order.indexOf(targetSection);

    // Retroceder siempre permitido
    if (targetIndex < currentIndex) {
      setActiveSection(targetSection);
      setShowMobileMenu(false);
      return;
    }

    // Avanzar: validar sección actual
    const sectionResult = validateSection(activeSection);
    if (sectionResult.valid) {
      setActiveSection(targetSection);
      setShowMobileMenu(false);
    } else {
      const firstField = Object.keys(sectionResult.errors)[0];
      Swal.fire({
        title: 'Corrige errores',
        text: 'Hay errores en esta sección. Por favor corrígelos antes de avanzar.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      const el = document.querySelector(`[name="${firstField}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }
  };

  const nextSection = () => {
    const order = sectionTabs.map(t => t.id);
    const currentIndex = order.indexOf(activeSection);
    if (currentIndex < order.length - 1) {
      handleSectionClick(order[currentIndex + 1]);
    }
  };

  const prevSection = () => {
    const order = sectionTabs.map(t => t.id);
    const currentIndex = order.indexOf(activeSection);
    if (currentIndex > 0) {
      setActiveSection(order[currentIndex - 1]);
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!validate()) {
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(
        `[name="${firstErrorField}"]`
      );
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      setIsSubmitting(false);
      return;
    }

    const result = await Swal.fire({
      title: '¿Crear reserva?',
      text:
        schedules.length > 1
          ? `Se crearán ${schedules.length} eventos. ¿Continuar?`
          : '¿Estás seguro de crear esta nueva reserva?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar',
      width: isMobile ? '95%' : undefined,
    });

    if (!result.isConfirmed) {
      setIsSubmitting(false);
      return;
    }

    let confirmResult = true;
    if (selectedRoomIsCUC) {
      confirmResult = await mostrarModalConfirmacionFinal();
    } else {
      const normalConfirm = await Swal.fire({
        title: '¿Confirmar reserva?',
        html: `
          <div class="text-left">
            <p class="mb-4 text-gray-700">¿Estás seguro de continuar con esta reserva?</p>
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-yellow-700">
                    <strong>Asegúrate que los datos estén correctos</strong>, luego no se podrá editar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, confirmar reserva',
        cancelButtonText: 'Revisar datos',
        focusConfirm: false,
        width: isMobile ? '95%' : '500px',
      });
      confirmResult = normalConfirm.isConfirmed;
    }

    if (!confirmResult) {
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (
        key === 'reservationFrom' &&
        !formData.reservationFrom &&
        formData.eventFrom
      ) {
        data.append('reservationFrom', formData.eventFrom);
        return;
      }
      if (
        key === 'reservationTo' &&
        !formData.reservationTo &&
        formData.eventTo
      ) {
        data.append('reservationTo', formData.eventTo);
        return;
      }
      if (formData[key]) {
        data.append(key, formData[key]);
      }
    });

    if (imageFile) data.append('imageFile', imageFile);

    const schedulesToSend = schedules.map(s => ({
      eventFrom: s.eventFrom,
      eventTo: s.eventTo,
      reservationFrom: s.reservationFrom || s.eventFrom,
      reservationTo: s.reservationTo || s.eventTo,
    }));

    if (schedulesToSend.length > 0) {
      data.append('schedules', JSON.stringify(schedulesToSend));
    }

    data.append('status', 'pending');
    if (formData.paymentMethod) {
      data.append('paymentMethod', formData.paymentMethod);
    }

    try {
      Swal.fire({
        title: 'Procesando...',
        text: 'Por favor espere mientras se crea la reserva',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await axiosInstance.post('/events', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Swal.close();

      await Swal.fire({
        title: '¡Reserva creada con éxito!',
        html: `
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p class="text-gray-700 mb-4">Tu reserva ha sido enviada para revisión.</p>
            ${
              selectedRoomIsCUC
                ? `
              <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 text-left">
                <p class="text-sm text-blue-700">
                  <strong>Recordatorio:</strong> Para espacios en la CUC, recuerda gestionar el aval de COPRED si es requerido.
                </p>
              </div>
            `
                : ''
            }
            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 text-left">
              <p class="text-sm text-blue-700">
                <strong>Puede subir la programación del evento</strong> para que se tenga en cuenta en su solicitud.
              </p>
            </div>
            <p class="text-sm text-gray-600">
              Se creó${schedules.length > 1 ? 'n' : ''} ${schedules.length} evento${schedules.length > 1 ? 's' : ''} exitosamente.
            </p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
        width: isMobile ? '95%' : '500px',
      });

      // Resetear formulario y referencias
      setFormData({
        name: '',
        description: '',
        specialRequirements: '',
        capacity: '',
        cost: '',
        contact: '',
        eventFrom: '',
        eventTo: '',
        reservationFrom: '',
        reservationTo: '',
        roomId: '',
      });
      setImageFile(null);
      setImagePreview(null);
      setSchedules([]);
      setRecurrenceConfig({
        active: false,
        frequency: 'weekly',
        daysOfWeek: [],
        repeatUntil: '',
      });
      setActiveSection('space');
      setSelectedRoomIsCUC(false);

      previousSchedulesHashRef.current = '';
      isFirstGenerationRef.current = true;
      lastChangeWasManualRef.current = false;
      manuallyDeletedDatesRef.current.clear();

      if (onEventCreated) {
        onEventCreated(response.data);
      }
    } catch (error) {
      Swal.close();
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.errors?.join(', ') ||
        'Error al crear el evento. Por favor, intente nuevamente.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (roomsLoading && rooms.length === 0) {
    return (
      <div className="max-w-6xl mx-auto my-2 sm:my-5 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 sm:px-8 py-3 sm:py-6">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white text-center">
            Cargando espacios disponibles...
          </h2>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (roomsError && rooms.length === 0) {
    return (
      <div className="max-w-6xl mx-auto my-2 sm:my-5 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-3 sm:px-8 py-3 sm:py-6">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white text-center">
            Error al cargar espacios
          </h2>
        </div>
        <div className="p-8 text-center">
          <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <p className="text-gray-700 mb-4">{roomsError}</p>
          <button
            onClick={retryLoadRooms}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const currentSectionObj = sectionTabs.find(t => t.id === activeSection);

  return (
    <div className="max-w-6xl mx-auto my-2 sm:my-5 bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 z-10">
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-gray-600 transition-colors mr-2 sm:mr-4"
            title="Volver atrás"
          >
            <FaArrowLeft size={isMobile ? 20 : 24} />
          </button>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 truncate pr-2">
            Crear Reserva
          </h2>
          <div className="w-8 sm:w-10"></div> {/* Espaciador para centrar */}
        </div>

        {/* Selector de secciones para móvil - Dropdown */}
        <div className="mt-3 sm:hidden">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 rounded-lg text-gray-700"
          >
            <span className="flex items-center">
              {currentSectionObj && (
                <>
                  <currentSectionObj.icon className="mr-2 h-4 w-4" />
                  {currentSectionObj.label}
                </>
              )}
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${showMobileMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Menú desplegable móvil */}
          {showMobileMenu && (
            <div className="absolute left-4 right-4 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {sectionTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSectionClick(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left border-b last:border-b-0 ${
                      activeSection === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-4 w-4 ${activeSection === tab.id ? 'text-blue-500' : 'text-gray-500'}`}
                    />
                    <span
                      className={activeSection === tab.id ? 'font-medium' : ''}
                    >
                      {tab.label}
                    </span>
                    {activeSection === tab.id && (
                      <span className="ml-auto text-blue-500">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navegación por secciones - Escritorio */}
        <div className="hidden sm:flex mt-4 space-x-2 overflow-x-auto pb-2">
          {sectionTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleSectionClick(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario scrolleable */}
      <form
        id="eventForm"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 sm:p-6"
      >
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm sm:text-base text-red-700 text-center">
              {error}
            </p>
          </div>
        )}

        {/* Sección: Espacio */}
        {activeSection === 'space' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-1">
                Selecciona el Espacio
              </h3>
              <p className="text-xs sm:text-sm text-blue-600">
                Elige el espacio donde se realizará el evento.
              </p>
            </div>

            {selectedRoomIsCUC && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded-lg">
                <div className="flex items-start gap-2 sm:gap-3">
                  <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm text-yellow-800 font-semibold mb-1">
                      Espacio en Patrimonio Mundial - CUC
                    </p>
                    <p className="text-[10px] sm:text-xs text-yellow-700">
                      Este espacio está sujeto al Protocolo de Uso de la Ciudad
                      Universitaria de Caracas
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPinIcon className="inline mr-2 h-4 w-4 text-blue-500" />
                  Espacio para el Evento <span className="text-red-500">*</span>
                </label>
                <SelectWithIcon
                  icon={MapPinIcon}
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleChange}
                  error={errors.roomId}
                >
                  <option value="">Selecciona un espacio...</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({room.capacity} pers.)
                      {room.isInCUC ? ' (CUC)' : ''}
                    </option>
                  ))}
                </SelectWithIcon>
                {errors.roomId && (
                  <p className="mt-1 text-sm text-red-600">{errors.roomId}</p>
                )}
              </div>

              {/* Información adicional */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-start gap-2 sm:gap-3">
                  <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Tip:</strong> Selecciona el espacio que mejor se
                      adapte al tamaño de tu evento.
                    </p>
                    <p className="text-[10px] sm:text-xs text-blue-800 mt-1">
                      Los espacios marcados con <strong>(CUC)</strong> están en
                      la Ciudad Universitaria.
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalles del espacio seleccionado (escritorio) */}
              {!isMobile && formData.roomId && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 pb-2 border-b">
                    Detalles del Espacio
                  </h4>
                  {(() => {
                    const selectedRoom = rooms.find(
                      room => room.id == formData.roomId
                    );
                    if (!selectedRoom) return null;
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Nombre:
                          </span>
                          <span className="text-sm font-semibold text-blue-600">
                            {selectedRoom.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Capacidad:
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            {selectedRoom.capacity} personas
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Ubicación:
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            {selectedRoom.location}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Costo base:
                          </span>
                          <span className="text-sm font-semibold text-green-600">
                            {selectedRoom.cost === '0' ||
                            selectedRoom.cost === 0
                              ? 'Gratuito'
                              : `$${parseFloat(selectedRoom.cost).toFixed(2)}`}
                          </span>
                        </div>
                        {selectedRoom.isInCUC && (
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Ubicación:
                            </span>
                            <span className="text-sm font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                              Ciudad Universitaria (CUC)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sección: Información Básica */}
        {activeSection === 'basic' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-1">
                Información del Evento
              </h3>
              <p className="text-xs sm:text-sm text-blue-600">
                Completa la información principal del evento.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DocumentTextIcon className="inline mr-2 h-4 w-4 text-blue-500" />
                  Nombre del Evento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Conferencia"
                  maxLength={200}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.name.length}/200
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DocumentTextIcon className="inline mr-2 h-4 w-4 text-blue-500" />
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe los detalles del evento"
                  maxLength={5000}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/5000
                </p>
              </div>

              {/* Requerimientos Especiales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ClipboardDocumentCheckIcon className="inline mr-2 h-4 w-4 text-green-500" />
                  Requerimientos Especiales
                  <span className="text-xs text-gray-500 ml-1">(Opcional)</span>
                </label>
                <textarea
                  name="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.specialRequirements
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Ej: Necesito exoneración, montaje de audio, acceso para personas con movilidad reducida, vigilancia adicional, estacionamiento para 2 vehículos, requerimiento de energía eléctrica, etc."
                  maxLength={2000}
                />
                {errors.specialRequirements && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.specialRequirements}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.specialRequirements.length}/2000
                </p>
              </div>

              {/* Capacidad y Costo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <UserGroupIcon className="inline mr-2 h-4 w-4 text-blue-500" />
                    Capacidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    max="10000"
                    className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.capacity ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 100"
                  />
                  {errors.capacity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.capacity}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CurrencyDollarIcon className="inline mr-2 h-4 w-4 text-blue-500" />
                    Costo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.cost ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: $1000 o Gratis"
                    maxLength={100}
                  />
                  {errors.cost && (
                    <p className="mt-1 text-sm text-red-600">{errors.cost}</p>
                  )}
                </div>
              </div>

              {/* Contacto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <UserIcon className="inline mr-2 h-4 w-4 text-blue-500" />
                  Información de Contacto{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.contact ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Información para contactar al organizador"
                  maxLength={500}
                />
                {errors.contact && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.contact.length}/500
                </p>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CurrencyDollarIcon className="inline mr-2 h-4 w-4 text-blue-500" />
                  Método de Pago <span className="text-red-500">*</span>
                </label>
                {(() => {
                  const selectedRoom = rooms.find(r => r.id == formData.roomId);
                  const acceptsTransfer = selectedRoom?.acceptsTransfer;
                  const acceptsMaterials = selectedRoom?.acceptsMaterials;

                  if (!formData.roomId) {
                    return (
                      <p className="text-sm text-gray-500">
                        Selecciona un espacio para ver los métodos disponibles.
                      </p>
                    );
                  }

                  const options = [];
                  if (acceptsTransfer)
                    options.push({ value: 'transfer', label: 'Transferencia' });
                  if (acceptsMaterials)
                    options.push({ value: 'materials', label: 'Materiales' });

                  if (options.length === 0) {
                    return (
                      <p className="text-sm text-yellow-700">
                        Este espacio no permite métodos de pago configurados.
                      </p>
                    );
                  }

                  return (
                    <div className="flex flex-col sm:flex-row gap-3">
                      {options.map(opt => (
                        <label
                          key={opt.value}
                          className="inline-flex items-center gap-2"
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={opt.value}
                            checked={formData.paymentMethod === opt.value}
                            onChange={handleChange}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                      {errors.paymentMethod && (
                        <p className="text-sm text-red-600">
                          {errors.paymentMethod}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Sección: Fechas */}
        {activeSection === 'dates' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-1">
                Fechas del Evento Principal
              </h3>
              <p className="text-xs sm:text-sm text-blue-600">
                Define las fechas y horas del evento.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="inline mr-2 h-4 w-4 text-blue-500" />
                  Fechas del Evento Principal{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Inicio del Evento
                    </label>
                    <input
                      type="datetime-local"
                      name="eventFrom"
                      value={formData.eventFrom}
                      onChange={handleChange}
                      min={getMinDateTime()}
                      max={getMaxDateTime()}
                      className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.eventFrom ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.eventFrom && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.eventFrom}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Fin del Evento
                    </label>
                    <input
                      type="datetime-local"
                      name="eventTo"
                      value={formData.eventTo}
                      onChange={handleChange}
                      min={formData.eventFrom || getMinDateTime()}
                      max={getMaxDateTime()}
                      className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.eventTo ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.eventTo && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.eventTo}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-1">
                Período de Reserva
              </h3>
              <p className="text-xs sm:text-sm text-blue-600">
                Define el período de reserva del espacio (opcional).
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="inline mr-2 h-4 w-4 text-blue-500" />
                  Fechas de Reserva
                  <span className="text-xs text-gray-500 ml-1">(Opcional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Si no se especifican, se usarán las fechas del evento.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Inicio Reserva
                    </label>
                    <input
                      type="datetime-local"
                      name="reservationFrom"
                      value={formData.reservationFrom}
                      onChange={handleChange}
                      min={getMinDateTime()}
                      max={formData.eventFrom || getMaxDateTime()}
                      className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.reservationFrom
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Fin Reserva
                    </label>
                    <input
                      type="datetime-local"
                      name="reservationTo"
                      value={formData.reservationTo}
                      onChange={handleChange}
                      min={formData.reservationFrom || getMinDateTime()}
                      max={getMaxDateTime()}
                      className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.reservationTo
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm text-blue-800">
                    <strong>Nota:</strong> El período de reserva debe cubrir
                    completamente el evento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección: Recurrencia */}
        {activeSection === 'recurrence' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-1">
                Configuración de Recurrencia
              </h3>
              <p className="text-xs sm:text-sm text-blue-600">
                Configura la recurrencia del evento si es necesario.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              {/* Validación de duración del evento */}
              {formData.eventFrom && formData.eventTo && (
                <div className="mb-4">
                  {(() => {
                    const eventFrom = new Date(formData.eventFrom);
                    const eventTo = new Date(formData.eventTo);
                    const isSameDay =
                      eventFrom.getFullYear() === eventTo.getFullYear() &&
                      eventFrom.getMonth() === eventTo.getMonth() &&
                      eventFrom.getDate() === eventTo.getDate();

                    if (!isSameDay) {
                      return (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-yellow-700">
                                <strong className="font-medium">
                                  Recurrencia no disponible:
                                </strong>{' '}
                                El evento debe comenzar y terminar el mismo día
                                para poder activar la recurrencia.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  <FaSyncAlt className="inline mr-2 text-purple-500" />
                  Configuración de Recurrencia
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">
                    Activar recurrencia
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recurrenceConfig.active}
                      onChange={e => {
                        if (e.target.checked) {
                          const eventFrom = new Date(formData.eventFrom);
                          const eventTo = new Date(formData.eventTo);
                          const isSameDay =
                            eventFrom.getFullYear() === eventTo.getFullYear() &&
                            eventFrom.getMonth() === eventTo.getMonth() &&
                            eventFrom.getDate() === eventTo.getDate();

                          if (!isSameDay) {
                            Swal.fire({
                              title: 'No se puede activar recurrencia',
                              text: 'El evento debe comenzar y terminar el mismo día para poder activar la recurrencia.',
                              icon: 'warning',
                              confirmButtonColor: '#3085d6',
                            });
                            return;
                          }
                        }
                        handleRecurrenceChange('active', e.target.checked);
                      }}
                      className="sr-only peer"
                      disabled={
                        !formData.eventFrom ||
                        !formData.eventTo ||
                        (() => {
                          const eventFrom = new Date(formData.eventFrom);
                          const eventTo = new Date(formData.eventTo);
                          return (
                            eventFrom.getFullYear() !== eventTo.getFullYear() ||
                            eventFrom.getMonth() !== eventTo.getMonth() ||
                            eventFrom.getDate() !== eventTo.getDate()
                          );
                        })()
                      }
                    />
                    <div
                      className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                        !formData.eventFrom ||
                        !formData.eventTo ||
                        (() => {
                          const eventFrom = new Date(formData.eventFrom);
                          const eventTo = new Date(formData.eventTo);
                          return (
                            eventFrom.getFullYear() !== eventTo.getFullYear() ||
                            eventFrom.getMonth() !== eventTo.getMonth() ||
                            eventFrom.getDate() !== eventTo.getDate()
                          );
                        })()
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    ></div>
                  </label>
                </div>
              </div>

              {recurrenceConfig.active && (
                <div className="space-y-4 mt-4 p-4 bg-white rounded-lg border">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Día de repetición
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map(day => (
                        <button
                          key={day.id}
                          type="button"
                          disabled
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            recurrenceConfig.daysOfWeek.includes(day.id)
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-gray-100 text-gray-400'
                          } cursor-not-allowed opacity-60`}
                          title={day.name}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-blue-600">
                      <InformationCircleIcon className="inline mr-1 h-4 w-4" />
                      Día fijado según la fecha del evento:{' '}
                      {
                        weekDays.find(
                          d => d.id === recurrenceConfig.daysOfWeek[0]
                        )?.name
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frecuencia
                      </label>
                      <div className="w-full px-3 py-2 border rounded-lg bg-gray-50">
                        Semanal
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Repetir hasta
                      </label>
                      <input
                        type="date"
                        value={recurrenceConfig.repeatUntil}
                        onChange={e =>
                          handleRecurrenceChange('repeatUntil', e.target.value)
                        }
                        min={
                          formData.eventFrom
                            ? formData.eventFrom.split('T')[0]
                            : undefined
                        }
                        className={`w-full px-3 py-3 sm:py-2 border rounded-lg ${
                          errors.recurrenceUntil ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.recurrenceUntil && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.recurrenceUntil}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
                    El evento se repetirá semanalmente los{' '}
                    {weekDays
                      .find(d => d.id === recurrenceConfig.daysOfWeek[0])
                      ?.name.toLowerCase()}
                    s.
                  </div>
                </div>
              )}

              {!recurrenceConfig.active && (
                <div className="text-center py-4 text-gray-500">
                  <FaCalendar className="text-3xl mx-auto mb-2 text-gray-400" />
                  <p>Sin recurrencia - Se creará un solo evento</p>
                  <p className="text-sm mt-1">
                    {formData.eventFrom && formData.eventTo
                      ? (() => {
                          const eventFrom = new Date(formData.eventFrom);
                          const eventTo = new Date(formData.eventTo);
                          const isSameDay =
                            eventFrom.getFullYear() === eventTo.getFullYear() &&
                            eventFrom.getMonth() === eventTo.getMonth() &&
                            eventFrom.getDate() === eventTo.getDate();

                          return isSameDay
                            ? 'Activa la recurrencia para crear múltiples eventos automáticamente'
                            : 'El evento debe comenzar y terminar el mismo día para activar recurrencia';
                        })()
                      : 'Configura las fechas del evento para activar recurrencia'}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-1">
                Horarios Generados
              </h3>
              <p className="text-xs sm:text-sm text-blue-600">
                Visualiza los horarios creados automáticamente.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  Horarios Programados
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium self-start sm:self-auto ${
                    schedules.length > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {schedules.length} horario(s)
                </span>
              </div>

              {errors.schedules && (
                <p className="mb-2 text-sm text-red-600">{errors.schedules}</p>
              )}

              {schedules.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {schedules.map((schedule, index) => (
                    <div key={index} className="bg-white p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm text-gray-700">
                          Horario {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSchedule(index)}
                          className="text-red-500 hover:text-red-700 text-sm p-1"
                          title="Eliminar este horario"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div>
                          <span className="font-medium">Evento:</span>
                          <div className="text-gray-600 break-words">
                            {new Date(schedule.eventFrom).toLocaleString()} -{' '}
                            {new Date(schedule.eventTo).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Reserva:</span>
                          <div className="text-gray-600 break-words">
                            {new Date(
                              schedule.reservationFrom
                            ).toLocaleString()}{' '}
                            -{' '}
                            {new Date(schedule.reservationTo).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-white rounded border">
                  <FaCalendarAlt className="text-3xl mx-auto mb-2 text-gray-400" />
                  <p>No hay horarios programados.</p>
                  <p className="text-sm mt-1">
                    Configura las fechas del evento para generar horarios
                    automáticamente.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sección: Imagen */}
        {activeSection === 'image' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-1">
                Imagen del Evento
              </h3>
              <p className="text-xs sm:text-sm text-blue-600">
                Selecciona una imagen representativa del evento.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <ImageUploadArea
                imageFile={imageFile}
                onFileChange={handleImageChange}
                imagePreview={imagePreview}
              />
              {errors.imageFile && (
                <p className="mt-2 text-sm text-red-600">{errors.imageFile}</p>
              )}
            </div>

            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm text-blue-800">
                    <strong>Recomendación:</strong> Usa una imagen atractiva.
                  </p>
                  <p className="text-[10px] sm:text-xs text-blue-600 mt-1">
                    Formatos: JPEG, JPG, PNG, GIF, WebP. Máx: 5MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección: Revisión */}
        {activeSection === 'review' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-1">
                Resumen de la Reserva
              </h3>
              <p className="text-xs sm:text-sm text-blue-600">
                Revisa toda la información antes de crear la reserva.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-bold text-gray-800 text-base">
                  Información del Evento
                </h4>
                <div className="space-y-3">
                  <div className="border-b border-gray-200 pb-2">
                    <span className="font-medium text-gray-700 block text-sm">
                      Nombre:
                    </span>
                    <p className="text-gray-600 text-sm break-words">
                      {formData.name || 'No especificado'}
                    </p>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <span className="font-medium text-gray-700 block text-sm">
                      Descripción:
                    </span>
                    <p className="text-gray-600 text-sm break-words">
                      {formData.description || 'No especificada'}
                    </p>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <span className="font-medium text-gray-700 block text-sm">
                      Espacio:
                    </span>
                    <p className="text-gray-600 text-sm">
                      {rooms.find(r => r.id == formData.roomId)?.name ||
                        'No seleccionado'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-2">
                    <div>
                      <span className="font-medium text-gray-700 block text-sm">
                        Capacidad:
                      </span>
                      <p className="text-gray-600 text-sm">
                        {formData.capacity || 'No especificada'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 block text-sm">
                        Costo:
                      </span>
                      <p className="text-gray-600 text-sm">
                        {formData.cost || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-bold text-gray-800 text-base">
                  Fechas y Horarios
                </h4>
                <div className="space-y-3">
                  <div className="border-b border-gray-200 pb-2">
                    <span className="font-medium text-gray-700 block text-sm">
                      Evento Principal:
                    </span>
                    <p className="text-gray-600 text-sm break-words">
                      {formData.eventFrom
                        ? `${new Date(formData.eventFrom).toLocaleString()} - ${new Date(formData.eventTo).toLocaleString()}`
                        : 'No especificado'}
                    </p>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <span className="font-medium text-gray-700 block text-sm">
                      Período de Reserva:
                    </span>
                    <p className="text-gray-600 text-sm break-words">
                      {formData.reservationFrom
                        ? `${new Date(formData.reservationFrom).toLocaleString()} - ${new Date(formData.reservationTo).toLocaleString()}`
                        : 'Mismas fechas del evento'}
                    </p>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <span className="font-medium text-gray-700 block text-sm">
                      Recurrencia:
                    </span>
                    <p className="text-gray-600 text-sm">
                      {recurrenceConfig.active
                        ? `${recurrenceConfig.frequency === 'weekly' ? 'Semanal' : recurrenceConfig.frequency === 'biweekly' ? 'Quincenal' : 'Mensual'} - ${recurrenceConfig.daysOfWeek.length} día(s)`
                        : 'Sin recurrencia'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 block text-sm">
                      Total de Horarios:
                    </span>
                    <p className="text-gray-600 font-bold text-base">
                      {schedules.length} horario(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* Previsualización de Imagen */}
              {imagePreview && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-3 text-base">
                    Imagen del Evento
                  </h4>
                  <div className="flex justify-center">
                    <img
                      src={imagePreview}
                      alt="Previsualización"
                      className="max-w-full max-h-48 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                </div>
              )}

              {selectedRoomIsCUC && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-yellow-800 font-semibold mb-1">
                        Espacio en Patrimonio Mundial - CUC
                      </p>
                      <p className="text-[10px] sm:text-xs text-yellow-700">
                        Este espacio está sujeto al Protocolo de Uso de la CUC.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1 text-center sm:text-left">
            <span className="text-red-500">*</span> Campos obligatorios
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-end order-1 sm:order-2">
            {activeSection !== sectionTabs[0].id && (
              <button
                type="button"
                onClick={prevSection}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm flex items-center justify-center"
              >
                <FaChevronLeft className="mr-1 sm:mr-2 text-xs" />
                <span className="hidden sm:inline">Anterior</span>
                <span className="sm:hidden">Ant</span>
              </button>
            )}

            {activeSection !== sectionTabs[sectionTabs.length - 1].id && (
              <button
                type="button"
                onClick={nextSection}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center justify-center"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <span className="sm:hidden">Sig</span>
                <FaChevronRight className="ml-1 sm:ml-2 text-xs" />
              </button>
            )}

            {activeSection === sectionTabs[sectionTabs.length - 1].id && (
              <button
                type="submit"
                form="eventForm"
                disabled={isSubmitting || schedules.length === 0}
                className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-lg transition-colors flex items-center justify-center text-sm ${
                  isSubmitting || schedules.length === 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Creando...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">
                      Crear {schedules.length} Evento
                      {schedules.length !== 1 ? 's' : ''}
                    </span>
                    <span className="sm:hidden">
                      {schedules.length > 1
                        ? `${schedules.length} Ev`
                        : 'Crear'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEventForm;
