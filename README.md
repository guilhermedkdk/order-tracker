# Rastreador de pedidos

[![CI](https://github.com/guilhermedkdk/order-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/guilhermedkdk/order-tracker/actions/workflows/ci.yml)

Mini rastreador de pedidos de delivery, feito para um desafio técnico. Restaurantes registram pedidos
e acompanham cada um do recebimento à entrega. API em Java 25 com Spring Boot 4.1, front em React com
TypeScript e banco Postgres.

## O que tem

- **Cadastro, login e sessão.** O JWT fica num cookie httpOnly que o JavaScript da página não lê, com
  proteção CSRF. Toda rota fora do cadastro, do login e da documentação exige sessão.
- **Restaurantes e papéis.** Quem se cadastra é dono e vê só os próprios restaurantes. O admin vê
  todos. Um seletor no topo troca o restaurante, e a escolha fica na URL.
- **Pedidos.** Cliente, endereço de entrega, itens, taxa, forma de pagamento com troco e observações.
  A API calcula o total e valida cada campo, com mensagens em português apontando o campo certo.
- **Status com regras.** `RECEBIDO → EM_PREPARO → SAIU_PARA_ENTREGA → ENTREGUE`, um passo por vez, e
  `CANCELADO` a partir de qualquer status em andamento, sempre com motivo. Transição inválida responde
  409. Cada mudança entra no histórico com autor e horário.
- **Lista e busca.** Pedidos do mais novo para o mais antigo, com filtro por restaurante e status,
  paginação e busca por id. Pedido de outro restaurante responde 404, como se não existisse.
- **Demonstração.** Contas prontas com três restaurantes e 15 pedidos em todos os status, login de um
  clique e um botão para o admin restaurar os dados de exemplo.
- **Documentação da API** no Swagger, em português, com login e CSRF funcionando pela própria página.

## Como rodar

Precisa de Java 25 ([Temurin](https://adoptium.net)), Node 24 com pnpm 10 e o Docker aberto. Não
precisa instalar Maven nem Postgres: o Maven Wrapper vem no repositório, e o Spring Boot sobe o
Postgres sozinho pelo Docker Compose.

API, de dentro de `backend/` (no PowerShell, `.\mvnw spring-boot:run`):

```bash
./mvnw spring-boot:run
```

Ela responde em http://127.0.0.1:8080, e o Swagger fica em http://127.0.0.1:8080/swagger-ui.html.

Front, de dentro de `frontend/`:

```bash
pnpm install
```

```bash
pnpm dev
```

Abra http://localhost:5173. O Vite repassa `/api` para a API, então o navegador fala com uma origem
só.

### Só com Docker

Sem Java nem Node instalados, da raiz do repositório:

```bash
docker compose up --build
```

O app fica em http://localhost:8081 e o Swagger em http://localhost:8081/swagger-ui.html. O nginx
serve o front e repassa `/api` para a API, como a Vercel faz em produção. A primeira subida demora
alguns minutos, porque compila a API e o front dentro dos containers.

### Contas de demonstração

Todas com a senha `demo1234`. A tela de login também tem os botões "Entrar como dono" e "Entrar como
admin".

| Conta | Papel | Restaurantes |
| ----- | ----- | ------------ |
| `admin@example.com` | Admin | Vê todos e pode restaurar a demonstração |
| `rafael@example.com` | Dono | Cantina Bella Napoli e Burger da Vila |
| `juliana@example.com` | Dona | Sushi Kenzo |

## Testes

Backend, de dentro de `backend/`: formatação (Spotless) e testes. Os testes HTTP rodam contra um
Postgres de verdade, que o Testcontainers sobe no Docker.

```bash
./mvnw verify
```

Front, de dentro de `frontend/`: tipos, lint (oxlint), formatação (Prettier) e testes (Vitest com
Testing Library e MSW).

```bash
pnpm check
```

## Como está organizado

```
backend/    API Spring Boot, organizada por funcionalidade
  auth/          cadastro, login, JWT no cookie, CSRF e o usuário da requisição
  restaurant/    restaurantes e a regra de quem enxerga o quê (RestaurantScope)
  order/         o agregado Order, com totais, status e histórico, e a API de pedidos
  demo/          contas e pedidos de demonstração
  shared/        formato dos erros (Problem Details), paginação e documentação
frontend/   React + Vite, organizado por funcionalidade em src/features/
docs/       especificação, arquitetura, glossário e decisões
```

Os documentos em `docs/` contam o porquê de cada parte:

- [SPEC.md](docs/SPEC.md): o que o sistema faz, com o checklist dos requisitos do desafio e o teste
  que prova cada um.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): onde cada parte roda, os pacotes e como são testados.
- [GLOSSARY.md](docs/GLOSSARY.md): o vocabulário do domínio.
- [DECISIONS.md](docs/DECISIONS.md): as escolhas que não são óbvias e as armadilhas encontradas.

## Decisões que valem destacar

- **Postgres, não SQLite.** O desafio aceita "SQLite ou similar". Com Postgres em todo lugar, o que os
  testes conferem é exatamente o que roda em produção.
- **Regras de status só no backend.** Cada pedido vem com `allowedNextStatuses`, e o front mostra só
  essas ações. A tabela de transições existe num lugar só.
- **Pedido guarda a própria cópia do cliente e do endereço**, para o histórico não mudar quando um
  cadastro muda.
- **Um único lugar decide visibilidade.** `RestaurantScope` responde quais restaurantes cada usuário
  enxerga, e todo o resto pergunta a ele.
- **Dados de demonstração passam pelo domínio.** Os pedidos de exemplo são criados pelas mesmas regras
  de um pedido de verdade, então não ficam inconsistentes quando uma regra muda.

## Próximos passos

O desenvolvimento segue em três fases, cada uma num PR (ordem completa no [SPEC](docs/SPEC.md)):

1. **Fase 1, o obrigatório:** esta versão.
2. **Fase 2:** detalhe do pedido com linha do tempo, filtro e paginação na tela, base de clientes com
   preenchimento pelo telefone, endereço pelo CEP, Docker Compose completo, CI, repaginação visual,
   kanban e deploy.
3. **Fase 3:** atualização em tempo real por SSE e refresh token com rotação.
