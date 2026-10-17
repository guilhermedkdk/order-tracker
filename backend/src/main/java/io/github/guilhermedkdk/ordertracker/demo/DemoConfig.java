package io.github.guilhermedkdk.ordertracker.demo;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// app.demo.enabled turns the demo data on: on locally and in the public demo, off for a real restaurant.
@Configuration(proxyBeanMethods = false)
@ConditionalOnBooleanProperty("app.demo.enabled")
class DemoConfig {

    @Bean
    ApplicationRunner seedDemoData(DemoData demo) {
        return arguments -> demo.seed();
    }
}
