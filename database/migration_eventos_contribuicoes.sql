-- =====================================================================
-- MIGRAÇÃO: Eventos/Presenças e Contribuições
-- Execute este script apenas se o banco "amut_sistema" já existia
-- ANTES da adição das funcionalidades de Eventos e Contribuições.
-- (Se você está criando o banco do zero, basta rodar o schema.sql —
--  este script não é necessário.)
--
-- Uso: mysql -u root -p amut_sistema < backend/database/migration_eventos_contribuicoes.sql
-- =====================================================================

USE amut_sistema;

CREATE TABLE IF NOT EXISTS eventos (
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

CREATE TABLE IF NOT EXISTS evento_presencas (
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

CREATE TABLE IF NOT EXISTS contribuicoes (
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

SELECT 'Migração concluída: tabelas de eventos, presenças e contribuições criadas.' AS resultado;
