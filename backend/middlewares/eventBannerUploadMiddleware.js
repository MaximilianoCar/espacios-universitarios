const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración del almacenamiento para banners
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = `./uploads/events/banners`;

    // Verificar si la carpeta existe, si no, crearla
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `banner-${Date.now()}${ext}`);
  },
});

// Filtrar solo imágenes
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo imágenes.'), false);
  }
};

const upload = require('multer')({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB max
});

module.exports = upload;
