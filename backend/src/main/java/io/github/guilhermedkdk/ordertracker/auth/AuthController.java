package io.github.guilhermedkdk.ordertracker.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Autenticação", description = "Cadastro, login e sessão em cookie httpOnly.")
@RequestMapping("/api/auth")
class AuthController {

    private final AuthService auth;
    private final Sessions sessions;

    AuthController(AuthService auth, Sessions sessions) {
        this.auth = auth;
        this.sessions = sessions;
    }

    @Operation(summary = "Cadastra um dono e abre a sessão")
    @ApiResponse(responseCode = "201", description = "Conta criada e sessão aberta")
    @ApiResponse(responseCode = "400", description = "Dados inválidos")
    @ApiResponse(responseCode = "409", description = "E-mail já cadastrado")
    @PostMapping("/signup")
    ResponseEntity<UserResponse> signup(@Valid @RequestBody SignupRequest request) {
        User user = auth.signup(request.name(), request.email(), request.password());
        return ResponseEntity.created(URI.create("/api/auth/me"))
                .header(
                        HttpHeaders.SET_COOKIE,
                        sessions.open(user.toCurrentUser()).toString())
                .body(UserResponse.of(user));
    }

    @Operation(summary = "Abre a sessão")
    @ApiResponse(responseCode = "200", description = "Sessão aberta")
    @ApiResponse(responseCode = "401", description = "E-mail ou senha inválidos")
    @PostMapping("/login")
    ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = auth.login(request.email(), request.password());
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        sessions.open(user.toCurrentUser()).toString())
                .body(UserResponse.of(user));
    }

    @Operation(summary = "Fecha a sessão")
    @ApiResponse(responseCode = "204", description = "Sessão fechada")
    @PostMapping("/logout")
    ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, sessions.close().toString())
                .build();
    }

    @Operation(summary = "Usuário da sessão")
    @ApiResponse(responseCode = "200", description = "O usuário logado")
    @ApiResponse(responseCode = "401", description = "Sem sessão")
    @GetMapping("/me")
    UserResponse me(CurrentUser current) {
        return auth.find(current.id())
                .map(UserResponse::of)
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("Usuário da sessão não existe."));
    }

    record SignupRequest(
            @NotBlank(message = "Informe o nome.")
            @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.")
            String name,

            @NotBlank(message = "Informe o e-mail.")
            @Email(message = "Informe um e-mail válido.")
            @Size(max = 254, message = "O e-mail deve ter no máximo 254 caracteres.")
            String email,

            @NotNull(message = "Informe a senha.")
            @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.")
            String password) {

        SignupRequest {
            name = name == null ? null : name.strip();
            email = normalizeEmail(email);
        }
    }

    record LoginRequest(
            @NotBlank(message = "Informe o e-mail.") String email,
            @NotEmpty(message = "Informe a senha.") String password) {

        LoginRequest {
            email = normalizeEmail(email);
        }
    }

    record UserResponse(UUID id, String name, String email, Role role, boolean demo) {

        static UserResponse of(User user) {
            CurrentUser current = user.toCurrentUser();
            return new UserResponse(current.id(), current.name(), current.email(), current.role(), user.isDemo());
        }
    }

    // E-mails are stored trimmed and lowercased, so "Ana@Example.com " and "ana@example.com" are one account.
    private static String normalizeEmail(String email) {
        return email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
}
