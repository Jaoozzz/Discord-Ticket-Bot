# <img src="./assets//ticket.webp" width="28" height="28" style="vertical-align: middle;"> Bot Ticket

> Sistema completo de tickets para Discord, desenvolvido em **Node.js** com **discord.js v14** e **SQLite**.

[![Version](https://img.shields.io/badge/Version-v1.0.0-blue?style=flat-square)](https://github.com/Jaoozzz/Discord-Ticket-Bot)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square\&logo=node.js\&logoColor=white)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-blue?style=flat-square\&logo=discord)](https://discord.js.org/)
[![Database](https://img.shields.io/badge/Database-SQLite-lightgrey?style=flat-square)](https://www.sqlite.org/)
[![Dependencies](https://img.shields.io/badge/Dependencies-3-brightgreen?style=flat-square)](https://github.com/Jaoozzz/Discord-Ticket-Bot/blob/main/package.json)
[![RAM](https://img.shields.io/badge/RAM-100--250MB-orange?style=flat-square)](#-desempenho)
[![CPU](https://img.shields.io/badge/CPU-0.0--0.1%20vCPU-yellow?style=flat-square)](#-desempenho)
[![Size](https://img.shields.io/badge/Size-80.6KB-purple?style=flat-square)](#-desempenho)

[![Download](https://img.shields.io/badge/⬇%20Download-Bot%20Ticket-2ea44f?style=for-the-badge)](https://github.com/Jaoozzz/Discord-Ticket-Bot/archive/refs/heads/main.zip)

---

## 📌 Sobre

O **Bot Ticket** é um sistema completo de atendimento para servidores Discord.

Ele foi desenvolvido para facilitar a organização do suporte, permitindo criar tickets, gerenciar atendimentos, acompanhar filas, utilizar prioridades, configurar SLA, gerar transcripts e muito mais.

O projeto foi desenvolvido pensando em ser **simples de instalar, fácil de configurar e livre para utilização**.

---

## ✨ Recursos

* 🎫 Sistema completo de tickets
* 🖱️ Painel interativo para abertura de tickets
* 📝 Formulários através de Modals
* 👥 Sistema de fila de atendimento
* 🙋 Sistema de atendimento/`claim`
* 🔄 Transferência de tickets
* ⭐ Avaliação do atendimento
* 🚦 Sistema de prioridade
* ⏱️ SLA de primeira resposta
* 💤 Fechamento automático por inatividade
* 📝 Notas internas para a equipe
* 🚫 Sistema de blacklist
* 📄 Transcripts em `.txt` e `.html`
* 💰 Geração de QR Code para Pix
* 🕐 Horário comercial configurável
* 💾 Backup automático do banco de dados
* ⚙️ Painel de configuração diretamente pelo Discord
* 🌐 Suporte a múltiplos servidores
* 🗃️ Banco de dados SQLite

---

## 📊 Desempenho

O consumo pode variar de acordo com a quantidade de servidores, tickets, usuários e atividades realizadas pelo bot.

| Recurso           |    Consumo observado |
| ----------------- | -------------------: |
| 🧠 RAM            | **~100 MB — 250 MB** |
| ⚡ CPU             |  **~0.0 — 0.1 vCPU** |
| 📦 Projeto        |         **~80.6 KB** |
| 📁 `node_modules` |     **Não incluído** |

> ⚠️ Os valores de RAM e CPU são estimativas baseadas em testes iniciais e podem variar dependendo da hospedagem e da utilização do bot.

O tamanho de **80.6 KB** considera o projeto distribuído sem a pasta `node_modules`.

---

## 🛠️ Tecnologias utilizadas

| Tecnologia         | Utilização             |
| ------------------ | ---------------------- |
| **Node.js**        | Runtime do bot         |
| **discord.js v14** | Integração com Discord |
| **SQLite**         | Armazenamento de dados |
| **better-sqlite3** | Comunicação com SQLite |
| **QRCode**         | Geração de QR Codes    |

---

## 📥 Download

### Download rápido

[![Download](https://img.shields.io/badge/⬇%20BAIXAR-Bot%20Ticket-2ea44f?style=for-the-badge)](https://github.com/Jaoozzz/Discord-Ticket-Bot/archive/refs/heads/main.zip)

O download acima contém o código do projeto disponível no repositório e **não inclui `node_modules`**.

> 💡 Para uma versão específica e estável do bot, recomenda-se utilizar as **Releases** do GitHub quando estiverem disponíveis.

### Código-fonte

[![GitHub](https://img.shields.io/badge/GitHub-Código%20Fonte-181717?style=for-the-badge\&logo=github\&logoColor=white)](https://github.com/Jaoozzz/Discord-Ticket-Bot)

---

## 🚀 Instalação

### Requisitos

Antes de começar, você precisará ter:

* [Node.js](https://nodejs.org/) **18 ou superior**
* Uma aplicação criada no [Discord Developer Portal](https://discord.com/developers/applications)
* Um bot criado dentro da aplicação
* Permissão suficiente para adicionar o bot ao servidor

### 1. Clone o repositório

```bash
git clone https://github.com/Jaoozzz/Discord-Ticket-Bot.git
cd Discord-Ticket-Bot
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o bot

Abra o arquivo:

```text
config.json
```

E configure suas informações:

```json
{
  "token": "SEU_TOKEN",
  "clientId": "ID_DA_APLICACAO",
  "guildId": "",
  "ownerId": [
    "SEU_ID_DO_DISCORD"
  ]
}
```

### 4. Inicie o bot

```bash
npm start
```

Se tudo estiver configurado corretamente, o bot ficará online e registrará os comandos disponíveis nos servidores em que estiver presente.

---

## ⚙️ Primeira configuração

Depois de colocar o bot online:

### 1. Configure o bot

Utilize:

```text
/config
```

O comando abre o painel de configuração.

### 2. Configure o sistema de tickets

Defina pelo menos:

* Categoria dos tickets
* Cargo da equipe de atendimento
* Marca/nome do sistema
* Canal de logs
* Tipos de ticket
* Configurações de atendimento
* Horário comercial

### 3. Publique o painel

Utilize:

```text
/painel
```

O painel será enviado no canal atual.

A partir disso, os usuários poderão abrir seus tickets normalmente.

---

## 💻 Comandos

| Comando        | Permissão                  | Função                              |
| -------------- | -------------------------- | ----------------------------------- |
| `/config`      | Dono                       | Abre o painel de configuração       |
| `/painel`      | Staff / Gerenciar Servidor | Publica o painel de tickets         |
| `/claim`       | Staff                      | Assume um ticket                    |
| `/fechar`      | Staff / dono do ticket*    | Fecha o ticket                      |
| `/add`         | Staff                      | Adiciona um usuário ao ticket       |
| `/remove`      | Staff                      | Remove um usuário do ticket         |
| `/rename`      | Staff                      | Renomeia o ticket                   |
| `/staff`       | Staff                      | Exibe tickets e fila de atendimento |
| `/stats`       | Staff                      | Exibe estatísticas                  |
| `/ticket info` | Staff / dono               | Exibe informações do ticket         |
| `/blacklist`   | Staff                      | Gerencia a blacklist                |

* Depende da configuração de fechamento pelo proprietário do ticket.

---

## 🎟️ Sistema de atendimento

O painel de tickets permite que a equipe utilize diversas funções diretamente dentro do atendimento.

Entre elas:

* Assumir ticket
* Transferir atendimento
* Alterar status
* Alterar prioridade
* Adicionar/remover usuários
* Adicionar notas internas
* Notificar o usuário
* Gerar transcript
* Gerar QR Code Pix

---

## ⏱️ SLA e fechamento automático

O sistema possui recursos para ajudar a equipe a manter os atendimentos organizados.

### SLA

O SLA permite identificar tickets que ficaram muito tempo sem receber uma primeira resposta da equipe.

### Auto Close

Tickets que permanecem inativos podem ser avisados e posteriormente fechados automaticamente, dependendo das configurações do servidor.

---

## 💾 Banco de dados e backups

O bot utiliza **SQLite** para armazenar os dados.

O banco é criado automaticamente durante a utilização do sistema.

Estrutura relacionada:

```text
database/
├── tickets.sqlite
└── guilds/
```

O sistema também possui **backup automático**, executado periodicamente.

---

## 📁 Estrutura do projeto

```text
Discord-Ticket-Bot/
├── commands/
│   └── Comandos slash
│
├── events/
│   └── Eventos do Discord
│
├── utils/
│   └── Sistemas internos do bot
│
├── database/
│   └── Banco de dados e configurações
│
├── config.json
├── index.js
├── package.json
└── package-lock.json
```

---

## 🔐 Segurança

### ⚠️ Nunca compartilhe seu token

O token do bot funciona como uma senha.

**Nunca:**

* Envie seu token para outras pessoas
* Publique seu token no GitHub
* Coloque o token diretamente no código público
* Envie seu `config.json` contendo o token

Caso o token seja exposto, gere um novo token imediatamente pelo Discord Developer Portal.

---

## 📜 Uso e redistribuição

O **Bot Ticket** é disponibilizado para utilização e modificação livre.

Você pode utilizar o projeto em seus próprios servidores e realizar alterações no código para adaptá-lo às suas necessidades.

### ⚠️ Ao redistribuir

Caso você publique uma versão modificada ou disponibilize este projeto em outro repositório, **mantenha a atribuição ao projeto original e inclua o repositório original como fonte**.

**Repositório original:**

https://github.com/Jaoozzz/Discord-Ticket-Bot

Não remova a referência ao projeto original ao redistribuir o código.

> Para transformar essas condições em uma licença juridicamente formal, adicione um arquivo `LICENSE` ao repositório. O texto desta seção, sozinho, é uma política de atribuição e não substitui uma licença de software.

---

## ❓ FAQ

### Preciso saber programar?

Não.

Para instalar e utilizar o bot, você precisa apenas configurar o `config.json`, instalar as dependências e iniciar o projeto.

Conhecimento de programação é necessário apenas para modificar o funcionamento interno do bot.

### Posso utilizar o bot em vários servidores?

Sim.

As configurações podem ser separadas por servidor, permitindo que diferentes servidores tenham configurações próprias.

### Preciso instalar um banco de dados?

Não.

O projeto utiliza SQLite e cria o banco automaticamente.

### O `node_modules` está incluído no download?

Não.

As dependências devem ser instaladas através de:

```bash
npm install
```

Isso mantém o download do projeto pequeno e evita distribuir uma pasta `node_modules` desnecessariamente grande.

### O bot é gratuito?

Sim. O projeto é disponibilizado para utilização livre, respeitando as condições de atribuição descritas neste README.

### Encontrei um problema

Abra uma **Issue** no repositório descrevendo:

* O problema encontrado
* O que você estava fazendo
* A mensagem de erro
* Logs relevantes
* Como reproduzir o problema

---

## 🤝 Contribuição

Contribuições são bem-vindas.

Você pode:

* Corrigir bugs
* Melhorar funcionalidades
* Sugerir recursos
* Melhorar a documentação
* Enviar Pull Requests

---

## 🔗 Links

**Repositório:**
https://github.com/Jaoozzz/Discord-Ticket-Bot

**Autor:**
[Jaoozzz](https://github.com/Jaoozzz)

---

<div align="center">

### 🎫 Bot Ticket

Sistema de tickets para Discord.

**Feito com Node.js, discord.js e SQLite.**

⭐ Se este projeto foi útil para você, considere deixar uma estrela no repositório!

</div>
