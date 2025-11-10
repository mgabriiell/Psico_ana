import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "../../assets/Agenda.css";

const todosHorarios = [
  "09:00", "10:00", "11:00", "13:00",
  "14:00", "15:00", "16:00", "17:00"
];

const precosServico = {
  "Corte Masculino": 35.0,
  "Corte Feminino": 60.0,
  "Coloração": 120.0,
  "Hidratação": 80.0,
  "Manicure": 25.0,
  "Pedicure": 30.0
};

export default function Agenda() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    const { data, error } = await supabase
      .from("agendamentos")
      .select("*")
      .order("data", { ascending: false })
      .order("horario", { ascending: true });

    if (error) {
      console.error("Erro ao carregar agendamentos:", error);
    } else {
      setAgendamentos(data || []);
    }
  };

  const agendamentosAtivos = agendamentos.filter((a) => a.status === "ativo");
  const agendamentosPorDataAtivos = agendamentosAtivos.reduce((acc, agendamento) => {
    const data = agendamento.data;
    if (!acc[data]) acc[data] = [];
    acc[data].push(agendamento);
    return acc;
  }, {});

  const hoje = new Date().toISOString().split("T")[0];
  const datasAtivasOrdenadas = Object.keys(agendamentosPorDataAtivos).sort();
  const datasFuturasOuHojeAtivas = datasAtivasOrdenadas.filter((data) => data >= hoje);

  const handleCancelar = async (id) => {
    if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;
    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (error) throw error;
      setAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelado" } : a))
      );
      alert("✅ Agendamento cancelado com sucesso.");
    } catch (error) {
      console.error("Erro ao cancelar:", error);
      alert("❌ Erro ao cancelar agendamento.");
    }
  };

  const handleEditar = (agendamento) => {
    if (agendamento.status !== "ativo") {
      alert("Apenas agendamentos ativos podem ser editados.");
      return;
    }
    setAgendamentoEditando({
      ...agendamento,
      valor: parseFloat(agendamento.valor || precosServico[agendamento.servico] || 0).toFixed(2)
    });
    setShowModalEditar(true);
  };

  const handleSalvarEdicao = async () => {
    if (!agendamentoEditando) return;
    setLoading(true);
    try {
      const dadosParaSalvar = {
        nome: agendamentoEditando.nome,
        servico: agendamentoEditando.servico,
        data: agendamentoEditando.data,
        horario: agendamentoEditando.horario,
        email: agendamentoEditando.email,
        telefone: agendamentoEditando.telefone,
        valor: parseFloat(agendamentoEditando.valor),
        status: "ativo"
      };
      const { error } = await supabase
        .from("agendamentos")
        .update(dadosParaSalvar)
        .eq("id", agendamentoEditando.id);
      if (error) throw error;
      setAgendamentos((prev) =>
        prev.map((a) => (a.id === agendamentoEditando.id ? { ...dadosParaSalvar, id: a.id } : a))
      );
      alert("✅ Agendamento atualizado com sucesso!");
      setShowModalEditar(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("❌ Erro ao atualizar agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const getHorariosDisponiveis = (data, atual) => {
    const ocupados = agendamentos
      .filter((a) => a.data === data && a.id !== atual?.id && a.status === "ativo")
      .map((a) => a.horario);
    return todosHorarios.filter((h) => !ocupados.includes(h));
  };

  const formatarData = (dataISO) => {
    const data = new Date(dataISO + "T00:00:00");
    const options = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    };
    return data.toLocaleDateString("pt-BR", options);
  };

  const formatarDataCurta = (dataISO) => {
    const data = new Date(dataISO + "T00:00:00");
    return data.toLocaleDateString("pt-BR");
  };

  const formatarValor = (valor) => `R$ ${parseFloat(valor).toFixed(2).replace(".", ",")}`;

  const horariosDisponiveisEdit = agendamentoEditando
    ? getHorariosDisponiveis(agendamentoEditando.data, agendamentoEditando)
    : [];

  return (
    <div className="agenda-container">
      <div className="agenda-content">
        <h1 className="agenda-titulo">📅 Agenda de Agendamentos</h1>

        {agendamentosAtivos.length === 0 ? (
          <div className="agenda-vazia">
            <div className="agenda-vazia-icon">📋</div>
            <p>Nenhum agendamento ativo encontrado.</p>
          </div>
        ) : (
          <div className="agenda-lista">
            {datasFuturasOuHojeAtivas.map((data) => (
              <div key={data} className="agenda-dia-card">
                <div className="agenda-dia-header">
                  <h3 className="agenda-dia-titulo">{formatarData(data)}</h3>
                  <div className="agenda-dia-subtitle">
                    {agendamentosPorDataAtivos[data].length} agendamento(s)
                  </div>
                </div>
                <div className="agenda-itens">
                  {agendamentosPorDataAtivos[data]
                    .sort((a, b) => a.horario.localeCompare(b.horario))
                    .map((a) => (
                      <div key={a.id} className="agenda-item-card">
                        <div className="agenda-item-info">
                          <div className="agenda-item-horario">{a.horario}</div>
                          <div className="agenda-item-cliente">{a.nome}</div>
                          <div className="agenda-item-detalhes">
                            <span className="agenda-item-servico">{a.servico}</span>
                            <span className="agenda-item-valor">{formatarValor(a.valor)}</span>
                          </div>
                          <div className="agenda-item-contato">
                            📧 {a.email} • 📞 {a.telefone}
                          </div>
                        </div>
                        <div className="agenda-item-botoes">
                          <button 
                            className="agenda-btn editar" 
                            onClick={() => handleEditar(a)}
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            className="agenda-btn cancelar" 
                            onClick={() => handleCancelar(a.id)}
                          >
                            ❌ Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModalEditar && agendamentoEditando && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Editar Agendamento</h3>
                <button 
                  className="modal-close" 
                  onClick={() => setShowModalEditar(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                <div className="modal-form-group">
                  <label>Nome do Cliente:</label>
                  <input
                    type="text"
                    value={agendamentoEditando.nome}
                    onChange={(e) =>
                      setAgendamentoEditando({ ...agendamentoEditando, nome: e.target.value })
                    }
                  />
                </div>

                <div className="modal-form-group">
                  <label>Serviço:</label>
                  <select
                    value={agendamentoEditando.servico}
                    onChange={(e) =>
                      setAgendamentoEditando({
                        ...agendamentoEditando,
                        servico: e.target.value,
                        valor: precosServico[e.target.value]
                      })
                    }
                  >
                    {Object.keys(precosServico).map((s) => (
                      <option key={s} value={s}>
                        {s} - {formatarValor(precosServico[s])}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-form-group">
                  <label>Data:</label>
                  <input
                    type="date"
                    value={agendamentoEditando.data}
                    onChange={(e) =>
                      setAgendamentoEditando({ ...agendamentoEditando, data: e.target.value })
                    }
                  />
                </div>

                <div className="modal-form-group">
                  <label>Horário:</label>
                  <div className="agenda-horarios">
                    {todosHorarios.map((h) => {
                      const disponivel =
                        horariosDisponiveisEdit.includes(h) || h === agendamentoEditando.horario;
                      return (
                        <button
                          key={h}
                          type="button"
                          className={`agenda-horario-btn ${
                            h === agendamentoEditando.horario ? "ativo" : ""
                          } ${!disponivel ? "indisponivel" : ""}`}
                          disabled={!disponivel}
                          onClick={() =>
                            disponivel &&
                            setAgendamentoEditando({ ...agendamentoEditando, horario: h })
                          }
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="modal-actions">
                  <button onClick={() => setShowModalEditar(false)} disabled={loading}>
                    Cancelar
                  </button>
                  <button onClick={handleSalvarEdicao} disabled={loading}>
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}