    import React, { useState, useEffect } from "react";
    import { supabase } from "../../supabaseClient";
    import ListaPacientes from "./SubcomponentesProntuario/ListaPacientes";
    import DetalhePaciente from "./SubcomponentesProntuario/DetalhePaciente";
    import CadastroPaciente from "./SubcomponentesProntuario/FormularioPaciente";
    import AgendaPsicologo from "./AgendaPsicologo";
    import ControleFinanceiro from "./ControleFinanceiro"; 
    import ConfigurarDisponibilidade from "./ConfigurarDisponibilidade";
    import Dashboard from "./Dashboard";
    import Sidebar from "../../components/Sidebar"; 
    import RelatorioFinanceiro from "./RelatorioFinanceiro"; // Componente do Dashboard Financeiro

    import '../../assets/Proprietario.css'; 

    export default function Proprietario({ onLogout }) {
        // Estados principais
        const [viewAtiva, setViewAtiva] = useState("dashboard");
        const [pacientes, setPacientes] = useState([]);
        const [agendamentos, setAgendamentos] = useState([]);
        const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
        const [modoCadastro, setModoCadastro] = useState(false);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState("");
        
        // Estatísticas principais do painel
        const [estatisticas, setEstatisticas] = useState({
            totalPacientes: 0,
            agendamentosHoje: 0,
            sessoesMes: 0,
            receitaMes: 0,
            totalSessoes: 0,
            receitaPendente: 0,
            despesasPendentes: 0,
            despesaTotalMes: 0,
            // 🚨 NOVO: Dados brutos para gráficos
            movimentacoes: [], 
            sessoes: []
        });

        // 🚀 Carrega todos os dados iniciais ao montar o componente
        useEffect(() => {
            carregarDadosIniciais();
        }, []);

        // 🔄 Recarrega estatísticas quando a view financeira é ativada ou na inserção (via prop)
        useEffect(() => {
            if (viewAtiva === 'financeiro' || viewAtiva === 'relatorios' || viewAtiva === 'dashboard') {
                carregarEstatisticas();
            }
        }, [viewAtiva]);


        const carregarDadosIniciais = async () => {
            setLoading(true);
            // Assumindo a re-inclusão das funções originais
            await carregarPacientes();
            await carregarAgendamentos();
            await carregarEstatisticas();
            setLoading(false);
        };

        // 🔁 Atualiza apenas um paciente específico (Lógica mantida)
        const recarregarPaciente = async (pacienteId) => {
            try {
                const { data: pacienteAtualizado, error } = await supabase
                    .from("pacientes")
                    // ✅ CORREÇÃO AQUI: Usando o nome explícito da FK 'sessoes!fk_paciente'
                    .select("*, sessoes!fk_paciente(*)")
                    .eq('id', pacienteId)
                    .single();

                if (error) throw error;

                const totalSessoesAtualizado = pacienteAtualizado.sessoes ? pacienteAtualizado.sessoes.length : 0;

                const pacienteFinal = {
                    ...pacienteAtualizado,
                    total_sessoes: totalSessoesAtualizado
                };

                setPacienteSelecionado(pacienteFinal);
                setPacientes(prev => prev.map(p => p.id === pacienteId ? pacienteFinal : p));

            } catch (error) {
                console.error("Erro ao recarregar paciente:", error);
            }
        };

        // 🔄 Quando o paciente for atualizado, recarrega estatísticas também (Lógica mantida)
        const handlePacienteAtualizado = async (pacienteId) => {
            if (viewAtiva === 'pacientes') {
                await recarregarPaciente(pacienteId);
                await carregarEstatisticas();
            }
        };

        // 📋 Carrega todos os pacientes (Lógica mantida)
        const carregarPacientes = async () => {
            setLoading(true);
            setError("");
            try {
                const { data, error } = await supabase
                    .from("pacientes")
                    // ✅ CORREÇÃO AQUI: Re-adicionado '*' para colunas do paciente + FK explícita
                    .select("*, sessoes!fk_paciente(*)") 
                    .order("nome_completo", { ascending: true });

                if (error) throw error;

                const pacientesComTotal = (data || []).map(p => ({
                    ...p,
                    // A Supabase renomeia o embed para 'sessoes' por padrão
                    total_sessoes: p.sessoes ? p.sessoes.length : 0
                }));

                setPacientes(pacientesComTotal);

            } catch (error) {
                console.error("❌ Erro ao carregar pacientes:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        // 📅 Carrega os agendamentos do psicólogo (Lógica mantida)
        const carregarAgendamentos = async () => {
            try {
                const { data, error } = await supabase
                    .from("agendamentos")
                    .select("*")
                    .order("data", { ascending: true });

                if (!error) {
                    setAgendamentos(data || []);
                }
            } catch (error) {
                console.error("Erro ao carregar agendamentos:", error);
            }
        };

        // 📊 Carrega estatísticas do painel (KPIs e Dados Brutos para Gráficos)
        const carregarEstatisticas = async () => {
            try {
                // --- VARIÁVEIS DE DATA ---
                const hoje = new Date().toISOString().split('T')[0];
                const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]; 

                // --- KPIS BÁSICOS ---
                const { count: totalPacientes } = await supabase.from("pacientes").select("*", { count: 'exact', head: true });
                const { count: agendamentosHoje } = await supabase.from("agendamentos").select("*", { count: 'exact', head: true }).eq('data', hoje).eq('status', 'ativo');
                const { count: totalSessoes } = await supabase.from("sessoes").select("*", { count: 'exact', head: true });

                // 1. RECEITA (Tabela sessoes) - Busca dados brutos
                const { data: sessoesMesData, error: sessoesError } = await supabase
                    .from("sessoes")
                    .select("id, data_sessao, valor, status_pagamento, paciente_id") // Mais campos para gráficos/detalhes
                    .gte('data_sessao', primeiroDiaMes);
                
                if (sessoesError) throw sessoesError;
                
                // Cálculos de Receita
                const sessoesMesCount = sessoesMesData?.length || 0;
                const receitaMes = sessoesMesData?.filter(s => s.status_pagamento?.toLowerCase() === 'pago')
                    .reduce((total, s) => total + (Number(s.valor) || 0), 0) || 0;
                
                const receitaPendente = sessoesMesData
                    ?.filter(s => s.status_pagamento?.toLowerCase() === "pendente")
                    .reduce((total, sessao) => total + (Number(sessao.valor) || 0), 0)
                    || 0;
                
                // 2. DESPESAS/MOVIMENTAÇÕES (Tabela movimentacoes_financeiras) - Busca dados brutos
                const { data: movimentacoesData, error: movError } = await supabase
                    .from("movimentacoes_financeiras")
                    .select("id, data, valor, tipo, categoria, status, descricao") // Campos necessários para gráficos
                    .gte('data', primeiroDiaMes);

                if (movError) throw movError;
                
                const despesasMesData = movimentacoesData.filter(m => m.tipo === 'Despesa');
                
                // Cálculos de Despesa
                const despesaTotalMes = despesasMesData
                    ?.reduce((total, despesa) => total + (Number(despesa.valor) || 0), 0)
                    || 0;
                
                const despesasPendentes = despesasMesData
                    ?.filter(d => d.status === 'Pendente')
                    .reduce((total, despesa) => total + (Number(despesa.valor) || 0), 0)
                    || 0;
                
                // Atualiza o Estado
                setEstatisticas({
                    totalPacientes: totalPacientes || 0,
                    agendamentosHoje: agendamentosHoje || 0,
                    sessoesMes: sessoesMesCount,
                    receitaMes,
                    receitaPendente,
                    totalSessoes: totalSessoes || 0,
                    despesasPendentes, 
                    despesaTotalMes,
                    // Passa os dados brutos para os gráficos
                    movimentacoes: movimentacoesData, 
                    sessoes: sessoesMesData.map(s => ({
                        ...s,
                        data: s.data_sessao // Padroniza o nome do campo de data
                    }))
                });

            } catch (error) {
                console.error("Erro ao carregar estatísticas:", error);
            }
        };

        // 📌 Handlers de interface (Mantidos)
        const handleSelecionarPaciente = (paciente) => setPacienteSelecionado(paciente);
        const handleVoltarLista = () => setPacienteSelecionado(null);
        const handleCadastroConcluido = () => {
            setModoCadastro(false);
            carregarPacientes();
            carregarEstatisticas(); 
        };

        // 📺 Renderiza o conteúdo principal com base na view ativa
        const renderConteudo = () => {
            if (modoCadastro) {
                return (
                    <CadastroPaciente 
                        onSalvar={handleCadastroConcluido}
                        onCancelar={() => setModoCadastro(false)}
                    />
                );
            }

            switch (viewAtiva) {
                case "dashboard":
                    return <Dashboard estatisticas={estatisticas} agendamentos={agendamentos} />;
                
                case "agenda":
                    return <AgendaPsicologo />;
                
                case "financeiro": 
                    // Módulo de INSERÇÃO de Despesas. Passa a função de recarregar estatísticas.
                    return <ControleFinanceiro onDespesaAdicionada={carregarEstatisticas} />;
                
                case "pacientes":
                    if (pacienteSelecionado) {
                        return (
                            <DetalhePaciente
                                paciente={pacienteSelecionado}
                                onVoltar={handleVoltarLista}
                                onPacienteAtualizado={() => handlePacienteAtualizado(pacienteSelecionado.id)}
                            />
                        );
                    }
                    return (
                        <ListaPacientes
                            pacientes={pacientes}
                            onSelecionar={handleSelecionarPaciente}
                            onRecarregar={carregarPacientes}
                            onNovoPaciente={() => setModoCadastro(true)}
                            loading={loading}
                            error={error}
                        />
                    );
                
                case "relatorios":
                    // Dashboard Financeiro: Recebe os KPIs e os dados brutos para os gráficos
                    return <RelatorioFinanceiro estatisticas={estatisticas} />;
                
                case "disponibilidade":
                    return <ConfigurarDisponibilidade />;
                
                default:
                    return <Dashboard estatisticas={estatisticas} agendamentos={agendamentos} />;
            }
        };

        // 🌐 Layout geral com Sidebar
        return (
            <div className="proprietario-layout">
                <Sidebar
                    viewAtiva={viewAtiva}
                    setViewAtiva={setViewAtiva}
                    setModoCadastro={setModoCadastro}
                    onLogout={onLogout}
                    estatisticas={estatisticas}
                />

                <main className="proprietario-main">
                    {renderConteudo()}
                </main>
            </div>
        );
    }