# Decisões

Log append-only, com a entrada mais nova no topo. Cada entrada registra o que uma sessão futura faria
errado sem ela.

### 2026-10-19 - Em produção, a Vercel é o proxy da API

**Armadilha:** parece que a primeira visita depois do repouso do Render daria erro, e que valeria
criar repetições automáticas no front. Não é preciso: a Vercel espera até 120 s pela resposta de um
rewrite, e o Render acorda em menos de um minuto, então a tela "Carregando…" cobre a espera.
**Regra:** `frontend/vercel.json` repassa `/api` e o Swagger ao Render, como o nginx faz no Compose, e é
o único lugar com o endereço do Render. A tela de servidor fora do ar só aparece quando a API não
responde de fato, com um botão para tentar de novo. Um `/:path*` da Vercel também casa o caminho sem
nada depois e o repassa com barra no fim, que a API responde com 404; por isso `/v3/api-docs` tem
regra própria antes da genérica.
**Onde:** `frontend/vercel.json`, `frontend/src/components/PageUnreachable.tsx`.

### 2026-10-19 - Telefone e CEP preenchem pelo mesmo registro

**Armadilha:** cada preenchimento olhando só para campos vazios, ou só para o que ele mesmo pôs,
deixava no formulário o nome e o endereço do cliente anterior quando o telefone era corrigido, e o
endereço da base de clientes quando a pessoa digitava um CEP novo.
**Regra:** `useAutofill` guarda o que foi preenchido sozinho, e um campo vira da pessoa assim que ela o
muda. O endereço do cliente só entra enquanto o CEP não foi digitado. A resposta do ViaCEP troca rua,
bairro, cidade e UF preenchidos antes e limpa número e complemento que vieram de outro endereço. Isso
substitui a regra do CEP de 2026-10-17 abaixo.
**Onde:** `frontend/src/features/orders/autofill.ts`, `useCustomerAutofill.ts`, `useCepAutofill.ts`.

### 2026-10-19 - Evento de menu ou diálogo chega ao card do kanban

**Armadilha:** um portal do React renderiza o menu e o diálogo fora do card, mas os eventos sobem pela
árvore do React até o `<li>` arrastável. O dnd-kit não confere de onde veio o clique, então selecionar
texto no diálogo de cancelamento arrastava o card de trás.
**Regra:** os listeners do card passam por `fromCardOnly`, que ignora eventos de fora do DOM do card.
**Onde:** `frontend/src/features/orders/OrderBoard.tsx`.

### 2026-10-19 - Diálogo aberto por menu mora fora do menu

**Armadilha:** o caminho comum é pôr o `Dialog` dentro do item do `DropdownMenu`. O menu fecha ao
escolher o item, desmonta o conteúdo e leva o diálogo junto.
**Regra:** o diálogo fica ao lado do menu, com o estado de aberto no componente pai, e recebe
`returnFocus` para devolver o foco a quem o abriu. Vale para cancelar pedido e restaurar demonstração.
**Onde:** `frontend/src/features/orders/StatusActions.tsx`, `frontend/src/app/UserMenu.tsx`.

### 2026-10-19 - Arrastar no kanban: toda coluna é alvo, e quem decide é o soltar

**Armadilha:** desligar (`disabled`) as colunas que não aceitam o card parece o jeito certo, mas o
dnd-kit mede os alvos no começo do arrasto e uma coluna ligada no meio dele pode ficar sem medida.
O `<a>` do card também é arrastável pelo próprio navegador e rouba o gesto do dnd-kit.
**Regra:** todas as colunas ficam ligadas; `resolveDrop` decide no soltar (ignora, move ou pede o
motivo) e o destaque visual só mostra as colunas permitidas. O link do card tem `draggable={false}`.
Não há sensor de teclado: pelo teclado, o caminho são os botões do card.
**Onde:** `frontend/src/features/orders/OrderBoard.tsx`, `frontend/src/features/orders/board.ts`.

### 2026-10-19 - Kanban com uma consulta por status

**Armadilha:** o reflexo é carregar todos os pedidos numa consulta só e agrupar no front, ou criar
um endpoint de quadro. A primeira traz só 100 pedidos misturados e erra o total de cada coluna; a
segunda muda a API por causa de uma tela.
**Regra:** cada coluna é a primeira página de `GET /api/orders?status=`, com o `totalElements` como
total e "Ver todos" para a lista filtrada. O card arrastado vai para a coluna nova antes da resposta
(`pending`), e como as colunas recarregam em tempos diferentes, `arrangeBoard` mostra cada pedido uma
vez só e acerta os totais.
**Onde:** `frontend/src/features/orders/api.ts` (`useOrderBoard`), `frontend/src/features/orders/board.ts`.

### 2026-10-19 - Regras globais do CSS que parecem sobrando

**Armadilha:** `scrollbar-gutter: stable` evita que a página ande para o lado quando a barra de
rolagem aparece ou some (trocar de filtro mudava a altura). Mas o Radix, ao abrir menu, select ou
diálogo, trava a rolagem e soma uma margem do tamanho da barra, e com o espaço já reservado a página
andava do mesmo jeito. Além disso, o Tailwind 4 deixa botão com cursor de seta. CSS não aceita
comentário com `//`, então o porquê fica aqui.
**Regra:** não tire do `index.css` o `scrollbar-gutter`, a margem zerada em `body[data-scroll-locked]`
nem o `cursor: pointer` dos elementos clicáveis.
**Onde:** `frontend/src/index.css`.

### 2026-10-17 - Proxy na frente da API repassa o host original

**Armadilha:** atrás do nginx (e, em produção, do rewrite da Vercel), a API enxerga o próprio endereço
interno. Sem `X-Forwarded-Host`, o Swagger anunciava `http://localhost` sem a porta, e o "Try it out"
mandava as chamadas para o lugar errado.
**Regra:** o proxy manda `Host`, `X-Forwarded-Proto` e `X-Forwarded-Host`, e a API roda com
`SERVER_FORWARD_HEADERS_STRATEGY=framework` sempre que estiver atrás de um proxy.
**Onde:** `frontend/nginx.conf`, `docker-compose.yml`, variáveis do Render.

### 2026-10-17 - CEP preenche pelo evento do campo, não por observar o valor

**Armadilha:** observar o CEP com `useWatch` dispararia o ViaCEP também quando a base de clientes
preenche o endereço, trocando "Av. Paulista" do cadastro por "Avenida Paulista". E uma resposta lenta
apagaria a rua que a pessoa digitou enquanto esperava.
**Regra:** a busca roda no `onChange` do próprio campo de CEP, e a resposta só preenche campos vazios
ou que ainda guardam o preenchimento anterior do CEP. Número e complemento nunca vêm do ViaCEP.
**Onde:** `frontend/src/features/orders/useCepAutofill.ts`.

### 2026-10-17 - Base de clientes gravada por upsert nativo

**Armadilha:** o jeito JPA de "buscar e salvar" o cliente corre: dois primeiros pedidos do mesmo
telefone ao mesmo tempo tentam inserir os dois, um bate na unique e derruba a criação do pedido.
**Regra:** o cliente só é gravado por `CustomerRepository.upsert`, um `insert ... on conflict do update`
do Postgres que só sobrescreve quando o pedido é mais novo (`last_order_at`). O id do cliente é UUID
v4, porque o insert nativo não passa pelo gerador do Hibernate, e ele nunca sai da API.
**Onde:** `backend/.../customer/CustomerRepository.java`, `V4__create_customers.sql`.

### 2026-10-17 - Dados de demonstração passam pelo domínio

**Armadilha:** o caminho comum é um SQL de seed, que grava totais e histórico à mão e deixa de bater
com as regras na primeira mudança delas.
**Regra:** o roteiro em `DemoScript` vira pedidos por `Order.create` e `changeStatus`, com instantes no
passado. Se uma regra nova quebrar o roteiro, `DemoDataTests` falha; corrija o roteiro, não a regra.
**Onde:** `backend/.../demo/`.

### 2026-10-17 - Testes rodam com os dados de demonstração ligados

**Armadilha:** com a demo carregada no banco dos testes, qualquer contagem global (todos os pedidos,
todos os restaurantes) muda conforme a demo muda.
**Regra:** um teste só conta o que pertence às contas que ele mesmo criou com `TestAccounts`, ou às
contas demo quando o teste é sobre a demo. Para o admin, use `contains`, nunca `containsExactly`.
**Onde:** `backend/src/test/`.

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
**Regra:** `PublicRoutes` é a lista única das rotas abertas sem sessão. A segurança libera essas rotas,
e `Sessions.resolve` ignora o cookie nelas. Rota pública nova entra só ali; antes as duas listas eram
separadas e o Swagger ficou de fora da segunda.
**Onde:** `backend/.../auth/PublicRoutes.java`.

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
