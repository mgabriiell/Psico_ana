// src/views/proprietario/Sidebar.jsx
import React from "react";
import LogoLuisaNunes from "../context/Marca.png"; // Caminho da logo

export default function Sidebar({
  viewAtiva,
  setViewAtiva,
  setModoCadastro,
  onLogout,
  estatisticas,
}) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", badge: null },
    { id: "agenda", label: "Agenda", icon: "📅", badge: null },
    { id: "pacientes", label: "Pacientes", icon: "👥", badge: estatisticas.totalPacientes },
    { id: "financeiro", label: "Financeiro", icon: "💰", badge: null },
    { id: "relatorios", label: "Relatórios", icon: "📈", badge: null },
    { id: "disponibilidade", label: "Disponibilidade", icon: "🕒", badge: null },
  ];

  return (
    <div className="sidebar">
      {/* Cabeçalho com Logo */}
      <div className="sidebar-header">
        <div className="logo-container">
          <img src={LogoLuisaNunes} alt="Luisa Nunes Psicóloga" className="logo-img" />
        </div>
      </div>

      {/* Menu de navegação */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${viewAtiva === item.id ? "active" : ""}`}
            onClick={() => {
              setModoCadastro(false);
              setViewAtiva(item.id);
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.badge !== null && item.badge > 0 && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Ações rápidas */}
      <div className="sidebar-actions">
        <button
          className="action-btn primary"
          onClick={() => {
            setViewAtiva("pacientes");
            setModoCadastro(true);
          }}
        >
          <span className="action-icon">👤</span>
          Novo Paciente
        </button>

        <button className="action-btn logout" onClick={onLogout}>
          <span className="action-icon">🚪</span>
          Sair
        </button>
      </div>
    </div>
  );
}
