package io.github.guilhermedkdk.ordertracker.shared;

/** The request clashes with the current state, such as a taken e-mail. Answers 409. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
