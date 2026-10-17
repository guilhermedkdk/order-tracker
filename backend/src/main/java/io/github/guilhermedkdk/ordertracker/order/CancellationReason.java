package io.github.guilhermedkdk.ordertracker.order;

public enum CancellationReason {
    CLIENTE_DESISTIU,
    CLIENTE_NAO_ENCONTRADO,
    ITEM_INDISPONIVEL,
    FORA_DA_AREA_DE_ENTREGA,
    PROBLEMA_NO_PAGAMENTO,
    OUTRO
}
