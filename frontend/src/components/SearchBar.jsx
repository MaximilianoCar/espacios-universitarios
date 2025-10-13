import React from 'react';

const SearchBar = ({ placeholder, onSearch }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleInputChange = e => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="flex justify-center mt-4">
      <div className="relative w-11/12 max-w-lg">
        <input
          type="text"
          className="border border-gray-300 rounded-full py-2 pl-8 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
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
      </div>
    </div>
  );
};

export default SearchBar;
