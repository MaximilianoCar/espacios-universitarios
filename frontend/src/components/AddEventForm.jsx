import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ArrowPathIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaUsers,
  FaDollarSign,
  FaFileAlt,
  FaFileImage,
  FaSyncAlt,
  FaTimes,
  FaClipboardCheck,
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

// Componentes auxiliares fuera del componente principal para evitar remounts
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
      className={`block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
      className={`block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
    >
      {children}
    </select>
  </div>
);

const ImageUploadArea = ({ imageFile, onFileChange }) => (
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
      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
        PNG, JPG, GIF hasta 5MB
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
);

const AddEventForm = ({ onEventCreated }) => {
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
  const [rooms, setRooms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [selectedRoomIsCUC, setSelectedRoomIsCUC] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

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

  // Referencias para inputs
  const inputRefs = useRef({});

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const sections = [
    { id: 'space', title: isMobile ? 'Espacio' : 'Espacio', icon: MapPinIcon },
    {
      id: 'basic',
      title: isMobile ? 'Básica' : 'Información Básica',
      icon: InformationCircleIcon,
    },
    {
      id: 'dates',
      title: isMobile ? 'Fechas' : 'Fechas y Horarios',
      icon: CalendarIcon,
    },
    {
      id: 'recurrence',
      title: isMobile ? 'Recurrencia' : 'Recurrencia',
      icon: ArrowPathIcon,
    },
    { id: 'image', title: isMobile ? 'Imagen' : 'Imagen', icon: PhotoIcon },
    {
      id: 'review',
      title: isMobile ? 'Revisión' : 'Revisión',
      icon: ClipboardDocumentCheckIcon,
    },
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

  // Fetch rooms
  useEffect(() => {
    axiosInstance
      .get('/rooms')
      .then(response => {
        setRooms(response.data);
      })
      .catch(error => {
        console.error('Error fetching rooms:', error);
      });
  }, []);

  // Función para generar un hash simple de los horarios para comparación
  const generateSchedulesHash = schedulesArray => {
    if (!schedulesArray || schedulesArray.length === 0) return 'empty';

    // Crear un string con información clave de cada horario
    const hashString = schedulesArray
      .map(
        s =>
          `${new Date(s.eventFrom).getTime()}-${new Date(s.eventTo).getTime()}-${s.dayOfWeek || ''}`
      )
      .join('|');

    return hashString;
  };

  // Función para generar horarios basados en recurrencia
  const generateRecurringSchedules = useCallback(() => {
    // Helpers para formatear en horario local (evitar toISOString que convierte a UTC)
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

    // Si no hay recurrencia, solo el evento principal (usar formatos locales)
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

    // Para cada día seleccionado
    recurrenceConfig.daysOfWeek.forEach(dayOfWeek => {
      // Encontrar la primera fecha con este día de la semana a partir del inicio
      let currentDate = new Date(reservationStart);

      // Avanzar hasta el día de la semana correcto
      while (currentDate.getDay() !== dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Generar eventos según la frecuencia
      while (currentDate <= repeatUntil) {
        // Crear fechas del evento manteniendo la hora original
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

        // Avanzar según la frecuencia
        switch (recurrenceConfig.frequency) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            // Avanzar un mes manteniendo el mismo día del mes
            const next = new Date(currentDate);
            next.setMonth(next.getMonth() + 1);
            const desiredDay = currentDate.getDate();
            // Ajustar si el día no existe en el siguiente mes
            const temp = new Date(next.getFullYear(), next.getMonth() + 1, 0);
            if (desiredDay > temp.getDate()) {
              next.setDate(temp.getDate());
            } else {
              next.setDate(desiredDay);
            }
            currentDate = next;
            // Asegurar que sea el mismo día de la semana (avanzar si hace falta)
            while (currentDate.getDay() !== dayOfWeek) {
              currentDate.setDate(currentDate.getDate() + 1);
            }
            break;
          default:
            currentDate.setDate(currentDate.getDate() + 7);
        }
      }
    });

    // Ordenar por fecha (usar orden natural de strings locales)
    return generatedSchedules.sort(
      (a, b) => new Date(a.eventFrom) - new Date(b.eventFrom)
    );
  }, [
    formData.eventFrom,
    formData.eventTo,
    formData.reservationFrom,
    formData.reservationTo,
    recurrenceConfig,
  ]);

  // Efecto para generar horarios cuando cambian las fechas o recurrencia
  useEffect(() => {
    if (formData.eventFrom && formData.eventTo) {
      const generatedSchedules = generateRecurringSchedules();

      // Validar que no haya demasiados horarios (límite de 50)
      if (generatedSchedules.length > 50) {
        Swal.fire({
          title: 'Demasiados horarios',
          text: `Se generarían ${generatedSchedules.length} horarios. Por favor, reduce el rango de fechas.`,
          icon: 'warning',
        });
        return;
      }

      // Generar hash de los horarios actuales
      const currentHash = generateSchedulesHash(generatedSchedules);
      const previousHash = previousSchedulesHashRef.current;

      // Actualizar la referencia del hash
      previousSchedulesHashRef.current = currentHash;

      if (!isFirstGenerationRef.current && currentHash !== previousHash) {
        // Verificar si fue solo un cambio de hora (misma cantidad, misma fecha, diferente hora)
        const wasJustTimeChange =
          generatedSchedules.length === schedules.length &&
          generatedSchedules.every((newSch, index) => {
            const oldSch = schedules[index];
            if (!oldSch) return false;

            const newDate = new Date(newSch.eventFrom);
            const oldDate = new Date(oldSch.eventFrom);

            // Misma fecha pero diferente hora
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

      // Si es la primera generación, marcar que ya no es la primera
      if (isFirstGenerationRef.current) {
        isFirstGenerationRef.current = false;
      }

      // Resetear la bandera de cambio manual
      lastChangeWasManualRef.current = false;

      setSchedules(generatedSchedules);
    }
  }, [
    formData.eventFrom,
    formData.eventTo,
    generateRecurringSchedules,
    schedules.length,
  ]);

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  // CORREGIDO: Función handleChange optimizada para evitar pérdida de foco
  const handleChange = useCallback(
    e => {
      const { name, value, type, files } = e.target;

      if (type === 'file') {
        const file = files[0];
        setImageFile(file);

        // Crear previsualización de la imagen
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
        // Para campos de fecha/hora, marcar como cambio manual
        if (name === 'eventFrom' || name === 'eventTo') {
          lastChangeWasManualRef.current = true;
        }

        // Usar función de actualización para evitar recreación
        setFormData(prev => ({ ...prev, [name]: value }));

        // Limpiar error del campo cuando se modifica
        if (errors[name]) {
          setErrors(prev => ({ ...prev, [name]: '' }));
        }
      }
      setError('');
    },
    [errors]
  ); // Solo depende de errors

  // CORREGIDO: Efecto separado para manejar cambios en roomId
  useEffect(() => {
    if (formData.roomId) {
      const selectedRoom = rooms.find(room => room.id == formData.roomId);
      if (selectedRoom && selectedRoom.isInCUC) {
        setSelectedRoomIsCUC(true);
        // Mostrar modal de protocolo CUC
        mostrarModalProtocoloCUC();
      } else {
        setSelectedRoomIsCUC(false);
      }

      // Resetear paymentMethod cuando se cambia de sala
      setFormData(prev => ({ ...prev, paymentMethod: '' }));
    }
  }, [formData.roomId, rooms]);

  const handleRecurrenceChange = (field, value) => {
    // Para cambios en recurrencia, no marcar como manual
    setRecurrenceConfig(prev => ({
      ...prev,
      [field]: value,
    }));
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
    setSchedules(prev => prev.filter((_, i) => i !== index));
  };

  // Función para mostrar modal de protocolo CUC
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
              ${protocoloCUC.requisitos
                .map(item => `<li>${item}</li>`)
                .join('')}
            </ul>
          </div>

          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <p class="text-sm text-yellow-700 font-semibold">${
              protocoloCUC.compromiso
            }</p>
          </div>
        </div>
      `,
      icon: 'warning',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Entendido',
      width: isMobile ? '95%' : '600px',
      customClass: {
        container: 'z-50',
      },
    });
  };

  // Función para mostrar modal de confirmación final con checklist
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
                  <input 
                    type="checkbox" 
                    id="check${index}" 
                    name="check${index}" 
                    class="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  >
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
        // Validar que todos los checkboxes estén marcados
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

    // Crear previsualización de la imagen
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

  // Función para calcular fecha mínima (ahora + 1 hora)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  // Función para calcular fecha máxima (1 año desde ahora)
  const getMaxDateTime = () => {
    const now = new Date();
    now.setFullYear(now.getFullYear() + 1);
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const validate = () => {
    const newErrors = {};
    const now = new Date();

    // Validación de campos requeridos
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    else if (formData.name.length > 200)
      newErrors.name = 'El nombre no puede exceder 200 caracteres';

    if (!formData.description.trim())
      newErrors.description = 'La descripción es requerida';
    else if (formData.description.length > 5000)
      newErrors.description =
        'La descripción no puede exceder los 5000 caracteres';

    // Validación de requerimientos especiales
    if (
      formData.specialRequirements &&
      formData.specialRequirements.length > 2000
    ) {
      newErrors.specialRequirements =
        'Los requerimientos especiales no pueden exceder 2000 caracteres';
    }

    // Validación de capacidad y costo
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

    // Validar método de pago según el espacio seleccionado
    if (formData.roomId) {
      const selectedRoom = rooms.find(r => r.id == formData.roomId);
      const acceptsTransfer = selectedRoom?.acceptsTransfer;
      const acceptsMaterials = selectedRoom?.acceptsMaterials;

      if ((acceptsTransfer || acceptsMaterials) && !formData.paymentMethod) {
        newErrors.paymentMethod = 'Debe seleccionar un método de pago';
      }
    }

    // Validación de fechas
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

    // Manejo flexible de fechas de reserva: si falta una de las dos fechas
    // de reserva, usamos la fecha de evento correspondiente como fallback
    // para las comprobaciones. No exigimos que ambas estén presentes.
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

    // Verificar que el evento esté dentro del periodo de reserva (si es posible)
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

    // Validación de recurrencia
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

    // Validación de horarios
    if (schedules.length === 0) {
      newErrors.schedules = 'Debe haber al menos un horario programado';
    } else {
      // Verificar solapamiento entre horarios
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

    // Validación de imagen
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
      const maxSize = 5 * 1024 * 1024; // 5MB

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

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!validate()) {
      // Scroll al primer error
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

    // Confirmación antes de crear
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

    // Si el espacio seleccionado es en CUC, mostrar modal de confirmación final con checklist
    let confirmResult = true;

    if (selectedRoomIsCUC) {
      confirmResult = await mostrarModalConfirmacionFinal();
    } else {
      // Para espacios no CUC, mostrar confirmación normal
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

    // Si confirma, proceder con el envío
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      // Si no se especificó reservationFrom/To, usar eventFrom/eventTo
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

    // Adjuntar schedules
    const schedulesToSend = schedules.map(s => ({
      eventFrom: s.eventFrom,
      eventTo: s.eventTo,
      reservationFrom: s.reservationFrom || s.eventFrom,
      reservationTo: s.reservationTo || s.eventTo,
    }));

    if (schedulesToSend.length > 0) {
      data.append('schedules', JSON.stringify(schedulesToSend));
    }

    // Agregar status por defecto
    data.append('status', 'pending');
    // Agregar método de pago si fue seleccionado
    if (formData.paymentMethod) {
      data.append('paymentMethod', formData.paymentMethod);
    }

    try {
      // Mostrar loader durante el envío
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

      // Cerrar loader y mostrar modal de éxito
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

      // Limpiar formulario y ejecutar callback
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
      setActiveSection(0);
      setSelectedRoomIsCUC(false);

      // Resetear referencias
      previousSchedulesHashRef.current = '';
      isFirstGenerationRef.current = true;
      lastChangeWasManualRef.current = false;

      if (onEventCreated) {
        onEventCreated(response.data);
      }
    } catch (error) {
      Swal.close(); // Cerrar loader en caso de error
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

  const nextSection = () => {
    // Validar sección actual antes de avanzar
    let currentSectionValid = true;
    const newErrors = {};

    switch (activeSection) {
      case 0: // Espacio
        if (!formData.roomId) {
          newErrors.roomId = 'Selecciona un espacio para continuar.';
          currentSectionValid = false;
        }
        break;
      case 1: // Información básica
        if (!formData.name.trim()) {
          newErrors.name = 'El nombre del evento es requerido.';
          currentSectionValid = false;
        }
        if (!formData.description.trim()) {
          newErrors.description = 'La descripción es requerida.';
          currentSectionValid = false;
        }
        if (!formData.capacity) {
          newErrors.capacity = 'La capacidad es requerida.';
          currentSectionValid = false;
        }
        if (!formData.cost) {
          newErrors.cost = 'El costo es requerido.';
          currentSectionValid = false;
        }
        if (!formData.contact) {
          newErrors.contact = 'El contacto es requerido.';
          currentSectionValid = false;
        }
        // Validar método de pago si aplica
        if (formData.roomId) {
          const selectedRoom = rooms.find(r => r.id == formData.roomId);
          const acceptsTransfer = selectedRoom?.acceptsTransfer;
          const acceptsMaterials = selectedRoom?.acceptsMaterials;
          if (
            (acceptsTransfer || acceptsMaterials) &&
            !formData.paymentMethod
          ) {
            newErrors.paymentMethod =
              'Selecciona un método de pago para continuar.';
            currentSectionValid = false;
          }
        }
        break;
      case 2: // Fechas
        if (!formData.eventFrom) {
          newErrors.eventFrom = 'La fecha de inicio es requerida.';
          currentSectionValid = false;
        }
        if (!formData.eventTo) {
          newErrors.eventTo = 'La fecha de fin es requerida.';
          currentSectionValid = false;
        }
        //if (!formData.reservationFrom) {
        //  newErrors.reservationFrom =
        //    'La fecha de inicio de reserva es requerida.';
        //  currentSectionValid = false;
        //}
        //if (!formData.reservationTo) {
        //  newErrors.reservationTo = 'La fecha de fin de reserva es requerida.';
        //  currentSectionValid = false;
        //}
        break;
      case 3: // Recurrencia
        // La validación de recurrencia se hace en validate()
        break;
      case 4: // Imagen
        if (!imageFile) {
          newErrors.imageFile = 'Debes seleccionar una imagen para continuar.';
          currentSectionValid = false;
        }
        break;
      default:
        break;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
    }

    if (currentSectionValid) {
      setActiveSection(prev => Math.min(prev + 1, sections.length - 1));
      // Scroll al inicio de la sección en móvil
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const prevSection = () => {
    setActiveSection(prev => Math.max(prev - 1, 0));
    // Scroll al inicio de la sección en móvil
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-2 sm:my-5 bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header - MEJORADO para móvil */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 sm:px-8 py-3 sm:py-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="flex items-center text-white hover:text-gray-200 transition-colors mr-2 sm:mr-4"
            title="Volver atrás"
          >
            <FaArrowLeft size={isMobile ? 18 : 24} />
          </button>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white text-center flex-1">
            {isMobile ? 'Nueva Reserva' : 'Solicitar Reserva de Espacio'}
          </h2>
        </div>
      </div>

      {/* Progress Steps - MEJORADO para móvil */}
      <div className="px-2 sm:px-8 py-2 sm:py-6 border-b border-gray-200">
        <div className="flex justify-between items-center overflow-x-auto pb-1 sm:pb-2">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isActive = index === activeSection;
            const isCompleted = index < activeSection;

            return (
              <div
                key={section.id}
                className="flex flex-col items-center flex-1 min-w-[50px] sm:min-w-[80px]"
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full border-2 ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 text-gray-500'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </div>
                <span
                  className={`text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1 md:mt-2 font-medium text-center ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {section.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content - MEJORADO para móvil */}
      <form onSubmit={handleSubmit} className="px-3 sm:px-8 py-3 sm:py-6">
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm sm:text-base text-red-700 text-center">
              {error}
            </p>
          </div>
        )}

        {/* Sección 1: Espacio - MEJORADO para móvil */}
        {activeSection === 0 && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-1 sm:gap-2">
              <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
              {isMobile ? 'Selecciona el Espacio' : 'Selecciona el Espacio'}
            </h3>

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Columna izquierda: Select de espacio */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Espacio para el Evento *
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
                    <p className="text-red-500 text-xs sm:text-sm mt-1">
                      {errors.roomId}
                    </p>
                  )}
                </div>

                {/* Información adicional sobre el select */}
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-blue-800">
                        <strong>Tip:</strong> Selecciona el espacio que mejor se
                        adapte al tamaño de tu evento.
                      </p>
                      <p className="text-[10px] sm:text-xs text-blue-800 mt-1">
                        Los espacios marcados con <strong>(CUC)</strong> están
                        en la Ciudad Universitaria.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha: Detalles del espacio seleccionado - OCULTO en móvil muy pequeño */}
              {!isMobile && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 pb-2 border-b">
                      Detalles del Espacio
                    </h4>

                    {formData.roomId ? (
                      <div className="space-y-4">
                        {(() => {
                          const selectedRoom = rooms.find(
                            room => room.id == formData.roomId
                          );
                          if (!selectedRoom) return null;

                          return (
                            <>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    Nombre:
                                  </span>
                                  <span className="text-sm font-semibold text-blue-600">
                                    {selectedRoom.name}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    Capacidad:
                                  </span>
                                  <span className="text-sm font-semibold text-gray-800">
                                    {selectedRoom.capacity} personas
                                  </span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    Ubicación:
                                  </span>
                                  <span className="text-sm font-semibold text-gray-800">
                                    {selectedRoom.location}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center">
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
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      Ubicación:
                                    </span>
                                    <span className="text-sm font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                      Ciudad Universitaria (CUC)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                          <InformationCircleIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">
                          Selecciona un espacio para ver sus detalles
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sección 2: Información Básica - MEJORADO para móvil */}
        {activeSection === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-1 sm:gap-2">
              <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
              {isMobile ? 'Información Básica' : 'Información del Evento'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Nombre del Evento *
                </label>
                <InputWithIcon
                  icon={DocumentTextIcon}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Conferencia"
                  error={errors.name}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.name}
                  </p>
                )}
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                  {formData.name.length}/200
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Capacidad Esperada *
                </label>
                <InputWithIcon
                  icon={UserGroupIcon}
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Ej: 50"
                  min="1"
                  max="10000"
                  error={errors.capacity}
                />
                {errors.capacity && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.capacity}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Costo del Evento *
                </label>
                <InputWithIcon
                  icon={CurrencyDollarIcon}
                  type="text"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder="Ej: $1,000"
                  error={errors.cost}
                />
                {errors.cost && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.cost}
                  </p>
                )}
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                  {formData.cost.length}/100
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Contacto *
                </label>
                <InputWithIcon
                  icon={UserIcon}
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  error={errors.contact}
                />
                {errors.contact && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.contact}
                  </p>
                )}
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                  {formData.contact.length}/500
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Método de Pago *
                </label>
                {(() => {
                  const selectedRoom = rooms.find(r => r.id == formData.roomId);
                  const acceptsTransfer = selectedRoom?.acceptsTransfer;
                  const acceptsMaterials = selectedRoom?.acceptsMaterials;

                  if (!formData.roomId) {
                    return (
                      <p className="text-xs sm:text-sm text-gray-500">
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
                      <p className="text-xs sm:text-sm text-yellow-700">
                        Este espacio no permite métodos de pago configurados.
                      </p>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                      {options.map(opt => (
                        <label
                          key={opt.value}
                          className="inline-flex items-center gap-1 sm:gap-2"
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={opt.value}
                            checked={formData.paymentMethod === opt.value}
                            onChange={e =>
                              setFormData(prev => ({
                                ...prev,
                                paymentMethod: e.target.value,
                              }))
                            }
                            className="form-radio h-3 w-3 sm:h-4 sm:w-4"
                          />
                          <span className="text-xs sm:text-sm text-gray-700">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                      {errors.paymentMethod && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">
                          {errors.paymentMethod}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Descripción del Evento *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={isMobile ? 3 : 4}
                  className={`block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe los detalles..."
                  maxLength={5000}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                  {formData.description.length}/5000
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Requerimientos Especiales
                </label>
                <textarea
                  name="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={handleChange}
                  rows={isMobile ? 3 : 4}
                  className={`block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.specialRequirements
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Ej: Necesito exoneración, montaje de audio, acceso para personas con movilidad reducida, vigilancia adicional, estacionamiento para 2 vehículos, requerimiento de energía eléctrica, etc."
                  maxLength={2000}
                />
                {errors.specialRequirements && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.specialRequirements}
                  </p>
                )}
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                  {formData.specialRequirements.length}/2000
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sección 3: Fechas y Horarios - MEJORADO para móvil */}
        {activeSection === 2 && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-1 sm:gap-2">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
              Fechas y Horarios
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-medium text-gray-700 border-b pb-1 sm:pb-2 text-sm sm:text-base">
                  Duración del Evento *
                </h4>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Inicio del Evento
                  </label>
                  <InputWithIcon
                    icon={CalendarIcon}
                    type="datetime-local"
                    name="eventFrom"
                    value={formData.eventFrom}
                    onChange={handleChange}
                    min={getMinDateTime()}
                    max={getMaxDateTime()}
                    error={errors.eventFrom}
                  />
                  {errors.eventFrom && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">
                      {errors.eventFrom}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Fin del Evento
                  </label>
                  <InputWithIcon
                    icon={CalendarIcon}
                    type="datetime-local"
                    name="eventTo"
                    value={formData.eventTo}
                    onChange={handleChange}
                    min={formData.eventFrom || getMinDateTime()}
                    max={getMaxDateTime()}
                    error={errors.eventTo}
                  />
                  {errors.eventTo && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">
                      {errors.eventTo}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-medium text-gray-700 border-b pb-1 sm:pb-2 text-sm sm:text-base">
                  Período de Reserva
                </h4>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Inicio de la Reserva
                  </label>
                  <InputWithIcon
                    icon={CalendarIcon}
                    type="datetime-local"
                    name="reservationFrom"
                    value={formData.reservationFrom}
                    onChange={handleChange}
                    min={getMinDateTime()}
                    max={formData.eventFrom || getMaxDateTime()}
                    error={errors.reservationFrom}
                  />
                  {errors.reservationFrom && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">
                      {errors.reservationFrom}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Fin de la Reserva
                  </label>
                  <InputWithIcon
                    icon={CalendarIcon}
                    type="datetime-local"
                    name="reservationTo"
                    value={formData.reservationTo}
                    onChange={handleChange}
                    min={formData.reservationFrom || getMinDateTime()}
                    max={getMaxDateTime()}
                    error={errors.reservationTo}
                  />
                  {errors.reservationTo && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">
                      {errors.reservationTo}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm text-blue-800">
                    <strong>Nota:</strong> El período de reserva debe cubrir
                    completamente el evento.
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Las fechas de reserva pueden dejarse vacías; si no se especifican,
              se usarán las fechas de inicio y fin del evento.
            </p>
          </div>
        )}

        {/* Sección 4: Recurrencia - MEJORADO para móvil */}
        {activeSection === 3 && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-1 sm:gap-2">
              <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
              Configuración de Recurrencia
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">
                      <FaSyncAlt className="inline mr-1 sm:mr-2 text-purple-500 text-xs sm:text-sm" />
                      Activar recurrencia
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recurrenceConfig.active}
                        onChange={e =>
                          handleRecurrenceChange('active', e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {recurrenceConfig.active && (
                    <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4 p-3 sm:p-4 bg-white rounded-lg border">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Días de la semana
                        </label>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {weekDays.map(day => (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => toggleDaySelection(day.id)}
                              className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                                recurrenceConfig.daysOfWeek.includes(day.id)
                                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                              title={day.name}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                        {errors.recurrenceDays && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.recurrenceDays}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Frecuencia
                          </label>
                          <select
                            value={recurrenceConfig.frequency}
                            onChange={e =>
                              handleRecurrenceChange(
                                'frequency',
                                e.target.value
                              )
                            }
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="weekly">Semanal</option>
                            <option value="biweekly">Quincenal</option>
                            <option value="monthly">Mensual</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Repetir hasta
                          </label>
                          <input
                            type="date"
                            value={recurrenceConfig.repeatUntil}
                            onChange={e =>
                              handleRecurrenceChange(
                                'repeatUntil',
                                e.target.value
                              )
                            }
                            min={
                              formData.eventFrom
                                ? formData.eventFrom.split('T')[0]
                                : undefined
                            }
                            className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.recurrenceUntil
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                          />
                          {errors.recurrenceUntil && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.recurrenceUntil}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                      Horarios Generados
                    </label>
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                        schedules.length > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {schedules.length} horario(s)
                    </span>
                  </div>

                  {errors.schedules && (
                    <p className="mb-2 text-xs text-red-600">
                      {errors.schedules}
                    </p>
                  )}

                  {schedules.length > 0 ? (
                    <div className="max-h-60 sm:max-h-96 overflow-y-auto space-y-1 sm:space-y-2">
                      {schedules.map((schedule, index) => (
                        <div
                          key={index}
                          className="bg-white p-2 sm:p-3 border rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-1 sm:mb-2">
                            <span className="font-medium text-[10px] sm:text-xs text-gray-700">
                              Horario {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSchedule(index)}
                              className="text-red-500 hover:text-red-700 text-[10px] sm:text-xs"
                            >
                              <FaTimes />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-1 sm:gap-2 text-[10px] sm:text-xs">
                            <div>
                              <span className="font-medium">Evento:</span>
                              <span className="text-gray-600 ml-1">
                                {new Date(schedule.eventFrom)
                                  .toLocaleString()
                                  .slice(0, -3)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Reserva:</span>
                              <span className="text-gray-600 ml-1">
                                {new Date(schedule.reservationFrom)
                                  .toLocaleString()
                                  .slice(0, -3)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 sm:py-6 text-gray-500 bg-white rounded border">
                      <FaCalendarAlt className="text-xl sm:text-3xl mx-auto mb-1 sm:mb-2 text-gray-400" />
                      <p className="text-[10px] sm:text-xs">
                        No hay horarios programados.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección 5: Imagen - MEJORADO para móvil */}
        {activeSection === 4 && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-1 sm:gap-2">
              <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
              Imagen del Evento
            </h3>

            <div>
              <PhotoIcon className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-2 sm:mb-4" />
              <ImageUploadArea
                imageFile={imageFile}
                onFileChange={handleImageChange}
              />
              {errors.imageFile && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">
                  {errors.imageFile}
                </p>
              )}

              {imagePreview && (
                <div className="mt-3 sm:mt-4 flex justify-center">
                  <img
                    src={imagePreview}
                    alt="Previsualización"
                    className="max-w-full h-auto max-h-32 sm:max-h-48 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
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

        {/* Sección 6: Revisión - MEJORADO para móvil */}
        {activeSection === 5 && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-1 sm:gap-2">
              <ClipboardDocumentCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
              Resumen de la Reserva
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-gray-50 p-3 sm:p-6 rounded-lg space-y-2 sm:space-y-4">
                <h4 className="font-bold text-gray-800 text-sm sm:text-base">
                  Información del Evento
                </h4>
                <div className="space-y-1.5 sm:space-y-3">
                  <div>
                    <span className="font-medium text-gray-700 text-xs sm:text-sm">
                      Nombre:
                    </span>
                    <p className="text-gray-600 text-xs sm:text-sm truncate">
                      {formData.name || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 text-xs sm:text-sm">
                      Espacio:
                    </span>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {rooms.find(r => r.id == formData.roomId)?.name ||
                        'No seleccionado'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">
                        Capacidad:
                      </span>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        {formData.capacity || 'No especificada'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">
                        Costo:
                      </span>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        {formData.cost || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-6 rounded-lg space-y-2 sm:space-y-4">
                <h4 className="font-bold text-gray-800 text-sm sm:text-base">
                  Fechas y Horarios
                </h4>
                <div className="space-y-1.5 sm:space-y-3">
                  <div>
                    <span className="font-medium text-gray-700 text-xs sm:text-sm">
                      Total de Horarios:
                    </span>
                    <p className="text-gray-600 font-bold text-xs sm:text-sm ml-1">
                      {schedules.length} horario(s)
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 text-xs sm:text-sm">
                      Recurrencia:
                    </span>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {recurrenceConfig.active
                        ? `Sí - ${recurrenceConfig.daysOfWeek.length} día(s)`
                        : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Previsualización de Imagen */}
            {imagePreview && (
              <div className="bg-gray-50 p-3 sm:p-6 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-2 sm:mb-4 text-sm sm:text-base">
                  Imagen del Evento
                </h4>
                <div className="flex justify-center">
                  <img
                    src={imagePreview}
                    alt="Previsualización"
                    className="max-w-full h-auto max-h-24 sm:max-h-32 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              </div>
            )}

            {selectedRoomIsCUC && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded-lg">
                <div className="flex items-start gap-2 sm:gap-3">
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
        )}

        {/* Navigation Buttons - MEJORADO para móvil */}
        <div className="flex justify-between mt-4 sm:mt-6 md:mt-8 pt-3 sm:pt-4 md:pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevSection}
            disabled={activeSection === 0}
            className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm md:text-base ${
              activeSection === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Anterior
          </button>

          {activeSection < sections.length - 1 ? (
            <button
              type="button"
              onClick={nextSection}
              className="bg-blue-600 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm md:text-base hover:bg-blue-700 transition-colors"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || schedules.length === 0}
              className={`px-3 sm:px-4 md:px-8 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm md:text-base ${
                isSubmitting || schedules.length === 0
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white transition-colors`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Creando...</span>
                  <span className="sm:hidden">...</span>
                </span>
              ) : (
                `Crear ${schedules.length} ${isMobile ? 'Evento' : 'Evento' + (schedules.length !== 1 ? 's' : '')}`
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddEventForm;
