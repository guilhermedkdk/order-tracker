package io.github.guilhermedkdk.ordertracker.demo;

import io.github.guilhermedkdk.ordertracker.auth.CurrentUser;
import io.github.guilhermedkdk.ordertracker.shared.ForbiddenException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Demonstração", description = "Dados de exemplo da demo pública.")
@RequestMapping("/api/demo")
@ConditionalOnBooleanProperty("app.demo.enabled")
class DemoController {

    private final DemoData demo;

    DemoController(DemoData demo) {
        this.demo = demo;
    }

    @Operation(summary = "Restaura os dados de demonstração")
    @ApiResponse(responseCode = "204", description = "Demonstração restaurada")
    @ApiResponse(responseCode = "403", description = "Só o admin restaura")
    @PostMapping("/restore")
    ResponseEntity<Void> restore(CurrentUser user) {
        if (!user.isAdmin()) {
            throw new ForbiddenException("Só o admin restaura a demonstração.");
        }
        demo.restore();
        return ResponseEntity.noContent().build();
    }
}
