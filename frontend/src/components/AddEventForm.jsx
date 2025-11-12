import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from 'sweetalert2';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  UserIcon,
  PhotoIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import InputWithIcon from './InputWithIcon';
import SelectWithIcon from './SelectWithIcon';
import ImageUploadArea from './ImageUploadArea';

const AddEventForm = ({ onEventCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    cost: '',
    contact: '',
    eventFrom: '',
    eventTo: '',
    reservationFrom: '',
    reservationTo: '',
    roomId: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [rooms, setRooms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [selectedRoomIsCUC, setSelectedRoomIsCUC] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const sections = [
    { id: 'space', title: 'Espacio', icon: MapPinIcon },
    { id: 'basic', title: 'Información Básica', icon: InformationCircleIcon },
    { id: 'dates', title: 'Fechas y Horarios', icon: CalendarIcon },
    { id: 'image', title: 'Imagen', icon: PhotoIcon },
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
      'La mayoría de las actividades requieren que se gestionen con antelación (1 semana a 1 mes)',
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

  // Manejar volver atrás
  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

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

  // Usar useCallback para evitar recrear la función en cada render
  const handleChange = useCallback(
    e => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: '' }));
      setError('');

      // Si se cambia el roomId, verificar si es un espacio en CUC
      if (name === 'roomId' && value) {
        const selectedRoom = rooms.find(room => room.id == value);
        if (selectedRoom && selectedRoom.isInCUC) {
          setSelectedRoomIsCUC(true);
          // Mostrar modal de protocolo CUC
          mostrarModalProtocoloCUC();
        } else {
          setSelectedRoomIsCUC(false);
        }
      }
    },
    [rooms]
  );

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
      width: '600px',
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
            <p class="text-xs text-gray-600">Aval de COPRED puede ser requerido</p>
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
      width: '650px',
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
  };

  // Función para calcular fecha mínima (ahora + 1 hora)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  // Función para calcular fecha máxima (1 año desde ahora)
  const getMaxDateTime = () => {
    const now = new Date();
    now.setFullYear(now.getFullYear() + 1);
    return now.toISOString().slice(0, 16);
  };

  const validate = () => {
    const newErrors = {};
    const now = new Date();

    const eventFromDate = new Date(formData.eventFrom);
    const eventToDate = new Date(formData.eventTo);
    const reservationFromDate = new Date(formData.reservationFrom);
    const reservationToDate = new Date(formData.reservationTo);

    if (!formData.name.trim())
      newErrors.name = 'El nombre del evento es requerido.';
    if (!formData.eventFrom)
      newErrors.eventFrom = 'La fecha y hora de inicio son requeridas.';
    else if (eventFromDate < now)
      newErrors.eventFrom = 'La fecha no puede estar en el pasado.';

    if (!formData.eventTo)
      newErrors.eventTo = 'La fecha y hora de fin son requeridas.';
    else if (eventToDate <= eventFromDate)
      newErrors.eventTo = 'Debe ser posterior al inicio.';

    if (!formData.reservationFrom)
      newErrors.reservationFrom = 'La fecha de inicio de reserva es requerida.';
    if (!formData.reservationTo)
      newErrors.reservationTo = 'La fecha de fin de reserva es requerida.';

    if (reservationFromDate > eventFromDate)
      newErrors.reservationFrom = 'No puede iniciar después del evento.';
    if (reservationToDate < eventToDate)
      newErrors.reservationTo = 'No puede finalizar antes del evento.';
    if (!formData.roomId)
      newErrors.roomId = 'Selecciona un espacio para el evento.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setError('');

    // Validar que se haya seleccionado una imagen
    if (!imageFile) {
      setError('Por favor, selecciona una imagen para el evento.');
      setIsSubmitting(false);
      return;
    }

    if (validate()) {
      // Si el espacio seleccionado es en CUC, mostrar modal de confirmación final con checklist
      let confirmResult = true;

      if (selectedRoomIsCUC) {
        confirmResult = await mostrarModalConfirmacionFinal();
      } else {
        // Para espacios no CUC, mostrar confirmación normal
        confirmResult = await Swal.fire({
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
          width: '500px',
        });
        confirmResult = confirmResult.isConfirmed;
      }

      if (!confirmResult) {
        setIsSubmitting(false);
        return;
      }

      // Si confirma, proceder con el envío
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (imageFile) data.append('imageFile', imageFile);

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
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
          width: '500px',
        });

        // Limpiar formulario y ejecutar callback
        setFormData({
          name: '',
          description: '',
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
        setActiveSection(0);
        setSelectedRoomIsCUC(false);
        onEventCreated(response.data);
      } catch (error) {
        Swal.close(); // Cerrar loader en caso de error
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.errors?.join(', ') ||
          'Error al crear el evento. Por favor, intente nuevamente.';
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setError('Por favor, corrige los errores en el formulario.');
      setIsSubmitting(false);
    }
  };

  const nextSection = () => {
    // Validar sección actual antes de avanzar
    let currentSectionValid = true;

    switch (activeSection) {
      case 0: // Espacio
        if (!formData.roomId) {
          setErrors(prev => ({
            ...prev,
            roomId: 'Selecciona un espacio para continuar.',
          }));
          currentSectionValid = false;
        }
        break;
      case 1: // Información básica
        if (!formData.name.trim()) {
          setErrors(prev => ({
            ...prev,
            name: 'El nombre del evento es requerido.',
          }));
          currentSectionValid = false;
        }
        if (!formData.capacity) {
          setErrors(prev => ({
            ...prev,
            capacity: 'La capacidad es requerida.',
          }));
          currentSectionValid = false;
        }
        if (!formData.cost) {
          setErrors(prev => ({ ...prev, cost: 'El costo es requerido.' }));
          currentSectionValid = false;
        }
        if (!formData.contact) {
          setErrors(prev => ({
            ...prev,
            contact: 'El contacto es requerido.',
          }));
          currentSectionValid = false;
        }
        break;
      case 2: // Fechas
        if (!formData.eventFrom) {
          setErrors(prev => ({
            ...prev,
            eventFrom: 'La fecha de inicio es requerida.',
          }));
          currentSectionValid = false;
        }
        if (!formData.eventTo) {
          setErrors(prev => ({
            ...prev,
            eventTo: 'La fecha de fin es requerida.',
          }));
          currentSectionValid = false;
        }
        if (!formData.reservationFrom) {
          setErrors(prev => ({
            ...prev,
            reservationFrom: 'La fecha de inicio de reserva es requerida.',
          }));
          currentSectionValid = false;
        }
        if (!formData.reservationTo) {
          setErrors(prev => ({
            ...prev,
            reservationTo: 'La fecha de fin de reserva es requerida.',
          }));
          currentSectionValid = false;
        }
        break;
      default:
        break;
    }

    if (currentSectionValid) {
      setActiveSection(prev => Math.min(prev + 1, sections.length - 1));
    }
  };

  const prevSection = () => setActiveSection(prev => Math.max(prev - 1, 0));

  return (
    <div className="max-w-4xl mx-auto my-5 bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-8 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-white hover:text-gray-200 transition-colors mr-4"
            title="Volver atrás"
          >
            <FaArrowLeft size={24} />
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center flex-1">
            Solicitar Reserva de Espacio
          </h2>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isActive = index === activeSection;
            const isCompleted = index < activeSection;

            return (
              <div
                key={section.id}
                className="flex flex-col items-center flex-1"
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                {/* Ocultar texto en móvil, mostrar en sm y arriba */}
                <span
                  className={`text-xs sm:text-sm mt-1 sm:mt-2 font-medium hidden sm:block ${
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

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="px-4 sm:px-8 py-4 sm:py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}

        {/* Sección 1: Espacio */}
        {activeSection === 0 && (
          <div className="space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Selecciona el Espacio
            </h3>

            {selectedRoomIsCUC && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800 font-semibold mb-1">
                      Espacio en Patrimonio Mundial - CUC
                    </p>
                    <p className="text-xs text-yellow-700">
                      Este espacio está sujeto al Protocolo de Uso de la Ciudad
                      Universitaria de Caracas
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    {room.name} - Capacidad: {room.capacity} personas
                    {room.isInCUC && ' (CUC)'}
                  </option>
                ))}
              </SelectWithIcon>
              {errors.roomId && (
                <p className="text-red-500 text-sm mt-1">{errors.roomId}</p>
              )}
            </div>

            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm text-blue-800">
                    <strong>Tip:</strong> Selecciona el espacio que mejor se
                    adapte al tamaño y necesidades de tu evento.
                  </p>
                  <p className="text-xs sm:text-sm text-blue-800 mt-1">
                    Los espacios marcados con <strong>(CUC)</strong> están en la
                    Ciudad Universitaria y tienen normativas especiales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resto del código del formulario se mantiene igual */}
        {/* ... (las otras secciones permanecen sin cambios) ... */}

        {/* Sección 2: Información Básica */}
        {activeSection === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <InformationCircleIcon className="w-6 h-6 text-blue-600" />
              Información del Evento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Evento *
                </label>
                <InputWithIcon
                  icon={InformationCircleIcon}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Conferencia de Tecnología"
                  error={errors.name}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  error={errors.capacity}
                />
                {errors.capacity && (
                  <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo del Evento *
                </label>
                <InputWithIcon
                  icon={CurrencyDollarIcon}
                  type="text"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder="Ej: $1,000.00"
                  error={errors.cost}
                />
                {errors.cost && (
                  <p className="text-red-500 text-sm mt-1">{errors.cost}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contacto *
                </label>
                <InputWithIcon
                  icon={UserIcon}
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez - 555-1234"
                  error={errors.contact}
                />
                {errors.contact && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Evento
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe los detalles de tu evento..."
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sección 3: Fechas y Horarios */}
        {activeSection === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              Fechas y Horarios
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 border-b pb-2">
                  Duración del Evento *
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <p className="text-red-500 text-sm mt-1">
                      {errors.eventFrom}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <p className="text-red-500 text-sm mt-1">
                      {errors.eventTo}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 border-b pb-2">
                  Período de Reserva *
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <p className="text-red-500 text-sm mt-1">
                      {errors.reservationFrom}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <p className="text-red-500 text-sm mt-1">
                      {errors.reservationTo}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Nota:</strong> El período de reserva debe cubrir
                    completamente la duración del evento.
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Ejemplo:</strong> Si tu evento es de 2:00 PM a 5:00
                    PM, la reserva podría ser de 1:00 PM a 6:00 PM.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección 4: Imagen */}
        {activeSection === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <PhotoIcon className="w-6 h-6 text-blue-600" />
              Imagen del Evento
            </h3>

            <div>
              <PhotoIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <ImageUploadArea
                imageFile={imageFile}
                onFileChange={handleImageChange}
              />
            </div>

            {!imageFile && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> Debes seleccionar una imagen
                      antes de enviar el formulario.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800">
                    <strong>Recomendación:</strong> Usa una imagen atractiva que
                    represente tu evento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevSection}
            disabled={activeSection === 0}
            className={`px-4 sm:px-6 py-2 rounded-lg font-medium text-sm sm:text-base ${
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
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium text-sm sm:text-base hover:bg-blue-700 transition-colors"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !imageFile}
              className={`px-4 sm:px-8 py-2 rounded-lg font-medium text-sm sm:text-base ${
                isSubmitting || !imageFile
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white transition-colors`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Creando Reserva...</span>
                  <span className="sm:hidden">Creando...</span>
                </span>
              ) : (
                'Crear Reserva'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddEventForm;
