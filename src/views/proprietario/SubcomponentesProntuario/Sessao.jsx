// src/views/proprietario/SubcomponentesProntuario/Sessao.jsx

import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import '../../../assets/Sessao.css';

export default function Sessao({ pacienteId, onSalvar, onCancelar, sessaoParaEditar }) {
    const [dataSessao, setDataSessao] = useState("");
    const [plano, setPlano] = useState("");
    const [valor, setValor] = useState("");
    const [statusPagamento, setStatusPagamento] = useState("Pendente");
    const [formaPagamento, setFormaPagamento] = useState("");
    const [resumo, setResumo] = useState("");
    const [anotacaoClinica, setAnotacaoClinica] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const opcoesPlano = ["Individual", "Casais", "Familiar", "Empresarial", "Outro"];
    const opcoesStatusPagamento = ["Pendente", "Pago", "Cancelado"];
    const opcoesFormaPagamento = [
        "Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito", 
        "Transferência Bancária", "Convênio", "Outro"
    ];

    useEffect(() => {
        if (sessaoParaEditar) {
            setDataSessao(sessaoParaEditar.data_sessao.split('T')[0]);
            setPlano(sessaoParaEditar.plano || "");
            setValor(sessaoParaEditar.valor || "");
            setStatusPagamento(sessaoParaEditar.status_pagamento || "Pendente");
            setFormaPagamento(sessaoParaEditar.forma_pagamento || "");
            setResumo(sessaoParaEditar.resumo || "");
            setAnotacaoClinica(sessaoParaEditar.anotacao_clinica || "");
        } else {
            const hoje = new Date().toISOString().split('T')[0];
            setDataSessao(hoje);
            setPlano("Individual");
            setValor("");
            setStatusPagamento("Pendente");
            setFormaPagamento("");
            setResumo("");
            setAnotacaoClinica("");
        }
    }, [sessaoParaEditar]);

    const validarFormulario = () => {
        if (!dataSessao) {
            setError("Data da sessão é obrigatória.");
            return false;
        }
        if (!plano) {
            setError("Plano é obrigatório.");
            return false;
        }
        if (!valor || isNaN(valor) || Number(valor) <= 0) {
            setError("Valor deve ser um número positivo.");
            return false;
        }
        if (statusPagamento === "Pago" && !formaPagamento) {
            setError("Forma de pagamento é obrigatória para sessões pagas.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!validarFormulario()) return;

        setLoading(true);

        try {
            const dadosSessao = {
                paciente_id: pacienteId,
                data_sessao: `${dataSessao}T00:00:00`,
                plano,
                valor: Number(valor),
                status_pagamento: statusPagamento,
                forma_pagamento: formaPagamento,
                resumo: resumo,
                anotacao_clinica: anotacaoClinica,
                updated_at: new Date().toISOString()
            };

            let result;
            if (sessaoParaEditar) {
                result = await supabase
                    .from("sessoes")
                    .update(dadosSessao)
                    .eq("id", sessaoParaEditar.id);
            } else {
                result = await supabase
                    .from("sessoes")
                    .insert([dadosSessao]);
            }

            if (result.error) throw result.error;
            onSalvar();

        } catch (error) {
            console.error("Erro ao salvar sessão:", error);
            setError("Erro ao salvar sessão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`sessao-prontuario-container ${loading ? 'sessao-prontuario-loading' : ''}`}>
            <h3 className="sessao-prontuario-titulo">
                {sessaoParaEditar ? "✏️ Editar Sessão" : "➕ Nova Sessão"}
            </h3>

            {error && <div className="sessao-prontuario-erro">{error}</div>}

            <form onSubmit={handleSubmit}>
                {/* Primeira linha de campos */}
                <div className="sessao-prontuario-grid">
                    <div className="sessao-prontuario-campo sessao-prontuario-campo-required">
                        <label className="sessao-prontuario-label">Data da Sessão</label>
                        <input
                            type="date"
                            className="sessao-prontuario-input"
                            value={dataSessao}
                            onChange={(e) => setDataSessao(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="sessao-prontuario-campo sessao-prontuario-campo-required">
                        <label className="sessao-prontuario-label">Plano</label>
                        <select
                            className="sessao-prontuario-select"
                            value={plano}
                            onChange={(e) => setPlano(e.target.value)}
                            required
                            disabled={loading}
                        >
                            <option value="">Selecione o plano</option>
                            {opcoesPlano.map(opcao => (
                                <option key={opcao} value={opcao}>{opcao}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sessao-prontuario-campo sessao-prontuario-campo-required">
                        <label className="sessao-prontuario-label">Valor (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="sessao-prontuario-input"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            placeholder="0.00"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="sessao-prontuario-campo sessao-prontuario-campo-required">
                        <label className="sessao-prontuario-label">Status do Pagamento</label>
                        <select
                            className="sessao-prontuario-select"
                            value={statusPagamento}
                            onChange={(e) => setStatusPagamento(e.target.value)}
                            required
                            disabled={loading}
                        >
                            {opcoesStatusPagamento.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Segunda linha de campos */}
                <div className="sessao-prontuario-grid">
                    {statusPagamento === "Pago" && (
                        <div className="sessao-prontuario-campo sessao-prontuario-campo-required sessao-prontuario-pago">
                            <label className="sessao-prontuario-label">Forma de Pagamento</label>
                            <select
                                className="sessao-prontuario-select"
                                value={formaPagamento}
                                onChange={(e) => setFormaPagamento(e.target.value)}
                                required={statusPagamento === "Pago"}
                                disabled={loading}
                            >
                                <option value="">Selecione a forma</option>
                                {opcoesFormaPagamento.map(forma => (
                                    <option key={forma} value={forma}>{forma}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={`sessao-prontuario-campo ${statusPagamento === "Pago" ? '' : 'sessao-prontuario-campo-full'}`}>
                        <label className="sessao-prontuario-label">Resumo da Sessão</label>
                        <input
                            type="text"
                            className="sessao-prontuario-input"
                            value={resumo}
                            onChange={(e) => setResumo(e.target.value)}
                            placeholder="Breve resumo dos temas abordados"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Campo de anotação clínica */}
                <div className="sessao-prontuario-campo sessao-prontuario-campo-full">
                    <label className="sessao-prontuario-label">Anotação Clínica</label>
                    <textarea
                        className="sessao-prontuario-textarea"
                        rows="6"
                        value={anotacaoClinica}
                        onChange={(e) => setAnotacaoClinica(e.target.value)}
                        placeholder="Registre observações clínicas importantes, evolução do paciente, técnicas utilizadas, intervenções realizadas, etc."
                        disabled={loading}
                    />
                </div>

                {/* Botões de ação */}
                <div className="sessao-prontuario-acoes">
                    <button
                        type="button"
                        className="sessao-prontuario-btn sessao-prontuario-btn-cancelar"
                        onClick={onCancelar}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="sessao-prontuario-btn sessao-prontuario-btn-confirmar"
                        disabled={loading}
                    >
                        {loading ? "Salvando..." : (sessaoParaEditar ? "Atualizar Sessão" : "Criar Sessão")}
                    </button>
                </div>
            </form>
        </div>
    );
}