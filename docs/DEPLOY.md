# Deploy

A demo pública roda em três serviços, todos no plano gratuito:

```
navegador → Vercel (front e rewrite de /api) → Render (API, imagem Docker) → Neon (Postgres)
```

O navegador só fala com o domínio da Vercel. A Vercel serve o front e repassa `/api/*` para o
Render, então o cookie de sessão é do mesmo site (ver `docs/DECISIONS.md`).

## 1. Banco no Neon

1. Crie um projeto com Postgres 17, na região AWS US East (N. Virginia), perto do Render.
2. Em **Connect**, desligue o connection pooling: o host não pode ter `-pooler`, porque o Flyway roda
   as migrations por essa mesma conexão.
3. Guarde o host, o banco, o usuário e a senha. A URL JDBC fica
   `jdbc:postgresql://<host>/<banco>?sslmode=require`.

## 2. API no Render

1. **New → Web Service**, a partir do repositório no GitHub.
2. **Language:** Docker. **Root Directory:** `backend`. **Region:** Virginia (US East).
   **Instance:** Free.
3. **Health Check Path:** `/actuator/health`.
4. Variáveis de ambiente:

| Variável | Valor |
| -------- | ----- |
| `SPRING_DATASOURCE_URL` | A URL JDBC do Neon |
| `SPRING_DATASOURCE_USERNAME` | O usuário do Neon |
| `SPRING_DATASOURCE_PASSWORD` | A senha do Neon |
| `APP_AUTH_JWT_SECRET` | Use o botão **Generate** do Render. Sem ela, todo mundo é deslogado quando a API reinicia. |
| `APP_AUTH_COOKIE_SECURE` | `true` |
| `SERVER_FORWARD_HEADERS_STRATEGY` | `framework` |
| `SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE` | `0` |
| `SPRING_DATASOURCE_HIKARI_IDLE_TIMEOUT` | `60000` |

As duas últimas fecham as conexões ociosas depois de um minuto, para o Neon conseguir suspender o
banco e não gastar as horas gratuitas à toa.

`PORT` e `SERVER_ADDRESS` não precisam ser definidas: o Render define a primeira, e a imagem Docker
define a segunda.

## 3. Front na Vercel

1. **Add New → Project**, a partir do mesmo repositório.
2. **Root Directory:** `frontend`. A Vercel reconhece o Vite e usa `pnpm build`, com saída em `dist`.
3. `frontend/vercel.json` repassa `/api/*` para o endereço do Render e manda as outras rotas para o
   `index.html`. Se o endereço do Render mudar, é só esse arquivo.

## Limites do plano gratuito

- O Render suspende a API depois de uns 15 minutos sem acesso. A primeira requisição depois disso
  acorda a API e leva perto de um minuto; a tela de login fica em "Carregando…" enquanto isso.
- O Neon suspende o banco depois de alguns minutos parado e acorda em menos de um segundo.
- Nenhum dos três cobra por excedente nesses planos: quando um limite estoura, o serviço é pausado.
