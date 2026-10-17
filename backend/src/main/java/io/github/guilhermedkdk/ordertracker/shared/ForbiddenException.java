package io.github.guilhermedkdk.ordertracker.shared;

/** The user is signed in but their role cannot do this. Answers 403. */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
