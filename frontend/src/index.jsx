import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux'; // Importar Provider de react-redux
import { store } from './app/store'; // Importar el store que creaste
import App from './App';
import './index.css'; // Asegúrate de que las directivas de Tailwind estén incluidas

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container); // Creación del root

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);
