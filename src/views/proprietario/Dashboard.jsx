// src/views/proprietario/Dashboard.jsx

import React from 'react';
import '../../assets/Dashboard.css'; 
// ✅ Importe o componente DashboardCard
import DashboardCard from '../../components/DashboardCard'; 

export default function Dashboard({ estatisticas }) {
    // A prop 'agendamentos' não é usada após remover a seção de agendamentos
    // e 'onAcao' seria uma prop para lidar com cliques nos botões de ação rápida.

    // Formatação auxiliar para moeda
    const formatarMoeda = (valor) => {
        return valor != null ? `R$ ${valor.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
    };

    return (
        <div className="dashboard-container">
            <h2>📊 Dashboard</h2>
            
            {/* Grid de Estatísticas (usando DashboardCard) */}
            <div className="stats-grid">
                
                <DashboardCard 
                    className="primary" // Adiciona a classe para o estilo de cor
                    icon="👥" 
                    valor={estatisticas.totalPacientes || 0} 
                    label="Pacientes Ativos" 
                />
                
                <DashboardCard 
                    className="success" 
                    icon="📅" 
                    valor={estatisticas.agendamentosHoje || 0} 
                    label="Agendamentos Hoje" 
                />
                
                <DashboardCard 
                    className="sessao" 
                    icon="💼" 
                    valor={estatisticas.sessoesMes || 0} 
                    label="Sessões Este Mês" 
                />

                <DashboardCard 
                    className="info" 
                    icon="📈" 
                    valor={estatisticas.totalSessoes || 0} 
                    label="Total de Sessões" 
                />
                
                <DashboardCard 
                    className="warning" 
                    icon="⏳" 
                    valor={formatarMoeda(estatisticas.receitaPendente || 0)} 
                    label="Receita Pendente" 
                />
                
                <DashboardCard 
                    className="danger" 
                    icon="💰" 
                    valor={formatarMoeda(estatisticas.receitaMes || 0)} 
                    label="Receita Mensal (Paga)" 
                />
            </div>

            {/* Ações Rápidas (Largura Total) */}
            <div className="dashboard-sections-row">
                <div className="dashboard-section">
                    <h3>⚡ Ações Rápidas</h3>
                    <div className="quick-actions">
                        <button className="quick-action-btn">📝 Nova Sessão</button>
                        <button className="quick-action-btn">🗓️ Novo Agendamento</button>
                        <button className="quick-action-btn">👤 Adicionar Paciente</button>
                        <button className="quick-action-btn">📊 Ver Relatórios</button>
                    </div>
                </div>
            </div>
        </div>
    );
}