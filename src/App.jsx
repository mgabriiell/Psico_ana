// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Agendamento from "./views/pacientes/Agendamento";
import Proprietario from "./views/proprietario/Proprietario";
import LoginProprietario from "./views/proprietario/LoginProprietario";
import Cancelar from "./views/proprietario/SubcomponentesProntuario/cancelar";
import "./assets/App.css";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const [pagina, setPagina] = useState("inicio");
  const [acessoProprietario, setAcessoProprietario] = useState(false);

  const handleLogout = () => {
    setAcessoProprietario(false);
    setPagina("inicio");
  };

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Rota principal */}
          <Route
            path="/"
            element={
              pagina === "inicio" ? (
                <div className="tela-inicial-container">
                  <div className="tela-inicial">
                    <h1 className="tela-inicial-titulo">
                      Luisa Nunes Psicologia
                    </h1>
                    <div className="tela-inicial-botoes">
                      <button 
                        className="tela-inicial-btn"
                        onClick={() => setPagina("cliente")}
                      >
                        🗓️ Agendar Consulta (Cliente)
                      </button>
                      <button 
                        className="tela-inicial-btn"
                        onClick={() => setPagina("login")}
                      >
                        ⚙️ Painel do Psicólogo
                      </button>
                    </div>
                  </div>
                </div>
              ) : pagina === "cliente" ? (
                <div className="container-generico">
                 
                  <Agendamento />
                </div>
              ) : pagina === "login" ? (
                <div className="container-generico">
                  <LoginProprietario
                    onLogin={() => {
                      setAcessoProprietario(true);
                      setPagina("proprietario");
                    }}
                    onCancelar={() => setPagina("inicio")}
                  />
                </div>
              ) : pagina === "proprietario" && acessoProprietario ? (
                <div className="container-generico">
                  <Proprietario onLogout={handleLogout} />
                </div>
              ) : (
                // Fallback para rotas não encontradas
                <div className="tela-inicial-container">
                  <div className="tela-inicial">
                    <h1 className="tela-inicial-titulo">
                      Página Não Encontrada
                    </h1>
                    <div className="tela-inicial-botoes">
                      <button 
                        className="tela-inicial-btn"
                        onClick={() => setPagina("inicio")}
                      >
                        🏠 Voltar ao Início
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
          />

          {/* Rota de cancelamento */}
          <Route path="/cancelar" element={<Cancelar />} />

          {/* Rota fallback para páginas não encontradas */}
          <Route
            path="*"
            element={
              <div className="tela-inicial-container">
                <div className="tela-inicial">
                  <h1 className="tela-inicial-titulo">
                    404 - Página Não Encontrada
                  </h1>
                  <div className="tela-inicial-botoes">
                    <button 
                      className="tela-inicial-btn"
                      onClick={() => window.location.href = '/'}
                    >
                      🏠 Voltar ao Início
                    </button>
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