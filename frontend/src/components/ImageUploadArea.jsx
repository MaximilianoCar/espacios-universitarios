import React from 'react';

const ImageUploadArea = ({ imageFile, onFileChange }) => {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center hover:border-blue-400 transition-colors">
      <div className="mb-4">
        <label htmlFor="imageFile" className="cursor-pointer">
          <span className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base hover:bg-blue-700 transition-colors">
            Seleccionar Imagen
          </span>
          <input
            type="file"
            name="imageFile"
            id="imageFile"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
        </label>
      </div>

      <p className="text-xs sm:text-sm text-gray-600">
        PNG, JPG, JPEG hasta 5MB
      </p>

      {imageFile && (
        <div className="mt-4">
          <p className="text-green-600 font-medium text-sm sm:text-base mb-2">
            ✓ Imagen seleccionada: {imageFile.name}
          </p>
          <img
            src={URL.createObjectURL(imageFile)}
            alt="Previsualización"
            className="w-32 h-24 sm:w-48 sm:h-32 object-cover rounded-lg mx-auto shadow-md"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploadArea;
