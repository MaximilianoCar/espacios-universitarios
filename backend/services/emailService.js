const nodemailer = require('nodemailer');

// Configurar el transporter (ejemplo con Gmail)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailTemplates = {
  // Notificación para admins - Solicitud de upgrade a solicitante
  upgradeRequest: (userEmail, userName) => ({
    subject: '📋 Nueva Solicitud de Upgrade a Solicitante',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nueva Solicitud de Registro</h2>
        <p>El usuario <strong>${userName}</strong> (${userEmail}) ha solicitado convertirse en solicitante.</p>
        <p>Por favor, ingresa a la aplicación para revisar y aprobar/rechazar esta solicitud.</p>
        <a href="${process.env.APP_URL}/admin/solicitudes" 
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Revisar Solicitudes
        </a>
        <p style="margin-top: 20px; color: #666;">
          Este es un mensaje automático, por favor no responder.
        </p>
      </div>
    `,
  }),

  // Notificación al visitante - Resultado de solicitud
  upgradeResult: (userName, approved, adminComments = '') => ({
    subject: approved ? '✅ Solicitud Aprobada' : '❌ Solicitud Rechazada',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${approved ? '#28a745' : '#dc3545'};">
          ${approved ? '¡Solicitud Aprobada!' : 'Solicitud Rechazada'}
        </h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Tu solicitud para convertirte en solicitante ha sido <strong>${
          approved ? 'APROBADA' : 'RECHAZADA'
        }</strong>.</p>
        ${
          adminComments
            ? `<p><strong>Comentarios del administrador:</strong> ${adminComments}</p>`
            : ''
        }
        ${
          approved
            ? `<p>Ahora puedes acceder a todas las funcionalidades de solicitante, incluyendo la reserva de espacios.</p>
           <a href="${process.env.APP_URL}/login" 
              style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Ingresar a la Plataforma
          </a>`
            : `<p>Si crees que esto es un error, por favor contacta con los administradores.</p>`
        }
      </div>
    `,
  }),

  // Notificación a coordinadores - Nueva reserva
  reservationRequest: (solicitanteName, spaceName, fecha) => ({
    subject: '📅 Nueva Solicitud de Reserva',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nueva Solicitud de Reserva</h2>
        <p>El solicitante <strong>${solicitanteName}</strong> ha solicitado reservar:</p>
        <ul>
          <li><strong>Espacio:</strong> ${spaceName}</li>
          <li><strong>Fecha:</strong> ${fecha}</li>
        </ul>
        <p>Por favor, ingresa a la aplicación para revisar y aprobar/rechazar esta reserva.</p>
        <a href="${process.env.APP_URL}/coord/reservas" 
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Revisar Reservas
        </a>
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
    subject: approved ? '✅ Reserva Aprobada' : '❌ Reserva Rechazada',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${approved ? '#28a745' : '#dc3545'};">
          ${approved ? '¡Reserva Aprobada!' : 'Reserva Rechazada'}
        </h2>
        <p>Hola <strong>${solicitanteName}</strong>,</p>
        <p>Tu solicitud de reserva para <strong>${spaceName}</strong> el <strong>${fecha}</strong> ha sido <strong>${
      approved ? 'APROBADA' : 'RECHAZADA'
    }</strong>.</p>
        ${
          coordComments
            ? `<p><strong>Comentarios del coordinador:</strong> ${coordComments}</p>`
            : ''
        }
        ${
          approved
            ? `<p>Tu reserva ha sido confirmada. Por favor, presenta este correo como comprobante cuando uses el espacio.</p>`
            : `<p>Puedes intentar reservar otro espacio u horario disponible.</p>`
        }
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
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`Email enviado a ${to}: ${template.subject}`);
      return result;
    } catch (error) {
      console.error('Error enviando email:', error);
      throw error;
    }
  }

  // Métodos específicos para cada caso de uso
  async notifyUpgradeRequest(adminEmails, userEmail, userName) {
    const emails = Array.isArray(adminEmails) ? adminEmails : [adminEmails];
    const promises = emails.map(email =>
      this.sendEmail(email, 'upgradeRequest', [userEmail, userName])
    );
    return Promise.all(promises);
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
    fecha
  ) {
    const emails = Array.isArray(coordEmails) ? coordEmails : [coordEmails];
    const promises = emails.map(email =>
      this.sendEmail(email, 'reservationRequest', [
        solicitanteName,
        spaceName,
        fecha,
      ])
    );
    return Promise.all(promises);
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
}

module.exports = new EmailService();
