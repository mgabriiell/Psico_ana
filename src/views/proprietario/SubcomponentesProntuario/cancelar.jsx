  import React, { useEffect, useState } from "react";
  import { useSearchParams } from "react-router-dom";
  import { supabase } from "../../../supabaseClient";
  import "../../../assets/Cancelar.css";
  

  export default function Cancelar() {
    const [searchParams] = useSearchParams();
    const [agendamento, setAgendamento] = useState(null);
    const [status, setStatus] = useState("carregando");
    const token = searchParams.get("token");

    useEffect(() => {
      const buscarAgendamento = async () => {
        if (!token) {
          setStatus("erro");
          return;
        }

        const { data, error } = await supabase
          .from("agendamentos")
          .select("*")
          .eq("token_cancelamento", token)
          .single();

        if (error || !data) {
          setStatus("nao_encontrado");
        } else {
          setAgendamento(data);
          setStatus("encontrado");
        }
      };

      buscarAgendamento();
    }, [token]);

    const cancelarAgendamento = async () => {
      const { error } = await supabase
        .from("agendamentos")
        .update({ status: "cancelado" })
        .eq("token_cancelamento", token);

      if (error) {
        alert("❌ Erro ao cancelar o agendamento.");
      } else {
        setStatus("cancelado");
      }
    };

    if (status === "carregando") return <p>Carregando informações...</p>;
    if (status === "erro") return <p>Token inválido.</p>;
    if (status === "nao_encontrado") return <p>Agendamento não encontrado.</p>;
    if (status === "cancelado")
      return <p>✅ Agendamento cancelado com sucesso!</p>;

    return (
      <div className="agendamento-container">
        <h2>Cancelar Agendamento</h2>
        {agendamento && (
          <div className="resumo-container">
            <div className="resumo-item">
              <strong>Cliente:</strong> {agendamento.nome}
            </div>
            <div className="resumo-item">
              <strong>Data:</strong>{" "}
              {new Date(agendamento.data).toLocaleDateString("pt-BR")}
            </div>
            <div className="resumo-item">
              <strong>Horário:</strong> {agendamento.horario}
            </div>
            <div className="resumo-item">
              <strong>Serviço:</strong> {agendamento.servico}
            </div>
            <button
              className="agendar-btn"
              onClick={cancelarAgendamento}
              style={{ backgroundColor: "#e74c3c" }}
            >
              ❌ Cancelar Agendamento
            </button>
          </div>
        )}
      </div>
    );
  }
