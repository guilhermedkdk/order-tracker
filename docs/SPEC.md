# Especificação

O que o sistema faz. A organização do código está em `docs/ARCHITECTURE.md`, o vocabulário em
`docs/GLOSSARY.md` e o porquê das escolhas em `docs/DECISIONS.md`.

## Objetivo

Desafio técnico de entrevista: um mini rastreador de pedidos de delivery, entregue até 21/10/2026 às
23:59. Primeiro o obrigatório do enunciado, depois polimento e extras, em três fases. Cada fase termina
num PR que deixa o sistema funcionando.

## Obrigatórios do enunciado

Cada linha só é marcada quando o teste que a prova existe e passa.

| | Requisito | Como é atendido | Prova |
| - | --------- | --------------- | ----- |
| [x] | Cadastro com nome, e-mail e senha | `POST /api/auth/signup` | `AuthApiTests`, `auth.test.tsx` |
| [x] | Login com e-mail e senha | `POST /api/auth/login`, sessão em cookie | `AuthApiTests`, `auth.test.tsx` |
| [x] | Só usuários autenticados acessam | Toda rota fora do cadastro, do login, do logout e da documentação responde 401 sem sessão; o front redireciona para `/entrar` | `AuthApiTests`, `auth.test.tsx` |
| [x] | Criar pedido (cliente, itens, endereço) | `POST /api/orders` | `OrderApiTests` |
| [x] | Atualizar o status (`RECEBIDO`, `EM_PREPARO`, `SAIU_PARA_ENTREGA`, `ENTREGUE`, `CANCELADO`) | `PATCH /api/orders/{id}/status`, com as regras de transição | `OrderTests`, `OrderApiTests` |
| [x] | Listar todos os pedidos e buscar por ID | `GET /api/orders`, `GET /api/orders/{id}` | `OrderApiTests` |
| [x] | Persistência em SQLite ou similar | Postgres com Flyway | todos os testes HTTP, com Postgres real via Testcontainers |
| [x] | React lista pedidos com status atual e cria pedido | Telas `/pedidos` e `/pedidos/novo` | `orders.test.tsx`, `new-order.test.tsx` |
| [x] | Repositório Git com histórico | Um PR por fase, commits por passo | [PR #1](https://github.com/guilhermedkdk/order-tracker/pull/1), com merge commit |

## Papéis e visibilidade

- O cadastro sempre cria um **dono**. O **admin** só existe nos dados de demonstração.
- O dono cria os próprios restaurantes. Sem nenhum, ele cai em `/restaurantes/novo`. Só donos criam
  restaurantes; o admin recebe 403.
- O dono vê e altera pedidos dos seus restaurantes; o admin, de todos. Pedido ou restaurante fora do
  alcance responde 404.

## Cadastro e login

- Nome: 2 a 100 caracteres. E-mail: formato válido, gravado em minúsculas e sem espaços, único (409
  "E-mail já cadastrado"). Senha: 8 a 72 caracteres, porque o BCrypt ignora o que passa de 72 bytes.
- Cadastro já deixa a pessoa logada. Login errado responde 401 com uma mensagem só, sem dizer se o
  e-mail existe.
- **Fase 1:** um JWT de 8 horas num cookie httpOnly `SameSite=Lax` (`Secure` em produção), CSRF com o
  token em cookie legível e devolvido no header `X-XSRF-TOKEN`. Logout apaga o cookie.
- **Fase 3:** JWT de 15 minutos mais refresh token de 7 dias com rotação, guardado como hash no banco,
  com uma janela curta de tolerância para abas que renovam ao mesmo tempo. Logout revoga o refresh token.

## Pedido

| Campo | Regra |
| ----- | ----- |
| Restaurante | Obrigatório, dentro do alcance do usuário. |
| Cliente | Nome de 2 a 100 caracteres; telefone com DDD, 10 ou 11 dígitos, gravado só com dígitos. |
| Endereço de entrega | CEP com 8 dígitos; rua até 150; número até 20 (aceita "S/N"); complemento opcional até 100; bairro e cidade até 100; UF entre as 27 siglas. |
| Itens | De 1 a 50. Nome até 100, quantidade inteira de 1 a 999, preço unitário de R$ 0,01 a R$ 99.999,99. |
| Taxa de entrega | De R$ 0,00 a R$ 999,99. Padrão R$ 0,00. |
| Forma de pagamento | Obrigatória. "Troco para" só com `DINHEIRO`, opcional, nunca menor que o total. |
| Observações | Opcional, até 500 caracteres. |

- A API calcula subtotal e total, com duas casas. O corpo da criação não tem campo de total.
- Criar um pedido grava o cliente na base daquele restaurante: cria, ou atualiza nome e último endereço
  se o telefone já existir (fase 2).
- Depois de criado, só o status do pedido muda.

## Status

| De | Para |
| -- | ---- |
| `RECEBIDO` | `EM_PREPARO`, `CANCELADO` |
| `EM_PREPARO` | `SAIU_PARA_ENTREGA`, `CANCELADO` |
| `SAIU_PARA_ENTREGA` | `ENTREGUE`, `CANCELADO` |
| `ENTREGUE`, `CANCELADO` | nenhum |

- Qualquer outra transição, inclusive para o mesmo status, responde 409.
- Cancelar exige o motivo do cancelamento. O detalhe vai até 300 caracteres e é obrigatório com
  `OUTRO`. Fora de um cancelamento, a API recusa motivo e detalhe com 400.
- Cada mudança grava status, instante, autor e, num cancelamento, motivo e detalhe. A criação grava a
  primeira, para `RECEBIDO`.
- Se duas pessoas mudam o mesmo pedido ao mesmo tempo, a segunda recebe 409 em vez de sobrescrever a
  primeira. O pedido guarda um número de versão para isso.

## API

| Método e rota | Faz |
| ------------- | --- |
| `POST /api/auth/signup` | Cadastra um dono e abre a sessão. 201. |
| `POST /api/auth/login` | Abre a sessão. 200. |
| `POST /api/auth/logout` | Fecha a sessão. 204. |
| `GET /api/auth/me` | O usuário da sessão: id, nome, e-mail, papel e se é conta demo. |
| `GET /api/restaurants` | Restaurantes visíveis; para o admin, com o nome do dono. |
| `POST /api/restaurants` | Cria um restaurante do dono da sessão. 201. |
| `GET /api/orders?restaurantId=&status=&page=&size=` | Pedidos visíveis, do mais novo para o mais antigo, paginados (20 por padrão, até 100). |
| `GET /api/orders/{id}` | O pedido com itens, histórico de status e próximos status. |
| `POST /api/orders` | Cria um pedido. 201 com `Location`. |
| `PATCH /api/orders/{id}/status` | `{ status, cancellationReason?, cancellationDetail? }`. 200 com o pedido. |
| `GET /api/customers?restaurantId=&phone=` | O cliente daquele restaurante com esse telefone, ou 404 (fase 2). |
| `POST /api/demo/restore` | Só admin. Restaura a demonstração. 204. |
| `GET /api/orders/stream` | SSE com as mudanças de status visíveis (fase 3). |

Todo pedido na API traz `id` (UUID), `code`, os totais e `allowedNextStatuses`. A documentação fica em
`/swagger-ui.html`, aberta sem login.

## Telas

- `/entrar`: login e os botões "Entrar como admin" e "Entrar como dono". `/cadastro`: cadastro.
- `/restaurantes/novo`: criação de restaurante, que também é a primeira tela de um dono novo.
- Cabeçalho: seletor de restaurante, com a opção "Todos" para o admin, nome do usuário, sair e, para o
  admin, "Restaurar demonstração" com confirmação.
- `/pedidos`: lista com código, cliente, bairro, total, horário e status, e as ações dos próximos status
  em cada linha. Cancelar abre um diálogo com o motivo. Na fase 2, filtro por status e paginação; na
  fase 3, alternância entre lista e kanban.
- `/pedidos/novo`: o formulário do pedido no restaurante selecionado, com itens que se adicionam e
  removem e a prévia do total. Na visão "Todos", o restaurante é o primeiro campo do formulário. Na fase 2, o telefone preenche nome e endereço,
  e o CEP preenche rua, bairro, cidade e UF pelo ViaCEP.
- `/pedidos/:id` (fase 2): detalhe com itens, pagamento e a linha do tempo do histórico.
- Valores em reais, horários no fuso de São Paulo, tudo em português.

## Dados de demonstração

- Ligados por `app.demo.enabled`: sim no local, na demo pública e nos testes, que assim conferem a
  carga a cada execução. Um restaurante de verdade desligaria.
- Na subida, se a conta do admin demo não existir, cria as contas `admin@example.com` (admin),
  `rafael@example.com` (dono da Cantina Bella Napoli e do Burger da Vila) e `juliana@example.com`
  (dona do Sushi Kenzo), todas com a senha `demo1234`, e 15 pedidos espalhados pelas últimas quatro
  horas, em todos os status, com histórico coerente e cancelamentos com motivo.
- Os pedidos de exemplo passam pelas mesmas regras do domínio que um pedido de verdade, só que com
  horários no passado.
- Restaurar mantém as contas demo, então a sessão de quem clicou continua valendo. Apaga os
  restaurantes delas, com pedidos e clientes, e recria tudo com horários relativos ao momento da
  restauração. Pedidos que o admin demo criou em restaurantes de contas reais ficam.

## Tempo real (fase 3)

- O navegador abre `GET /api/orders/stream` com `EventSource`, que manda o cookie de sessão sozinho.
- A API envia um evento por mudança de status (id do pedido, restaurante, novo status) só para conexões
  que enxergam aquele restaurante, mais um comentário de sinal de vida a cada 30 segundos.
- O front fecha a conexão quando a aba vai para segundo plano. Ao voltar, ou ao reconectar, recarrega a
  lista, então nenhum evento perdido deixa a tela errada.

## Fora da primeira versão

Ver a entrada "Fora do escopo da primeira versão" em `docs/DECISIONS.md`.

## Ordem de construção

Cada fase é uma branch com um PR para `main`, revisado com `/code-review` antes do merge commit.

**Fase 1, `feat/phase-1`: o obrigatório**

1. Documentos do projeto.
2. Esqueleto: backend com Postgres local, Flyway e Testcontainers; front com Tailwind, shadcn/ui e
   Vitest; lint, formatação e testes rodando nos dois.
3. Autenticação da fase 1, com as telas de login e cadastro.
4. Restaurantes, escopo de visibilidade, seletor e primeiro restaurante.
5. Pedidos: criar, listar com filtro e paginação já na API, buscar por id e mudar status com
   histórico; telas de lista e novo pedido.
6. Dados de demonstração, restauração e botões de conta demo.
7. Swagger e README com como rodar.

**Fase 2, `feat/phase-2`: polimento e deploy**

1. Detalhe do pedido com linha do tempo.
2. Filtro por status e paginação na lista.
3. Base de clientes e preenchimento pelo telefone.
4. Preenchimento do endereço pelo CEP.
5. Docker Compose do sistema inteiro.
6. GitHub Actions com build e testes.
7. Deploy: Render, Vercel e Neon, com o link no README.

**Fase 3, `feat/phase-3`: extras**

1. Refresh token com rotação, a segunda fase da autenticação.
2. Tempo real por SSE.
3. Kanban.
4. README final: prints, diagrama e "Como usei IA".
