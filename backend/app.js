require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, User } = require('./models');
const { QueryTypes } = require('sequelize');

// Rutas
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const eventRoutes = require('./routes/eventRoutes');
const dependencyRoutes = require('./routes/dependencyRoutes');

const app = express();
app.set('trust proxy', true);

// --- CORS Config ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Seeding Logic ---
async function seedAdminUser() {
  try {
    const adminData = {
      role: 'admin',
      name: process.env.SEED_ADMIN_NAME,
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD_HASH,
      ci: process.env.SEED_ADMIN_CI,
      status: true,
    };

    const [user, created] = await User.findOrCreate({
      where: { email: adminData.email },
      defaults: adminData,
    });

    if (created) console.log('Admin inicial creado.');
    else console.log('Admin ya existe, omitiendo.');
  } catch (error) {
    console.error('Error en seeding:', error);
  }
}

// --- Sync Sequence Helper ---
async function syncSequence(tableName) {
  try {
    await sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), (SELECT MAX(id) FROM "${tableName}"));`,
      { type: QueryTypes.SELECT }
    );
  } catch (e) {
    console.warn(`Aviso en secuencia ${tableName}: ${e.message}`);
  }
}

// --- Server Startup ---
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.sync({ force: false });

    // Ejecutar ordenadamente
    await seedAdminUser();
    await syncSequence('Users');
    await syncSequence('Rooms');
    await syncSequence('Events');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor activo en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('Error fatal:', err);
    process.exit(1);
  }
}

// Rutas base
app.use('/api', userRoutes);
app.use('/api', roomRoutes);
app.use('/api', eventRoutes);
app.use('/api', dependencyRoutes);

startServer();
