package io.github.guilhermedkdk.ordertracker.shared;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.TypeMismatchException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

// Every error the API returns, including the ones raised by the security filters, comes out of
// here as Problem Details with Portuguese messages.
@RestControllerAdvice
class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    record FieldMessage(String field, String message) {}

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        List<FieldMessage> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldMessage(error.getField(), error.getDefaultMessage()))
                .toList();
        return ResponseEntity.badRequest().body(invalid(errors));
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        return ResponseEntity.badRequest()
                .body(problem(
                        HttpStatus.BAD_REQUEST, "Dados inválidos", "Não foi possível ler o corpo da requisição."));
    }

    @Override
    protected ResponseEntity<Object> handleNoResourceFoundException(
            NoResourceFoundException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(problem(HttpStatus.NOT_FOUND, "Não encontrado", "Rota não encontrada."));
    }

    @Override
    protected ResponseEntity<Object> handleTypeMismatch(
            TypeMismatchException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        return ResponseEntity.badRequest()
                .body(problem(
                        HttpStatus.BAD_REQUEST,
                        "Dados inválidos",
                        "Valor inválido para %s.".formatted(ex.getPropertyName())));
    }

    @ExceptionHandler(DomainValidationException.class)
    ProblemDetail domainValidation(DomainValidationException ex) {
        return invalid(List.of(new FieldMessage(ex.field(), ex.getMessage())));
    }

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail notFound(NotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Não encontrado", ex.getMessage());
    }

    @ExceptionHandler(ForbiddenException.class)
    ProblemDetail forbidden(ForbiddenException ex) {
        return problem(HttpStatus.FORBIDDEN, "Acesso negado", ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    ProblemDetail conflict(ConflictException ex) {
        return problem(HttpStatus.CONFLICT, "Conflito", ex.getMessage());
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ProblemDetail concurrentChange(OptimisticLockingFailureException ex) {
        return problem(
                HttpStatus.CONFLICT,
                "Conflito",
                "Outra pessoa alterou este pedido agora há pouco. Recarregue e tente de novo.");
    }

    @ExceptionHandler(AuthenticationException.class)
    ProblemDetail unauthenticated(AuthenticationException ex) {
        String detail = ex instanceof BadCredentialsException ? ex.getMessage() : "Faça login para continuar.";
        return problem(HttpStatus.UNAUTHORIZED, "Não autenticado", detail);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ProblemDetail accessDenied(AccessDeniedException ex) {
        String detail = ex instanceof CsrfException
                ? "Token CSRF ausente ou inválido. Recarregue a página e tente de novo."
                : "Você não tem permissão para esta ação.";
        return problem(HttpStatus.FORBIDDEN, "Acesso negado", detail);
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail unexpected(Exception ex) {
        log.error("Erro inesperado ao atender a requisição", ex);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Erro inesperado", "Algo deu errado. Tente de novo.");
    }

    private static ProblemDetail invalid(List<FieldMessage> errors) {
        ProblemDetail problem = problem(HttpStatus.BAD_REQUEST, "Dados inválidos", "Confira os campos destacados.");
        problem.setProperty("errors", errors);
        return problem;
    }

    private static ProblemDetail problem(HttpStatus status, String title, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        return problem;
    }
}
