// src/views/pacientes/Agendamento.jsx
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import "../../assets/Agendamento.css";

const precosServico = {
  "Consulta Inicial": 150,
  "Acompanhamento Semanal": 120,
  "Terapia de Casal": 200,
  "Atendimento Emergencial": 180,
};

export default function Agendamento() {
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [servico, setServico] = useState("Consulta Inicial");
  const [agendamentos, setAgendamentos] = useState([]);
  const [todosHorarios, setTodosHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showModalConfirmacao, setShowModalConfirmacao] = useState(false);
  const [showModalSucesso, setShowModalSucesso] = useState(false);

  // Carrega agendamentos ao abrir o componente
  useEffect(() => {
    carregarAgendamentos();
  }, []);

  // Atualiza horários disponíveis quando a data muda
  useEffect(() => {
    if (dataSelecionada) carregarDisponibilidade(dataSelecionada);
  }, [dataSelecionada]);

  // Carrega horários disponíveis do dia selecionado
  const carregarDisponibilidade = async (data) => {
    const partes = data.split("-");
    const dataLocal = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));

    const diaSemanaBr = dataLocal.toLocaleDateString("pt-BR", {
      weekday: "long",
      timeZone: "America/Sao_Paulo",
    });

    const mapaDias = {
      "segunda-feira": "Segunda",
      "terça-feira": "Terça",
      "quarta-feira": "Quarta",
      "quinta-feira": "Quinta",
      "sexta-feira": "Sexta",
      "sábado": "Sábado",
      "domingo": "Domingo",
    };

    const nomeDia = mapaDias[diaSemanaBr.toLowerCase()] || diaSemanaBr;

    const { data: disp, error } = await supabase
      .from("disponibilidades")
      .select("*")
      .eq("dia_semana", nomeDia)
      .eq("ativo", true);

    if (error) {
      console.error("Erro ao carregar disponibilidade:", error);
      return;
    }

    const horariosGerados = disp.map((item) => item.hora_inicio);
    setTodosHorarios(horariosGerados);
  };

  // Carrega todos os agendamentos
  const carregarAgendamentos = async () => {
    const { data, error } = await supabase
      .from("agendamentos")
      .select("data, horario, status");

    if (error) {
      console.error("Erro ao carregar agendamentos:", error);
      return;
    }
    setAgendamentos(data);
  };

  // Filtra horários disponíveis
  const getHorariosDisponiveis = (data) => {
    const horariosOcupados = agendamentos
      .filter((a) => a.data === data && a.status === "ativo")
      .map((a) => a.horario);
    return todosHorarios.filter((h) => !horariosOcupados.includes(h));
  };

  const horariosDisponiveis = useMemo(
    () => getHorariosDisponiveis(dataSelecionada),
    [dataSelecionada, agendamentos, todosHorarios]
  );

  // Validação do formulário
  const validarFormulario = () => {
    if (!dataSelecionada || !horarioSelecionado || !nomeCliente || !emailCliente || !telefoneCliente) {
      setErrorMsg("Por favor, preencha todos os campos obrigatórios.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(emailCliente)) {
      setErrorMsg("Email inválido.");
      return false;
    }
    if (!/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(telefoneCliente)) {
      setErrorMsg("Telefone inválido. Use o formato (11) 99999-9999");
      return false;
    }
    const hoje = new Date().toISOString().split("T")[0];
    if (dataSelecionada < hoje) {
      setErrorMsg("Não é permitido agendar em datas passadas.");
      return false;
    }
    return true;
  };

  // Confirmação antes de agendar
  const handleConfirmarAgendamento = () => {
    setErrorMsg("");
    if (!validarFormulario()) return;
    if (!horariosDisponiveis.includes(horarioSelecionado)) {
      setErrorMsg("Este horário não está mais disponível. Por favor, escolha outro.");
      return;
    }
    setShowModalConfirmacao(true);
  };

  // Limpa formulário
  const limparTodosCampos = () => {
    setNomeCliente("");
    setEmailCliente("");
    setTelefoneCliente("");
    setHorarioSelecionado("");
    setServico("Consulta Inicial");
    setDataSelecionada("");
  };

  // Inserção do agendamento
  const handleAgendar = async () => {
    setLoading(true);
    setShowModalConfirmacao(false);

    try {
      const { error } = await supabase.from("agendamentos").insert([
        {
          nome: nomeCliente,
          email: emailCliente,
          telefone: telefoneCliente,
          servico: servico,
          valor: precosServico[servico],
          data: dataSelecionada,
          horario: horarioSelecionado,
          status: "ativo",
          token_cancelamento: crypto.randomUUID(),
        },
      ]);

      if (error) throw error;

      setShowModalSucesso(true);
      limparTodosCampos();
      await carregarAgendamentos();
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      setErrorMsg("Erro ao confirmar agendamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const isFormularioCompleto =
    dataSelecionada && horarioSelecionado && nomeCliente && emailCliente && telefoneCliente;

  return (
    <div className="agendamento__container">
      <h1 className="agendamento__titulo">📅 Agendar Consulta</h1>

      {errorMsg && <div className="agendamento__error-msg">{errorMsg}</div>}

      <div className="agendamento__campo-card">
        <label className="agendamento__campo-label">Serviço:</label>
        <select
          className="agendamento__campo-input"
          value={servico}
          onChange={(e) => setServico(e.target.value)}
          disabled={loading}
        >
          {Object.keys(precosServico).map((s) => (
            <option key={s} value={s}>
              {s} - R$ {precosServico[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="agendamento__campo-card">
        <label className="agendamento__campo-label">Data:</label>
        <input
          className="agendamento__campo-input"
          type="date"
          value={dataSelecionada}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => {
            setDataSelecionada(e.target.value);
            setHorarioSelecionado("");
          }}
          disabled={loading}
        />
      </div>

      {dataSelecionada && (
        <>
          <div className="agendamento__horarios-section">
            <h3 className="agendamento__horarios-titulo">⏰ Horários Disponíveis</h3>
            <div className="agendamento__horarios-grid">
              {todosHorarios.map((h) => {
                const disponivel = horariosDisponiveis.includes(h);
                return (
                  <button
                    key={h}
                    className={`agendamento__horario-btn ${
                      h === horarioSelecionado ? "agendamento__horario-btn--ativo" : ""
                    } ${!disponivel ? "agendamento__horario-btn--indisponivel" : ""}`}
                    onClick={() => disponivel && setHorarioSelecionado(h)}
                    disabled={!disponivel || loading}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
            {horariosDisponiveis.length === 0 && (
              <div className="agendamento__horarios-vazio">
                Nenhum horário disponível para esta data
              </div>
            )}
          </div>

          <div className="agendamento__campo-card">
            <label className="agendamento__campo-label">Nome Completo:</label>
            <input
              className="agendamento__campo-input"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Digite seu nome completo"
              disabled={loading}
            />
          </div>

          <div className="agendamento__campo-card">
            <label className="agendamento__campo-label">E-mail:</label>
            <input
              className="agendamento__campo-input"
              type="email"
              value={emailCliente}
              onChange={(e) => setEmailCliente(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>

          <div className="agendamento__campo-card">
            <label className="agendamento__campo-label">Telefone:</label>
            <input
              className="agendamento__campo-input"
              value={telefoneCliente}
              onChange={(e) => setTelefoneCliente(e.target.value)}
              placeholder="(11) 99999-9999"
              disabled={loading}
            />
          </div>

          <div className="agendamento__agendar-acao">
            <button
              className={`agendamento__agendar-btn ${loading ? "agendamento__agendar-btn--loading" : ""}`}
              onClick={handleConfirmarAgendamento}
              disabled={!isFormularioCompleto || loading}
            >
              {loading ? "🔄 AGENDANDO..." : "✅ CONFIRMAR AGENDAMENTO"}
            </button>
          </div>
        </>
      )}

      {/* Modal de confirmação */}
      {showModalConfirmacao && (
        <div className="modal__overlay">
          <div className="modal__container">
            <div className="modal__header">
              <h3 className="modal__titulo">📋 Confirmar Agendamento</h3>
              <button 
                className="modal__close" 
                onClick={() => setShowModalConfirmacao(false)}
                disabled={loading}
              >
                ×
              </button>
            </div>

            <div className="modal__content">
              <div className="modal__resumo-container">
                <div className="modal__resumo-item">
                  <strong>Cliente:</strong> <span>{nomeCliente}</span>
                </div>
                <div className="modal__resumo-item">
                  <strong>Data:</strong>{" "}
                  <span>{new Date(dataSelecionada).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="modal__resumo-item">
                  <strong>Horário:</strong> <span>{horarioSelecionado}</span>
                </div>
                <div className="modal__resumo-item">
                  <strong>Serviço:</strong> <span>{servico}</span>
                </div>
                <div className="modal__resumo-item">
                  <strong>Valor:</strong> <span>R$ {precosServico[servico]}</span>
                </div>
              </div>

              <div className="modal__actions">
                <button 
                  className="modal__btn modal__btn--cancelar" 
                  onClick={() => setShowModalConfirmacao(false)}
                  disabled={loading}
                >
                  Corrigir Dados
                </button>
                <button 
                  className="modal__btn modal__btn--confirmar" 
                  onClick={handleAgendar}
                  disabled={loading}
                >
                  {loading ? "Confirmando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sucesso */}
      {showModalSucesso && (
        <div className="modal__overlay">
          <div className="modal__container modal__container--success">
            <div className="modal__header">
              <h3 className="modal__titulo">✅ Agendamento Confirmado!</h3>
              <button 
                className="modal__close" 
                onClick={() => setShowModalSucesso(false)}
              >
                ×
              </button>
            </div>
            <div className="modal__content">
              <p>
                Seu agendamento para <strong>{servico}</strong> foi realizado com sucesso.
              </p>
              <p>
                <strong>Data:</strong> {new Date(dataSelecionada).toLocaleDateString("pt-BR")}
              </p>
              <p>
                <strong>Horário:</strong> {horarioSelecionado}
              </p>
              <p>
                <strong>Valor:</strong> R$ {precosServico[servico]}
              </p>
              <p style={{fontSize: '0.9em', color: 'var(--color-text-subtle)', marginTop: '15px'}}>
                Você receberá um email de confirmação com os detalhes.
              </p>
              <div className="modal__actions">
                <button 
                  className="modal__btn modal__btn--confirmar" 
                  onClick={() => setShowModalSucesso(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}