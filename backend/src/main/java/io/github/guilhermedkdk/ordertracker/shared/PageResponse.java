package io.github.guilhermedkdk.ordertracker.shared;

import java.util.List;
import org.springframework.data.domain.Page;

/** One page of a list, with what the client needs to page through the rest. Pages start at 0. */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
                page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
