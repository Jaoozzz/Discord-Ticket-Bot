# Bot Ticket

Bot de tickets para Discord, feito com [discord.js](https://discord.js.org/) v14 e SQLite. Painel de atendimento com botões/menu, formulário de abertura, fila de atendimento, prioridade, SLA de primeira resposta, avaliações, blacklist, transcript em TXT/HTML, backup automático do banco e um painel de configuração `/config` que roda inteiro dentro do Discord (sem precisar editar arquivo na mão depois do setup inicial).

## Índice

- [O que ele faz](#o-que-ele-faz)
- [Antes de instalar](#antes-de-instalar)
- [Instalação](#instalação)
- [Primeira configuração](#primeira-configuração)
- [Comandos](#comandos)
- [Estrutura do projeto](#estrutura-do-projeto)
- [FAQ](#faq)

## O que ele faz

- Painel público de tickets (botões, menu dropdown ou os dois) publicado com `/painel`
- Formulário (modal) opcional ao abrir ticket, pra já vir com assunto/detalhes
- Fila de atendimento, prioridade, transferência entre staff e "assumir" ticket
- SLA configurável (avisa quando um ticket passa X minutos sem resposta da staff)
- Fechamento automático de tickets inativos, com aviso antes de fechar
- Avaliação por estrelas ao final do atendimento
- Notas internas (só staff vê)
- Blacklist de usuários (bloquear abertura de novos tickets)
- Transcript em `.txt` e `.html` do ticket
- QR Code de Pix dentro do ticket, se configurado
- Horário comercial configurável (mensagem automática fora do expediente)
- Backup automático do banco a cada 6 horas
- Painel de configuração visual via `/config` (só o dono do bot consegue abrir)

## Antes de instalar

Você vai precisar de:

- [Node.js](https://nodejs.org/) 18 ou superior instalado
- Uma aplicação criada no [Discord Developer Portal](https://discord.com/developers/applications), com um bot e o **token** dele
- Permissão de administrador no servidor onde for usar o bot

## Instalação

```bash
git clone <url-do-seu-fork-ou-repo>
cd bot-ticket
npm install
```

Abra o `config.json` na raiz do projeto e preencha pelo menos:

```json
{
  "token": "token do seu bot aqui",
  "clientId": "ID da aplicação do bot",
  "guildId": "",
  "ownerId": ["seu ID de usuário do Discord"]
}
```

- `token` e `clientId` você pega no Developer Portal, na página da sua aplicação.
- `ownerId` é uma lista (array) — pode colocar mais de um ID se quiser mais de um dono.
- `guildId` pode ficar em branco; ele é preenchido automaticamente quando você roda o comando `/painel` pela primeira vez em cada servidor.

Depois é só rodar:

```bash
npm start
```

Se aparecer `Bot Ticket online como <nome>#0000` no console, deu certo. Os comandos slash (`/painel`, `/config`, etc.) são registrados automaticamente sempre que o bot liga — não precisa rodar nada separado pra isso.

## Primeira configuração

1. Rode `/config` no servidor (só funciona pra quem está no `ownerId` do `config.json`). Isso abre um painel dentro do Discord pra configurar marca, cores, categoria de tickets, cargo de staff, canal de logs, tipos de ticket, FAQ, horário comercial, etc.
2. Configure pelo menos: **cargo de staff** e **categoria de tickets** (onde os canais de ticket vão ser criados).
3. Rode `/painel` no canal onde você quer que o painel público apareça.
4. Pronto — usuários já podem clicar/selecionar pra abrir ticket.

## Comandos

| Comando | Quem pode usar | O que faz |
|---|---|---|
| `/config` | Dono (`ownerId`) | Abre o painel de configuração visual |
| `/painel` | Staff / quem tem Gerenciar Servidor | Publica o painel público de tickets no canal atual |
| `/claim` | Staff | Assume o ticket do canal atual |
| `/fechar` | Staff (ou o dono do ticket, se `allowOwnerClose` estiver ativo) | Encerra o ticket atual |
| `/add usuario:@alguém` | Staff | Adiciona alguém ao ticket atual |
| `/remove usuario:@alguém` | Staff | Remove alguém do ticket atual |
| `/rename nome:texto` | Staff | Renomeia o canal do ticket |
| `/staff` | Staff | Mostra o painel com todos os tickets abertos e a fila |
| `/stats` | Staff | Estatísticas: tickets abertos, sem atendente, blacklist, avaliações |
| `/ticket info` | Staff ou dono do ticket | Mostra informações do ticket atual |
| `/blacklist add\|remove\|list\|check` | Staff | Gerencia usuários bloqueados de abrir ticket |

Além dos comandos, o próprio painel/canal de ticket tem botões pra: assumir, transferir, mudar status, mudar prioridade, notificar o dono, adicionar usuário, ver/adicionar nota interna, gerar transcript e gerar Pix (se configurado).

## Estrutura do projeto

```
bot-ticket/
├── commands/       → slash commands (/painel, /config, /claim, etc.)
├── events/         → eventos do Discord (interactionCreate, guildMemberAdd, messageCreate)
├── utils/          → toda a lógica: banco, tickets, painel, config, transcript, backup, SLA...
├── database/       → banco SQLite (gerado automaticamente, não versionar)
├── config.json     → configuração global (token, dono, marca, tipos de ticket, etc.)
└── index.js        → ponto de entrada do bot
```

O banco (`database/tickets.sqlite`) e as pastas `backups/` e `database/guilds/` são gerados sozinhos na primeira vez que o bot roda — não é necessário criar nada manualmente.

## FAQ

**Preciso saber programar pra usar isso?**
Não pra usar. Pra instalar e configurar, só editar o `config.json` no começo (token/dono) e depois usar `/config` dentro do Discord. Programar só é necessário se você quiser mudar o comportamento do bot.

**O bot funciona em mais de um servidor com uma instância só?**
Sim. A configuração é por servidor (`database/guilds/<id>.json`), então cada servidor pode ter marca, cargo de staff, categoria, tipos de ticket etc. diferentes, mesmo rodando o mesmo processo do bot.

**Onde eu pego o token do bot?**
No [Discord Developer Portal](https://discord.com/developers/applications) → sua aplicação → aba "Bot" → "Reset Token" (ou "Token" se for a primeira vez). Nunca compartilhe esse token com ninguém nem suba ele pro GitHub — é como se fosse a senha do bot.

**Rodei `npm start` e deu "Configure o token em config.json".**
Significa que o campo `"token"` no `config.json` está vazio. Preencha com o token do bot e rode de novo.

**Os comandos slash não aparecem no Discord.**
Pode levar até 1 hora pra comandos globais propagarem, mas como este bot registra os comandos **por servidor** (guild commands), normalmente aparece na hora. Se não aparecer, tente sair e entrar no servidor de novo, ou reiniciar o app do Discord. Confira também se o bot tem o escopo `applications.commands` marcado no link de convite.

**Como convido o bot pro meu servidor?**
No Developer Portal → sua aplicação → "OAuth2" → "URL Generator". Marque os escopos `bot` e `applications.commands`, e nas permissões marque pelo menos: Gerenciar Canais, Gerenciar Cargos (se for usar cargo automático), Enviar Mensagens, Inserir Links, Anexar Arquivos, Ler Histórico de Mensagens, Usar Comandos de Barra.

**Como defino quem é staff?**
Em `/config`, defina o **cargo de staff** (`staffRole`). Qualquer pessoa com esse cargo, com permissão de Administrador, ou com Gerenciar Servidor, é tratada como staff pelo bot.

**Um usuário comum pode fechar o próprio ticket?**
Só se a opção `allowOwnerClose` estiver ativada (é o padrão). Se estiver desativada, só staff consegue fechar.

**Como funciona a fila e o SLA?**
A fila é calculada pela ordem de criação dos tickets abertos do mesmo tipo. O SLA é o tempo (em minutos, configurável) que o bot espera pela primeira resposta de um staff antes de sinalizar o ticket como atrasado.

**O que acontece com um ticket abandonado?**
Se `autoClose` estiver habilitado, o bot avisa após `warnMinutes` de inatividade e fecha sozinho após `closeMinutes`, salvando o transcript e mandando na DM do usuário antes de apagar o canal.

**Onde ficam salvos os dados (tickets, notas, avaliações)?**
Em SQLite, no arquivo `database/tickets.sqlite`. É gerado automaticamente — não precisa instalar nenhum banco separado.

**O bot faz backup sozinho?**
Sim, a cada 6 horas ele salva uma cópia de segurança das configurações e tickets na pasta `backups/`.

**Posso usar isso comercialmente / revender?**
O código é seu pra usar e modificar como quiser. Só ajuste a marca (`brand` no `config.json`) e remova qualquer coisa que não faça sentido pro seu caso.

**Encontrei um bug ou quero sugerir algo, o que faço?**
Abra uma *issue* no repositório, ou mande um pull request se você mesmo já corrigiu.
