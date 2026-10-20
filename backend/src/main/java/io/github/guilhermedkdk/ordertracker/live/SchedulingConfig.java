package io.github.guilhermedkdk.ordertracker.live;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

// Turns on @Scheduled, which the heartbeat of the order stream uses.
@Configuration(proxyBeanMethods = false)
@EnableScheduling
class SchedulingConfig {}
