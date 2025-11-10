// src/views/proprietario/SubcomponentesProntuario/DetalhePaciente.jsx

import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import Sessao from "./Sessao";
import FormularioPaciente from "./FormularioPaciente";
import '../../../assets/DetalhePaciente.css';

// Constantes úteis
const MODO = {
    VISUALIZAR: 'visualizar',
    NOVA_SESSAO: 'nova',
    EDITAR_SESSAO: 'editarSessao',
    EDITAR_DADOS: 'editarDados'
};

// --- COMPONENTE FILHO AUXILIAR: Card de Informações Simples ---
const DetalheCard = ({ title, children, className = '' }) => (
    <div className={`card-detalhes ${className}`}>
        <h3>{title}</h3>
        {children}
    </div>
);
// -----------------------------------------------------------------


export default function DetalhePaciente({ paciente, onVoltar, onPacienteAtualizado }) {
    const [sessoes, setSessoes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [modo, setModo] = useState(MODO.VISUALIZAR);
    const [sessaoSelecionada, setSessaoSelecionada] = useState(null); 

    // --- LÓGICAS DE CARREGAMENTO & HANDLERS ---
    const carregarSessoes = async (pacienteId) => {
        setLoading(true);
        const { data, error } = await supabase
            .from("sessoes")
            .select("*") 
            .eq("paciente_id", pacienteId)
            .order("data_sessao", { ascending: false });

        if (error) {
            console.error("Erro ao carregar sessões:", error);
            setSessoes([]);
        } else {
            setSessoes(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (paciente?.id) {
            if (modo === MODO.VISUALIZAR || modo === MODO.EDITAR_DADOS) {
                carregarSessoes(paciente.id);
            }
        }
    }, [paciente, modo]); 
    
    const handleSessaoSalva = () => {
        setModo(MODO.VISUALIZAR); 
        setSessaoSelecionada(null); 
        carregarSessoes(paciente.id); 
        if (onPacienteAtualizado) {
            onPacienteAtualizado();
        }
    };
    
    const handleAbrirEdicaoSessao = (sessao) => {
        setSessaoSelecionada(sessao);
        setModo(MODO.EDITAR_SESSAO);
    };

    const handleDadosSalvos = () => {
        setModo(MODO.VISUALIZAR); 
        if (onPacienteAtualizado) {
            onPacienteAtualizado();
        }
    };
    
    const handleCancelarAcao = () => {
        setModo(MODO.VISUALIZAR);
        setSessaoSelecionada(null);
    };

    // --- RENDERIZAÇÃO CONDICIONAL PRINCIPAL (MOVIMENTAÇÕES DE FLUXO) ---
    
    if (modo === MODO.EDITAR_DADOS) {
        return (
            <FormularioPaciente
                pacienteInicial={paciente}
                onSalvar={handleDadosSalvos}
                onCancelar={handleCancelarAcao}
            />
        );
    }

    if (modo === MODO.NOVA_SESSAO || modo === MODO.EDITAR_SESSAO) {
        return (
            <Sessao 
                pacienteId={paciente.id} 
                onSalvar={handleSessaoSalva} 
                onCancelar={handleCancelarAcao}
                sessaoParaEditar={sessaoSelecionada} 
            />
        );
    }
    
    if (!paciente) {
        return (
            <div className="detalhe-paciente-container">
                <p>Selecione um paciente na lista.</p>
            </div>
        );
    }
    
    // --- CÁLCULOS E FORMATAÇÃO (VISUALIZAR DETALHES) ---
    
    const totalSessoes = sessoes.length;
    const sessoesPagas = sessoes.filter(s => s.status_pagamento === 'Pago').length;
    const valorTotal = sessoes.filter(s => s.status_pagamento === 'Pago')
        .reduce((sum, s) => sum + (Number(s.valor) || 0), 0);
        
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    // --- RENDERIZAÇÃO PADRÃO (VISUALIZAR DETALHES) ---

    return (
        <div className="detalhe-paciente-container">
            {/* --- HEADER --- */}
            <div className="detalhe-paciente-header">
                <button onClick={onVoltar} className="btn btn-secondary">
                    ← Voltar
                </button>
                <div className="header-actions">
                    <button 
                        onClick={() => setModo(MODO.EDITAR_DADOS)} 
                        className="btn btn-secondary"
                    >
                        ✏️ Editar Dados
                    </button>
                    <button 
                        onClick={() => setModo(MODO.NOVA_SESSAO)} 
                        className="btn btn-primary"
                    >
                        + Nova Sessão
                    </button>
                </div>
            </div>

            {/* --- CONTEÚDO PRINCIPAL (DETALHES + SESSÕES) --- */}
            <div className="detalhe-paciente-content">
                
                {/* --- COLUNA ESQUERDA: DETALHES DO PACIENTE (MAIS MODULAR) --- */}
                <div className="paciente-detalhes">
                    
                    {/* CARD 1: Informações de Contato e Pessoais */}
                    <DetalheCard title={paciente.nome_completo}>
                        <div className="detalhe-grupo">
                            <div className="detalhe-item">
                                <label>Email:</label>
                                <p>{paciente.email}</p>
                            </div>
                            <div className="detalhe-item">
                                <label>Telefone:</label>
                                <p>{paciente.celular_telefone || 'N/A'}</p>
                            </div>
                            <div className="detalhe-item">
                                <label>Data Nasc.:</label>
                                <p>{formatDate(paciente.data_nascimento)}</p>
                            </div>
                            <div className="detalhe-item">
                                <label>Gênero:</label>
                                <p>{paciente.genero || 'N/A'}</p>
                            </div>
                            <div className="detalhe-item">
                                <label>CPF:</label>
                                <p>{paciente.cpf || 'Não informado'}</p>
                            </div>
                            <div className="detalhe-item">
                                <label>Profissão:</label>
                                <p>{paciente.profissao || 'N/A'}</p>
                            </div>
                        </div>
                    </DetalheCard>
                    
                    {/* CARD 2: Estatísticas */}
                    <DetalheCard title="Estatísticas Rápidas">
                        <div className="estatistica-grid"> {/* Usando classe mais descritiva */}
                            <div className="estatistica-item">
                                <strong>{totalSessoes}</strong>
                                <small>Sessões Totais</small>
                            </div>
                            <div className="estatistica-item">
                                <strong>{sessoesPagas}</strong>
                                <small>Sessões Pagas</small>
                            </div>
                            <div className="estatistica-item receita">
                                <strong>R$ {valorTotal.toFixed(2).replace('.', ',')}</strong>
                                <small>Receita Paga</small>
                            </div>
                        </div>
                    </DetalheCard>

                    {/* CARD 3: Observações (Condicional) */}
                    {paciente.observacoes && (
                        <DetalheCard title="Observações Gerais">
                            <p className="full-width-info">{paciente.observacoes}</p>
                        </DetalheCard>
                    )}
                </div>

                {/* --- COLUNA DIREITA: HISTÓRICO DE SESSÕES --- */}
                <div className="paciente-sessoes">
                    <h3>Histórico de Sessões ({sessoes.length})</h3>
                    
                    {loading ? (
                        <p className="loading-message">Carregando histórico...</p>
                    ) : sessoes.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhuma sessão registrada para este paciente.</p>
                        </div>
                    ) : (
                        <div className="lista-sessoes">
                            {sessoes.map((sessao) => (
                                <div 
                                    key={sessao.id} 
                                    className={`sessao-card status-${sessao.status_pagamento.toLowerCase().replace(' ', '')}`}
                                    onClick={() => handleAbrirEdicaoSessao(sessao)}
                                >
                                    <div className="sessao-info">
                                        <strong>{formatDate(sessao.data_sessao)}</strong> 
                                        <span>({sessao.plano || 'N/A'})</span>
                                    </div>
                                    <div className="sessao-meta">
                                        <span className={`tag-status status-${sessao.status_pagamento.toLowerCase().replace(' ', '')}`}>
                                            {sessao.status_pagamento}
                                        </span>
                                        <span className="sessao-valor">
                                            R$ {Number(sessao.valor).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                    <small className="sessao-resumo-anotacao">
                                        {sessao.anotacao_clinica.substring(0, 70)}{sessao.anotacao_clinica.length > 70 ? '...' : ''}
                                    </small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}