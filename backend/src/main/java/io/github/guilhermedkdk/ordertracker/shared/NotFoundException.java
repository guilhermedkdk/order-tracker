package io.github.guilhermedkdk.ordertracker.shared;

/** The resource does not exist for this user, whether or not it exists at all. Answers 404. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
