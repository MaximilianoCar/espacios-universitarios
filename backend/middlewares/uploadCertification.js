const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración del almacenamiento con multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = `./uploads/user-certification`;

    // Verificar si la carpeta existe, si no, crearla
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`); // Nombre del archivo con la fecha
  },
});

// Validación de tipo de archivo
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', // JPEG
    'image/png', // PNG
    'application/pdf', // PDF
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // Límite de 5MB
  },
});

module.exports = upload;
