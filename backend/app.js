require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { sequelize } = require('./models');
const { QueryTypes } = require('sequelize');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const eventRoutes = require('./routes/eventRoutes');
const path = require('path');

// SOLUCIÓN: usar cors() con lista dinámica (desde env o valores por defecto)
app.set('trust proxy', true);

const allowedOriginsEnv =
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,https://l5z18rgq-3000.brs.devtunnels.ms,http://localhost:3000';
const allowedOrigins = allowedOriginsEnv.split(',').map(s => s.trim());

const corsOptions = {
  origin: function (origin, callback) {
    // permitir requests sin origin (ej: herramientas como curl, o same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`CORS origin denied: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders:
    'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  credentials: true,
  optionsSuccessStatus: 200,
};

// Aplicar CORS globalmente y para preflight
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware para parsear JSON
app.use(express.json());

// Middleware para servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check (ya existía)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'El servidor está funcionando correctamente.',
  });
});

// Endpoint de depuración para comprobar proxy/CORS desde el frontend
app.get('/api/ping', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'pong',
    originReceived: req.headers.origin || null,
  });
});

// Montar las rutas
app.use('/api', userRoutes);
app.use('/api', roomRoutes);
app.use('/api', eventRoutes);

// Restaurar secuencia para casos especiales
async function syncSequence(tableName) {
  const syncQuery = `
    SELECT setval(
        pg_get_serial_sequence('"${tableName}"', 'id'),
        (SELECT MAX(id) FROM "${tableName}")
    );
  `;

  try {
    await sequelize.query(syncQuery, { type: QueryTypes.SELECT });
    console.log(`Secuencia de la tabla "${tableName}" sincronizada.`);
  } catch (error) {
    if (
      error.message.includes('cannot be null') ||
      error.message.includes('no relation named')
    ) {
      console.warn(
        `Advertencia al sincronizar la secuencia de "${tableName}": La tabla podría estar vacía o no existe. ${error.message}`
      );
    } else {
      console.error(
        `Error al sincronizar la secuencia de "${tableName}":`,
        error
      );
    }
  }
}

// Iniciar la base de datos y el servidor
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.sync({ force: false });

    // Sincronizar secuencias después de la sincronización de la BD
    await syncSequence('Users');
    await syncSequence('Rooms');
    await syncSequence('Events');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
      console.log(`Disponible localmente en: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('No se pudo conectar a la base de datos:', err);
    process.exit(1);
  }
}

startServer();
