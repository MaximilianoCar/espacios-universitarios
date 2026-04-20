import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import Swal from '../utils/swal';
import { FaArrowLeft, FaKey, FaUser } from 'react-icons/fa';

const MyUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get('/me');
        setUser(res.data);
      } catch (err) {
        console.error('Error fetching current user', err);
        Swal.error('Error', 'No se pudo obtener los datos del usuario');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChangePassword = async e => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return Swal.error('Campos incompletos', 'Complete todos los campos');
    }

    if (newPassword !== confirmPassword) {
      return Swal.error(
        'Error',
        'La nueva contraseña y la confirmación no coinciden'
      );
    }

    if (newPassword.length < 6) {
      return Swal.error(
        'Error',
        'La contraseña debe tener al menos 6 caracteres'
      );
    }

    const confirm = await Swal.confirm({
      title: 'Confirmar cambio',
      text: '¿Desea cambiar su contraseña ahora?',
    });

    if (!confirm.isConfirmed) return;

    try {
      Swal.showLoading();
      await axiosInstance.put('/users/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      Swal.close();
      Swal.success(
        'Contraseña actualizada',
        'Tu contraseña ha sido cambiada correctamente.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Swal.close();
      const msg = err.response?.data?.error || 'Error al cambiar la contraseña';
      Swal.error('Error', msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            className="flex items-center gap-2 text-blue-600 hover:underline"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft /> Volver
          </button>
        </div>

        <div className="max-w-3xl mx-auto bg-white shadow rounded p-6">
          <div className="flex items-center gap-4 mb-4">
            <FaUser className="text-blue-500" />
            <h2 className="text-2xl font-bold">Mi Usuario</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Nombre</p>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cédula</p>
              <p className="font-medium">{user?.ci || '—'}</p>
            </div>
            {user?.companyName && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Empresa</p>
                <p className="font-medium">{user.companyName}</p>
              </div>
            )}
          </div>

          <hr className="my-4" />

          <form onSubmit={handleChangePassword}>
            <div className="flex items-center gap-2 mb-4">
              <FaKey className="text-blue-500" />
              <h3 className="text-lg font-semibold">Cambiar contraseña</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="btn-blue px-4 py-2 rounded text-white"
              >
                Cambiar contraseña
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyUser;
