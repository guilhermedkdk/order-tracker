package io.github.guilhermedkdk.ordertracker.shared;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// The Swagger UI at /swagger-ui.html. Sign in through POST /api/auth/login there and the browser keeps
// the session cookie for the other calls.
@Configuration(proxyBeanMethods = false)
class ApiDocsConfig {

    private static final String SESSION = "sessao";

    @Bean
    OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info().title("Rastreador de pedidos").version("v1").description("""
                                API do mini rastreador de pedidos de delivery. A sessão vive num cookie \
                                httpOnly aberto por `POST /api/auth/login`; quem altera dados também manda o \
                                token CSRF do cookie `XSRF-TOKEN` no header `X-XSRF-TOKEN`, o que esta página \
                                faz sozinha. Contas de demonstração: `admin@example.com` e \
                                `rafael@example.com`, senha `demo1234`."""))
                .components(new Components()
                        .addSecuritySchemes(
                                SESSION,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.APIKEY)
                                        .in(SecurityScheme.In.COOKIE)
                                        .name("ot_session")
                                        .description("Cookie de sessão gravado pelo login.")))
                .addSecurityItem(new SecurityRequirement().addList(SESSION));
    }
}
