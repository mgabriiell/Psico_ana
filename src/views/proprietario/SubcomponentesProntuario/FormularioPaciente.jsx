import React, { useState, useEffect } from 'react';
import { supabase } from "../../../supabaseClient";
// Importe o novo CSS refatorado
import '../../../assets/FormularioPaciente.css'; 

// Estado inicial MANTIDO
const initialFormData = {
    // Dados Principais e de Contato
    nome_completo: '',
    naturalidade: '',
    data_nascimento: '',
    genero: '', 
    email: '',
    celular_telefone: '', 
    cpf: '',
    rg: '',
    
    // Endereço
    pais: 'Brasil', 
    cep: '',
    cidade: '',
    estado: '',
    rua_avenida: '',
    numero: '',
    bairro: '',
    complemento: '',
    
    // Socioeconômico e Contexto
    escolaridade: '', 
    profissao: '',
    como_conheceu: '', 
    encaminhado_por: '',
    socioeconomico: false, // CAMPO ATUALIZADO

    // Emergência
    contato_emergencia_nome: '', 
    contato_emergencia_telefone: '',
    contato_emergencia_parentesco: '',
    
    // Notas
    prontuario_inicial: '' 
};

// Renomeado para FormularioPaciente para refletir a dupla função
export default function FormularioPaciente({ pacienteInicial, onSalvar, onCancelar }) { 
    // Se pacienteInicial for fornecido, estamos editando
    const isEditing = !!pacienteInicial;
    
    // 1. Inicializa o estado com os dados do paciente ou com o estado vazio
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); 
    
    // 2. Efeito para carregar os dados iniciais do paciente se estiver editando
    useEffect(() => {
        if (isEditing) {
            // Cria um novo objeto onde todos os valores null são convertidos para ""
            const initialData = Object.keys(pacienteInicial).reduce((acc, key) => {
                // ✅ CORREÇÃO 1: Trata null para strings vazias (previne o aviso do React 'value prop on input should not be null')
                if (typeof pacienteInicial[key] === 'string' && pacienteInicial[key] === null) {
                    acc[key] = '';
                } else if (typeof pacienteInicial[key] === 'undefined') {
                    acc[key] = '';
                } else {
                    acc[key] = pacienteInicial[key];
                }
                return acc;
            }, {});

            // Mapeia os dados do paciente para o estado do formulário
            setFormData({
                ...initialFormData, // Garante que todos os campos existam
                ...initialData,
                // Garantir que a data_nascimento seja formatada corretamente para o input type="date"
                data_nascimento: initialData.data_nascimento ? initialData.data_nascimento.split('T')[0] : '',
                socioeconomico: initialData.socioeconomico || false, 
                // O campo prontuario_inicial é apenas local, deve estar vazio na edição
                prontuario_inicial: '' 
            });
        }
        // O array de dependências garante que isso só roda quando o pacienteInicial muda
    }, [pacienteInicial, isEditing]);


    // Listas para os campos SELECT
    const generos = ['Masculino', 'Feminino', 'Não-binário', 'Outro', 'Prefiro não informar'];
    const escolaridades = ['Fundamental Incompleto', 'Fundamental Completo', 'Médio Incompleto', 'Médio Completo', 'Superior Incompleto', 'Superior Completo', 'Pós-graduação', 'Mestrado', 'Doutorado'];
    const comoConheceuOpcoes = ['Indicação', 'Google', 'Instagram', 'Facebook', 'Site', 'Panfleto', 'Outro paciente', 'Outro'];


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // Lógica para lidar com checkboxes (booleans)
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
        // Limpa mensagens ao digitar
        setError('');
        setSuccessMessage('');
    };

    const validarFormulario = () => {
        setError('');
        
        // Validações obrigatórias
        if (!formData.nome_completo.trim()) {
            setError('Nome completo é obrigatório.');
            return false;
        }
        if (!formData.data_nascimento.trim()) {
            setError('Data de nascimento é obrigatória.');
            return false;
        }

        // Validação de email (opcional)
        if ((formData.email || '').trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
             setError('Email inválido.');
             return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validarFormulario()) return;

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            // ✅ CORREÇÃO 2: Destruturar e remover as colunas injetadas na carga (sessoes, total_sessoes)
            // e também o campo local prontuario_inicial.
            const { 
                prontuario_inicial, 
                sessoes, 
                total_sessoes, 
                ...dataToSave 
            } = formData;
            
            // Tratamento de valores vazios para NULL
            const pacienteData = Object.keys(dataToSave).reduce((acc, key) => {
                const value = dataToSave[key];
                if (typeof value === 'boolean') {
                    acc[key] = value;
                } else {
                    // Trata strings vazias para NULL, exceto para o campo 'pais' que tem um valor padrão
                    acc[key] = (typeof value === 'string' && value.trim() === '') && key !== 'pais' ? null : value;
                }
                return acc;
            }, {});

            if (pacienteData.pais === null) {
                pacienteData.pais = 'Brasil';
            }
            
            let dbOperation;
            
            // --- 2. LÓGICA DE EDIÇÃO (UPDATE) vs CADASTRO (INSERT) ---
            if (isEditing) {
                dbOperation = supabase
                    .from('pacientes')
                    .update(pacienteData) // Agora 'pacienteData' não tem 'sessoes'
                    .eq('id', pacienteInicial.id);
            } else {
                dbOperation = supabase
                    .from('pacientes')
                    .insert([pacienteData]);
            }
            
            const { error: dbError } = await dbOperation;

            if (dbError) throw dbError;
            
            const message = isEditing ? 'Dados do paciente atualizados com sucesso!' : 'Paciente cadastrado com sucesso!';
            setSuccessMessage(message);
            
            setTimeout(() => {
                onSalvar(); 
            }, 1000); 

        } catch (error) {
            console.error(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} paciente:`, error);
            
            if (error.code === '23514') {
                setError('Um valor inválido foi fornecido em um campo restrito (ex: Gênero ou Escolaridade). Por favor, use apenas as opções fornecidas.');
            } else if (error.code === '23505') {
                 setError('Já existe um paciente cadastrado com este CPF (ou outro campo Único).');
            } else {
                 setError('Erro ao salvar paciente: ' + (error.message || 'Erro desconhecido.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const limparFormulario = () => {
        // No modo edição, limpa para os dados iniciais. No modo cadastro, limpa totalmente.
        if (isEditing) {
             // Simula a inicialização para restaurar os valores do paciente inicial
             const initialData = Object.keys(pacienteInicial).reduce((acc, key) => {
                if (typeof pacienteInicial[key] === 'string' && pacienteInicial[key] === null) {
                    acc[key] = '';
                } else if (typeof pacienteInicial[key] === 'undefined') {
                    acc[key] = '';
                } else {
                    acc[key] = pacienteInicial[key];
                }
                return acc;
            }, {});

            setFormData({
                ...initialFormData,
                ...initialData,
                data_nascimento: initialData.data_nascimento ? initialData.data_nascimento.split('T')[0] : '',
                socioeconomico: initialData.socioeconomico || false,
                prontuario_inicial: '' 
            });
        } else {
            setFormData(initialFormData);
        }
        setError('');
        setSuccessMessage('');
    };

    // --- Renderização do Formulário ---
    return (
        // CLASSE DO CONTAINER RENOMEADA
        <div className="p-container">
            <div className="p-header">
                {/* CLASSE DO BOTÃO RENOMEADA */}
                <button onClick={onCancelar} className="p-btn-voltar">
                    ← {isEditing ? 'Voltar para Detalhes' : 'Voltar'}
                </button>
                <h2>{isEditing ? `✏️ Edição: ${formData.nome_completo || 'Paciente'}` : 'Cadastro Detalhado do Paciente'}</h2>
            </div>

            {/* Mensagens de Status */}
            {error && (
                <div className="p-error-message">
                    ❌ Erro: {error}
                </div>
            )}
            {successMessage && (
                <div className="p-success-message">
                    ✅ {successMessage}
                </div>
            )}
            
            {/* CLASSE DO FORM RENOMEADA */}
            <form onSubmit={handleSubmit} className="p-form">
                
                {/* CLASSE DA SEÇÃO RENOMEADA */}
                <div className="p-form-section">
                    <h3>Dados Pessoais e Contato</h3>
                    {/* CLASSE DO GRID RENOMEADA */}
                    <div className="p-form-grid">
                        {/* CLASSE DO GRUPO RENOMEADA */}
                        <div className="p-form-group"><label htmlFor="nome_completo">Nome Completo *</label>
                            <input type="text" id="nome_completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required disabled={loading}/>
                        </div>
                        <div className="p-form-group"><label htmlFor="cpf">CPF</label>
                            <input type="text" id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} disabled={loading} placeholder="000.000.000-00"/>
                        </div>
                        <div className="p-form-group"><label htmlFor="rg">RG</label>
                            <input type="text" id="rg" name="rg" value={formData.rg} onChange={handleChange} disabled={loading}/>
                        </div>
                        <div className="p-form-group"><label htmlFor="data_nascimento">Data de Nascimento *</label>
                            <input type="date" id="data_nascimento" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} required disabled={loading} max={new Date().toISOString().split('T')[0]}/>
                        </div>
                        <div className="p-form-group">
                            <label htmlFor="genero">Gênero</label>
                            <select id="genero" name="genero" value={formData.genero} onChange={handleChange} disabled={loading}>
                                <option value="">Selecione uma opção</option>
                                {generos.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="p-form-group"><label htmlFor="naturalidade">Naturalidade</label>
                            <input type="text" id="naturalidade" name="naturalidade" value={formData.naturalidade} onChange={handleChange} disabled={loading}/>
                        </div>
                        <div className="p-form-group"><label htmlFor="email">E-mail</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} disabled={loading}/>
                        </div>
                        <div className="p-form-group"><label htmlFor="celular_telefone">Celular / Telefone *</label>
                            <input type="text" id="celular_telefone" name="celular_telefone" value={formData.celular_telefone} onChange={handleChange} disabled={loading} placeholder="(00) 90000-0000"/>
                        </div>
                    </div>
                </div>

                <hr/>
                
                <div className="p-form-section">
                    <h3>Endereço</h3>
                    <div className="p-form-grid">
                        <div className="p-form-group"><label htmlFor="cep">CEP</label>
                            <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleChange} disabled={loading}/>
                        </div>
                        <div className="p-form-group"><label htmlFor="pais">País</label>
                            <input type="text" id="pais" name="pais" value={formData.pais} onChange={handleChange} disabled={loading} placeholder="Brasil"/>
                        </div>
                        <div className="p-form-group"><label htmlFor="estado">Estado</label>
                            <input type="text" id="estado" name="estado" value={formData.estado} onChange={handleChange} disabled={loading}/>
                        </div>
                        <div className="p-form-group"><label htmlFor="cidade">Cidade</label>
                            <input type="text" id="cidade" name="cidade" value={formData.cidade} onChange={handleChange} disabled={loading}/>
                        </div>
                        <div className="p-form-group"><label htmlFor="rua_avenida">Rua/ Avenida</label>
                            <input type="text" id="rua_avenida" name="rua_avenida" value={formData.rua_avenida} onChange={handleChange} disabled={loading}/>
                        </div>
                        <div className="p-form-group"><label htmlFor="numero">Número</label>
                            <input type="text" id="numero" name="numero" value={formData.numero} onChange={handleChange} disabled={loading}/>
                        </div>
                        <div className="p-form-group"><label htmlFor="bairro">Bairro</label>
                            <input type="text" id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} disabled={loading}/>
                        </div>
                        <div className="p-form-group"><label htmlFor="complemento">Complemento</label>
                            <input type="text" id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} disabled={loading}/>
                        </div>
                    </div>
                </div>

                <hr/>

                <div className="p-form-section">
                    <h3>Dados Adicionais e Emergência</h3>
                    <div className="p-form-grid">
                        <div className="p-form-group">
                            <label htmlFor="escolaridade">Escolaridade</label>
                            <select id="escolaridade" name="escolaridade" value={formData.escolaridade} onChange={handleChange} disabled={loading}>
                                <option value="">Selecione uma opção</option>
                                {escolaridades.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <div className="p-form-group"><label htmlFor="profissao">Profissão</label>
                            <input type="text" id="profissao" name="profissao" value={formData.profissao} onChange={handleChange} disabled={loading}/>
                        </div>
                        
                        {/* CLASSE DO CHECKBOX RENOMEADA */}
                        <div className="p-checkbox-group p-full-width">
                            <input 
                                type="checkbox" 
                                id="socioeconomico" 
                                name="socioeconomico" 
                                checked={formData.socioeconomico} 
                                onChange={handleChange} 
                                disabled={loading}
                            />
                            <label htmlFor="socioeconomico" className="p-checkbox-label">
                                Paciente com Condição Socioeconômica Específica (Marcar se Aplicável)
                            </label>
                        </div>
                        
                        <div className="p-form-group"><label htmlFor="contato_emergencia_nome">Nome Contato Emergência</label>
                            <input type="text" id="contato_emergencia_nome" name="contato_emergencia_nome" value={formData.contato_emergencia_nome} onChange={handleChange} disabled={loading}/>
                        </div>
                        <div className="p-form-group"><label htmlFor="contato_emergencia_telefone">Telefone Emergência</label>
                            <input type="text" id="contato_emergencia_telefone" name="contato_emergencia_telefone" value={formData.contato_emergencia_telefone} onChange={handleChange} disabled={loading}/>
                        </div>
                        <div className="p-form-group"><label htmlFor="contato_emergencia_parentesco">Parentesco</label>
                            <input type="text" id="contato_emergencia_parentesco" name="contato_emergencia_parentesco" value={formData.contato_emergencia_parentesco} onChange={handleChange} disabled={loading}/>
                        </div>
                        
                        <div className="p-form-group">
                            <label htmlFor="como_conheceu">Onde me conheceu?</label>
                             <select id="como_conheceu" name="como_conheceu" value={formData.como_conheceu} onChange={handleChange} disabled={loading}>
                                 <option value="">Selecione uma opção</option>
                                 {comoConheceuOpcoes.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                        </div>
                        <div className="p-form-group"><label htmlFor="encaminhado_por">Encaminhado por:</label>
                            <input type="text" id="encaminhado_por" name="encaminhado_por" value={formData.encaminhado_por} onChange={handleChange} disabled={loading}/>
                        </div>
                    </div>
                </div>
                
                <hr/>

                {/* CLASSE FULL-WIDTH RENOMEADA */}
                <div className="p-form-group p-full-width">
                         <label htmlFor="prontuario_inicial">Prontuário Inicial / Observações (Apenas para Notas)</label>
                         <textarea
                             id="prontuario_inicial"
                             name="prontuario_inicial"
                             value={formData.prontuario_inicial}
                             onChange={handleChange}
                             placeholder="Este campo é apenas para notas iniciais e NÃO será salvo na tabela de pacientes."
                             rows="4"
                             disabled={loading}
                         />
                </div>

                {/* CLASSE DE AÇÕES RENOMEADA */}
                <div className="p-form-actions">
                    {/* CLASSE DE BOTÕES RENOMEADA */}
                    <button type="button" onClick={limparFormulario} disabled={loading} className="p-btn p-btn-limpar">
                        {isEditing ? 'Restaurar' : 'Limpar'}
                    </button>
                    <button type="button" onClick={onCancelar} disabled={loading} className="p-btn p-btn-cancelar">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !formData.nome_completo.trim() || !formData.data_nascimento.trim()}
                        className="p-btn p-btn-confirmar"
                    >
                        {loading ? (isEditing ? 'Salvando...' : 'Cadastrando...') : (isEditing ? 'Salvar Alterações' : 'Cadastrar Paciente')}
                    </button>
                </div>
            </form>
        </div>
    );
}