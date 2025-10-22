// services/emailService.js
const nodemailer = require('nodemailer');

// Configurar el transporter (mantener igual)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

// Verificar la conexión
transporter.verify(function (error, success) {
  if (error) {
    console.error('Error configurando el servicio de email:', error);
  } else {
    console.log('Servicio de email configurado correctamente');
  }
});

const emailTemplates = {
  // Notificación para admins - Solicitud de upgrade a solicitante
  upgradeRequest: (userEmail, userName) => ({
    subject: 'Nueva Solicitud de Registro - Espacios Universitarios UCV',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nueva Solicitud de Registro</h2>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Usuario:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
        </div>
        <p>El usuario ha solicitado convertirse en solicitante y ha subido su documentación.</p>
        <a href="${process.env.APP_URL}/admin/solicitudes" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Revisar Solicitudes Pendientes
        </a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Espacios Universitarios UCV - ${new Date().getFullYear()}
        </p>
      </div>
    `,
  }),

  // Notificación al visitante - Resultado de solicitud
  upgradeResult: (userName, approved, adminComments = '') => ({
    subject: approved
      ? 'Solicitud Aprobada - Espacios Universitarios UCV'
      : 'Solicitud Rechazada - Espacios Universitarios UCV',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${
          approved ? '#28a745' : '#dc3545'
        }; text-align: center;">
          ${approved ? 'Solicitud Aprobada' : 'Solicitud Rechazada'}
        </h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Tu solicitud para convertirte en solicitante ha sido <strong style="color: ${
          approved ? '#28a745' : '#dc3545'
        };">${approved ? 'APROBADA' : 'RECHAZADA'}</strong>.</p>
        ${
          adminComments
            ? `<div style="background: #f8f9fa; padding: 12px; border-left: 4px solid #007bff; margin: 15px 0;">
                <strong>Comentarios del administrador:</strong><br>
                ${adminComments}
               </div>`
            : ''
        }
        ${
          approved
            ? `<p>Ahora puedes solicitar reservas de espacios</p>
               <a href="${process.env.APP_URL}/login" 
                  style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
                 Crear Mi Primera Reserva
               </a>`
            : `<p></p>`
        }
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Espacios Universitarios UCV - ${new Date().getFullYear()}
        </p>
      </div>
    `,
  }),

  // Notificación a coordinadores - Nueva reserva
  reservationRequest: (
    solicitanteName,
    spaceName,
    fecha,
    eventDetails = ''
  ) => ({
    subject: 'Nueva Solicitud de Reserva - Espacios Universitarios UCV',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nueva Solicitud de Reserva</h2>
        <p>Has recibido una nueva solicitud de reserva:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Solicitante:</strong> ${solicitanteName}</p>
          <p><strong>Espacio:</strong> ${spaceName}</p>
          ${
            eventDetails
              ? `<p><strong>Detalles del evento:</strong> ${eventDetails}</p>`
              : ''
          }
          <p><strong>Estado actual:</strong> <span style="color: #ffc107;">Pendiente de revisión</span></p>
        </div>
        <p>Por favor, revisa esta solicitud y aprueba o rechaza según la disponibilidad.</p>
        <a href="${process.env.APP_URL}/coord/reservas" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Gestionar Reservas Pendientes
        </a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Espacios Universitarios UCV - ${new Date().getFullYear()}
        </p>
      </div>
    `,
  }),

  // Notificación al solicitante - Resultado de reserva
  reservationResult: (
    solicitanteName,
    spaceName,
    fecha,
    approved,
    coordComments = ''
  ) => ({
    subject: approved
      ? 'Reserva Aprobada - Espacios Universitarios UCV'
      : 'Reserva Rechazada - Espacios Universitarios UCV',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${
          approved ? '#28a745' : '#dc3545'
        }; text-align: center;">
          ${approved ? '¡Reserva Aprobada!' : 'Reserva Rechazada'}
        </h2>
        <p>Hola <strong>${solicitanteName}</strong>,</p>
        <p>Tu solicitud de reserva ha sido <strong style="color: ${
          approved ? '#28a745' : '#dc3545'
        };">${approved ? 'APROBADA' : 'RECHAZADA'}</strong>.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Espacio:</strong> ${spaceName}</p>
          <p><strong>Estado:</strong> <span style="color: ${
            approved ? '#28a745' : '#dc3545'
          };">${approved ? 'Aprobada' : 'Rechazada'}</span></p>
        </div>

        ${
          coordComments
            ? `<div style="background: #e9ecef; padding: 12px; border-left: 4px solid #6c757d; margin: 15px 0;">
                <strong>Comentarios del coordinador:</strong><br>
                ${coordComments}
               </div>`
            : ''
        }
        
        ${
          approved
            ? `<div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Tu reserva ha sido confirmada</strong></p>
               </div>`
            : `<div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Reserva no disponible</strong></p>
                <p>Puedes intentar reservar otro espacio u horario disponible en el sistema.</p>
                <a href="${process.env.APP_URL}/events" 
                   style="background-color: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Ver Espacios Disponibles
                </a>
               </div>`
        }
        
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Espacios Universitarios UCV - ${new Date().getFullYear()}
        </p>
      </div>
    `,
  }),

  // notificación a coordinadores cuando usuario sube archivo de programa
  programUploaded: (solicitanteName, eventName, spaceName, eventId) => ({
    subject: 'Nuevo Programa de Evento Subido - Espacios Universitarios UCV',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nuevo Programa de Evento</h2>
        <p>El solicitante <strong>${solicitanteName}</strong> ha subido el programa para el evento:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Evento:</strong> ${eventName}</p>
          <p><strong>Espacio:</strong> ${spaceName}</p>
        </div>
        <p>El programa del evento ha sido cargado y está disponible para su revisión.</p>
        <a href="${process.env.APP_URL}/events/${eventId}" 
           style="background-color: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Revisar Programa del Evento
        </a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Espacios Universitarios UCV - ${new Date().getFullYear()}
        </p>
      </div>
    `,
  }),

  // notificación a usuario cuando coordinadores suben archivo de contrato
  contractUploaded: (
    solicitanteName,
    eventName,
    spaceName,
    fecha,
    eventId
  ) => ({
    subject: 'Contrato de Reserva Disponible - Espacios Universitarios UCV',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Contrato de Reserva Disponible</h2>
        <p>Hola <strong>${solicitanteName}</strong>,</p>
        <p>Se ha generado y subido el contrato para tu reserva:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Evento:</strong> ${eventName}</p>
          <p><strong>Espacio:</strong> ${spaceName}</p>
          <p><strong>Contrato generado:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>El contrato de tu reserva está disponible para su revisión y descarga.</p>
        <a href="${process.env.APP_URL}/events/${eventId}" 
           style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Ver Contrato y Detalles del Evento
        </a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Por favor, revisa los términos y condiciones del contrato.
        </p>
        <p style="color: #666; font-size: 12px;">
          Espacios Universitarios UCV - ${new Date().getFullYear()}
        </p>
      </div>
    `,
  }),
};

class EmailService {
  async sendEmail(to, templateType, templateData) {
    try {
      const template = emailTemplates[templateType](...templateData);

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: template.subject,
        html: template.html,
        text: template.html
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`Email enviado a ${to}: ${template.subject}`);
      return { success: true, result };
    } catch (error) {
      console.error('Error enviando email:', error);
      return { success: false, error: error.message };
    }
  }

  // metodos específicos
  async notifyUpgradeRequest(adminEmails, userEmail, userName) {
    const emails = Array.isArray(adminEmails) ? adminEmails : [adminEmails];
    const results = [];

    for (const email of emails) {
      const result = await this.sendEmail(email, 'upgradeRequest', [
        userEmail,
        userName,
      ]);
      results.push(result);
    }

    return results;
  }

  async notifyUpgradeResult(userEmail, userName, approved, adminComments) {
    return this.sendEmail(userEmail, 'upgradeResult', [
      userName,
      approved,
      adminComments,
    ]);
  }

  async notifyReservationRequest(
    coordEmails,
    solicitanteName,
    spaceName,
    fecha,
    eventDetails = ''
  ) {
    const emails = Array.isArray(coordEmails) ? coordEmails : [coordEmails];
    const results = [];

    for (const email of emails) {
      const result = await this.sendEmail(email, 'reservationRequest', [
        solicitanteName,
        spaceName,
        fecha,
        eventDetails,
      ]);
      results.push(result);
    }

    return results;
  }

  async notifyReservationResult(
    userEmail,
    solicitanteName,
    spaceName,
    fecha,
    approved,
    coordComments
  ) {
    return this.sendEmail(userEmail, 'reservationResult', [
      solicitanteName,
      spaceName,
      fecha,
      approved,
      coordComments,
    ]);
  }

  // notificar a coordinadores cuando usuario sube programa
  async notifyProgramUploaded(
    coordEmails,
    solicitanteName,
    eventName,
    spaceName,
    eventId
  ) {
    const emails = Array.isArray(coordEmails) ? coordEmails : [coordEmails];
    const results = [];

    for (const email of emails) {
      const result = await this.sendEmail(email, 'programUploaded', [
        solicitanteName,
        eventName,
        spaceName,
        eventId,
      ]);
      results.push(result);
    }

    return results;
  }

  // notificar a usuario cuando se sube contrato
  async notifyContractUploaded(
    userEmail,
    solicitanteName,
    eventName,
    spaceName,
    fecha,
    eventId
  ) {
    return this.sendEmail(userEmail, 'contractUploaded', [
      solicitanteName,
      eventName,
      spaceName,
      fecha,
      eventId,
    ]);
  }
}

module.exports = new EmailService();
