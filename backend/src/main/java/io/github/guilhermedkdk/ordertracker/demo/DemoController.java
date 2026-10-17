package io.github.guilhermedkdk.ordertracker.demo;

import io.github.guilhermedkdk.ordertracker.auth.CurrentUser;
import io.github.guilhermedkdk.ordertracker.shared.ForbiddenException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo")
@ConditionalOnBooleanProperty("app.demo.enabled")
class DemoController {

    private final DemoData demo;

    DemoController(DemoData demo) {
        this.demo = demo;
    }

    @PostMapping("/restore")
    ResponseEntity<Void> restore(CurrentUser user) {
        if (!user.isAdmin()) {
            throw new ForbiddenException("Só o admin restaura a demonstração.");
        }
        demo.restore();
        return ResponseEntity.noContent().build();
    }
}
