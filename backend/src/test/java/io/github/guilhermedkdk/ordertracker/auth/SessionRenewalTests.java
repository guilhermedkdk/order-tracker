package io.github.guilhermedkdk.ordertracker.auth;

import static io.github.guilhermedkdk.ordertracker.ApiSession.uniqueEmail;
import static org.assertj.core.api.Assertions.assertThat;

import io.github.guilhermedkdk.ordertracker.ApiSession;
import io.github.guilhermedkdk.ordertracker.IntegrationTest;
import io.github.guilhermedkdk.ordertracker.TestClock;
import java.time.Duration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockCookie;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@IntegrationTest
class SessionRenewalTests {

    @Autowired
    MockMvcTester mvc;

    @Autowired
    TestClock clock;

    @AfterEach
    void backToRealTime() {
        clock.reset();
    }

    @Test
    void signingInHandsAShortAccessTokenAndARefreshTokenOnlyAuthRoutesSee() {
        var signup = new ApiSession(mvc).signup("Ana Souza", uniqueEmail(), "segredo123");

        MockCookie access = (MockCookie) signup.getResponse().getCookie("ot_session");
        MockCookie refresh = (MockCookie) signup.getResponse().getCookie("ot_refresh");
        assertThat(access.getMaxAge()).isEqualTo(Duration.ofMinutes(15).toSeconds());
        assertThat(refresh).isNotNull();
        assertThat(refresh.isHttpOnly()).isTrue();
        assertThat(refresh.getSameSite()).isEqualTo("Strict");
        assertThat(refresh.getPath()).isEqualTo("/api/auth");
        assertThat(refresh.getMaxAge()).isEqualTo(Duration.ofDays(7).toSeconds());
    }

    @Test
    void anExpiredAccessTokenIsRenewedWithANewRefreshToken() {
        var browser = new ApiSession(mvc);
        browser.signup("Ana Souza", uniqueEmail(), "segredo123");
        String firstRefresh = browser.cookie("ot_refresh");

        clock.advance(Duration.ofMinutes(16));
        assertThat(browser.get("/api/auth/me")).hasStatus(HttpStatus.UNAUTHORIZED);

        assertThat(browser.post("/api/auth/refresh")).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(browser.get("/api/auth/me")).hasStatus(HttpStatus.OK);
        assertThat(browser.cookie("ot_refresh")).isNotBlank().isNotEqualTo(firstRefresh);
    }

    @Test
    void aTabRenewingWithTheTokenJustReplacedKeepsItsSession() {
        var browser = new ApiSession(mvc);
        browser.signup("Ana Souza", uniqueEmail(), "segredo123");
        String replaced = browser.cookie("ot_refresh");
        clock.advance(Duration.ofMinutes(16));
        browser.post("/api/auth/refresh");

        // The other tab sent its renewal with the old cookie before the first answer arrived.
        var otherTab = new ApiSession(mvc);
        otherTab.setCookie("ot_refresh", replaced);
        clock.advance(Duration.ofSeconds(5));
        var renewal = otherTab.post("/api/auth/refresh");

        assertThat(renewal).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(renewal.getResponse().getCookie("ot_refresh")).isNull();
        assertThat(otherTab.get("/api/auth/me")).hasStatus(HttpStatus.OK);
    }

    @Test
    void aReplacedTokenUsedLaterEndsTheWholeSession() {
        var browser = new ApiSession(mvc);
        browser.signup("Ana Souza", uniqueEmail(), "segredo123");
        String copied = browser.cookie("ot_refresh");
        clock.advance(Duration.ofMinutes(16));
        browser.post("/api/auth/refresh");

        // Whoever copied the old token tries it well after it was replaced.
        clock.advance(Duration.ofMinutes(1));
        var intruder = new ApiSession(mvc);
        intruder.setCookie("ot_refresh", copied);
        assertThat(intruder.post("/api/auth/refresh")).hasStatus(HttpStatus.UNAUTHORIZED);

        clock.advance(Duration.ofMinutes(16));
        assertThat(browser.post("/api/auth/refresh")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void signingOutRevokesTheRefreshToken() {
        var browser = new ApiSession(mvc);
        browser.signup("Ana Souza", uniqueEmail(), "segredo123");
        String refresh = browser.cookie("ot_refresh");

        var logout = browser.post("/api/auth/logout");

        assertThat(logout.getResponse().getCookie("ot_refresh").getMaxAge()).isZero();
        var sameCookieLater = new ApiSession(mvc);
        sameCookieLater.setCookie("ot_refresh", refresh);
        assertThat(sameCookieLater.post("/api/auth/refresh")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void aSessionUnusedForSevenDaysEnds() {
        var browser = new ApiSession(mvc);
        browser.signup("Ana Souza", uniqueEmail(), "segredo123");

        clock.advance(Duration.ofDays(7).plusMinutes(1));

        assertThat(browser.post("/api/auth/refresh")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void renewingWithoutARefreshTokenAsksToSignIn() {
        var renewal = new ApiSession(mvc).post("/api/auth/refresh");

        assertThat(renewal).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(renewal).bodyJson().extractingPath("$.detail").isEqualTo("Faça login para continuar.");
    }
}
