import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { updateRoom as updateRoomThunk } from '../features/rooms/roomsSlice';
import {
  FaFileAlt,
  FaUsers,
  FaMapPin,
  FaUser,
  FaFileImage,
  FaArrowLeft,
  FaBuilding,
  FaDollarSign,
  FaWheelchair,
  FaWifi,
  FaToilet,
  FaMicrophoneAlt,
  FaVideo,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaBox,
  FaEdit,
} from 'react-icons/fa';
import getMediaUrl from '../utils/media';

const UpdateRoomModal = ({ isOpen, onClose, room, onRoomUpdated }) => {
  const [submitting, setSubmitting] = useState(false);
  const [currentView, setCurrentView] = useState('room');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    location: '',
    staffowner: '',
    isInCUC: false,
    cost: '0',
    isAccessible: false,
    canExonerate: false,
    hasBathrooms: false,
    hasInternet: false,
    hasAudioEquipment: false,
    hasVideoEquipment: false,
    acceptsTransfer: false,
    acceptsMaterials: false,
    imageFile: null,
  });

  const [dependencies, setDependencies] = useState([]);
  const [selectedDependencyId, setSelectedDependencyId] = useState('');
  const [newDependency, setNewDependency] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImagePath, setCurrentImagePath] = useState(null);
  const dispatch = useDispatch();

  // Inicializar formulario
  useEffect(() => {
    const init = async () => {
      if (!room || !isOpen) return;

      try {
        const depsRes = await axiosInstance.get('/dependencies');
        setDependencies(depsRes.data || []);

        setFormData({
          name: room.name || '',
          description: room.description || '',
          capacity: room.capacity || '',
          location: room.location || '',
          staffowner: room.staffowner || '',
          isInCUC: room.isInCUC || false,
          cost: room.cost || '0',
          isAccessible: room.isAccessible || false,
          canExonerate: room.canExonerate || false,
          hasBathrooms: room.hasBathrooms || false,
          hasInternet: room.hasInternet || false,
          hasAudioEquipment: room.hasAudioEquipment || false,
          hasVideoEquipment: room.hasVideoEquipment || false,
          acceptsTransfer: room.acceptsTransfer || false,
          acceptsMaterials: room.acceptsMaterials || false,
          imageFile: null,
        });

        if (room.imagePath) {
          const imageUrl = getMediaUrl(room.imagePath);
          setImagePreview(imageUrl);
          setCurrentImagePath(imageUrl);
        }

        const deps = room.dependencies || [];
        setSelectedDependencyId(deps.length ? deps[0].id : '');
      } catch (err) {
        console.error('Error initializing update modal', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los datos',
          icon: 'error',
        });
      }
    };

    init();
  }, [room, isOpen]);

  const fetchDependencies = async () => {
    try {
      const res = await axiosInstance.get('/dependencies');
      setDependencies(res.data || []);
    } catch (err) {
      console.error('Error fetching dependencies', err);
    }
  };

  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      const file = files[0];
      setFormData({
        ...formData,
        [name]: file,
      });

      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(currentImagePath);
      }
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleDependencyChange = e => {
    const { name, value } = e.target;
    setNewDependency({
      ...newDependency,
      [name]: value,
    });
  };

  const validateRoomForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.description.trim())
      newErrors.description = 'La descripción es requerida';
    if (formData.description.length > 2000)
      newErrors.description = 'La descripción no puede exceder 2000 caracteres';
    if (!formData.capacity) newErrors.capacity = 'La capacidad es requerida';
    if (parseInt(formData.capacity) <= 0)
      newErrors.capacity = 'La capacidad debe ser positiva';
    if (!formData.location.trim())
      newErrors.location = 'La ubicación es requerida';
    if (!formData.staffowner.trim())
      newErrors.staffowner = 'El encargado es requerido';
    if (!selectedDependencyId)
      newErrors.dependency = 'La dependencia es requerida';
    if (formData.imageFile && formData.imageFile.size > 5 * 1024 * 1024)
      newErrors.imageFile = 'La imagen no debe exceder 5MB';

    if (formData.cost && isNaN(parseFloat(formData.cost))) {
      newErrors.cost = 'El costo debe ser un número válido';
    }

    if (!formData.acceptsTransfer && !formData.acceptsMaterials) {
      newErrors.paymentMethods = 'Debe seleccionar al menos un método de pago';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDependencyForm = () => {
    const newErrors = {};
    if (!newDependency.name.trim()) newErrors.name = 'El nombre es requerido';
    if (newDependency.name.length > 100)
      newErrors.name = 'El nombre no puede exceder 100 caracteres';
    if (newDependency.description && newDependency.description.length > 500)
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    return newErrors;
  };

  const handleCreateDependency = async () => {
    const dependencyErrors = validateDependencyForm();
    if (Object.keys(dependencyErrors).length > 0) {
      Swal.fire({
        title: 'Error',
        html: Object.values(dependencyErrors).join('<br>'),
        icon: 'error',
      });
      return;
    }

    const exists = dependencies.find(
      d => d.name.toLowerCase() === newDependency.name.trim().toLowerCase()
    );
    if (exists) {
      Swal.fire({
        title: 'Error',
        text: 'Ya existe una dependencia con ese nombre.',
        icon: 'error',
      });
      return;
    }

    try {
      const res = await axiosInstance.post('/dependencies', newDependency);

      Swal.fire({
        title: '¡Éxito!',
        text: 'Dependencia creada exitosamente',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });

      await fetchDependencies();
      setSelectedDependencyId(res.data.id);
      setCurrentView('room');
      setNewDependency({ name: '', description: '' });
    } catch (err) {
      console.error('Error creating dependency', err);
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.error || 'Error al crear dependencia',
        icon: 'error',
      });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateRoomForm()) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor corrige los errores en el formulario',
        icon: 'error',
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Actualizar espacio?',
      text: `¿Estás seguro de actualizar "${formData.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    setSubmitting(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('capacity', formData.capacity);
    data.append('location', formData.location);
    data.append('staffowner', formData.staffowner);
    data.append('isInCUC', formData.isInCUC);
    data.append('cost', formData.cost || '0');
    data.append('isAccessible', formData.isAccessible);
    data.append('canExonerate', formData.canExonerate);
    data.append('hasBathrooms', formData.hasBathrooms);
    data.append('hasInternet', formData.hasInternet);
    data.append('hasAudioEquipment', formData.hasAudioEquipment);
    data.append('hasVideoEquipment', formData.hasVideoEquipment);
    data.append('acceptsTransfer', formData.acceptsTransfer);
    data.append('acceptsMaterials', formData.acceptsMaterials);
    data.append('dependencyId', selectedDependencyId);

    if (formData.imageFile) data.append('image', formData.imageFile);

    try {
      await dispatch(updateRoomThunk({ id: room.id, data })).unwrap();

      Swal.fire({
        title: '¡Éxito!',
        text: 'Espacio actualizado exitosamente',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });

      if (onRoomUpdated) onRoomUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating room:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Error al actualizar espacio',
        icon: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const hasChanges =
      formData.name !== (room?.name || '') ||
      formData.description !== (room?.description || '') ||
      formData.capacity !== (room?.capacity || '') ||
      formData.location !== (room?.location || '') ||
      formData.staffowner !== (room?.staffowner || '') ||
      formData.isInCUC !== (room?.isInCUC || false) ||
      formData.cost !== (room?.cost || '0') ||
      formData.isAccessible !== (room?.isAccessible || false) ||
      formData.canExonerate !== (room?.canExonerate || false) ||
      formData.hasBathrooms !== (room?.hasBathrooms || false) ||
      formData.hasInternet !== (room?.hasInternet || false) ||
      formData.hasAudioEquipment !== (room?.hasAudioEquipment || false) ||
      formData.hasVideoEquipment !== (room?.hasVideoEquipment || false) ||
      formData.acceptsTransfer !== (room?.acceptsTransfer || false) ||
      formData.acceptsMaterials !== (room?.acceptsMaterials || false) ||
      formData.imageFile !== null ||
      selectedDependencyId !== (room?.dependencies?.[0]?.id || '');

    if (hasChanges) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Tienes cambios sin guardar',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Cancelar',
      }).then(result => {
        if (result.isConfirmed) onClose();
      });
    } else {
      onClose();
    }
  };

  if (!isOpen || !room) return null;

  // Formulario de dependencia
  if (currentView === 'dependency') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentView('room')}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <FaArrowLeft className="text-xl" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold">Nueva Dependencia</h2>
                  <p className="text-blue-100 text-sm">
                    Crear nueva dependencia para asignar al espacio
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form
            className="p-6 space-y-4"
            onSubmit={e => {
              e.preventDefault();
              handleCreateDependency();
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaBuilding className="inline mr-2 text-blue-500" />
                Nombre de la Dependencia <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={newDependency.name}
                onChange={handleDependencyChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Ej: Facultad de Ciencias"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo 100 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFileAlt className="inline mr-2 text-blue-500" />
                Descripción (Opcional)
              </label>
              <textarea
                name="description"
                value={newDependency.description}
                onChange={handleDependencyChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Breve descripción de la dependencia"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo 500 caracteres
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setCurrentView('room')}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
              >
                Crear Dependencia
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Formulario de actualización de sala
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Actualizar Espacio</h2>
              <p className="text-blue-100">
                Modifique los campos que desee cambiar
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-blue-200 text-3xl transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna Izquierda */}
            <div className="space-y-6">
              {/* Nombre */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <FaFileAlt className="inline mr-2 text-blue-600" />
                  Nombre del Espacio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.name
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Ej: Auditorio Principal"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <FaFileAlt className="inline mr-2 text-blue-600" />
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.description
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Describa las características del espacio..."
                />
                <div className="flex justify-between mt-2">
                  <span
                    className={`text-sm ${
                      formData.description.length > 2000
                        ? 'text-red-500'
                        : 'text-gray-500'
                    }`}
                  >
                    {formData.description.length}/2000
                  </span>
                  {errors.description && (
                    <span className="text-sm text-red-600">
                      {errors.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <FaMapPin className="inline mr-2 text-blue-600" />
                  Ubicación <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.location
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Ej: Edificio A, Piso 3"
                />
                {errors.location && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {errors.location}
                  </p>
                )}
              </div>

              {/* Capacidad y Encargado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <FaUsers className="inline mr-2 text-blue-600" />
                    Capacidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.capacity
                        ? 'border-red-500 ring-1 ring-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Ej: 100"
                  />
                  {errors.capacity && (
                    <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      {errors.capacity}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <FaUser className="inline mr-2 text-blue-600" />
                    Encargado <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="staffowner"
                    value={formData.staffowner}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.staffowner
                        ? 'border-red-500 ring-1 ring-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Nombre completo"
                  />
                  {errors.staffowner && (
                    <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      {errors.staffowner}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              {/* Dependencia */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    <FaUsers className="inline mr-2 text-blue-600" />
                    Dependencia <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCurrentView('dependency')}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm flex items-center"
                  >
                    <FaBuilding className="mr-2" />
                    Nueva Dependencia
                  </button>
                </div>

                <div className="space-y-3">
                  <select
                    value={selectedDependencyId}
                    onChange={e => setSelectedDependencyId(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.dependency
                        ? 'border-red-500 ring-1 ring-red-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Seleccione una dependencia --</option>
                    {dependencies.map(dep => (
                      <option key={dep.id} value={dep.id}>
                        {dep.name}
                      </option>
                    ))}
                  </select>

                  {/* Información de dependencia seleccionada o mensaje */}
                  <div className="mt-2">
                    {selectedDependencyId ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">
                            Dependencia actual:
                          </span>{' '}
                          {
                            dependencies.find(d => d.id == selectedDependencyId)
                              ?.name
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Nota:</span> Solo se
                          muestran las dependencias a las que tiene permiso.
                          {dependencies.length === 0 && (
                            <span className="block mt-1 text-yellow-600">
                              No tiene permisos para modificar espacios en
                              ninguna dependencia.
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {errors.dependency && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {errors.dependency}
                    </p>
                  )}
                </div>
              </div>

              {/* Costo */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <FaDollarSign className="inline mr-2 text-green-600" />
                  Costo
                </label>
                <input
                  type="text"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.cost
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Ej: 100.00 (0 = Gratuito)"
                />
                {errors.cost && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {errors.cost}
                  </p>
                )}
              </div>

              {/* Características del espacio */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Características del Espacio
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Accesibilidad */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isAccessible"
                      id="isAccessible"
                      checked={formData.isAccessible}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="isAccessible"
                      className="ml-3 block text-sm text-gray-700 flex items-center"
                    >
                      <FaWheelchair className="mr-2 text-green-600" />
                      Accesibilidad motriz
                    </label>
                  </div>

                  {/* Baños */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="hasBathrooms"
                      id="hasBathrooms"
                      checked={formData.hasBathrooms}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="hasBathrooms"
                      className="ml-3 block text-sm text-gray-700 flex items-center"
                    >
                      <FaToilet className="mr-2 text-purple-600" />
                      Baños disponibles
                    </label>
                  </div>

                  {/* Internet */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="hasInternet"
                      id="hasInternet"
                      checked={formData.hasInternet}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="hasInternet"
                      className="ml-3 block text-sm text-gray-700 flex items-center"
                    >
                      <FaWifi className="mr-2 text-blue-600" />
                      Conexión a Internet
                    </label>
                  </div>

                  {/* Equipo de audio */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="hasAudioEquipment"
                      id="hasAudioEquipment"
                      checked={formData.hasAudioEquipment}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="hasAudioEquipment"
                      className="ml-3 block text-sm text-gray-700 flex items-center"
                    >
                      <FaMicrophoneAlt className="mr-2 text-yellow-600" />
                      Equipo de audio
                    </label>
                  </div>

                  {/* Equipo de video */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="hasVideoEquipment"
                      id="hasVideoEquipment"
                      checked={formData.hasVideoEquipment}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="hasVideoEquipment"
                      className="ml-3 block text-sm text-gray-700 flex items-center"
                    >
                      <FaVideo className="mr-2 text-red-600" />
                      Equipo de video
                    </label>
                  </div>

                  {/* Exoneración */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="canExonerate"
                      id="canExonerate"
                      checked={formData.canExonerate}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="canExonerate"
                      className="ml-3 block text-sm text-gray-700 flex items-center"
                    >
                      <FaMoneyBillWave className="mr-2 text-green-600" />
                      Permite exoneración
                    </label>
                  </div>
                </div>
              </div>

              {/* Métodos de pago */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Métodos de Pago Aceptados{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="acceptsTransfer"
                      id="acceptsTransfer"
                      checked={formData.acceptsTransfer}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="acceptsTransfer"
                      className="ml-3 block text-sm text-gray-700 flex items-center"
                    >
                      <FaExchangeAlt className="mr-2 text-blue-600" />
                      Transferencia
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="acceptsMaterials"
                      id="acceptsMaterials"
                      checked={formData.acceptsMaterials}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label
                      htmlFor="acceptsMaterials"
                      className="ml-3 block text-sm text-gray-700 flex items-center"
                    >
                      <FaBox className="mr-2 text-orange-600" />
                      Materiales
                    </label>
                  </div>
                </div>
                {errors.paymentMethods && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {errors.paymentMethods}
                  </p>
                )}
              </div>

              {/* Imagen */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <FaFileImage className="inline mr-2 text-blue-600" />
                  Imagen del Espacio
                </label>

                {/* Preview */}
                <div className="mb-4 flex justify-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-48 h-48 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                      />
                      {formData.imageFile && (
                        <div className="absolute inset-0 bg-blue-900 bg-opacity-50 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold">
                            Nueva imagen
                          </span>
                        </div>
                      )}
                    </div>
                  ) : currentImagePath ? (
                    <div className="relative">
                      <img
                        src={currentImagePath}
                        alt="Current"
                        className="w-48 h-48 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-100">
                      <div className="text-center text-gray-500">
                        <FaFileImage className="text-4xl mx-auto mb-2" />
                        <p className="text-sm">Sin imagen</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="file"
                    name="imageFile"
                    onChange={handleChange}
                    accept="image/*"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {errors.imageFile && (
                    <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      {errors.imageFile}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos: JPG, PNG, GIF. Máx. 5MB (deje vacío para mantener la
                  imagen actual)
                </p>
              </div>

              {/* Checkbox CUC */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <input
                    id="isInCUC"
                    name="isInCUC"
                    type="checkbox"
                    checked={formData.isInCUC}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <label
                    htmlFor="isInCUC"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    ¿Está en la Ciudad Universitaria de Caracas?
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                (!formData.acceptsTransfer && !formData.acceptsMaterials)
              }
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Actualizando...
                </>
              ) : (
                <>
                  <FaEdit className="mr-2" />
                  Actualizar Espacio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateRoomModal;
