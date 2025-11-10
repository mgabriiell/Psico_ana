import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import '../../assets/relatoriofinanceiro.css'; 

const formatarMoeda = (valor) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#17a2b8'];

const useFinancialData = (estatisticas) => {
    const { movimentacoes, sessoes } = estatisticas;

    const dataCategorias = useMemo(() => {
        const despesasPagas = movimentacoes.filter(m => m.tipo === 'Despesa' && m.status === 'Pago');
        const categoriasMap = despesasPagas.reduce((acc, d) => {
            const cat = d.categoria || 'Outras';
            acc[cat] = (acc[cat] || 0) + Number(d.valor);
            return acc;
        }, {});
        return Object.entries(categoriasMap)
            .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
            .sort((a, b) => b.value - a.value);
    }, [movimentacoes]);

    const dataMensal = useMemo(() => {
        const receitas = sessoes.filter(s => s.status_pagamento === 'Pago');
        const despesas = movimentacoes.filter(m => m.tipo === 'Despesa' && m.status === 'Pago');
        const mesesMap = {};

        [...receitas, ...despesas].forEach(item => {
            const dataStr = item.data || item.data_sessao;
            if (!dataStr) return;
            const [ano, mes] = dataStr.split('-');
            const key = `${ano}-${mes}`;
            const nomeMes = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'short' });
            if (!mesesMap[key]) mesesMap[key] = { name: nomeMes, Receita: 0, Despesa: 0 };
            if (item.status_pagamento === 'Pago') mesesMap[key].Receita += Number(item.valor);
            if (item.tipo === 'Despesa') mesesMap[key].Despesa += Number(item.valor);
        });

        return Object.keys(mesesMap).sort().map(k => ({
            ...mesesMap[k],
            Receita: parseFloat(mesesMap[k].Receita.toFixed(2)),
            Despesa: parseFloat(mesesMap[k].Despesa.toFixed(2)),
            Lucro: mesesMap[k].Receita - mesesMap[k].Despesa
        }));
    }, [movimentacoes, sessoes]);

    const receitaAcumulada = useMemo(() => {
        let acumulado = 0;
        return dataMensal.map(item => {
            acumulado += item.Receita - item.Despesa;
            return { ...item, Acumulado: acumulado };
        });
    }, [dataMensal]);

    const topCategorias = useMemo(() => dataCategorias.slice(0, 5), [dataCategorias]);

    return { dataCategorias, dataMensal, receitaAcumulada, topCategorias };
};

export default function RelatorioFinanceiro({ estatisticas }) {
    const {
        receitaMes,
        receitaPendente,
        despesasPendentes,
        despesaTotalMes
    } = estatisticas;

    const { dataCategorias, dataMensal, receitaAcumulada, topCategorias } = useFinancialData(estatisticas);

    const saldoBruto = (receitaMes || 0) - (despesaTotalMes || 0);
    const tendencia = saldoBruto >= 0 ? "⬆️" : "⬇️";

    const cards = [
        { title: "Receita Realizada (Mês)", value: formatarMoeda(receitaMes), detail: `(+ ${formatarMoeda(receitaPendente)} pendente)`, className: "card-receita" },
        { title: "Despesas (Mês)", value: formatarMoeda(despesaTotalMes), detail: `( ${formatarMoeda(despesasPendentes)} pendente )`, className: "card-despesa" },
        { title: "Lucro / Saldo Bruto", value: `${tendencia} ${formatarMoeda(saldoBruto)}`, className: saldoBruto >= 0 ? "card-lucro" : "card-prejuizo" }
    ];

    return (
        <div className="relatorio-financeiro-container">
            <h2>📊 Relatório Financeiro</h2>

            <div className="financeiro-cards-grid">
                {cards.map((c, i) => (
                    <div key={i} className={`financeiro-card ${c.className}`}>
                        <h4>{c.title}</h4>
                        <p className="valor">{c.value}</p>
                        {c.detail && <small>{c.detail}</small>}
                    </div>
                ))}
            </div>

            <div className="financeiro-graficos">
                <h3>📈 Análises Detalhadas</h3>

                <div className="graficos-grid-2-col">
                    <div className="grafico-item">
                        <h4>Fluxo Mensal — Receita vs Despesa</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dataMensal}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(v) => formatarMoeda(v)} />
                                <Legend />
                                <Bar dataKey="Receita" fill="#28a745" />
                                <Bar dataKey="Despesa" fill="#dc3545" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grafico-item">
                        <h4>Receita Acumulada</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={receitaAcumulada}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(v) => formatarMoeda(v)} />
                                <Legend />
                                <Line type="monotone" dataKey="Acumulado" stroke="#007bff" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="graficos-grid-2-col">
                    <div className="grafico-item">
                        <h4>Top 5 Categorias de Despesa</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart layout="vertical" data={topCategorias} margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" />
                                <Tooltip formatter={(v) => formatarMoeda(v)} />
                                <Bar dataKey="value" fill="#fd7e14" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grafico-item">
                        <h4>Distribuição de Despesas (Pizza)</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={dataCategorias}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {dataCategorias.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => formatarMoeda(v)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
