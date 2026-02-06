import React from 'react';

const SearchBar = ({ placeholder, onSearch }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleInputChange = e => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      onSearch(searchTerm);
    }
  };

  const handleSearchClick = () => {
    onSearch(searchTerm);
  };

  const handleClearClick = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="mt-4">
      <div className="relative w-11/12 max-w-lg">
        <input
          type="text"
          className="border border-gray-300 rounded-full py-2 pl-10 pr-12 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M21 21l-5.197-5.197M17 10.5A6.5 6.5 0 1 1 4 10.5a6.5 6.5 0 0 1 13 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>

        {/* Botón de búsqueda */}
        <button
          type="button"
          onClick={handleSearchClick}
          className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
          title="Buscar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        {/* Botón de limpiar */}
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearClick}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Limpiar búsqueda"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Indicador de ayuda */}
      {searchTerm && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Presiona Enter o haz clic en la lupa para buscar
        </div>
      )}
    </div>
  );
};

export default SearchBar;
