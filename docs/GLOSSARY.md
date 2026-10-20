# Glossário

Rastreador de pedidos de delivery: restaurantes registram pedidos e acompanham cada um do recebimento
à entrega. Os termos estão em português, como aparecem na interface; o nome entre crases é o usado
no código.

## Pessoas e acesso

**Usuário** (`User`):
Quem faz login no sistema. Todo usuário tem exatamente um papel.
_Evite_: conta, operador

**Papel** (`Role`):
O que um usuário pode ver e fazer: `ADMIN` ou `DONO`.
_Evite_: perfil, permissão, tipo de usuário

**Admin** (`ADMIN`):
Usuário de suporte que vê e altera todos os restaurantes e pedidos. Ninguém vira admin pelo cadastro.
_Evite_: administrador, superusuário

**Dono** (`DONO`):
Usuário criado pelo cadastro público, dono de um ou mais restaurantes. Vê e altera só os pedidos dos
seus restaurantes.
_Evite_: proprietário, lojista, gerente, owner

**Sessão** (`Sessions`):
O tempo em que um usuário fica dentro do sistema depois de entrar. Dura enquanto ele usar o sistema
ao menos uma vez a cada sete dias, e termina quando ele sai.
_Evite_: login (para o período; login é o ato de entrar), conexão

**Pedido visível**:
Para um dono, um pedido de um dos seus restaurantes; para o admin, qualquer pedido. Um pedido que não
é visível não existe para aquele usuário.

**Cliente** (`Customer`):
A pessoa que recebe o pedido, identificada pelo telefone dentro de um restaurante. Nunca faz login.
_Evite_: consumidor, comprador, usuário

**Base de clientes**:
Os clientes de um restaurante, cada um com nome e último endereço, usados para preencher um novo
pedido a partir do telefone. Cada restaurante tem a sua, mesmo dois restaurantes do mesmo dono.

## Restaurantes

**Restaurante** (`Restaurant`):
Estabelecimento que recebe pedidos. Tem um nome e exatamente um dono.
_Evite_: loja, estabelecimento, empresa, tenant

**Restaurante selecionado**:
O restaurante cujos pedidos a interface está mostrando. O admin também pode selecionar "Todos".

## Pedidos

**Pedido** (`Order`):
Uma entrega encomendada a um restaurante: cliente, endereço de entrega, itens, pagamento e status.
Depois de criado, só o status muda.
_Evite_: encomenda, compra, venda, ordem

**Código do pedido**:
Os últimos 8 caracteres do identificador do pedido, em maiúsculas, usados para exibir e citar o
pedido ("Pedido #A1B2C3D4"). Não identifica o pedido sozinho.

**Item** (`OrderItem`):
Uma linha do pedido: nome digitado livremente, quantidade e preço unitário. Não há cardápio.
_Evite_: produto

**Endereço de entrega** (`DeliveryAddress`):
Para onde o pedido vai: CEP, rua, número, complemento, bairro, cidade e UF, como estavam no momento
da criação do pedido.
_Evite_: endereço do cliente

**Último endereço**:
O endereço de entrega do pedido mais recente de um cliente, guardado na base de clientes para
preencher o próximo pedido.

**Subtotal**:
A soma de quantidade × preço unitário de todos os itens.

**Taxa de entrega** (`deliveryFee`):
O valor cobrado pela entrega, informado em cada pedido.
_Evite_: frete

**Total**:
Subtotal mais taxa de entrega, sempre calculado pelo sistema.

**Forma de pagamento** (`PaymentMethod`):
Como o cliente paga: `PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO` ou `DINHEIRO`.

**Troco para** (`changeFor`):
Com `DINHEIRO`, o valor que o cliente vai entregar, para o entregador levar o troco. Nunca é menor que
o total.

**Observações** (`notes`):
Texto livre do pedido, para o restaurante ou o entregador.

## Status e rastreamento

**Status** (`OrderStatus`):
A etapa em que o pedido está: `RECEBIDO`, `EM_PREPARO`, `SAIU_PARA_ENTREGA`, `ENTREGUE` ou
`CANCELADO`.
_Evite_: situação, estado, fase

**Status final**:
`ENTREGUE` ou `CANCELADO`. Um pedido em status final não muda mais.
_Evite_: concluído, fechado

**Pedido em andamento**:
Pedido que ainda não chegou a um status final.
_Evite_: pedido aberto, pedido ativo

**Transição**:
A passagem de um pedido de um status para outro. Fora o cancelamento, a única transição é para a
etapa seguinte.

**Próximos status** (`allowedNextStatuses`):
As transições que um pedido aceita agora. Vazio num status final.

**Cancelamento**:
A transição de um pedido em andamento para `CANCELADO`. Sempre tem um motivo do cancelamento.

**Motivo do cancelamento** (`CancellationReason`):
Por que o pedido foi cancelado: `CLIENTE_DESISTIU`, `CLIENTE_NAO_ENCONTRADO`, `ITEM_INDISPONIVEL`,
`FORA_DA_AREA_DE_ENTREGA`, `PROBLEMA_NO_PAGAMENTO` ou `OUTRO`. Aceita um detalhe em texto,
obrigatório com `OUTRO`.

**Mudança de status** (`StatusChange`):
O registro de uma transição: o novo status, quando aconteceu, quem fez e, num cancelamento, o motivo.
A criação do pedido é a primeira mudança, para `RECEBIDO`.
_Evite_: evento, log

**Histórico de status**:
As mudanças de status de um pedido em ordem cronológica, mostradas como linha do tempo no detalhe do
pedido.
_Evite_: log, auditoria, rastreio

## Demonstração

**Conta demo**:
Usuário criado pelos dados de demonstração, com credenciais públicas no README.

**Dados de demonstração**:
As contas demo e tudo o que pertence a elas: restaurantes, pedidos e clientes.
_Evite_: seed (no texto voltado ao usuário)

**Restaurar demonstração**:
Ação do admin que apaga e recria os dados de demonstração, sem tocar nas contas criadas pelo
cadastro.
