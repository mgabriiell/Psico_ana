// src/views/proprietario/ConfigurarDisponibilidade.jsx

import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "../../assets/Disponibilidade.css";

const diasSemana = [
  "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"
];

// 🔹 Função para calcular hora final automática (+1h)
const calcularHoraFim = (horaInicio) => {
  if (!horaInicio) return "";
  const [h, m] = horaInicio.split(":").map(Number);
  const fim = new Date();
  fim.setHours(h + 1, m, 0, 0);
  const hFim = fim.getHours().toString().padStart(2, "0");
  const mFim = fim.getMinutes().toString().padStart(2, "0");
  return `${hFim}:${mFim}`;
};

export default function ConfigurarDisponibilidade() {
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [novoDia, setNovoDia] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    carregarDisponibilidades();
  }, []);

  const carregarDisponibilidades = async () => {
    const { data, error } = await supabase
      .from("disponibilidades")
      .select("*")
      .order("id", { ascending: true });
    if (error) {
      console.error("Erro ao carregar:", error);
      setErro("Erro ao carregar disponibilidades.");
    } else {
      setDisponibilidades(data || []);
      setErro("");
    }
  };

const handleSalvar = async () => {
  if (!novoDia || !horaInicio) {
    setErro("Selecione o dia e o horário de início.");
    return;
  }

  // calcula hora final automaticamente (1h depois)
  const [hora, minuto] = horaInicio.split(":");
  const horaFinal = `${String(Number(hora) + 1).padStart(2, "0")}:${minuto}`;

  setLoading(true);
  setErro("");
  setSucesso("");

  try {
    const { error } = await supabase.from("disponibilidades").insert([{
      dia_semana: novoDia,
      hora_inicio: horaInicio,
      hora_fim: horaFinal,
      ativo: true
    }]);

    if (error) throw error;

    setSucesso(`Disponibilidade adicionada (${horaInicio} - ${horaFinal})`);
    setNovoDia("");
    setHoraInicio("");
    carregarDisponibilidades();
  } catch (error) {
    console.error("Erro ao salvar:", error);
    setErro("Não foi possível salvar.");
  } finally {
    setLoading(false);
  }
};


  const handleRemover = async (id) => {
    if (!window.confirm("Remover este horário?")) return;
    const { error } = await supabase.from("disponibilidades").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Erro ao remover.");
    } else {
      carregarDisponibilidades();
    }
  };

  const handleAtivarToggle = async (id, ativoAtual) => {
    const { error } = await supabase
      .from("disponibilidades")
      .update({ ativo: !ativoAtual })
      .eq("id", id);
    if (!error) carregarDisponibilidades();
  };

  return (
    <div className="disponibilidade-container">
      <h1>🕒 Configurar Disponibilidade</h1>

      {erro && <div className="erro-msg">{erro}</div>}
      {sucesso && <div className="sucesso-msg">{sucesso}</div>}

      <div className="nova-disponibilidade">
      <select value={novoDia} onChange={(e) => setNovoDia(e.target.value)}>
        <option value="">Selecione o dia</option>
        {diasSemana.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <input
        type="time"
        value={horaInicio}
        onChange={(e) => setHoraInicio(e.target.value)}
      />

      <button onClick={handleSalvar} disabled={loading}>
        {loading ? "Salvando..." : "Adicionar"}
      </button>
    </div>

      <h3>📋 Disponibilidades Atuais</h3>
      <table className="tabela-disponibilidades">
        <thead>
          <tr>
            <th>Dia</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {disponibilidades.map((d) => (
            <tr key={d.id}>
              <td>{d.dia_semana}</td>
              <td>{d.hora_inicio}</td>
              <td>{d.hora_fim}</td>
              <td>
                <button 
                  className={`status-btn ${d.ativo ? "ativo" : "inativo"}`}
                  onClick={() => handleAtivarToggle(d.id, d.ativo)}
                >
                  {d.ativo ? "Ativo" : "Inativo"}
                </button>
              </td>
              <td>
                <button className="btn-remover" onClick={() => handleRemover(d.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
