package io.github.guilhermedkdk.ordertracker.shared;

/** A business rule rejected one field. Answers 400 in the same shape as a Bean Validation error. */
public class DomainValidationException extends RuntimeException {

    private final String field;

    public DomainValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String field() {
        return field;
    }
}
