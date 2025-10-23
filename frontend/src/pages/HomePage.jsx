// src/pages/HomePage.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import Modal from '../components/Modal';
import RequestUpgradeForm from '../components/RequestUpgradeForm';
import MenuCard from '../components/MenuCard';
import { usePendingReservations } from '../hooks/usePendingReservations';
import { usePendingUsers } from '../hooks/usePendingUsers';
import { useUserEventsCount } from '../hooks/useUserEventsCount';
import { updateUserRole } from '../features/auth/authSlice';
import Swal from 'sweetalert2';

import backgroundImage from '../assets/ucvfondo.jpg';

const HomePage = () => {
  const { user, role, isAuthenticated } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Estado para controlar el modal de solicitud de ascenso
  const [showRequestUpgradeModal, setShowRequestUpgradeModal] = useState(false);

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

  // --- Definición de Tarjetas por Rol ---

  // ADMINISTRATOR
  const AdminCards = (
    <>
      <MenuCard
        title="Gestionar Espacios"
        description="Configura y administra los espacios disponibles."
        link="/admin/rooms"
        icon="🏠"
      />
      <MenuCard
        title="Gestionar Reservas"
        description="Revisa y gestiona las reservas de todos los usuarios."
        link="/reservations"
        icon="📑"
        badgeCount={pendingCount}
        badgeLoading={pendingLoading}
      />
      <MenuCard
        title="Gestionar Usuarios"
        description="Revisa y gestiona la lista de usuarios registrados."
        link="/users"
        icon="👤"
      />
      <MenuCard
        title="Gestionar Solicitudes de Usuarios"
        description="Revisa las solicitudes pendientes y aprueba/rechaza."
        link="/pending"
        icon="📋"
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
        icon="🏠"
      />
      <MenuCard
        title="Gestionar Reservas"
        description="Revisa y gestiona las reservas de los usuarios en tu área."
        link="/reservations"
        icon="✅"
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
        icon="📝"
      />
      <MenuCard
        title="Consultar Mis Reservas"
        description="Revisa las reservas que has realizado y su estado."
        link="/my-reservations"
        icon="🔍"
        showMultipleBadges={true}
        approvedCount={eventsCount.approved}
        deniedCount={eventsCount.denied}
        pendingCount={eventsCount.pending}
      />
    </>
  );

  // VISITOR
  const VisitorCards = (
    <>
      <MenuCard
        title="Eventos Próximos"
        description="Explora los eventos y actividades programadas."
        link="/events"
        icon="📅"
      />
      <MenuCard
        title="¡Quiero Reservar!"
        description="Haz clic para obtener el rol de 'Solicitante' y poder reservar espacios."
        onClick={() => setShowRequestUpgradeModal(true)}
        icon="🔑"
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
        icon="📅"
      />
      <MenuCard
        title="Solicitud en proceso"
        description="Se le notificará cuando se termine de procesar su solicitud."
        link="/#"
        icon="⏳"
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
      case 'visitor':
      default:
        return {
          title: `Panel de Visitante - ${user}`,
          cards: VisitorCards,
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
          className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-6 max-w-7xl mx-auto`}
        >
          {cards}
        </div>
      </div>

      <Footer />

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
