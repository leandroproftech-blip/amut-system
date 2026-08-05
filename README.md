# Sistema de Gestão — AMUT (Associação Mães Unidas pelo TEA)
### Lábrea - Amazonas

Sistema completo para a associação gerenciar o cadastro de **pacientes** (pessoas com TEA
atendidas), **responsáveis** (pais/mães/responsáveis legais) e **usuários** do painel
(colaboradores, presidente e administrador).

O sistema tem duas partes (servidas pelo mesmo servidor Node.js):

1. **Site institucional** (`public/index.html`) — página pública com informações da AMUT e
   acesso à área restrita.
2. **Painel de gestão** (`public/admin/`) — protegido por login, onde a equipe cadastra e
   gerencia pacientes, responsáveis, eventos, contribuições e usuários.

O formulário de cadastro de pacientes foi construído reproduzindo **fielmente os campos da
ficha de cadastro oficial da AMUT** (identificação, diagnóstico do TEA, informações escolares,
habitacionais, socioeconômicas e termo de aceite).

---

## Tecnologias usadas

- **Frontend:** HTML5 + JavaScript puro (vanilla) + Tailwind CSS (via CDN)
- **Backend:** Node.js + Express (API REST)
- **Banco de dados:** MySQL
- **Autenticação:** JWT (JSON Web Token) + senhas com hash bcrypt

Não há build step no frontend — são arquivos HTML estáticos servidos pela pasta `public/`.

---

## Estrutura de pastas

```
amut-sistema/
├── config/db.js                 # Conexão com o MySQL
├── controllers/                 # Regras de negócio de cada recurso
├── middleware/auth.js           # Autenticação JWT e controle de permissões
├── routes/                      # Rotas da API
├── database/
│   ├── schema.sql               # Script de criação das tabelas
│   ├── migration_eventos_contribuicoes.sql
│   └── seed.js                  # Cria o 1º usuário administrador
├── public/                      # Site + Painel (estático)
│   ├── index.html               # Site institucional
│   ├── login.html               # Login do painel
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── pacientes.html
│   │   ├── responsaveis.html
│   │   ├── eventos.html
│   │   ├── contribuicoes.html
│   │   ├── usuarios.html
│   │   └── perfil.html
│   └── assets/
│       ├── js/
│       └── img/logo.png
├── server.js                    # Ponto de entrada (API + arquivos estáticos)
├── package.json
├── .env.example                 # Modelo do arquivo de configuração
└── README.md
```

---

## Passo a passo para colocar no ar

### 1. Pré-requisitos

- [Node.js](https://nodejs.org) versão 18 ou superior
- [MySQL](https://www.mysql.com/) instalado e rodando (local ou em um servidor)
- Um editor de código (recomendado: VS Code)

### 2. Criar o banco de dados

Com o MySQL rodando, execute o script pronto:

```bash
mysql -u root -p < database/schema.sql
```

Isso cria o banco `amut_sistema` com todas as tabelas: `usuarios`, `pacientes`,
`responsaveis`, `eventos`, `evento_presencas`, `contribuicoes` e `log_atividades`.

> Se você já tinha instalado o sistema **antes** das funcionalidades de Eventos e
> Contribuições, não precisa recriar o banco — basta rodar a migração:
> ```bash
> mysql -u root -p amut_sistema < database/migration_eventos_contribuicoes.sql
> ```

### 3. Configurar o projeto

```bash
npm install
cp .env.example .env
```

No Windows (PowerShell):

```powershell
npm install
Copy-Item .env.example .env
```

Abra o arquivo `.env` e ajuste para os dados do seu MySQL:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=amut_sistema
JWT_SECRET=troque_por_uma_chave_bem_secreta
FRONTEND_URL=http://localhost:3000
```

> O arquivo `.env` **não** deve ser enviado ao GitHub (já está no `.gitignore`).

### 4. Criar o primeiro usuário administrador

```bash
npm run seed
```

Isso cria o login inicial:

- **E-mail:** `admin@amut.org.br`
- **Senha:** `Amut@2026`

> ⚠️ **Troque essa senha assim que fizer o primeiro login**, na tela "Meu Perfil" do painel.

### 5. Iniciar o sistema

```bash
npm start
```

O sistema sobe em `http://localhost:3000` (API + site + painel).

Para desenvolvimento com reinício automático:

```bash
npm run dev
```

Acesse:

- Site: `http://localhost:3000`
- Login: `http://localhost:3000/login.html`
- API health: `http://localhost:3000/api/health`

---

## Como usar o sistema

1. Acesse o site e clique em **"Área Restrita"**.
2. Faça login com o usuário administrador criado no seed.
3. No **Dashboard**, veja o resumo de pacientes, responsáveis e usuários.
4. Em **Pacientes**, clique em **"+ Novo Paciente"** para abrir o formulário completo
   (dividido em abas: dados pessoais, TEA, escola, moradia, socioeconômico,
   responsáveis e outras informações).
5. Em **Responsáveis**, consulte e edite rapidamente qualquer responsável já vinculado
   a um paciente (para adicionar um novo responsável, edite o paciente correspondente).
6. Em **Eventos**, cadastre reuniões/eventos da associação e registre a presença de
   cada paciente. **Se um paciente atingir 3 faltas consecutivas sem justificativa**
   (em eventos marcados como "realizado"), o sistema **desliga automaticamente** o
   cadastro dele (status muda para "inativo" e o motivo fica registrado).
7. Em **Contribuições**, registre as doações mensais feitas pelos responsáveis/apoiadores
   da associação — quem contribuiu, quanto e quando. A tela mostra o total arrecadado
   no mês, o número de contribuintes e o total geral. Também é possível gerar o
   **Relatório Mensal** em PDF (via impressão do navegador).
8. Em **Usuários** (visível apenas para administradores), cadastre outros membros da
   equipe com os cargos: colaborador(a), presidente ou administrador(a).

### Impressão de documentos (na tela Pacientes)

- **Comprovante de Cadastro/Inclusão**: reproduz o modelo oficial em papel da AMUT.
- **Ficha Completa**: reproduz a ficha de cadastro oficial (3 páginas, com os campos
  de identificação, TEA, escola, moradia, socioeconômico, termo de aceite e assinaturas).

Ambos podem ser impressos a qualquer momento pela lista de pacientes, ou logo após
salvar um cadastro (novo ou editado), através da janela de confirmação que aparece.

### Cargos e permissões

| Ação                                   | Colaborador(a) | Presidente | Administrador(a) |
|-----------------------------------------|:---:|:---:|:---:|
| Ver dashboard                           | ✅ | ✅ | ✅ |
| Cadastrar/editar pacientes               | ✅ | ✅ | ✅ |
| Excluir pacientes                        | ❌ | ✅ | ✅ |
| Editar responsáveis                      | ✅ | ✅ | ✅ |
| Excluir responsáveis                     | ❌ | ✅ | ✅ |
| Criar eventos e registrar presença       | ✅ | ✅ | ✅ |
| Excluir eventos                          | ❌ | ✅ | ✅ |
| Registrar contribuições/doações          | ✅ | ✅ | ✅ |
| Excluir contribuições                    | ❌ | ✅ | ✅ |
| Gerenciar usuários do sistema             | ❌ | ❌ | ✅ |

---

## Hospedagem (quando for colocar em produção)

- **Backend + MySQL + frontend:** serviços como Railway, Render, Hostinger (VPS), ou um
  servidor próprio com Node.js e MySQL instalados.
- Lembre-se de usar **HTTPS** e um `JWT_SECRET` forte em produção.
- Nunca suba o arquivo `.env` para repositórios públicos.

---

## Dúvidas frequentes

**"Erro ao conectar ao banco de dados" ao iniciar**
Verifique se o MySQL está rodando e se usuário/senha/nome do banco no `.env` estão corretos.

**A tela de login dá erro de CORS / "Failed to fetch"**
Confirme que o servidor está rodando (`npm start`) e que `FRONTEND_URL` no `.env`
aponta para o endereço correto (ex.: `http://localhost:3000`).

**Esqueci a senha do administrador**
Rode novamente `npm run seed` apenas se ainda não existir nenhum usuário com o e-mail
`admin@amut.org.br` no banco — caso já exista, altere a senha diretamente pela tela
"Meu Perfil" de outro usuário admin, ou peça ajuda para gerar um novo hash de senha.
