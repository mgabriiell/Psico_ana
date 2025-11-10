// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import Agendamento from "./views/pacientes/Agendamento";
import Proprietario from "./views/proprietario/Proprietario";
import LoginProprietario from "./views/proprietario/LoginProprietario";
import Cancelar from "./views/proprietario/SubcomponentesProntuario/cancelar";
import "./assets/App.css";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const [acessoProprietario, setAcessoProprietario] = useState(false);

  const handleLogout = () => {
    setAcessoProprietario(false);
  };

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Tela Inicial */}
          <Route
            path="/"
            element={
              <div className="tela-inicial-container">
                <div className="tela-inicial">
                  <h1 className="tela-inicial-titulo">Luisa Nunes Psicologia</h1>
                  <div className="tela-inicial-botoes">
                    <Link to="/agendamento" className="no-underline">
                      <button className="tela-inicial-btn">🗓️ Agendar Consulta (Cliente)</button>
                    </Link>
                    <Link to="/login" className="no-underline">
                      <button className="tela-inicial-btn">⚙️ Painel do Psicólogo</button>
                    </Link>
                  </div>
                </div>
              </div>
            }
          />

          {/* Agendamento */}
          <Route
            path="/agendamento"
            element={<div className="container-generico"><Agendamento /></div>}
          />

          {/* Login Proprietário */}
         <Route
        path="/login"
        element={
          acessoProprietario ? (
            <Navigate to="/proprietario" replace />
          ) : (
            <div className="container-generico">
              <LoginProprietario
                onLogin={() => setAcessoProprietario(true)}
                onCancelar={() => {}}
              />
            </div>
          )
        }
      />

          {/* Painel Proprietário - protegido */}
          <Route
            path="/proprietario"
            element={
              acessoProprietario ? (
                <div className="container-generico">
                  <Proprietario onLogout={handleLogout} />
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Cancelar */}
          <Route path="/cancelar" element={<Cancelar />} />

          {/* Fallback 404 */}
          <Route
            path="*"
            element={
              <div className="tela-inicial-container">
                <div className="tela-inicial">
                  <h1 className="tela-inicial-titulo">404 - Página Não Encontrada</h1>
                  <div className="tela-inicial-botoes">
                    <Link to="/" className="no-underline">
                      <button className="tela-inicial-btn">🏠 Voltar ao Início</button>
                    </Link>
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
