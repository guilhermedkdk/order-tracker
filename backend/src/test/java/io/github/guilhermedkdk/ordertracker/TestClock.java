package io.github.guilhermedkdk.ordertracker;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.springframework.context.annotation.Primary;

/**
 * The application's clock in HTTP tests: real time, unless a test moves it forward. Every test shares
 * one context, so a test that calls {@link #advance} calls {@link #reset} after it.
 */
@Primary
public class TestClock extends Clock {

    private volatile Duration offset = Duration.ZERO;

    public void advance(Duration amount) {
        offset = offset.plus(amount);
    }

    public void reset() {
        offset = Duration.ZERO;
    }

    @Override
    public Instant instant() {
        return Clock.systemUTC().instant().plus(offset);
    }

    @Override
    public ZoneId getZone() {
        return ZoneOffset.UTC;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        throw new UnsupportedOperationException("The application always runs in UTC.");
    }
}
