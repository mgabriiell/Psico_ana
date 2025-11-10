// src/components/DashboardCard.jsx (VERSÃO SIMPLIFICADA E SEGURA)
import React from 'react';

export default function DashboardCard({ label, valor, icon, className }) {
    // Note: Removida a prop 'cor' e o style={{'--card-top-gradient': cor}}
    // Dependemos apenas do className para a cor.
    return (
        <div className={`stat-card ${className}`}> 
            <div className="stat-icon">{icon}</div> 
            <div className="stat-info">
                <span className="stat-number">{valor}</span>
                <span className="stat-label">{label}</span>
            </div>
        </div>
    );
}