-- =====================================================================
-- Sistema de Gestão - Associação Mães Unidas pelo TEA (AMUT) - Lábrea/AM
-- Script de criação do banco de dados MySQL
-- =====================================================================

CREATE DATABASE IF NOT EXISTS amut_sistema
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE amut_sistema;

-- ---------------------------------------------------------------------
-- Tabela: usuarios
-- Usuários que acessam o painel administrativo (colaboradores, presidente, admin)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  cargo ENUM('admin', 'presidente', 'colaborador') NOT NULL DEFAULT 'colaborador',
  telefone VARCHAR(20) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_login DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabela: pacientes
-- Pessoa com TEA atendida pela associação (ficha de cadastro completa)
-- ---------------------------------------------------------------------
CREATE TABLE pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Identificação do cadastro
  numero_inscricao VARCHAR(20) NULL,
  ano_inscricao YEAR NULL,
  data_inclusao DATE NULL,

  -- 1. Informações pessoais
  nome VARCHAR(150) NOT NULL,
  sexo ENUM('F', 'M') NULL,
  data_nascimento DATE NULL,
  cpf VARCHAR(14) NULL,
  idade INT NULL,
  endereco VARCHAR(200) NULL,
  numero_endereco VARCHAR(20) NULL,
  bairro VARCHAR(100) NULL,
  cidade VARCHAR(100) NOT NULL DEFAULT 'Lábrea-AM',
  cep VARCHAR(10) NULL DEFAULT '69830-000',
  ponto_referencia VARCHAR(255) NULL,

  -- 2. Informações quanto à pessoa com TEA
  possui_diagnostico TINYINT(1) NULL,
  idade_diagnostico VARCHAR(50) NULL,
  descricao_diagnostico TEXT NULL,
  nivel_suporte TINYINT NULL COMMENT '1, 2 ou 3',
  verbal TINYINT(1) NULL,
  possui_comorbidade TINYINT(1) NULL,
  qual_comorbidade VARCHAR(255) NULL,
  em_tratamento_comorbidade TINYINT(1) NULL,
  descricao_tratamento TEXT NULL,
  faz_uso_medicamento TINYINT(1) NULL,
  qual_medicamento VARCHAR(255) NULL,
  participa_terapia TINYINT(1) NULL,
  qual_terapia VARCHAR(255) NULL,
  onde_terapia VARCHAR(255) NULL,
  terapia_particular_ou_sus ENUM('Particular', 'SUS', 'Ambos') NULL,
  participa_outros_projetos TINYINT(1) NULL,
  qual_outro_projeto VARCHAR(255) NULL,

  -- 3. Informações escolares
  escola_tipo ENUM('Privada', 'Estadual', 'Municipal', 'Não estuda') NULL,
  escola_nome VARCHAR(150) NULL,
  periodo_escolar ENUM('Matutino', 'Vespertino', 'Integral') NULL,
  possui_pedido_medico_segundo_professor TINYINT(1) NULL,
  necessidade_segundo_professor_atendida TINYINT(1) NULL,
  informacoes_escolares_adicionais TEXT NULL,

  -- 4. Informações habitacionais
  imovel_tipo ENUM('Próprio', 'Alugado', 'Cedido', 'Próprio Financiado') NULL,
  mora_com_pai TINYINT(1) NULL DEFAULT 0,
  mora_com_mae TINYINT(1) NULL DEFAULT 0,
  quantidade_irmaos INT NULL DEFAULT 0,
  outros_moradores VARCHAR(255) NULL,

  -- 5. Informações socioeconômicas
  quantidade_pessoas_autistas_familia INT NULL DEFAULT 1,
  recebe_bolsa_familia TINYINT(1) NULL,
  valor_bolsa_familia DECIMAL(10,2) NULL,
  recebe_bpc TINYINT(1) NULL,
  valor_bpc DECIMAL(10,2) NULL,
  recebe_outro_auxilio VARCHAR(255) NULL,

  -- Informações adicionais / autorizações
  autoriza_fotos TINYINT(1) NULL,
  contato_emergencia VARCHAR(255) NULL,
  compromete_participar_reunioes TINYINT(1) NULL,
  informacoes_adicionais TEXT NULL,

  -- Termo de aceite
  termo_aceite_nome VARCHAR(150) NULL,
  termo_aceite_cpf VARCHAR(14) NULL,
  termo_aceite_data DATE NULL,

  -- Controle do sistema
  status ENUM('ativo', 'inativo', 'desligado') NOT NULL DEFAULT 'ativo',
  motivo_desligamento VARCHAR(255) NULL,
  observacoes_internas TEXT NULL,
  cadastrado_por INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_paciente_cadastrado_por FOREIGN KEY (cadastrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_paciente_nome (nome),
  INDEX idx_paciente_cpf (cpf),
  INDEX idx_paciente_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabela: responsaveis
-- Pai, mãe ou responsável legal pela pessoa com TEA (pode haver mais de um)
-- ---------------------------------------------------------------------
CREATE TABLE responsaveis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  parentesco ENUM('Pai', 'Mãe', 'Responsável Legal', 'Outro') NOT NULL DEFAULT 'Responsável Legal',
  nome VARCHAR(150) NOT NULL,
  cpf VARCHAR(14) NULL,
  rg VARCHAR(20) NULL,
  profissao VARCHAR(100) NULL,
  empresa VARCHAR(150) NULL,
  salario DECIMAL(10,2) NULL,
  telefone VARCHAR(20) NULL,
  email VARCHAR(150) NULL,
  endereco VARCHAR(200) NULL,
  principal TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Responsável principal para contato',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_responsavel_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  INDEX idx_responsavel_paciente (paciente_id),
  INDEX idx_responsavel_nome (nome)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabela: eventos
-- Eventos/reuniões promovidos pela associação
-- ---------------------------------------------------------------------
CREATE TABLE eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT NULL,
  data_evento DATE NOT NULL,
  hora_evento TIME NULL,
  local VARCHAR(200) NULL,
  status ENUM('agendado', 'realizado', 'cancelado') NOT NULL DEFAULT 'agendado',
  criado_por INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_evento_criado_por FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_evento_data (data_evento)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabela: evento_presencas
-- Registro de presença/falta de cada paciente em cada evento
-- ---------------------------------------------------------------------
CREATE TABLE evento_presencas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NOT NULL,
  paciente_id INT NOT NULL,
  presente TINYINT(1) NOT NULL DEFAULT 0,
  justificativa VARCHAR(255) NULL,
  registrado_por INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_presenca_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
  CONSTRAINT fk_presenca_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_presenca_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  UNIQUE KEY uk_evento_paciente (evento_id, paciente_id),
  INDEX idx_presenca_paciente (paciente_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabela: contribuicoes
-- Doações/contribuições mensais de responsáveis ou apoiadores da AMUT
-- ---------------------------------------------------------------------
CREATE TABLE contribuicoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  responsavel_id INT NULL,
  paciente_id INT NULL,
  nome_contribuinte VARCHAR(150) NOT NULL,
  telefone_contribuinte VARCHAR(20) NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_contribuicao DATE NOT NULL,
  mes_referencia CHAR(7) NULL COMMENT 'Formato AAAA-MM: mês a que a contribuição se refere',
  forma_pagamento ENUM('Dinheiro', 'PIX', 'Transferência', 'Cartão', 'Outro') NOT NULL DEFAULT 'PIX',
  observacoes VARCHAR(255) NULL,
  registrado_por INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_contribuicao_responsavel FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id) ON DELETE SET NULL,
  CONSTRAINT fk_contribuicao_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL,
  CONSTRAINT fk_contribuicao_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_contribuicao_data (data_contribuicao),
  INDEX idx_contribuicao_mes (mes_referencia)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabela: log_atividades
-- Auditoria simples de ações relevantes no sistema
-- ---------------------------------------------------------------------
CREATE TABLE log_atividades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  acao VARCHAR(100) NOT NULL,
  entidade VARCHAR(50) NULL,
  entidade_id INT NULL,
  detalhes TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_log_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;
