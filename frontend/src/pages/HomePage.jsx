// src/pages/HomePage.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axiosInstance from '../axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import Modal from '../components/Modal';
import RequestUpgradeForm from '../components/RequestUpgradeForm';
import CompleteExternalUserForm from '../components/CompleteExternalUserForm';
import MenuCard from '../components/MenuCard';
import { usePendingReservations } from '../hooks/usePendingReservations';
import { usePendingUsers } from '../hooks/usePendingUsers';
import { useUserEventsCount } from '../hooks/useUserEventsCount';
import { updateUserRole } from '../features/auth/authSlice';
import Swal from '../utils/swal';

//iconos
import {
  BuildingOfficeIcon,
  DocumentTextIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  KeyIcon,
  ClockIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

import backgroundImage from '../assets/ucvfondo.jpg';

const HomePage = () => {
  const { user, role, isAuthenticated } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Estado para controlar el modal de solicitud de ascenso
  const [showRequestUpgradeModal, setShowRequestUpgradeModal] = useState(false);
  // Estado para controlar el modal de completar información de usuario externo
  const [showCompleteExternalModal, setShowCompleteExternalModal] =
    useState(false);

  // hook para obtener las reservas pendientes
  const { pendingCount, loading: pendingLoading } = usePendingReservations();

  // hook para obtener usuarios pendientes
  const { pendingUsersCount, loading: pendingUsersLoading } = usePendingUsers();

  // hook para obtener conteo de eventos del usuario
  const { eventsCount, loading: eventsLoading } = useUserEventsCount();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!role || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleUpgradeSuccess = () => {
    // Actualizar el estado de Redux inmediatamente
    dispatch(updateUserRole({ role: 'pending' }));
    console.log(role);
    setShowRequestUpgradeModal(false);

    Swal.fire({
      title: '¡Solicitud enviada!',
      text: 'Tu solicitud ha sido enviada y está en revisión.',
      icon: 'success',
      timer: 3000,
    });
  };

  const handleCompleteExternalSuccess = () => {
    // Actualizar los datos del usuario
    setShowCompleteExternalModal(false);

    Swal.fire({
      title: '¡Información completada!',
      text: 'Tu información como usuario externo ha sido actualizada correctamente.',
      icon: 'success',
      timer: 3000,
    }).then(() => {
      // Después de completar la información, mostrar el modal de solicitud para ser requester
      setShowRequestUpgradeModal(true);
    });
  };

  // --- Definición de Tarjetas por Rol ---

  // ADMINISTRATOR
  const AdminCards = (
    <>
      <MenuCard
        title="Gestionar Espacios"
        description="Configura y administra los espacios disponibles."
        link="/admin/rooms"
        icon={<BuildingOfficeIcon className="w-12 h-12 text-blue-500" />}
      />
      <MenuCard
        title="Gestionar Reservas"
        description="Revisa y gestiona las reservas de todos los usuarios."
        link="/reservations"
        icon={<DocumentTextIcon className="w-12 h-12 text-blue-500" />}
        badgeCount={pendingCount}
        badgeLoading={pendingLoading}
      />
      <MenuCard
        title="Gestionar Usuarios"
        description="Revisa y gestiona la lista de usuarios registrados."
        link="/users"
        icon={<UsersIcon className="w-12 h-12 text-blue-500" />}
      />
      <MenuCard
        title="Gestionar Solicitudes de Usuarios"
        description="Revisa las solicitudes pendientes y aprueba/rechaza."
        link="/pending"
        icon={<ClipboardDocumentListIcon className="w-12 h-12 text-blue-500" />}
        badgeCount={pendingUsersCount}
        badgeLoading={pendingUsersLoading}
      />
    </>
  );

  // COORDINATOR
  const CoordinatorCards = (
    <>
      <MenuCard
        title="Gestionar Espacios"
        description="Configura y administra los espacios disponibles."
        link="/admin/rooms"
        icon={<BuildingOfficeIcon className="w-12 h-12 text-blue-500" />}
      />
      <MenuCard
        title="Gestionar Reservas"
        description="Revisa y gestiona las reservas de los usuarios en tu área."
        link="/reservations"
        icon={<CheckCircleIcon className="w-12 h-12 text-blue-500" />}
        badgeCount={pendingCount}
        badgeLoading={pendingLoading}
      />
    </>
  );

  // REQUESTER
  const RequesterCards = (
    <>
      <MenuCard
        title="Solicitar Reserva"
        description="Solicita una reserva para tu evento."
        link="/create-reservation"
        icon={<PencilIcon className="w-12 h-12 text-blue-500" />}
      />
      <MenuCard
        title="Consultar Mis Reservas"
        description="Revisa las reservas que has realizado y su estado."
        link="/my-reservations"
        icon={<MagnifyingGlassIcon className="w-12 h-12 text-blue-500" />}
        showMultipleBadges={true}
        approvedCount={eventsCount.approved}
        deniedCount={eventsCount.denied}
        pendingCount={eventsCount.pending}
      />
    </>
  );

  // VISITOR - EXTERNO A LA UNIVERSIDAD (rol: externalvisitor)
  const VisitorExternalCards = (
    <>
      <MenuCard
        title="Eventos Próximos"
        description="Explora los eventos y actividades programadas."
        link="/events"
        icon={<CalendarIcon className="w-12 h-12 text-blue-500" />}
      />
      <MenuCard
        title="Completar Información"
        description="Como usuario externo, necesitamos algunos datos adicionales para proceder."
        onClick={() => setShowCompleteExternalModal(true)}
        icon={<UserCircleIcon className="w-12 h-12 text-blue-500" />}
        isButton={true}
        disabled={false}
      />
    </>
  );

  // VISITOR - INTERNO A LA UNIVERSIDAD (rol: visitor)
  const VisitorInternalCards = (
    <>
      <MenuCard
        title="Eventos Próximos"
        description="Explora los eventos y actividades programadas."
        link="/events"
        icon={<CalendarIcon className="w-12 h-12 text-blue-500" />}
      />
      <MenuCard
        title="¡Quiero Reservar!"
        description="Haz click para empezar a reservar espacios."
        onClick={() => setShowRequestUpgradeModal(true)}
        icon={<KeyIcon className="w-12 h-12 text-blue-500" />}
        isButton={true}
        disabled={false}
      />
    </>
  );

  // PENDING
  const PendingCards = (
    <>
      <MenuCard
        title="Eventos Próximos"
        description="Explora los eventos y actividades programadas."
        link="/events"
        icon={<CalendarIcon className="w-12 h-12 text-blue-500" />}
      />
      <MenuCard
        title="Solicitud en proceso"
        description="Se le notificará cuando se termine de procesar su solicitud."
        link="/#"
        icon={<ClockIcon className="w-12 h-12 text-blue-500" />}
        disabled={true}
      />
    </>
  );

  const renderCards = () => {
    switch (role) {
      case 'admin':
        return {
          title: `Panel de Administración - ${user}`,
          cards: AdminCards,
          gridCols: 'lg:grid-cols-2 xl:grid-cols-4',
        };
      case 'coordinator':
        return {
          title: `Panel de Coordinación - ${user}`,
          cards: CoordinatorCards,
          gridCols: 'lg:grid-cols-2',
        };
      case 'requester':
        return {
          title: `Panel de Solicitante - ${user}`,
          cards: RequesterCards,
          gridCols: 'lg:grid-cols-2',
        };
      case 'pending':
        return {
          title: `Panel de Visitante - ${user}`,
          cards: PendingCards,
          gridCols: 'lg:grid-cols-2',
        };
      case 'externalvisitor':
        return {
          title: `Panel de Visitante Externo - ${user}`,
          cards: VisitorExternalCards,
          gridCols: 'lg:grid-cols-2',
        };
      case 'visitor':
      default:
        return {
          title: `Panel de Visitante Interno - ${user}`,
          cards: VisitorInternalCards,
          gridCols: 'lg:grid-cols-2',
        };
    }
  };

  const { title, cards, gridCols } = renderCards();

  return (
    <div className="min-h-screen grid grid-rows-[auto_auto_1fr_auto] bg-gray-50">
      <Header />
      <HeroSection
        title={`¡Bienvenido(a), ${user}!`}
        subtitle="Encuentra todas tus opciones principales en el panel de control"
        backgroundImage={backgroundImage}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Selecciona una de las opciones disponibles para comenzar
          </p>
        </div>

        <div
          className="grid gap-6 justify-center"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 340px))',
          }}
        >
          {' '}
          {cards}
        </div>
      </div>

      <Footer />

      {/* Modal para completar información de usuario externo */}
      {showCompleteExternalModal && (
        <Modal onClose={() => setShowCompleteExternalModal(false)}>
          <CompleteExternalUserForm
            onClose={() => setShowCompleteExternalModal(false)}
            onSuccess={handleCompleteExternalSuccess}
          />
        </Modal>
      )}

      {/* Modal para la Solicitud de Ascenso de Rol */}
      {showRequestUpgradeModal && (
        <Modal onClose={() => setShowRequestUpgradeModal(false)}>
          <RequestUpgradeForm
            onClose={() => setShowRequestUpgradeModal(false)}
            onSuccess={handleUpgradeSuccess}
          />
        </Modal>
      )}
    </div>
  );
};

export default HomePage;
