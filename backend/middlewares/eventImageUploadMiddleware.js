const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = 'uploads/events/images/';
    // Verificar si la carpeta existe, si no, crearla
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    // Crear un nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Filtrar archivos por tipo
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png/;
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes.'));
  }
};

const uploadImages = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = uploadImages;
