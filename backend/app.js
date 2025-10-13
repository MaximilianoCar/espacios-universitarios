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

app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Middleware para servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Montar las rutas
app.use('/api', userRoutes);
app.use('/api', roomRoutes);
app.use('/api', eventRoutes);

//Restaurar secuencia para casos especiales
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
      // Esta es una advertencia. No debe detener el servidor, pues el error es menor.
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

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'El servidor está funcionando correctamente.',
  });
});

// Iniciar la base de datos y el servidor
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.sync({ force: false });

    // Sincronizar secuencias después de la sincronización de la BD
    await syncSequence('Users');
    await syncSequence('Rooms');
    await syncSequence('Events');

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('No se pudo conectar a la base de datos:', err);
    process.exit(1);
  }
}

startServer();
