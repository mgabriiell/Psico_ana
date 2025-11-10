import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 
import '../../assets/financeiro.css'; // O seu arquivo CSS

// Constantes para os valores fixos
const NATUREZAS = ['Fixo', 'Variável'];
const STATUS = ['Pago', 'Pendente'];

// Lista de Categorias Comuns para Despesas
const CATEGORIAS = [
    'Aluguel / Imóvel', 
    'Contas de Consumo (Água, Luz, Internet)',
    'Salários / Pró-labore', 
    'Impostos / Taxas',
    'Marketing / Publicidade',
    'Material de Escritório',
    'Manutenção / Reparos',
    'Software / Assinaturas',
    'Capacitação / Cursos',
    'Outras Despesas'
];

export default function ControleFinanceiro({ onDespesaAdicionada }) {
    
    // ... (Estados do Formulário e da Lista) ...
    const [novaDespesa, setNovaDespesa] = useState({
        data: new Date().toISOString().split('T')[0], 
        descricao: '',
        valor: '',
        natureza: NATUREZAS[0], 
        categoria: CATEGORIAS[0],
        status: STATUS[1], 
        tipo: 'Despesa'
    });

    const [despesas, setDespesas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [statusUpdating, setStatusUpdating] = useState(null); // Estado para rastrear qual ID está sendo atualizado

    // ... (useEffect e carregarDespesas) ...
    useEffect(() => {
        carregarDespesas();
    }, []);

    const carregarDespesas = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('movimentacoes_financeiras')
                .select('*')
                .eq('tipo', 'Despesa') 
                .order('data', { ascending: false });

            if (error) throw error;
            setDespesas(data || []);
        } catch (err) {
            console.error('Erro ao carregar despesas:', err.message);
            setError('Erro ao carregar despesas. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };
    // ... (handleChange e handleSubmit) ...
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNovaDespesa(prev => ({
            ...prev,
            [name]: name === 'valor' 
                ? Number(value.replace(',', '.')) 
                : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!novaDespesa.descricao || novaDespesa.valor <= 0 || !novaDespesa.data || !novaDespesa.categoria) {
            setError('Preencha todos os campos obrigatórios (descrição, valor, data e categoria).');
            setLoading(false);
            return;
        }

        try {
            const despesaParaInserir = {
                ...novaDespesa,
                valor: Number(novaDespesa.valor).toFixed(2)
            };
            
            const { error } = await supabase
                .from('movimentacoes_financeiras')
                .insert([{ ...despesaParaInserir }]); 

            if (error) throw error;

            setNovaDespesa({ 
                data: new Date().toISOString().split('T')[0],
                descricao: '', 
                valor: '', 
                natureza: NATUREZAS[0], 
                categoria: CATEGORIAS[0],
                status: STATUS[1],
                tipo: 'Despesa'
            });

            await carregarDespesas();
            
            if (onDespesaAdicionada) {
                onDespesaAdicionada(); 
            }
            
        } catch (err) {
            console.error('Erro ao registrar despesa:', err.message);
            setError('Falha ao registrar despesa. Verifique a conexão.');
        } finally {
            setLoading(false);
        }
    };

    // 🚀 FUNÇÃO: Mudar o status de Pendente para Pago
    const handleMudarStatus = async (id, statusAtual) => {
        const novoStatus = statusAtual === 'Pendente' ? 'Pago' : 'Pendente';
        
        setStatusUpdating(id); // Indica que este item está sendo atualizado
        setError(null);

        try {
            const { error } = await supabase
                .from('movimentacoes_financeiras')
                .update({ 
                    status: novoStatus,
                })
                .eq('id', id);

            if (error) throw error;

            // 1. Atualiza o estado local
            setDespesas(prevDespesas => 
                prevDespesas.map(d => 
                    d.id === id ? { ...d, status: novoStatus } : d
                )
            );

            // 2. Notifica o componente pai para recarregar os KPIs (Dashboard Financeiro)
            if (onDespesaAdicionada) {
                onDespesaAdicionada(); 
            }

        } catch (err) {
            console.error('Erro ao atualizar status:', err.message);
            setError('Falha ao atualizar o status da despesa.');
        } finally {
            setStatusUpdating(null); // Finaliza o rastreamento
        }
    };
    // --------------------------------------------------------------------------------

    return (
        <div className="financeiro-container">
            <h2>💰 Controle de Despesas</h2>

            {/* Formulário de Nova Despesa */}
            <div className="card form-card">
                <h3>Adicionar Nova Despesa</h3>
                <form onSubmit={handleSubmit} className="despesa-form">
                    {/* Linha 1: Descrição, Valor, Data, Natureza */}
                    <div className="form-group-inline">
                        <input
                            type="text"
                            name="descricao"
                            placeholder="Descrição (ex: Aluguel do consultório)"
                            value={novaDespesa.descricao}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="number"
                            name="valor"
                            placeholder="Valor (R$)"
                            value={novaDespesa.valor}
                            onChange={handleChange}
                            step="0.01"
                            min="0.01"
                            required
                        />
                        <input
                            type="date"
                            name="data"
                            value={novaDespesa.data}
                            onChange={handleChange}
                            required
                        />
                        <select name="natureza" value={novaDespesa.natureza} onChange={handleChange}>
                            {NATUREZAS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>

                    {/* Linha 2: Categoria, Status, Botão */}
                    <div className="form-group-inline">
                        <select name="categoria" value={novaDespesa.categoria} onChange={handleChange} required>
                            <option value="" disabled>Selecione a Categoria</option>
                            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        
                        {/* Este select de status é opcional, pois o status inicial é definido */}
                        <select name="status" value={novaDespesa.status} onChange={handleChange}>
                            {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        
                        <button type="submit" disabled={loading} className="btn-primary" style={{ gridColumn: 'span 2' }}>
                            {loading ? 'Registrando...' : 'Salvar Despesa'}
                        </button>
                    </div>
                </form>
                {error && <p className="error-message">{error}</p>}
            </div>

            {/* Lista de Despesas Registradas */}
            <div className="lista-despesas-container">
                <h3>Despesas Registradas</h3>
                {loading && <p>Carregando despesas...</p>}
                
                {!loading && despesas.length === 0 && (
                    <p className="lista-vazia">Nenhuma despesa registrada ainda.</p>
                )}

                {!loading && despesas.length > 0 && (
                    <table className="despesas-table">
                        {/* CORREÇÃO APLICADA AQUI: Remover quebras de linha entre <tr> e <th> */}
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Natureza</th>
                                <th>Status</th>
                                <th>Valor</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* CORREÇÃO APLICADA AQUI: Remover quebras de linha entre <tbody> e <tr> */}
                            {despesas.map(d => (
                                <tr key={d.id} className={d.status === 'Pendente' ? 'despesa-pendente' : ''}>
                                    <td>{new Date(d.data).toLocaleDateString('pt-BR')}</td>
                                    <td>{d.descricao}</td>
                                    <td>{d.categoria || '-'}</td>
                                    <td>{d.natureza}</td>
                                    <td>
                                        <span className={`status-badge status-${d.status.toLowerCase()}`}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="valor-despesa">
                                        R$ {Number(d.valor).toFixed(2).replace('.', ',')}
                                    </td>
                                    <td>
                                        {d.status === 'Pendente' ? (
                                            <button 
                                                className="btn-mudar-status"
                                                onClick={() => handleMudarStatus(d.id, d.status)}
                                                disabled={statusUpdating === d.id} // Desativa enquanto atualiza
                                            >
                                                {statusUpdating === d.id ? 'Pagando...' : 'Marcar como Pago'}
                                            </button>
                                        ) : (
                                            <span className="text-success">✅ Pago</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}