import React, { useState } from 'react';
import '../../../assets/ListaPacientes.css';

export default function ListaPacientes({ pacientes, onSelecionar, onRecarregar, onNovoPaciente, loading, error }) {
    const [termoBusca, setTermoBusca] = useState('');
    
    // --- LÓGICA DE FILTRAGEM ---
    const pacientesFiltrados = pacientes.filter(paciente => {
        const termo = termoBusca.toLowerCase();

        const nomeCompleto = (paciente.nome_completo || '').toString().toLowerCase();
        const telefone = (paciente.celular_telefone || '').toString();

        return (
            nomeCompleto.includes(termo) ||
            telefone.includes(termo)
        );
    });

    // --- LÓGICA DE RENDERIZAÇÃO ---
    
    const renderContent = () => {
        if (loading) {
            return (
                <div className="status-message loading">
                    <p>⏳ Carregando pacientes...</p>
                </div>
            );
        }

        if (error) {
             return (
                 <div className="status-message error">
                     <p>❌ Erro ao carregar pacientes: {error}</p>
                     <button onClick={onRecarregar} className="btn btn-secondary">
                         🔄 Tentar Novamente
                     </button>
                 </div>
             );
        }

        if (pacientesFiltrados.length === 0 && termoBusca) {
            return (
                <div className="status-message info">
                    <p>🔍 Nenhum paciente encontrado com o termo: "{termoBusca}"</p>
                </div>
            );
        }

        if (pacientesFiltrados.length === 0) {
            return (
                <div className="status-message info">
                    <p>📝 Ainda não há pacientes cadastrados</p>
                    <small>Clique em "Novo Paciente" para começar</small>
                </div>
            );
        }

        // Tabela simplificada
        return (
            <div className="tabela-container"> {/* Adicionado um container para melhor responsividade de tabela */}
                <table className="tabela-pacientes">
                    <thead>
                        <tr>
                            <th>Nome do Paciente</th>
                            <th>Telefone</th>
                            <th>Sessões</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pacientesFiltrados.map((paciente) => (
                            <tr key={paciente.id} onClick={() => onSelecionar(paciente)}>
                                {/* Nome do Paciente */}
                                <td data-label="Nome do Paciente">
                                    <div className="paciente-info-simples">
                                        
                                        {/* NOVO: Tag Socioeconômico */}
                                        <div className="nome-e-tag">
                                            <strong>{paciente.nome_completo}</strong>
                                            {paciente.socioeconomico && (
                                                <span className="socioeconomico-tag">
                                                    🤝 Social
                                                </span>
                                            )}
                                        </div>

                                        {paciente.email && (
                                            <small>{paciente.email}</small>
                                        )}
                                    </div>
                                </td>
                                
                                {/* Telefone */}
                                <td data-label="Telefone">
                                    {paciente.celular_telefone || <span className="texto-indisponivel">Não informado</span>}
                                </td>
                                
                                {/* Sessões */}
                                <td data-label="Sessões">
                                    <span className={`sessao-badge ${paciente.total_sessoes > 0 ? 'com-sessoes' : 'sem-sessoes'}`}>
                                        {paciente.total_sessoes || 0}
                                    </span>
                                </td>
                                
                                {/* Botão de ação */}
                                <td data-label="Ações">
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation();
                                            onSelecionar(paciente);
                                        }} 
                                        className="btn-acao"
                                    >
                                        Detalhes
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // --- JSX PRINCIPAL ---
    return (
        <div className="lista-pacientes-container">
            <div className="lista-header">
                <h2>👥 Lista de Pacientes</h2>
                <p className="subtitulo-lista">
                    {pacientesFiltrados.length} de {pacientes.length} pacientes
                    {termoBusca && ` • Filtrado por: "${termoBusca}"`}
                </p>
                
                <div className="controles-lista">
                    <input
                        type="text"
                        placeholder="🔍 Buscar por nome ou telefone..."
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        className="input-busca"
                    />

                    <div className="botoes-acao">
                        <button 
                            onClick={onRecarregar} 
                            className="btn btn-secondary" 
                            disabled={loading}
                        >
                            {loading ? "⏳" : "🔄"} Recarregar
                        </button>
                        <button 
                            onClick={onNovoPaciente} 
                            className="btn btn-primary"
                        >
                            👤 Novo Paciente
                        </button>
                    </div>
                </div>
            </div>

            <div className="lista-pacientes-content">
                {renderContent()}
            </div>
        </div>
    );
}