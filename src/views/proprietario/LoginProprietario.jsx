import React, { useState } from "react";
import "../../assets/LoginProprietario.css";


export default function LoginProprietario({ onLogin, onCancelar }) {
  const [senha, setSenha] = useState("");

  // Senha definida em .env para segurança
  const senhaCorreta = import.meta.env.VITE_SENHA_PROPRIETARIO || "minhaSenha123";

const handleLogin = () => {
  if (senha === senhaCorreta) {
    onLogin(); // apenas dispara login
  } else {
    alert("Senha incorreta!");
  }
};

  return (
    <div className="login-proprietario">
      <h2>🔒 Login Proprietário</h2>
      <input
        type="password"
        placeholder="Digite a senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />
      <div className="login-botoes">
        <button onClick={handleLogin}>Entrar</button>
        <button onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
}
