package io.github.guilhermedkdk.ordertracker.auth;

import static io.github.guilhermedkdk.ordertracker.ApiSession.uniqueEmail;
import static org.assertj.core.api.Assertions.assertThat;

import io.github.guilhermedkdk.ordertracker.ApiSession;
import io.github.guilhermedkdk.ordertracker.IntegrationTest;
import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockCookie;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@IntegrationTest
class AuthApiTests {

    @Autowired
    MockMvcTester mvc;

    @Test
    void signupOpensSessionForNewOwner() {
        var browser = new ApiSession(mvc);
        String email = uniqueEmail();

        assertThat(browser.signup("Ana Souza", email, "segredo123"))
                .hasStatus(HttpStatus.CREATED)
                .bodyJson()
                .extractingPath("$.role")
                .isEqualTo("DONO");

        var me = browser.get("/api/auth/me");
        assertThat(me).hasStatus(HttpStatus.OK);
        assertThat(me).bodyJson().extractingPath("$.name").isEqualTo("Ana Souza");
        assertThat(me).bodyJson().extractingPath("$.email").isEqualTo(email);
        assertThat(me).bodyJson().extractingPath("$.demo").isEqualTo(false);
    }

    @Test
    void routesOutsideSignInNeedASession() {
        var me = new ApiSession(mvc).get("/api/auth/me");

        assertThat(me).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(me).bodyJson().extractingPath("$.detail").isEqualTo("Faça login para continuar.");
    }

    @Test
    void sessionCookieIsHiddenFromScriptsAndStaysOnTheSite() {
        var signup = new ApiSession(mvc).signup("Ana Souza", uniqueEmail(), "segredo123");

        MockCookie cookie = (MockCookie) signup.getResponse().getCookie("ot_session");
        assertThat(cookie).isNotNull();
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.getSameSite()).isEqualTo("Lax");
        assertThat(cookie.getPath()).isEqualTo("/");
    }

    @Test
    void loginWithTheRightPasswordOpensSession() {
        String email = uniqueEmail();
        new ApiSession(mvc).signup("Ana Souza", email, "segredo123");
        var otherBrowser = new ApiSession(mvc);

        assertThat(otherBrowser.post("/api/auth/login", credentials(email, "segredo123")))
                .hasStatus(HttpStatus.OK);
        assertThat(otherBrowser.get("/api/auth/me"))
                .bodyJson()
                .extractingPath("$.email")
                .isEqualTo(email);
    }

    @Test
    void wrongPasswordAndUnknownEmailFailTheSameWay() {
        String email = uniqueEmail();
        new ApiSession(mvc).signup("Ana Souza", email, "segredo123");
        var browser = new ApiSession(mvc);

        var wrongPassword = browser.post("/api/auth/login", credentials(email, "outra-senha"));
        var unknownEmail = browser.post("/api/auth/login", credentials(uniqueEmail(), "segredo123"));

        assertThat(wrongPassword).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(wrongPassword).bodyJson().extractingPath("$.detail").isEqualTo("E-mail ou senha inválidos.");
        assertThat(unknownEmail).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(unknownEmail).bodyJson().extractingPath("$.detail").isEqualTo("E-mail ou senha inválidos.");
    }

    @Test
    void emailIgnoresCaseAndSurroundingSpaces() {
        String local = "ana." + UUID.randomUUID();
        var browser = new ApiSession(mvc);

        assertThat(browser.signup("Ana Souza", " " + local + "@Example.COM ", "segredo123"))
                .bodyJson()
                .extractingPath("$.email")
                .isEqualTo(local + "@example.com");

        var again = new ApiSession(mvc).signup("Outra Ana", local + "@example.com", "segredo123");
        assertThat(again).hasStatus(HttpStatus.CONFLICT);
        assertThat(again).bodyJson().extractingPath("$.detail").isEqualTo("E-mail já cadastrado.");

        assertThat(new ApiSession(mvc).post("/api/auth/login", credentials(local + "@EXAMPLE.com", "segredo123")))
                .hasStatus(HttpStatus.OK);
    }

    @Test
    void invalidSignupPointsAtEachField() {
        var signup = new ApiSession(mvc).signup("A", "nao-e-email", "123");

        assertThat(signup).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(signup)
                .bodyJson()
                .extractingPath("$.errors[*].field")
                .asArray()
                .containsExactlyInAnyOrder("name", "email", "password");
    }

    @Test
    void passwordLongerThanBcryptReadsIsRejected() {
        // 40 characters, but 80 bytes in UTF-8.
        var signup = new ApiSession(mvc).signup("Ana Souza", uniqueEmail(), "é".repeat(40));

        assertThat(signup).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(signup).bodyJson().extractingPath("$.errors[0].field").isEqualTo("password");
    }

    @Test
    void logoutEndsTheSession() {
        var browser = new ApiSession(mvc);
        browser.signup("Ana Souza", uniqueEmail(), "segredo123");

        var logout = browser.post("/api/auth/logout");

        assertThat(logout).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(logout.getResponse().getCookie("ot_session").getMaxAge()).isZero();
        assertThat(browser.get("/api/auth/me")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void changingDataWithoutTheCsrfTokenIsForbidden() {
        var signup = mvc.post()
                .uri("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "Ana Souza", "email": "%s", "password": "segredo123"}
                        """.formatted(uniqueEmail()))
                .cookie(new Cookie("XSRF-TOKEN", "forjado"))
                .exchange();

        assertThat(signup).hasStatus(HttpStatus.FORBIDDEN);
    }

    @Test
    void staleSessionCookieDoesNotBlockSigningIn() {
        var browser = new ApiSession(mvc);
        browser.setCookie("ot_session", "token-velho");

        assertThat(browser.get("/api/auth/me")).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(browser.signup("Ana Souza", uniqueEmail(), "segredo123")).hasStatus(HttpStatus.CREATED);
    }

    private static String credentials(String email, String password) {
        return """
                {"email": "%s", "password": "%s"}
                """.formatted(email, password);
    }
}
