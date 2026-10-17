# Decisões

Log append-only, com a entrada mais nova no topo. Cada entrada registra o que uma sessão futura faria
errado sem ela.

### 2026-10-17 - Valores em reais são campos de texto

**Armadilha:** `<input type="number">` não aceita vírgula em vários navegadores e devolve vazio para
"45,90", que é como qualquer pessoa no Brasil digita um preço.
**Regra:** preço, taxa e troco são campos de texto com `inputMode="decimal"`, e o schema do formulário
converte "45,90" ou "45.90" em número antes de mandar para a API, que só recebe números.
**Onde:** `frontend/src/features/orders/order-form.ts`.

### 2026-10-17 - Itens e histórico do pedido são coleções ordenadas

**Armadilha:** sem `@OrderColumn`, o Hibernate trata uma `@ElementCollection` como saco e, a cada
mudança de status, apaga e regrava o histórico inteiro do pedido.
**Regra:** itens e histórico são `@ElementCollection` de records com `@OrderColumn(name = "position")`,
então uma mudança de status só insere uma linha. Não tire o `@OrderColumn` nem troque por `@OneToMany`
sem motivo.
**Onde:** `backend/.../order/Order.java`, `V3__create_orders.sql`.

### 2026-10-17 - API local escuta só no 127.0.0.1

**Armadilha:** por padrão o Tomcat escuta em todos os endereços, o que expõe a API de desenvolvimento a
qualquer máquina da mesma rede e faz o Firewall do Windows perguntar se libera o `java.exe`.
**Regra:** `server.address` é `127.0.0.1`, e o proxy do Vite aponta para `127.0.0.1:8080` (não para
`localhost`, que pode resolver para `::1`). Imagem Docker e Render definem `SERVER_ADDRESS=0.0.0.0`,
senão a API fica inacessível dentro do container.
**Onde:** `backend/src/main/resources/application.yaml`, `frontend/vite.config.ts`, `backend/Dockerfile`
(fase 2).

### 2026-10-17 - Testes HTTP passam pelo CSRF de verdade

**Armadilha:** o atalho do Spring Security é `with(csrf())`, que injeta um token válido e deixa o
teste passar mesmo se o contrato com o front (cookie `XSRF-TOKEN` lido e devolvido no header) quebrar.
**Regra:** testes HTTP usam `ApiSession`, que guarda os cookies e devolve o token no header como o
front faz. Não use `with(csrf())`.
**Onde:** `backend/src/test/java/io/github/guilhermedkdk/ordertracker/ApiSession.java`.

### 2026-10-17 - Cookie velho não bloqueia o login

**Armadilha:** o resource server tenta validar o token do cookie em qualquer rota, até nas liberadas.
Com um cookie expirado, cadastro e login respondiam 401 e a pessoa não conseguia entrar de novo.
**Regra:** `Sessions.resolve` ignora o cookie em cadastro, login e logout. Rota nova que precisa
funcionar com sessão vencida entra nessa lista.
**Onde:** `backend/.../auth/Sessions.java`.

### 2026-10-17 - Erros dos filtros de segurança passam pelo mesmo handler

**Armadilha:** o padrão do Spring Security responde 401 e 403 com corpo vazio e header
`WWW-Authenticate`, num formato diferente do resto da API.
**Regra:** o entry point e o access denied handler repassam a exceção ao `HandlerExceptionResolver`, e
o formato de todo erro fica no `ApiExceptionHandler`. Nenhum filtro escreve resposta de erro sozinho.
**Onde:** `backend/.../auth/SecurityConfig.java`, `backend/.../shared/ApiExceptionHandler.java`.

### 2026-10-17 - Chave do JWT obrigatória em produção

**Armadilha:** sem `APP_AUTH_JWT_SECRET`, a API gera uma chave aleatória a cada subida. No local isso
só pede um novo login, mas o Render reinicia a API toda vez que ela acorda e derrubaria todas as
sessões.
**Regra:** produção sempre define `APP_AUTH_JWT_SECRET` com pelo menos 32 bytes; a API recusa subir
com menos. Nunca coloque uma chave fixa no repositório.
**Onde:** `backend/.../auth/SecurityConfig.java`, variáveis do Render.

### 2026-10-17 - Alias `@/` sem `baseUrl`

**Armadilha:** a instalação do shadcn/ui manda pôr `baseUrl` no `tsconfig`, mas o TypeScript 6 trata
`baseUrl` como obsoleto e o `tsc` falha com TS5101.
**Regra:** o alias `@/*` usa só `paths`, que já resolve a partir do próprio `tsconfig`. Não adicione
`baseUrl` nem `ignoreDeprecations`.
**Onde:** `frontend/tsconfig.json`, `frontend/tsconfig.app.json`.

### 2026-10-17 - Script de Linux entra no Git como executável

**Armadilha:** no Windows o Git grava arquivos sem o bit de execução, e o `./mvnw` falha com permissão
negada no Linux, onde rodam o CI e a imagem Docker.
**Regra:** todo script que roda no Linux entra com `git update-index --chmod=+x <arquivo>`. Confira com
`git ls-files -s`, que deve mostrar `100755`.
**Onde:** `backend/mvnw`.

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
serve para exibir; rotas e buscas usam o UUID inteiro. A API já devolve o campo `code`.
**Onde:** `Order.code()` no `backend/`.

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
