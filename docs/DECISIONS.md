# Decisões

Log append-only, com a entrada mais nova no topo. Cada entrada registra o que uma sessão futura faria
errado sem ela.

### 2026-10-17 - Postgres em todos os ambientes, não SQLite

**Armadilha:** o enunciado pede "SQLite ou similar", e um perfil SQLite local parece facilitar a vida
de quem avalia.
**Regra:** Postgres em todo lugar: o Docker Compose sobe o banco no `spring-boot:run`, os testes usam
Testcontainers e produção usa o Neon. Não crie perfil com outro banco; com dois dialetos, um teste
passa num e quebra no outro.
**Onde:** `backend/` (configuração e migrations Flyway).

### 2026-10-17 - Sessão em cookie httpOnly, com a API no mesmo site

**Armadilha:** o caminho comum numa SPA é guardar o JWT no `localStorage` e mandar no header
`Authorization`, mas qualquer XSS lê o token. Cookie com a API em outro domínio também falha: Safari e
Brave bloqueiam cookie de terceiro, e o login quebra sem erro no log.
**Regra:** o JWT vai num cookie httpOnly `SameSite=Lax`, com a proteção CSRF do Spring Security, e o
front chama sempre `/api` na própria origem: proxy do Vite no local, rewrite da Vercel em produção.
Nunca aponte o front direto para o domínio do Render.
**Onde:** segurança do `backend/`, `frontend/vite.config.ts`, `frontend/vercel.json`.

### 2026-10-17 - Pedido guarda a própria cópia do cliente e do endereço

**Armadilha:** com uma base de clientes, o reflexo é o pedido apontar para o cliente e ler nome e
endereço de lá.
**Regra:** o pedido grava nome, telefone e endereço de entrega no momento da criação e nunca mais lê a
base de clientes. A base, separada por restaurante, só preenche o próximo pedido e recebe o último
nome e o último endereço a cada pedido criado.
**Onde:** módulos de pedido e de cliente do `backend/`.

### 2026-10-17 - Pedido não visível responde 404, não 403

**Armadilha:** 403 parece o código certo para "você não pode ver isto", mas confirma que o pedido
existe.
**Regra:** busca, listagem e mudança de status filtram pelos pedidos visíveis ao usuário; fora disso,
404.
**Onde:** consultas de pedido no `backend/`.

### 2026-10-17 - Transições de status só no backend

**Armadilha:** o front precisa saber quais botões mostrar, e é tentador copiar a tabela de transições
para lá.
**Regra:** o backend é o único dono das transições. Cada pedido na API traz `allowedNextStatuses`, e o
front mostra exatamente essas opções.
**Onde:** módulo de pedido do `backend/`, telas de pedido do `frontend/`.

### 2026-10-17 - Enums do domínio em português

**Armadilha:** o código é todo em inglês, então um leitor esperaria `RECEIVED` e `PREPARING`.
**Regra:** os valores de enum expostos pela API (status, papel, forma de pagamento, motivo do
cancelamento) ficam em português, como os status do enunciado, que é o contrato com quem avalia.
Classes, campos e métodos continuam em inglês.
**Onde:** enums do `backend/`, tipos do `frontend/`.

### 2026-10-17 - Instantes sempre em UTC

**Armadilha:** `LocalDateTime` grava a hora sem fuso, e a tela acaba mostrando o horário deslocado em
três horas.
**Regra:** instantes são `Instant` no Java e `timestamptz` no banco; só o front converte para
`America/Sao_Paulo`, na hora de exibir.
**Onde:** entidades e migrations do `backend/`, formatação de datas no `frontend/`.

### 2026-10-17 - Código do pedido vem do fim do UUID

**Armadilha:** o id é UUID v7, cujos primeiros caracteres são o horário da criação; pedidos criados com
menos de um minuto de diferença teriam o mesmo código se ele viesse do começo.
**Regra:** o código do pedido são os últimos 8 caracteres hexadecimais do UUID, em maiúsculas. Ele só
serve para exibir; rotas e buscas usam o UUID inteiro.
**Onde:** formatação do pedido no `frontend/`.

### 2026-10-17 - Restaurar demonstração é a única exclusão

**Armadilha:** as credenciais demo são públicas, então restaurar parece "zerar o banco".
**Regra:** restaurar apaga e recria só as contas demo e o que pertence a elas; contas do cadastro
ficam intactas. Nenhuma outra tela ou endpoint apaga dados.
**Onde:** dados de demonstração do `backend/`.

### 2026-10-17 - Fora do escopo da primeira versão

**Armadilha:** são evoluções naturais e parecem pequenas, mas cada uma abre regras que ninguém pediu.
**Regra:** não implemente sem pedido explícito: edição de pedido depois de criado, exclusão de
restaurante, funcionários ou sócios por restaurante, vários endereços por cliente, cardápio, canal de
origem do pedido, limite de tentativas de login, confirmação de e-mail, recuperação de senha e SSE com
mais de uma instância do servidor.
**Onde:** projeto todo.
