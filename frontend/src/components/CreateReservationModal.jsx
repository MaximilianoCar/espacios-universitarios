import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from '../utils/swal';
import {
  FaCalendarAlt,
  FaUsers,
  FaDollarSign,
  FaMapPin,
  FaFileAlt,
  FaUser,
  FaFileImage,
  FaClipboardCheck,
  FaSyncAlt,
  FaTimes,
  FaCalendar,
  FaInfoCircle,
} from 'react-icons/fa';

const CreateReservationModal = ({ isOpen, onClose, onReservationCreated }) => {
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    specialRequirements: '',
    capacity: '',
    cost: '',
    contact: '',
    roomId: '',
    eventFrom: '',
    eventTo: '',
    reservationFrom: '',
    reservationTo: '',
    imageFile: null,
    paymentMethod: '',
  });

  // Configuración simplificada de recurrencia
  const [recurrenceConfig, setRecurrenceConfig] = useState({
    active: false,
    frequency: 'weekly',
    daysOfWeek: [],
    repeatUntil: '',
  });

  const [schedules, setSchedules] = useState([]);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [activeSection, setActiveSection] = useState('basic');

  // Referencias para controlar la generación de horarios
  const previousSchedulesHashRef = useRef('');
  const isFirstGenerationRef = useRef(true);
  const lastChangeWasManualRef = useRef(false);

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

  // Cargar las salas disponibles
  useEffect(() => {
    if (isOpen) {
      fetchRooms();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      specialRequirements: '',
      capacity: '',
      cost: '',
      contact: '',
      roomId: '',
      eventFrom: '',
      eventTo: '',
      reservationFrom: '',
      reservationTo: '',
      imageFile: null,
      paymentMethod: '',
    });
    setRecurrenceConfig({
      active: false,
      frequency: 'weekly',
      daysOfWeek: [],
      repeatUntil: '',
    });
    setSchedules([]);
    setErrors({});
    setImagePreview(null);
    setActiveSection('basic');
    // Resetear las referencias
    previousSchedulesHashRef.current = '';
    isFirstGenerationRef.current = true;
    lastChangeWasManualRef.current = false;
  };

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await axiosInstance.get('/rooms');
      setRooms(response.data || []);
    } catch (error) {
      console.error('Error al cargar las salas:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar las salas disponibles',
        icon: 'error',
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setLoadingRooms(false);
    }
  };

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
  const generateRecurringSchedules = () => {
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
  };

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
  }, [formData.eventFrom, formData.eventTo, recurrenceConfig]);

  const handleChange = e => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      const file = files[0];
      setFormData({
        ...formData,
        [name]: file,
      });

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

      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Limpiar error del campo cuando se modifica
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleRecurrenceChange = (field, value) => {
    // Simplificar recurrencia: solo semanal y usar el día de formData.eventFrom
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
        setRecurrenceConfig(prev => ({
          ...prev,
          active: true,
          daysOfWeek: [day],
          frequency: 'weekly',
        }));
      } else {
        setRecurrenceConfig(prev => ({
          ...prev,
          active: false,
          daysOfWeek: [],
          frequency: 'weekly',
        }));
      }
      return;
    }

    // Para otros cambios, mantener inmutabilidad (frequency no editable)
    setRecurrenceConfig(prev => ({ ...prev, [field]: value }));
  };

  // Si cambia la fecha de inicio y la recurrencia está activa, ajustar el día
  useEffect(() => {
    if (recurrenceConfig.active && formData.eventFrom) {
      const day = new Date(formData.eventFrom).getDay();
      setRecurrenceConfig(prev => ({
        ...prev,
        daysOfWeek: [day],
        frequency: 'weekly',
      }));
    }
  }, [formData.eventFrom]);

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

  const validateForm = () => {
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

    // Método de pago obligatorio en este modal
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Selecciona un método de pago';
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

    // Validación de fechas de reserva
    if (formData.reservationFrom && formData.reservationTo) {
      const reservationFrom = new Date(formData.reservationFrom);
      const reservationTo = new Date(formData.reservationTo);

      if (reservationFrom >= reservationTo) {
        newErrors.reservationTo =
          'La fecha de fin de reserva debe ser posterior a la fecha de inicio';
      }
    }

    // Validar que el evento esté dentro del rango de reserva
    if (formData.eventFrom && formData.reservationFrom) {
      const eventFrom = new Date(formData.eventFrom);
      const reservationFrom = new Date(formData.reservationFrom);

      if (eventFrom < reservationFrom) {
        newErrors.eventFrom =
          'El evento debe comenzar después del inicio de la reserva';
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
    if (!formData.imageFile) {
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

      if (!allowedTypes.includes(formData.imageFile.type)) {
        newErrors.imageFile =
          'Solo se permiten imágenes (JPEG, JPG, PNG, GIF, WebP)';
      }

      if (formData.imageFile.size > maxSize) {
        newErrors.imageFile = 'La imagen no debe exceder los 5MB';
      }
    }

    setErrors(newErrors);
    return { valid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  // Valida una sección específica; devuelve { valid, errors }
  const validateSection = sectionId => {
    const sectionFields = {
      basic: [
        'name',
        'description',
        'capacity',
        'cost',
        'contact',
        'roomId',
        'paymentMethod',
        'imageFile',
      ],
      dates: [
        'eventFrom',
        'eventTo',
        'reservationFrom',
        'reservationTo',
        'schedules',
      ],
      recurrence: ['recurrenceDays', 'recurrenceUntil'],
      review: [],
    };

    const fullResult = validateForm();
    const keys = Object.keys(fullResult.errors || {});
    const filtered = keys.filter(k => sectionFields[sectionId].includes(k));
    const filteredErrors = {};
    filtered.forEach(k => (filteredErrors[k] = fullResult.errors[k]));

    return {
      valid: Object.keys(filteredErrors).length === 0,
      errors: filteredErrors,
    };
  };

  const handleSectionClick = targetSection => {
    if (targetSection === activeSection) return;

    const order = ['basic', 'dates', 'recurrence', 'review'];
    const currentIndex = order.indexOf(activeSection);
    const targetIndex = order.indexOf(targetSection);

    // Permitimos retroceder sin validación
    if (targetIndex < currentIndex) {
      setActiveSection(targetSection);
      return;
    }

    // Si avanzamos, validar la sección actual
    const sectionResult = validateSection(activeSection);
    if (sectionResult.valid) {
      setActiveSection(targetSection);
    } else {
      const firstField = Object.keys(sectionResult.errors)[0];
      Swal.fire({
        title: 'Corrige errores',
        text: 'Hay errores en esta sección. Por favor corrígelos antes de avanzar.',
        icon: 'error',
      });
      const el = document.querySelector(`[name="${firstField}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const fullValidation = validateForm();
    if (!fullValidation.valid) {
      const firstErrorField = Object.keys(fullValidation.errors)[0];

      const fieldToSection = field => {
        const basic = [
          'name',
          'description',
          'capacity',
          'cost',
          'contact',
          'roomId',
          'paymentMethod',
          'imageFile',
        ];
        const dates = [
          'eventFrom',
          'eventTo',
          'reservationFrom',
          'reservationTo',
          'schedules',
        ];
        const recurrence = ['recurrenceDays', 'recurrenceUntil'];

        if (basic.includes(field)) return 'basic';
        if (dates.includes(field)) return 'dates';
        if (recurrence.includes(field)) return 'recurrence';
        return 'basic';
      };

      const section = fieldToSection(firstErrorField);
      setActiveSection(section);

      const errorElement = document.querySelector(
        `[name="${firstErrorField}"]`
      );
      if (errorElement) {
        setTimeout(() => {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }, 300);
      }

      Swal.fire({
        title: 'Corrige los errores',
        text: 'Hay errores en el formulario. Revisa los campos marcados en rojo.',
        icon: 'error',
      });
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
    });

    if (!result.isConfirmed) {
      return;
    }

    setSubmitting(true);

    // Crear FormData para enviar
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('capacity', formData.capacity);
    data.append('cost', formData.cost);
    data.append('contact', formData.contact);
    data.append('roomId', formData.roomId);
    data.append('eventFrom', formData.eventFrom);
    data.append('eventTo', formData.eventTo);
    data.append('reservationFrom', formData.reservationFrom);
    data.append('reservationTo', formData.reservationTo);
    data.append('status', 'pending');

    // Adjuntar método de pago
    if (formData.paymentMethod) {
      data.append('paymentMethod', formData.paymentMethod);
    }

    if (formData.specialRequirements) {
      data.append('specialRequirements', formData.specialRequirements);
    }

    if (formData.imageFile) {
      data.append('imageFile', formData.imageFile);
    }

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

    try {
      await axiosInstance.post('/events', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Swal.fire({
        title: '¡Reserva creada!',
        text: `Se creó${schedules.length > 1 ? 'n' : ''} ${schedules.length} evento${schedules.length > 1 ? 's' : ''} exitosamente.`,
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });

      // Notificar al componente padre para refrescar
      if (onReservationCreated) {
        onReservationCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error al crear la reserva:', error);

      let errorMessage = 'Hubo un error al crear la reserva';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#d33',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Verificar si hay datos sin guardar
    const hasUnsavedData =
      Object.values(formData).some(
        value => value && (typeof value !== 'object' || value instanceof File)
      ) ||
      schedules.length > 0 ||
      recurrenceConfig.active;

    if (hasUnsavedData) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Tienes datos sin guardar. ¿Seguro que quieres cerrar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Cancelar',
      }).then(result => {
        if (result.isConfirmed) {
          resetForm();
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Barra de navegación por secciones
  const sectionTabs = [
    { id: 'basic', label: 'Información Básica', icon: FaInfoCircle },
    { id: 'dates', label: 'Fechas', icon: FaCalendarAlt },
    { id: 'recurrence', label: 'Recurrencia', icon: FaSyncAlt },
    { id: 'review', label: 'Revisión', icon: FaClipboardCheck },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Crear Nueva Reserva
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
              disabled={submitting}
            >
              &times;
            </button>
          </div>

          {/* Navegación por secciones */}
          <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
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
                  <Icon className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Sección: Información Básica */}
          {activeSection === 'basic' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna Izquierda */}
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Información del Evento
                  </h3>
                  <p className="text-sm text-blue-600">
                    Completa la información principal del evento.
                  </p>
                </div>

                {/* Nombre del Evento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaFileAlt className="inline mr-2 text-blue-500" />
                    Nombre del Evento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ingrese el nombre del evento"
                    maxLength={200}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.name.length}/200 caracteres
                  </p>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaFileAlt className="inline mr-2 text-blue-500" />
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Describa el evento (máximo 5000 caracteres)"
                    maxLength={5000}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.description ? (
                      <p className="text-sm text-red-600">
                        {errors.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {formData.description.length}/5000 caracteres
                      </p>
                    )}
                  </div>
                </div>

                {/* Requerimientos Especiales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaClipboardCheck className="inline mr-2 text-green-500" />
                    Requerimientos Especiales
                    <span className="text-xs text-gray-500 ml-1">
                      (Opcional)
                    </span>
                  </label>
                  <textarea
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition ${
                      errors.specialRequirements
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Especifique requerimientos especiales como logística, protocolo, vigilancia, estacionamiento, etc. (máximo 2000 caracteres)"
                    maxLength={2000}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.specialRequirements ? (
                      <p className="text-sm text-red-600">
                        {errors.specialRequirements}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {formData.specialRequirements.length}/2000 caracteres
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Detalles Adicionales
                  </h3>
                  <p className="text-sm text-blue-600">
                    Completa los detalles del evento.
                  </p>
                </div>

                {/* Espacio (Room) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaMapPin className="inline mr-2 text-blue-500" />
                    Espacio <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="roomId"
                    value={formData.roomId}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.roomId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loadingRooms}
                  >
                    <option value="">Seleccione un espacio</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                  {loadingRooms && (
                    <p className="mt-1 text-sm text-gray-500">
                      Cargando espacios...
                    </p>
                  )}
                  {errors.roomId && (
                    <p className="mt-1 text-sm text-red-600">{errors.roomId}</p>
                  )}
                </div>

                {/* Información de Contacto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaUser className="inline mr-2 text-blue-500" />
                    Información de Contacto{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.contact ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Información para contactar al organizador"
                    maxLength={500}
                  />
                  {errors.contact && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.contact}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.contact.length}/500 caracteres
                  </p>
                </div>

                {/* Capacidad y Costo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaUsers className="inline mr-2 text-blue-500" />
                      Capacidad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      min="1"
                      max="10000"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
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
                      <FaDollarSign className="inline mr-2 text-blue-500" />
                      Costo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="cost"
                      value={formData.cost}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
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

                {/* Método de Pago (siempre las 3 opciones en este modal) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaDollarSign className="inline mr-2 text-blue-500" />
                    Método de Pago <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={formData.paymentMethod === 'transfer'}
                        onChange={handleChange}
                      />
                      <span className="text-sm">Transferencia</span>
                    </label>

                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="materials"
                        checked={formData.paymentMethod === 'materials'}
                        onChange={handleChange}
                      />
                      <span className="text-sm">Materiales</span>
                    </label>

                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="exoneration"
                        checked={formData.paymentMethod === 'exoneration'}
                        onChange={handleChange}
                      />
                      <span className="text-sm">Exoneración</span>
                    </label>
                  </div>
                  {errors.paymentMethod && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>

                {/* Imagen Obligatoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaFileImage className="inline mr-2 text-blue-500" />
                    Imagen del Evento <span className="text-red-500">*</span>
                  </label>

                  {/* Previsualización de imagen */}
                  {imagePreview && (
                    <div className="mb-3">
                      <img
                        src={imagePreview}
                        alt="Previsualización"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    name="imageFile"
                    onChange={handleChange}
                    accept="image/*"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.imageFile ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.imageFile && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.imageFile}
                    </p>
                  )}
                  {formData.imageFile ? (
                    <div className="mt-2 text-sm">
                      <p className="text-green-600">
                        ✓ Archivo seleccionado: {formData.imageFile.name}
                      </p>
                      <p className="text-gray-500">
                        Tamaño:{' '}
                        {(formData.imageFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-yellow-600">
                      ⚠ Por favor selecciona una imagen (requerido)
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Formatos permitidos: JPEG, JPG, PNG, GIF, WebP. Tamaño
                    máximo: 5MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sección: Fechas */}
          {activeSection === 'dates' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Fechas del Evento Principal
                  </h3>
                  <p className="text-sm text-blue-600">
                    Define las fechas y horas del evento.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaCalendarAlt className="inline mr-2 text-blue-500" />
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
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                            errors.eventFrom
                              ? 'border-red-500'
                              : 'border-gray-300'
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
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                            errors.eventTo
                              ? 'border-red-500'
                              : 'border-gray-300'
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
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Fechas de Reserva
                  </h3>
                  <p className="text-sm text-blue-600">
                    Define el período de reserva del espacio.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaCalendarAlt className="inline mr-2 text-blue-500" />
                      Fechas de Reserva
                      <span className="text-xs text-gray-500 ml-1">
                        (Opcional)
                      </span>
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
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
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
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                            errors.reservationTo
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sección: Recurrencia */}
          {activeSection === 'recurrence' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Configuración de Recurrencia
                  </h3>
                  <p className="text-sm text-blue-600">
                    Configura la recurrencia del evento si es necesario.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div className="flex items-center justify-between mb-4">
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
                          onChange={e =>
                            handleRecurrenceChange('active', e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {recurrenceConfig.active && (
                    <div className="space-y-4 mt-4 p-4 bg-white rounded-lg border">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Días de la semana
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {weekDays.map(day => (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() =>
                                !recurrenceConfig.active &&
                                toggleDaySelection(day.id)
                              }
                              disabled={recurrenceConfig.active}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                recurrenceConfig.daysOfWeek.includes(day.id)
                                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              } ${recurrenceConfig.active ? 'opacity-60 cursor-not-allowed' : ''}`}
                              title={day.name}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                        {errors.recurrenceDays && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.recurrenceDays}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className={`w-full px-3 py-2 border rounded-lg ${
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
                        {recurrenceConfig.frequency === 'weekly' &&
                          'El evento se repetirá semanalmente en los días seleccionados.'}
                        {recurrenceConfig.frequency === 'biweekly' &&
                          'El evento se repetirá cada dos semanas en los días seleccionados.'}
                        {recurrenceConfig.frequency === 'monthly' &&
                          'El evento se repetirá mensualmente el mismo día de la semana seleccionado.'}
                      </div>
                    </div>
                  )}

                  {!recurrenceConfig.active && (
                    <div className="text-center py-4 text-gray-500">
                      <FaCalendar className="text-3xl mx-auto mb-2 text-gray-400" />
                      <p>Sin recurrencia - Se creará un solo evento</p>
                      <p className="text-sm mt-1">
                        Activa la recurrencia para crear múltiples eventos
                        automáticamente
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Horarios Generados
                  </h3>
                  <p className="text-sm text-blue-600">
                    Visualiza los horarios creados automáticamente.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Horarios Programados
                    </label>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        schedules.length > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {schedules.length} horario(s)
                    </span>
                  </div>

                  {errors.schedules && (
                    <p className="mb-2 text-sm text-red-600">
                      {errors.schedules}
                    </p>
                  )}

                  {schedules.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {schedules.map((schedule, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 border rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm text-gray-700">
                              Horario {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSchedule(index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              <FaTimes />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium">Evento:</span>
                              <div className="text-gray-600">
                                {new Date(schedule.eventFrom).toLocaleString()}{' '}
                                - {new Date(schedule.eventTo).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Reserva:</span>
                              <div className="text-gray-600">
                                {new Date(
                                  schedule.reservationFrom
                                ).toLocaleString()}{' '}
                                -{' '}
                                {new Date(
                                  schedule.reservationTo
                                ).toLocaleString()}
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
            </div>
          )}

          {/* Sección: Revisión */}
          {activeSection === 'review' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Resumen de la Reserva
                </h3>
                <p className="text-sm text-blue-600">
                  Revisa toda la información antes de crear la reserva.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <h4 className="font-bold text-gray-800">
                    Información del Evento
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Nombre:</span>
                      <p className="text-gray-600">
                        {formData.name || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Descripción:
                      </span>
                      <p className="text-gray-600 truncate">
                        {formData.description || 'No especificada'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Espacio:
                      </span>
                      <p className="text-gray-600">
                        {rooms.find(r => r.id == formData.roomId)?.name ||
                          'No seleccionado'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">
                          Capacidad:
                        </span>
                        <p className="text-gray-600">
                          {formData.capacity || 'No especificada'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Costo:
                        </span>
                        <p className="text-gray-600">
                          {formData.cost || 'No especificado'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <h4 className="font-bold text-gray-800">Fechas y Horarios</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">
                        Evento Principal:
                      </span>
                      <p className="text-gray-600">
                        {formData.eventFrom
                          ? `${new Date(formData.eventFrom).toLocaleString()} - ${new Date(formData.eventTo).toLocaleString()}`
                          : 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Período de Reserva:
                      </span>
                      <p className="text-gray-600">
                        {formData.reservationFrom
                          ? `${new Date(formData.reservationFrom).toLocaleString()} - ${new Date(formData.reservationTo).toLocaleString()}`
                          : 'Mismas fechas del evento'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Recurrencia:
                      </span>
                      <p className="text-gray-600">
                        {recurrenceConfig.active
                          ? `${recurrenceConfig.frequency === 'weekly' ? 'Semanal' : recurrenceConfig.frequency === 'biweekly' ? 'Quincenal' : 'Mensual'} - ${recurrenceConfig.daysOfWeek.length} día(s)`
                          : 'Sin recurrencia'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Total de Horarios:
                      </span>
                      <p className="text-gray-600 font-bold">
                        {schedules.length} horario(s)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Previsualización de Imagen */}
              {imagePreview && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-4">
                    Imagen del Evento
                  </h4>
                  <div className="flex justify-center">
                    <img
                      src={imagePreview}
                      alt="Previsualización"
                      className="max-w-xs max-h-48 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de navegación y acción */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <span className="text-red-500">*</span> Campos obligatorios
              </div>

              <div className="flex space-x-3">
                {/* Botones de navegación entre secciones */}
                {activeSection !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => {
                      const sections = [
                        'basic',
                        'dates',
                        'recurrence',
                        'review',
                      ];
                      const currentIndex = sections.indexOf(activeSection);
                      if (currentIndex > 0) {
                        setActiveSection(sections[currentIndex - 1]);
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Anterior
                  </button>
                )}

                {activeSection !== 'review' && (
                  <button
                    type="button"
                    onClick={() => {
                      const sections = [
                        'basic',
                        'dates',
                        'recurrence',
                        'review',
                      ];
                      const currentIndex = sections.indexOf(activeSection);
                      if (currentIndex < sections.length - 1) {
                        setActiveSection(sections[currentIndex + 1]);
                      }
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Siguiente
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancelar
                </button>

                {activeSection === 'review' && (
                  <button
                    type="submit"
                    disabled={submitting || schedules.length === 0}
                    className={`px-6 py-2 rounded-lg transition-colors flex items-center ${
                      submitting || schedules.length === 0
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {submitting ? (
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
                        Creando...
                      </>
                    ) : (
                      `Crear ${schedules.length} Evento${schedules.length !== 1 ? 's' : ''}`
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReservationModal;
