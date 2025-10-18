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

import backgroundImage from '../assets/ucvfondo.jpg';

const HomePage = () => {
  const { user, role, isAuthenticated } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Inicializar dispatch

  // estado para controlar el modal de solicitud de ascenso
  const [showRequestUpgradeModal, setShowRequestUpgradeModal] = useState(false);

  const [hasRequestedUpgrade, setHasRequestedUpgrade] = useState(
    localStorage.getItem('hasRequestedUpgrade') === 'true'
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!role || !user) {
    return <div>Cargando...</div>;
  }

  const handleUpgradeSuccess = () => {
    localStorage.setItem('hasRequestedUpgrade', 'true');
    setShowRequestUpgradeModal(false);
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
        icon="👤"
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
        title={hasRequestedUpgrade ? 'Solicitud Enviada' : '¡Quiero Reservar!'}
        description={
          hasRequestedUpgrade
            ? 'Tu solicitud ha sido enviada.'
            : "Haz clic para obtener el rol de 'Solicitante'."
        }
        onClick={
          hasRequestedUpgrade
            ? undefined
            : () => setShowRequestUpgradeModal(true)
        }
        icon={hasRequestedUpgrade ? '🕙' : '🔑'}
        isButton={true}
        disabled={hasRequestedUpgrade}
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
        description="Se le notificara cuando se termine de procesar su solicitud."
        link="/#"
        icon="🕙"
        disabled={true}
      />
    </>
  );

  const renderCards = () => {
    switch (role) {
      case 'admin':
        return {
          title: 'Panel de Administración (Admin)',
          cards: AdminCards,
          gridCols: 'lg:grid-cols-4',
        };
      case 'coordinator':
        return {
          title: 'Panel de Coordinación',
          cards: CoordinatorCards,
          gridCols: 'lg:grid-cols-2',
        };
      case 'requester':
        return {
          title: 'Panel de Solicitante',
          cards: RequesterCards,
          gridCols: 'lg:grid-cols-2',
        };
      case 'pending':
        return {
          title: 'Panel de Visitante',
          cards: PendingCards,
          gridCols: 'lg:grid-cols-2',
        };
      case 'visitor':
      default:
        return {
          title: 'Panel de Visitante',
          cards: VisitorCards,
          gridCols: 'lg:grid-cols-2',
        };
    }
  };

  const { title, cards, gridCols } = renderCards();

  return (
    <div className="min-h-screen grid grid-rows-[auto_auto_1fr_auto]">
      <Header />
      <HeroSection
        title={`Bienvenido(a), ${user}`}
        subtitle="En este panel encontrarás tus opciones principales"
        backgroundImage={backgroundImage}
      />

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-6 text-center">{title}</h2>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-6`}>
          {cards}
        </div>
      </div>

      <Footer />

      {/* Modal para la Solicitud de Ascenso de Rol */}
      {showRequestUpgradeModal && (
        <Modal onClose={() => setShowRequestUpgradeModal(false)}>
          {/* Se elimina la prop onSuccess */}
          <RequestUpgradeForm
            onClose={() => setShowRequestUpgradeModal(false)}
            onSuccess={handleUpgradeSuccess}
          />
        </Modal>
      )}
    </div>
  );
};

// Componente MenuCard
const MenuCard = ({
  title,
  description,
  link,
  icon,
  onClick,
  isButton,
  disabled,
}) => {
  const cardClasses = `bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transform transition-transform min-h-[215px] flex flex-col justify-between ${
    disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:-translate-y-1 cursor-pointer'
  }`;

  const CardContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 flex-grow">{description}</p>
    </div>
  );

  if (isButton && (onClick || disabled)) {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        className={`${cardClasses} text-left w-full`}
        disabled={disabled}
      >
        {CardContent}
      </button>
    );
  }

  // Si no es botón, usa <a> como enlace tradicional
  return (
    <a
      href={disabled ? '#' : link}
      onClick={e => {
        if (disabled) {
          e.preventDefault();
        }

        if (!disabled && onClick) {
          onClick(e);
        }
      }}
      className={cardClasses}
    >
      {CardContent}
    </a>
  );
};

export default HomePage;
