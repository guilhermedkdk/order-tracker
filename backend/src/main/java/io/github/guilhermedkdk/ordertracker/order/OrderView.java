package io.github.guilhermedkdk.ordertracker.order;

/** An order as one user sees it, with the name of its restaurant. */
public record OrderView(Order order, String restaurantName) {}
