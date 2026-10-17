# order-tracker

Mini rastreador de pedidos de delivery, feito para um desafio técnico de entrevista: API em Java 25 +
Spring Boot 4.1 em `backend/`, React + TypeScript em `frontend/`, Postgres. Restaurantes registram
pedidos e acompanham o status até a entrega.

## Limites que nenhuma mudança quebra

- As transições de status vivem só em `Order`, no backend. O front mostra as ações que vêm em
  `allowedNextStatuses` e não conhece a tabela de transições.
- O que um usuário enxerga sai sempre de `RestaurantScope`. Pedido ou restaurante fora do escopo
  responde 404. Nenhum outro código decide visibilidade pelo papel.
- Depois de criado, o pedido nunca lê a base de clientes; ele tem a própria cópia do cliente e do
  endereço.
- O front fala só com `/api` na própria origem, sempre por `src/lib/http.ts`. O cookie de sessão depende
  disso.
- Schema só muda por uma migration Flyway nova. Uma migration que já rodou nunca é editada.
- Restaurar demonstração é a única exclusão do sistema.

Os motivos estão em `docs/DECISIONS.md`.

## Pronto quer dizer

- Backend: `./mvnw verify` verde dentro de `backend/` (formatação e testes). Os testes sobem Postgres
  pelo Testcontainers, então o Docker precisa estar rodando.
- Frontend: `pnpm check` verde dentro de `frontend/` (tipos, lint e testes).
- Mudança de tela: conferir também no navegador, com a API e o `pnpm dev` rodando.

## Código

- Backend por funcionalidade em `io.github.guilhermedkdk.ordertracker.<pacote>`. Tudo nasce
  package-private; só vira público o que outro pacote usa.
- Frontend por funcionalidade em `src/features/<nome>/`. Cada uma tem um `api.ts` com os hooks do
  TanStack Query, e as páginas usam só esses hooks.
- Nomes de domínio seguem `docs/GLOSSARY.md`. Valores de enum expostos pela API ficam em português,
  como os status do enunciado. Interface, mensagens de erro e documentação em pt-BR.
- Spring Boot 4, Spring Security 7, Hibernate 7 e Jackson 3 mudaram APIs recentes. Consulte a
  documentação atual (context7) antes de escrever configuração ou usar uma API que você não viu neste
  repositório.

## Docs

- `docs/SPEC.md`: o que o sistema faz, os obrigatórios do enunciado e a ordem de construção por fase.
  Leia antes de mudar comportamento e marque o checklist quando o teste que prova um item passar.
- `docs/ARCHITECTURE.md`: onde cada parte roda, pacotes, seams e testes. Leia antes de criar ou mover
  código.
- `docs/GLOSSARY.md`: o vocabulário. Termo novo ou renomeado passa pela skill `domain-modeling`.
- `docs/DECISIONS.md`: armadilhas e escolhas não óbvias. Leia antes de "consertar" algo que parece
  estranho. Aprendizado novo entra no topo, com data.

## Git

Uma branch por fase (`feat/phase-1`, `feat/phase-2`, `feat/phase-3`), um commit por passo da fase e um
PR para `main` com merge commit, que preserva os commits no histórico. O histórico é parte da avaliação.

## Skills

Use as skills globais na fase em que elas se aplicam: `codebase-design` ao desenhar pacote ou
interface, `tdd` ao implementar regra, `diagnosing-bugs` quando algo quebrar e `code-review` no PR de
cada fase, antes do merge.
