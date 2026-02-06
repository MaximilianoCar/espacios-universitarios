const nodemailer = require('nodemailer');
const Bottleneck = require('bottleneck');

// Configurar el transporter
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

// Limiter para evitar enviar demasiados correos en corto tiempo (configurable)
const emailRateMs = parseInt(process.env.EMAIL_RATE_MS || '1000', 10); // ms entre envíos
const emailMaxConcurrent = parseInt(
  process.env.EMAIL_MAX_CONCURRENT || '1',
  10
);
const limiter = new Bottleneck({
  maxConcurrent: emailMaxConcurrent,
  minTime: emailRateMs,
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
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Espacios Universitarios UCV - ${new Date().getFullYear()}
        </p>
              </div>
    `,
  }),
  // Notificación de calificación de evento por parte del solicitante
  eventRating: (
    userName,
    eventName,
    spaceName,
    spaceConditionRating,
    staffTreatmentRating,
    reservationProcessRating,
    suggestion = ''
  ) => ({
    subject: `Nueva calificación para ${eventName} - ${spaceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nueva Calificación de Evento</h2>
        <p>El usuario <strong>${userName}</strong> ha enviado una calificación para el evento <strong>${eventName}</strong> en el espacio <strong>${spaceName}</strong>.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Condiciones del espacio:</strong> ${spaceConditionRating || 'N/A'}</p>
          <p><strong>Trato del personal:</strong> ${staffTreatmentRating || 'N/A'}</p>
          <p><strong>Proceso de reserva:</strong> ${reservationProcessRating || 'N/A'}</p>
        </div>
        ${
          suggestion
            ? `<div style="background: #fff3cd; padding: 12px; border-left: 4px solid #ffeeba; margin: 15px 0;"><strong>Sugerencia del usuario:</strong><br>${suggestion}</div>`
            : ''
        }
        <p style="margin-top: 20px; color: #666; font-size: 12px;">Espacios Universitarios UCV - ${new Date().getFullYear()}</p>
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
            ? `<p>Ahora puedes solicitar reservas de espacios</p>`
            : `<p></p>`
        }
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Espacios Universitarios UCV - ${new Date().getFullYear()}
        </p>
      </div>
    `,
  }),

  // Plantilla para envío de código de recuperación de contraseña
  passwordReset: (userName, code) => ({
    subject:
      'Código para restablecer tu contraseña - Espacios Universitarios UCV',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Solicitud de Cambio de Contraseña</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código para continuar con el proceso:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; font-size: 20px;">
          <strong>${code}</strong>
        </div>
        <p>Este código expira en 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">Espacios Universitarios UCV - ${new Date().getFullYear()}</p>
      </div>
    `,
  }),

  // Plantilla para confirmar cambio de contraseña
  passwordChanged: userName => ({
    subject: 'Tu contraseña fue cambiada - Espacios Universitarios UCV',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Cambio de Contraseña Realizado</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Se ha realizado un cambio de contraseña en tu cuenta. Si fuiste tú, no necesitas hacer nada más. Si no reconoces esta acción, contacta al administrador del sistema.</p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">Espacios Universitarios UCV - ${new Date().getFullYear()}</p>
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
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Por favor, revisa los términos y condiciones del contrato.
        </p>
        <p style="color: #666; font-size: 12px;">
          Espacios Universitarios UCV - ${new Date().getFullYear()}
        </p>
      </div>
    `,
  }),

  // noti a todas las entidades externas
  entitiesApproval: (
    spaceName,
    reservationFrom,
    reservationTo,
    eventFrom,
    eventTo,
    eventId,
    eventName
  ) => ({
    subject: `Notificación de Reserva Aprobada - ${spaceName}`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745; text-align: center;">Notificación de Reserva Aprobada</h2>
      <p>Buen día,</p>
      <p>Se les informa que se ha aprobado una reserva para el evento "<strong>${eventName}</strong>" en el espacio <strong>${spaceName}</strong>.</p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="color: #555; margin-top: 0;">Detalles de la Reserva:</h3>
        <p><strong>Período de reserva:</strong> Desde ${new Date(
          reservationFrom
        ).toLocaleString()} hasta ${new Date(
          reservationTo
        ).toLocaleString()}</p>
        <p><strong>Período del evento:</strong> Desde ${new Date(
          eventFrom
        ).toLocaleString()} hasta ${new Date(eventTo).toLocaleString()}</p>
        <p><strong>Espacio:</strong> ${spaceName}</p>
        <p><strong>Evento:</strong> ${eventName}</p>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 5px;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          <strong>Nota:</strong> Este mensaje se envía de forma automática a todas las entidades involucradas en la gestión de espacios universitarios.
        </p>
      </div>
      
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Espacios Universitarios UCV - ${new Date().getFullYear()}
      </p>
    </div>
  `,
  }),

  // Notificación a todas las entidades externas sobre evento cancelado
  entitiesCancellation: (
    spaceName,
    reservationFrom,
    reservationTo,
    eventFrom,
    eventTo,
    eventId,
    eventName
  ) => ({
    subject: `Notificación de Cancelación de Reserva - ${spaceName}`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc3545; text-align: center;">Notificación de Cancelación de Reserva</h2>
      <p>Buen día,</p>
      <p>Se les informa que la reserva para el evento "<strong>${eventName}</strong>" en el espacio <strong>${spaceName}</strong> ha sido cancelada.</p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="color: #555; margin-top: 0;">Detalles de la Reserva Cancelada:</h3>
        <p><strong>Período de reserva:</strong> Desde ${new Date(
          reservationFrom
        ).toLocaleString()} hasta ${new Date(
          reservationTo
        ).toLocaleString()}</p>
        <p><strong>Período del evento:</strong> Desde ${new Date(
          eventFrom
        ).toLocaleString()} hasta ${new Date(eventTo).toLocaleString()}</p>
        <p><strong>Espacio:</strong> ${spaceName}</p>
        <p><strong>Evento:</strong> ${eventName}</p>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #f8d7da; border-radius: 5px;">
        <p style="margin: 0; color: #721c24; font-size: 14px;">
          <strong>Nota:</strong> Este mensaje se envía de forma automática a todas las entidades involucradas en la gestión de espacios universitarios.
        </p>
      </div>
      
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Espacios Universitarios UCV - ${new Date().getFullYear()}
      </p>
    </div>
  `,
  }),
};

class EmailService {
  // Envío "fire-and-forget": agendamos el envío con Bottleneck y retornamos
  // inmediatamente para no bloquear la petición. Los errores se loguean
  // desde la tarea programada.
  async sendEmail(to, templateType, templateData, bccEmails = []) {
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

      if (bccEmails && bccEmails.length > 0) {
        mailOptions.bcc = bccEmails;
      }

      limiter
        .schedule(() => transporter.sendMail(mailOptions))
        .then(result => {
          console.log(
            `Email enviado a ${to} ${
              bccEmails && bccEmails.length > 0
                ? `y ${bccEmails.length} destinatarios en BCC`
                : ''
            }: ${template.subject}`
          );
        })
        .catch(err => {
          console.error('Error enviando email (asíncrono):', err);
        });

      // devolvemos que el email fue encolado
      return { queued: true, success: true };
    } catch (error) {
      // Errores de construcción del mensaje o plantilla
      console.error('Error preparando email para envío:', error);
      return { queued: false, success: false, error: error.message };
    }
  }

  // metodos específicos
  async notifyUpgradeRequest(adminEmails, userEmail, userName) {
    const emails = Array.isArray(adminEmails) ? adminEmails : [adminEmails];
    const results = [];
    for (const email of emails) {
      // fire-and-forget: no await
      const result = this.sendEmail(email, 'upgradeRequest', [
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
      const result = this.sendEmail(email, 'reservationRequest', [
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
    try {
      // fire-and-forget
      const result = this.sendEmail(userEmail, 'reservationResult', [
        solicitanteName,
        spaceName,
        fecha,
        approved,
        coordComments,
      ]);

      if (result && result.queued) {
        console.log(`Notificación encolada para: ${userEmail}`);
      }

      return result;
    } catch (error) {
      console.error('Error en notifyReservationResult:', error);
      return { queued: false, success: false, error: error.message };
    }
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
      const result = this.sendEmail(email, 'programUploaded', [
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

  // notificar a entidades sobre evento aprobado
  async notifyAllEntitiesApproval(
    spaceName,
    reservationFrom,
    reservationTo,
    eventFrom,
    eventTo,
    eventId,
    eventName
  ) {
    try {
      const entityEmails = this.getEntityEmails();

      if (entityEmails.length === 0) {
        console.log('No hay emails de entidades configurados');
        return {
          success: false,
          error: 'No hay emails de entidades configurados',
        };
      }

      const result = this.sendEmail(
        process.env.EMAIL_FROM,
        'entitiesApproval',
        [
          spaceName,
          reservationFrom,
          reservationTo,
          eventFrom,
          eventTo,
          eventId,
          eventName,
        ],
        entityEmails
      );

      if (result && result.queued) {
        console.log(
          `Notificación de aprobación encolada para ${entityEmails.length} entidades`
        );
      }

      return result;
    } catch (error) {
      console.error('Error en notifyAllEntitiesApproval:', error);
      return { success: false, error: error.message };
    }
  }

  // Notificar a todas las entidades sobre evento cancelado
  async notifyAllEntitiesCancellation(
    spaceName,
    reservationFrom,
    reservationTo,
    eventFrom,
    eventTo,
    eventId,
    eventName
  ) {
    try {
      const entityEmails = this.getEntityEmails();

      if (entityEmails.length === 0) {
        console.log('No hay emails de entidades configurados');
        return {
          success: false,
          error: 'No hay emails de entidades configurados',
        };
      }

      const result = this.sendEmail(
        process.env.EMAIL_FROM,
        'entitiesCancellation',
        [
          spaceName,
          reservationFrom,
          reservationTo,
          eventFrom,
          eventTo,
          eventId,
          eventName,
        ],
        entityEmails
      );

      if (result && result.queued) {
        console.log(
          `Notificación de cancelación encolada para ${entityEmails.length} entidades`
        );
      }

      return result;
    } catch (error) {
      console.error('Error en notifyAllEntitiesCancellation:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyEventRating(
    coordEmails,
    userName,
    eventName,
    spaceName,
    spaceConditionRating,
    staffTreatmentRating,
    reservationProcessRating,
    suggestion = ''
  ) {
    try {
      const emails = Array.isArray(coordEmails) ? coordEmails : [coordEmails];
      const results = [];

      for (const email of emails) {
        const result = this.sendEmail(email, 'eventRating', [
          userName,
          eventName,
          spaceName,
          spaceConditionRating,
          staffTreatmentRating,
          reservationProcessRating,
          suggestion,
        ]);
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error('Error en notifyEventRating:', error);
      return { queued: false, success: false, error: error.message };
    }
  }

  // método auxiliar
  getEntityEmails() {
    return [
      process.env.BomberosMail,
      process.env.SeguridadMail,
      process.env.mantenimientoMail,
      process.env.JefeDeProtocoloMail,
      process.env.COPREDMail,
    ].filter(email => email && email.trim() !== ''); // Filtrar emails vacíos
  }

  // Notificar código de recuperación
  async notifyPasswordReset(userEmail, userName, code) {
    return this.sendEmail(userEmail, 'passwordReset', [userName, code]);
  }

  // Notificar que la contraseña fue cambiada
  async notifyPasswordChanged(userEmail, userName) {
    return this.sendEmail(userEmail, 'passwordChanged', [userName]);
  }
}

module.exports = new EmailService();
