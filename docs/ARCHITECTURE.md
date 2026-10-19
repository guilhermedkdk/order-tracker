# Arquitetura

Como o código se organiza e por quê. O comportamento está em `docs/SPEC.md` e o vocabulário em
`docs/GLOSSARY.md`.

## Onde cada parte roda

| Ambiente | Front | API | Banco |
| -------- | ----- | --- | ----- |
| Local | Vite em `:5173`, com proxy de `/api` para `:8080` | `./mvnw spring-boot:run` em `:8080` | Postgres que o Spring Boot sobe sozinho a partir de `backend/compose.yaml` |
| Docker Compose (fase 2) | nginx servindo o build e repassando `/api` | container da API | container do Postgres, todos em `docker-compose.yml` na raiz |
| Produção | Vercel, com rewrite de `/api/*` para o Render | Render, a partir do `backend/Dockerfile` | Neon |

Em todos os ambientes o navegador fala só com a origem do front, e `/api` chega à API pelo proxy. É isso
que deixa o cookie de sessão ser do mesmo site (ver `docs/DECISIONS.md`).

Existem dois arquivos de Compose com papéis diferentes. O Spring Boot lê o `backend/compose.yaml`, que
só tem o banco de desenvolvimento. O da raiz sobe o sistema inteiro, para quem não tem Java nem Node.

## Backend

Java 25, Spring Boot 4.1, Maven. Pacote base `io.github.guilhermedkdk.ordertracker`, organizado por
funcionalidade: cada pacote de primeiro nível é um módulo com controller, regras, persistência e testes
juntos.

**Público é só a interface.** Controllers, DTOs, mapeamentos e o que só o próprio pacote usa são
package-private. Uma classe só é pública quando outro pacote precisa dela, e o compilador barra o acesso
ao resto.

| Pacote | Interface (o que outros pacotes usam) | O que fica escondido |
| ------ | ------------------------------------- | -------------------- |
| `auth` | `CurrentUser`, recebido como parâmetro nos controllers; `UserDirectory`, para ler nomes de usuários; endpoints `/api/auth/*` | Usuários e senhas (BCrypt), emissão e leitura do JWT no cookie, CSRF, a configuração do Spring Security e, na fase 3, o refresh token com rotação. |
| `restaurant` | `RestaurantService.scopeOf(CurrentUser)`, que devolve um `RestaurantScope` (`All` ou `Only`); endpoints `/api/restaurants` | A regra de visibilidade: admin vê todos os restaurantes, dono vê os seus. É o único lugar do sistema que olha o papel para decidir o que alguém vê. Também a regra de que só donos criam restaurantes. |
| `order` | `Order` (`create`, `changeStatus`, `allowedNextStatuses`), `OrderService`; endpoints `/api/orders` | A máquina de status, o cálculo de subtotal e total, as regras de troco e de cancelamento, o histórico de status, filtros e paginação, e a forma do pedido na API (código, próximos status). |
| `customer` | `CustomerBook.remember`, chamado por `OrderService` a cada pedido gravado; endpoint `/api/customers` | A busca por restaurante e telefone, e o upsert atômico do nome e do último endereço. |
| `demo` | `POST /api/demo/restore`, só para o admin | As contas demo, o roteiro de restaurantes e pedidos com horários no passado, a carga na primeira subida e a restauração. |
| `live` (fase 3) | `GET /api/orders/stream` | As conexões SSE, o sinal de vida, a entrega só para quem enxerga o pedido. |
| `shared` | `ApiExceptionHandler`, as exceções de domínio comuns, o `Clock` | O formato Problem Details e a lista de erros por campo. |

Dependências: `restaurant` usa `auth`; `customer` usa `restaurant`; `order` usa `restaurant` e `customer`;
`live` usa `order` (eventos) e `restaurant`; `demo` usa todos. Todos podem usar `shared`. Nenhum ciclo.
Todo pedido entra por `OrderService`. A demo grava os seus, montados com horários no passado, por
`OrderService.save`, o mesmo caminho da criação, que também alimenta a base de clientes.

### O agregado `Order`

`Order` é uma entidade JPA que concentra quase todas as regras do domínio atrás de três métodos, sem
depender do Spring.
`Order.create(...)` recebe os dados, o autor e o instante, calcula os totais, valida o troco e registra a
primeira mudança de status. `order.changeStatus(alvo, cancelamento, autor, instante)` valida a transição,
exige o motivo quando o alvo é `CANCELADO` e registra a mudança. `allowedNextStatuses()` responde as
transições possíveis. O instante sempre chega como parâmetro, e é por isso que os testes de domínio e os
dados de demonstração conseguem montar qualquer histórico.

Itens, mudanças de status, cliente e endereço de entrega vivem dentro do agregado (`@OneToMany` com
cascata e `@Embeddable`). Nenhum outro código altera essas partes diretamente.

### Fluxo de "mudar status"

1. O front envia `PATCH /api/orders/{id}/status` com o cookie de sessão e o header CSRF.
2. O Spring Security valida o JWT do cookie, e o controller recebe o `CurrentUser`.
3. `OrderService` pede o `RestaurantScope` do usuário e carrega o pedido só se ele for visível. Se não
   for, responde 404.
4. `order.changeStatus(...)` aplica a regra. Uma transição inválida vira 409.
5. A resposta é o pedido atualizado, com os próximos status. Na fase 3, depois do commit, um evento
   `OrderStatusChanged` chega ao `live`, que avisa as conexões abertas que enxergam aquele restaurante.

### Fluxo de "criar pedido"

1. `POST /api/orders` com restaurante, cliente, endereço, itens, taxa, pagamento e observações.
2. A Bean Validation confere o formato do corpo (campos obrigatórios, telefone, CEP, UF).
3. `OrderService` confere se o restaurante está no escopo do usuário; se não estiver, 404.
4. `Order.create(...)` aplica as regras de domínio e devolve o pedido pronto.
5. Na mesma transação, `CustomerBook.remember(...)` cria ou atualiza o cliente daquele restaurante.
6. 201 com o pedido e o header `Location`.

### Erros

Todo erro sai em Problem Details (RFC 9457), com mensagens em português. Erro de formato (Bean
Validation) e erro de regra de domínio (troco menor que o total, `OUTRO` sem detalhe) saem com o mesmo
status 400 e a mesma lista `errors: [{ field, message }]`, para o front marcar o campo certo no
formulário sem saber de onde veio o erro. Pedido ou restaurante fora do escopo é 404, transição inválida
é 409, sem sessão é 401.

### Banco

Postgres, com o schema versionado por Flyway em `backend/src/main/resources/db/migration`. O Hibernate
só valida o schema (`ddl-auto=validate`) e nunca o altera. Ids são UUID v7, valores em `numeric(10,2)`,
instantes em `timestamptz`.

## Frontend

Vite, React e TypeScript. Organizado por funcionalidade em `frontend/src/features/<nome>/`, com o que é
de todos em `src/lib/` e `src/components/ui/` (componentes do shadcn/ui).

| Pasta | O que fica lá |
| ----- | ------------- |
| `app/` | Rotas, providers (TanStack Query), o layout com o seletor de restaurante e o guarda de rota autenticada. |
| `lib/http.ts` | O único módulo que chama `fetch` na API. Fala com `/api` na própria origem, manda o header CSRF nas requisições que alteram dados e transforma Problem Details em `ApiError` com os erros por campo. |
| `lib/format.ts` | Dinheiro em reais, datas no fuso de São Paulo, tempo desde o recebimento, código do pedido, máscaras de telefone e CEP. |
| `components/` | O que várias telas usam além do shadcn/ui: a logo, o `ControlledSelect` (o Select ligado a um campo do react-hook-form) e a tela de carregamento. |
| `features/auth/` | Login, cadastro, botões de conta demo, `useMe` e logout. |
| `features/restaurants/` | Seletor de restaurante, criação do primeiro restaurante e o restaurante selecionado, que vive na URL (`?restaurante=`). |
| `features/orders/` | Lista com filtro e paginação, detalhe com linha do tempo, formulário de novo pedido, kanban com arrastar entre colunas, ações de status e os rótulos em português dos enums. |
| `features/customers/` | A busca do cliente pelo telefone, usada pelo formulário de pedido. |
| `features/demo/` | O botão de restaurar demonstração. |

Cada funcionalidade tem um `api.ts` com as chamadas e os hooks do TanStack Query. As páginas usam esses
hooks, nunca o `lib/http.ts` direto.

O front não conhece regra de domínio. As ações de status vêm de `allowedNextStatuses`. O formulário de
pedido calcula o total só como prévia enquanto a pessoa digita; o valor que vale é o que a API devolve.
O ViaCEP (fase 2) é a única chamada externa, feita direto do navegador por `lib/viacep.ts`.

## Seams

- **`RestaurantScope`**, entre a regra de papel e todo o resto. Pedidos, clientes e o SSE recebem um
  escopo e perguntam se um restaurante está nele; nenhum deles sabe o que é admin ou dono.
- **`Clock`**, injetado nos serviços. Em produção é o relógio do sistema em UTC; o domínio recebe o
  instante como parâmetro e não precisa dele.
- **Rede no front.** Nos testes, o MSW (Mock Service Worker) intercepta as chamadas a `/api` e ao ViaCEP.
  O código de produção não tem porta nem adaptador para isso.
- **Eventos de pedido** (fase 3), entre `order` e `live`, pelos eventos de aplicação do Spring, disparados
  depois do commit. Um pedido que não foi gravado nunca chega a uma tela.

## Testes

- **Domínio** (`Order`): JUnit e AssertJ, sem Spring. Cobrem cada transição, os totais, o troco e o
  cancelamento. `RestaurantScope` não tem teste próprio: cabe em duas linhas e é exercitado pelos
  testes HTTP de restaurantes e pedidos.
- **Contas nos testes**: `TestAccounts` entrega sessões de dono (pelo cadastro) e de admin (inserido
  direto no banco, porque nenhuma rota cria admin).
- **HTTP**: `@SpringBootTest` com MockMvc e um Postgres de verdade via Testcontainers, compartilhado entre
  as classes de teste. Cada funcionalidade é testada pelos seus endpoints, com cookie e CSRF reais,
  incluindo 400, 401, 404 e 409.
- **Dados de demonstração**: um teste sobe a aplicação com o banco vazio e confere que as contas demo
  entram e que existem pedidos em todos os status.
- **Front**: Vitest, Testing Library e MSW para páginas e formulários; testes unitários para
  `lib/format.ts`.
