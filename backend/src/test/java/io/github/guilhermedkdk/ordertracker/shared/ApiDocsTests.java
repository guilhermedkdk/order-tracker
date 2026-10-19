package io.github.guilhermedkdk.ordertracker.shared;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.guilhermedkdk.ordertracker.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@IntegrationTest
class ApiDocsTests {

    @Autowired
    MockMvcTester mvc;

    @Test
    void apiDocumentationIsOpenWithoutASession() {
        var docs = mvc.get().uri("/v3/api-docs").exchange();

        assertThat(docs).hasStatus(HttpStatus.OK);
        assertThat(docs).bodyJson().extractingPath("$.info.title").isEqualTo("Rastreador de pedidos");
        assertThat(docs)
                .bodyJson()
                .extractingPath("$.paths['/api/orders/{id}/status'].patch")
                .isNotNull();
        assertThat(mvc.get().uri("/swagger-ui/index.html").exchange()).hasStatus(HttpStatus.OK);
    }

    @Test
    void routesAreGroupedAndDocumentTheirRealStatusCodes() {
        var docs = mvc.get().uri("/v3/api-docs").exchange();

        assertThat(docs)
                .bodyJson()
                .extractingPath("$.paths['/api/orders'].post.tags[0]")
                .isEqualTo("Pedidos");
        assertThat(docs)
                .bodyJson()
                .extractingPath("$.paths['/api/orders'].post.responses")
                .asMap()
                .containsKeys("201", "400", "404")
                .doesNotContainKey("200");
        assertThat(docs)
                .bodyJson()
                .extractingPath("$.paths['/api/orders/{id}/status'].patch.responses")
                .asMap()
                .containsKeys("200", "400", "404", "409");
    }

    // Behind the Vercel rewrite the API sees its own host; an absolute address would send "Try it out"
    // to another site, without the session cookie.
    @Test
    void theServerIsTheOriginTheDocumentationIsOpenedFrom() {
        var docs = mvc.get()
                .uri("/v3/api-docs")
                .header("Host", "order-tracker.onrender.com")
                .exchange();

        assertThat(docs).bodyJson().extractingPath("$.servers[*].url").asArray().containsExactly("/");
    }

    @Test
    void theSignedInUserIsNotDocumentedAsARequestParameter() {
        var docs = mvc.get().uri("/v3/api-docs").exchange();

        assertThat(docs).bodyJson().doesNotHavePath("$.paths['/api/auth/me'].get.parameters");
        assertThat(docs)
                .bodyJson()
                .extractingPath("$.paths['/api/orders'].get.parameters[*].name")
                .asArray()
                .containsExactlyInAnyOrder("restaurantId", "status", "page", "size");
    }
}
