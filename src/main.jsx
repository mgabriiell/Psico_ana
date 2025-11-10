// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Apenas importa o componente principal
// Remova: import AgendaPsicologo from "./AgendaPsicologo";
// Remova: import Prontuario from "./Prontuario";
// Remova: import "../../assets/Proprietario.css";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);