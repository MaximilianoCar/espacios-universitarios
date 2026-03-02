const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

function getJwtClient() {
  // Leer credenciales
  const credsPath = path.join(__dirname, '..', 'credentials.json');
  if (!fs.existsSync(credsPath)) {
    throw new Error('Missing credentials.json');
  }

  const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));

  // SIN subject para Gmail normal
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
  });

  console.log(`[gcal] Service Account: ${creds.client_email}`);
  console.log(
    `[gcal] Calendar Owner: ${process.env.CALENDAR_OWNER_EMAIL || 'espaciosuniversitariosucv@gmail.com'}`
  );
  console.log(`[gcal] Timezone: America/Caracas`);

  return { auth, creds };
}

async function getCalendar() {
  const { auth, creds } = getJwtClient();
  await auth.authorize();
  return {
    calendar: google.calendar({ version: 'v3', auth }),
    creds,
  };
}

async function createEvent(event) {
  try {
    const { calendar, creds } = await getCalendar();
    if (!event.eventFrom || !event.eventTo) {
      console.warn('Skipping Google Calendar event: missing dates');
      return null;
    }

    // ZONA HORARIA DE VENEZUELA
    const resource = {
      summary: event.name || 'Evento',
      description: event.description || '',
      start: {
        dateTime: new Date(event.eventFrom).toISOString(),
        timeZone: 'America/Caracas', // ZONA DE VENEZUELA
      },
      end: {
        dateTime: new Date(event.eventTo).toISOString(),
        timeZone: 'America/Caracas', // ZONA DE VENEZUELA
      },
    };

    // Email REAL del calendario
    const calendarId =
      process.env.CALENDAR_OWNER_EMAIL || 'espaciosuniversitariosucv@gmail.com';

    console.log(`[gcal] Creando evento en: ${calendarId}`);
    console.log(
      `[gcal] Hora Vzla: ${new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' })}`
    );

    const res = await calendar.events.insert({
      calendarId,
      resource,
    });

    console.log(`[gcal] Evento creado: ${res.data.id}`);
    return res.data && res.data.id ? res.data.id : null;
  } catch (err) {
    console.error('Google Calendar error:', err.message);

    // Mensaje específico
    if (err.message.includes('notFound') || err.message.includes('403')) {
      console.error(`Permisos: "Make changes to events"`);
    }

    return null;
  }
}

async function updateEvent(googleEventId, event) {
  try {
    if (!googleEventId) return null;
    const { calendar, creds } = await getCalendar();

    // Email REAL del calendario
    const calendarId =
      process.env.CALENDAR_OWNER_EMAIL || 'espaciosuniversitariosucv@gmail.com';

    const resource = {
      summary: event.name || 'Evento',
      description: event.description || '',
      start: {
        dateTime: event.eventFrom
          ? new Date(event.eventFrom).toISOString()
          : undefined,
        timeZone: 'America/Caracas', // VENEZUELA
      },
      end: {
        dateTime: event.eventTo
          ? new Date(event.eventTo).toISOString()
          : undefined,
        timeZone: 'America/Caracas', // VENEZUELA
      },
    };

    const res = await calendar.events.update({
      calendarId,
      eventId: googleEventId,
      resource,
    });
    return res.data && res.data.id ? res.data.id : null;
  } catch (err) {
    console.error('Google Calendar updateEvent error:', err.message);
    return null;
  }
}

async function deleteEvent(googleEventId) {
  try {
    if (!googleEventId) return null;
    const { calendar, creds } = await getCalendar();

    // Email REAL del calendario
    const calendarId =
      process.env.CALENDAR_OWNER_EMAIL || 'espaciosuniversitariosucv@gmail.com';

    await calendar.events.delete({
      calendarId,
      eventId: googleEventId,
    });
    return true;
  } catch (err) {
    console.error('Google Calendar deleteEvent error:', err.message);
    return false;
  }
}

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  async addOrUpdateAttendees(googleEventId, emails) {
    try {
      if (!googleEventId || !Array.isArray(emails) || emails.length === 0)
        return null;
      const { calendar } = await getCalendar();

      // Obtener evento actual
      const calendarId =
        process.env.CALENDAR_OWNER_EMAIL ||
        'espaciosuniversitariosucv@gmail.com';

      const getRes = await calendar.events.get({
        calendarId,
        eventId: googleEventId,
      });
      const ev = getRes.data;

      const existing = ev.attendees || [];
      const normalized = emails.map(e => ({ email: e.trim().toLowerCase() }));

      // Merge: mantener existentes y añadir/actualizar con los nuevos
      const mergedMap = {};
      for (const a of existing) mergedMap[(a.email || '').toLowerCase()] = a;
      for (const a of normalized) mergedMap[a.email] = { email: a.email }; // overwrite or add

      const attendees = Object.values(mergedMap);

      const resource = { attendees };

      const res = await calendar.events.patch({
        calendarId,
        eventId: googleEventId,
        resource,
        sendUpdates: 'all',
      });

      return res.data;
    } catch (err) {
      console.error('Google Calendar addOrUpdateAttendees error:', err.message);
      return null;
    }
  },
  async getEvent(googleEventId) {
    try {
      if (!googleEventId) return null;
      const { calendar } = await getCalendar();
      const calendarId =
        process.env.CALENDAR_OWNER_EMAIL ||
        'espaciosuniversitariosucv@gmail.com';
      const res = await calendar.events.get({
        calendarId,
        eventId: googleEventId,
      });
      return res.data || null;
    } catch (err) {
      console.error('Google Calendar getEvent error:', err.message);
      return null;
    }
  },
};
