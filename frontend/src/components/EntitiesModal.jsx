import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Swal from '../utils/swal';

const EntitiesModal = ({ onClose }) => {
  const token = useSelector(state => state.auth.token);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ id: null, name: '', email: '' });
  const [saving, setSaving] = useState(false);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/entities', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Error fetching entities');
      const data = await res.json();
      setEntities(data);
    } catch (err) {
      setError(err.message || 'Error al cargar las entidades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleEdit = entity =>
    setForm({ id: entity.id, name: entity.name, email: entity.email });

  const handleDelete = async id => {
    const confirmed = await Swal.confirmDanger({
      title: 'Eliminar entidad',
      text: '¿Estás seguro de que deseas eliminar esta entidad? Esta acción no se puede deshacer.',
      confirmButtonText: 'Eliminar',
    });
    if (!confirmed || !confirmed.isConfirmed) return;

    try {
      const res = await fetch(`/api/entities/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Error deleting');
      await fetchEntities();
      Swal.success('Eliminado', 'Entidad eliminada correctamente');
    } catch (err) {
      Swal.error('Error', err.message || 'Error');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `/api/entities/${form.id}` : '/api/entities';
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: form.name, email: form.email }),
      });
      if (!res.ok) throw new Error('Error saving');
      setForm({ id: null, name: '', email: '' });
      await fetchEntities();
      Swal.success(
        'Guardado',
        form.id ? 'Entidad actualizada' : 'Entidad agregada'
      );
    } catch (err) {
      Swal.error('Error', err.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl border border-gray-100 p-6 mx-auto transition-all">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-2">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Gestión de Entidades
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Administra y edita la información de tus entidades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-xs font-medium px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 items-end"
        >
          <div className="w-full sm:flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nombre
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej. Juan Pérez"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              required
            />
          </div>
          <div className="w-full sm:flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Correo Electrónico
            </label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              type="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              required
            />
          </div>
          <div className="w-full sm:w-auto">
            <button
              type="submit"
              disabled={saving}
              className={`w-full sm:w-auto text-sm font-medium px-5 py-2 rounded-lg text-white transition shadow-sm ${
                form.id
                  ? 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
              }`}
            >
              {saving ? 'Guardando...' : form.id ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de contenido */}
      <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Cargando entidades...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-lg inline-block font-medium">
              {error}
            </p>
          </div>
        ) : entities.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No hay entidades registradas actualmente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 border-b border-gray-100">
                  <th className="p-3 pl-4">Nombre</th>
                  <th className="p-3">Correo</th>
                  <th className="p-3 text-right pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entities.map(ent => (
                  <tr
                    key={ent.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="p-3 pl-4 text-sm font-medium text-gray-700">
                      {ent.name}
                    </td>
                    <td className="p-3 text-sm text-gray-500">{ent.email}</td>
                    <td className="p-3 text-sm text-right pr-4 space-x-1">
                      <button
                        onClick={() => handleEdit(ent)}
                        className="text-xs font-medium px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(ent.id)}
                        className="text-xs font-medium px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntitiesModal;
